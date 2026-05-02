import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/email'
import { contactFormLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

/**
 * Contact / lead intake endpoint.
 *
 * Three lead intents are supported in addition to the regular contact flow:
 *   - "walkthrough"      → Plan an Enterprise walkthrough/demo
 *   - "sample-pdf"       → Request a sample PDF report
 *   - "white-label"      → Request a white-label sample / setup quote
 *   - "general" (default)
 *
 * The four new optional fields (companyName, phoneNumber, domainCount,
 * industry) are typed by the form but stored in the existing
 * `ContactMessage.message` column with a structured "Details" prefix —
 * keeps the schema migration-free while preserving the data for support.
 */
const IntentEnum = z.enum(['general', 'walkthrough', 'sample-pdf', 'white-label'])

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
  reason: z.string().max(100).optional(),
  source: z.string().max(100).optional(),
  // New enterprise-grade fields. All optional so the basic flow keeps working.
  intent: IntentEnum.optional().default('general'),
  companyName: z.string().max(150).optional(),
  phoneNumber: z.string().max(40).optional(),
  domainCount: z.union([z.string(), z.number()]).optional(),
  industry: z.string().max(80).optional(),
  language: z.string().max(8).optional(),
})

type ContactPayload = z.infer<typeof ContactSchema>

/** Build a structured message body so the data is preserved in `ContactMessage.message`. */
function buildAugmentedMessage(payload: ContactPayload): string {
  const lines: string[] = []
  const intentLabel: Record<typeof payload.intent, string> = {
    general: 'General enquiry',
    walkthrough: 'Enterprise walkthrough request',
    'sample-pdf': 'Sample PDF report request',
    'white-label': 'White-label sample / setup request',
  }
  lines.push(`Intent: ${intentLabel[payload.intent ?? 'general']}`)
  if (payload.companyName) lines.push(`Company: ${payload.companyName}`)
  if (payload.phoneNumber) lines.push(`Phone: ${payload.phoneNumber}`)
  if (payload.domainCount !== undefined && payload.domainCount !== '') {
    lines.push(`Domains/sites: ${payload.domainCount}`)
  }
  if (payload.industry) lines.push(`Industry: ${payload.industry}`)
  if (payload.language) lines.push(`Preferred language: ${payload.language}`)
  if (payload.source) lines.push(`Source page: ${payload.source}`)

  if (lines.length === 0) return payload.message

  return `--- Lead details ---\n${lines.join('\n')}\n--- Message ---\n${payload.message}`
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = contactFormLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString(),
          },
        }
      )
    }

    const body = await request.json()

    // Validate input
    const validation = ContactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const payload = validation.data
    const { name, email, message, reason, source, intent } = payload

    // Basic spam detection
    const spamKeywords = ['crypto', 'bitcoin', 'loan', 'casino', 'viagra', 'cialis']
    const messageContent = message.toLowerCase()
    const hasSpam = spamKeywords.some((keyword) => messageContent.includes(keyword))

    if (hasSpam) {
      const clientIP =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        request.headers.get('x-real-ip') ||
        'unknown'
      console.warn('Potential spam detected from IP:', clientIP, {
        name,
        email,
        message: message.substring(0, 100),
      })
      // Still process but flag for review
    }

    // Persist to ContactMessage with structured details prefix
    const augmentedMessage = buildAugmentedMessage(payload)
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message: augmentedMessage,
        reason: reason || intent || null,
        source: source || null,
        status: 'new',
        replied: false,
      },
    })

    // sendContactNotification handles BOTH the team notification (info@vexnexa.com)
    // AND the user confirmation in a single call. Never blocks the success path.
    try {
      await sendContactNotification({
        name,
        email,
        message,
        reason,
        source,
        intent,
        companyName: payload.companyName,
        phoneNumber: payload.phoneNumber,
        domainCount:
          payload.domainCount !== undefined && payload.domainCount !== ''
            ? String(payload.domainCount)
            : undefined,
        industry: payload.industry,
        language: payload.language,
        referenceId: contactMessage.id,
      })
    } catch (emailError) {
      console.error('Failed to send contact emails:', emailError)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        messageId: contactMessage.id,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Contact message creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
    })

    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again or email us directly.',
        debug:
          process.env.NODE_ENV === 'development'
            ? {
                message: error instanceof Error ? error.message : String(error),
              }
            : undefined,
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}
