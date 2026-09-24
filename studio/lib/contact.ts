import { z } from 'zod'

export const CONTACT_LOCALES = ['nl', 'en', 'de', 'fr', 'es', 'pt', 'tl'] as const
export const CONTACT_BODY_LIMIT = 16 * 1024
export const CONTACT_INBOX = 'info@vexnexa.com'

const headerSafe = (value: string) => !/[\u0000-\u001f\u007f]/.test(value)
const messageSafe = (value: string) => !/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)

/** Safe to import in a client form: this module contains no credentials. */
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100).refine(headerSafe),
  email: z.string().trim().max(254).email().refine(headerSafe),
  message: z.string().trim().min(10).max(5000).refine(messageSafe),
  locale: z.enum(CONTACT_LOCALES),
  privacyAccepted: z.literal(true),
  website: z.string().max(200).default(''),
  requestId: z.uuid(),
}).strict()

export type ContactPayload = z.infer<typeof contactSchema>
export type ContactErrorCode =
  | 'invalid_input'
  | 'invalid_origin'
  | 'unsupported_media_type'
  | 'payload_too_large'
  | 'rate_limited'
  | 'unavailable'
  | 'delivery_failed'
export type ContactResponse =
  | { success: true }
  | { success: false; error: ContactErrorCode; fieldErrors?: Record<string, string[]> }

/** Origin protection is for browser submissions, not authentication or bot proofing. */
export function isSameOrigin(request: Request): boolean {
  if (request.headers.get('sec-fetch-site') === 'cross-site') return false
  const origin = request.headers.get('origin')
  if (!origin || origin === 'null') return false
  try {
    const source = new URL(origin)
    const destination = new URL(request.url)
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(destination.hostname)
    if (source.origin !== origin) return false
    if (destination.protocol !== 'https:' && !(local && destination.protocol === 'http:')) return false

    // NextRequest normalizes 127.0.0.1 and [::1] to localhost in request.url.
    // Recover only the actual local HTTP Host, never a forwarded/user-supplied
    // public origin. Host and Origin must still identify the same browser origin;
    // distinct loopback origins are not interchangeable for browser security.
    const sourceLocal = ['localhost', '127.0.0.1', '[::1]'].includes(source.hostname)
    const host = request.headers.get('host')
    if (local && sourceLocal && host) {
      const actual = new URL(`${destination.protocol}//${host}`)
      return !actual.username && !actual.password && actual.pathname === '/' &&
        !actual.search && !actual.hash && actual.origin === source.origin &&
        source.protocol === destination.protocol && source.port === destination.port
    }
    return source.origin === destination.origin
  } catch {
    return false
  }
}

export class ContactBodyError extends Error {
  constructor(public readonly code: 'invalid_input' | 'payload_too_large') {
    super(code)
    this.name = 'ContactBodyError'
  }
}

/** Counts actual streamed bytes as Content-Length may be absent or untrusted. */
export async function readContactBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) throw new ContactBodyError('invalid_input')
    if (Number(declaredLength) > CONTACT_BODY_LIMIT) throw new ContactBodyError('payload_too_large')
  }
  if (!request.body) throw new ContactBodyError('invalid_input')
  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > CONTACT_BODY_LIMIT) {
        void reader.cancel().catch(() => undefined)
        throw new ContactBodyError('payload_too_large')
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.byteLength
    }
    return JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
  } catch (error) {
    if (error instanceof ContactBodyError) throw error
    throw new ContactBodyError('invalid_input')
  } finally {
    reader.releaseLock()
  }
}

type RateLimitResult = { allowed: boolean; retryAfter: number }

/**
 * Bounded, best-effort, per-process abuse protection only. Serverless instances do
 * not share these counters and cold starts reset them. Use Vercel Firewall rules
 * for durable/distributed rate limiting; this is not a guaranteed spending cap.
 * A full map fails closed instead of evicting an active visitor's limit.
 */
export function createContactRateLimiter({
  limit = 5,
  windowMs = 15 * 60 * 1000,
  maxEntries = 1024,
} = {}) {
  if (limit < 1 || windowMs < 1 || maxEntries < 1) throw new Error('Invalid rate limit configuration')
  const entries = new Map<string, { count: number; expires: number }>()
  return (key: string, now = Date.now()): RateLimitResult => {
    for (const [entryKey, entry] of entries) {
      if (entry.expires <= now) entries.delete(entryKey)
    }
    const existing = entries.get(key)
    if (existing) {
      const retryAfter = Math.max(1, Math.ceil((existing.expires - now) / 1000))
      if (existing.count >= limit) return { allowed: false, retryAfter }
      existing.count += 1
      return { allowed: true, retryAfter: 0 }
    }
    if (entries.size >= maxEntries) {
      const earliest = Math.min(...Array.from(entries.values(), entry => entry.expires))
      return { allowed: false, retryAfter: Math.max(1, Math.ceil((earliest - now) / 1000)) }
    }
    entries.set(key, { count: 1, expires: now + windowMs })
    return { allowed: true, retryAfter: 0 }
  }
}

export function buildContactText(payload: ContactPayload): string {
  return [
    'New message from the VexNexa game studio website.',
    '',
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Language: ${payload.locale}`,
    `Reference: ${payload.requestId}`,
    'Privacy notice acknowledged: yes',
    '',
    'Message:',
    payload.message,
    '',
    'Reply to this email to respond to the sender. No automatic reply was sent.',
  ].join('\n')
}

/** Accept an explicit single sender mailbox, optionally with a display name. */
export function isValidContactSender(value: string): boolean {
  if (!value || value.length > 320 || !headerSafe(value)) return false
  const displayNameMatch = value.match(/^[^<>]+ <([^<>]+)>$/)
  return z.email().safeParse(displayNameMatch?.[1] ?? value).success
}
