import { createHash } from 'node:crypto'
import { isIP } from 'node:net'
import { Resend } from 'resend'
import {
  CONTACT_INBOX,
  ContactBodyError,
  buildContactText,
  contactSchema,
  createContactRateLimiter,
  isSameOrigin,
  isValidContactSender,
  readContactBody,
  type ContactErrorCode,
  type ContactResponse,
} from '../../../studio/lib/contact'

export const runtime = 'nodejs'
export const maxDuration = 30

const visitorLimit = createContactRateLimiter()
const instanceLimit = createContactRateLimiter({ limit: 30, maxEntries: 1 })

function json(body: ContactResponse, status = 200, extraHeaders?: Record<string, string>) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', ...extraHeaders },
  })
}

function failure(error: ContactErrorCode, status: number, extraHeaders?: Record<string, string>) {
  return json({ success: false, error }, status, extraHeaders)
}

/** Vercel supplies the forwarding header. Locally, use a shared fallback bucket. */
function visitorKey(request: Request): string {
  const value = process.env.VERCEL === '1'
    ? request.headers.get('x-vercel-forwarded-for') ?? request.headers.get('x-forwarded-for')
    : null
  const candidate = value?.slice(0, 128).split(',')[0]?.trim() ?? ''
  const ip = isIP(candidate) ? candidate : 'unknown'
  return createHash('sha256').update(ip).digest('hex')
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return failure('invalid_origin', 403)
  const contentType = request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase()
  if (contentType !== 'application/json') return failure('unsupported_media_type', 415)

  const visitor = visitorLimit(visitorKey(request))
  if (!visitor.allowed) {
    return failure('rate_limited', 429, { 'Retry-After': String(visitor.retryAfter) })
  }
  const instance = instanceLimit('contact')
  if (!instance.allowed) {
    return failure('rate_limited', 429, { 'Retry-After': String(instance.retryAfter) })
  }

  let input: unknown
  try {
    input = await readContactBody(request)
  } catch (error) {
    const code = error instanceof ContactBodyError ? error.code : 'invalid_input'
    return failure(code, code === 'payload_too_large' ? 413 : 400)
  }
  const parsed = contactSchema.safeParse(input)
  if (!parsed.success) {
    // Field names only: never echo visitor values or Zod's internal diagnostics.
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0] ?? 'form')
      fieldErrors[field] = ['invalid']
    }
    return json({ success: false, error: 'invalid_input', fieldErrors }, 400)
  }
  const payload = parsed.data
  // Quietly discard honeypot submissions; do not send or echo sensitive values.
  if (payload.website !== '') return json({ success: true })

  // These server-only environment variables never enter the shared form module.
  const apiKey = process.env.RESEND_API_KEY?.trim()
  const from = (process.env.RESEND_ADMIN_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || '').trim()
  if (!apiKey?.startsWith('re_') || apiKey.length < 10 || !isValidContactSender(from)) {
    console.warn('[studio-contact] configuration_unavailable')
    return failure('unavailable', 503)
  }

  try {
    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from,
      to: [CONTACT_INBOX],
      replyTo: payload.email,
      subject: 'VexNexa Games — new contact message',
      text: buildContactText(payload),
    }, {
      // Resend deduplicates the same key AND payload for 24 hours. The client
      // keeps its UUID on retry; no timestamp or random value is added here.
      idempotencyKey: `vexnexa-studio-contact/${payload.requestId}`,
    })
    if (error || !data?.id) {
      console.warn('[studio-contact] delivery_rejected')
      return failure('delivery_failed', 502)
    }
    // Resend accepted the message, not a guarantee of inbox delivery.
    return json({ success: true })
  } catch {
    // A timeout may occur after acceptance. Retry with the same idempotency key.
    console.warn('[studio-contact] delivery_unavailable')
    return failure('delivery_failed', 502)
  }
}
