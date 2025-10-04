import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendContactNotification } from '@/lib/email'
import { contactFormLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = contactFormLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimitResult.limit.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
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

    const { name, email, message } = validation.data

    // Basic spam detection
    const spamKeywords = ['crypto', 'bitcoin', 'loan', 'casino', 'viagra', 'cialis']
    const messageContent = message.toLowerCase()
    const hasSpam = spamKeywords.some(keyword => messageContent.includes(keyword))
    
    if (hasSpam) {
      const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                      request.headers.get('x-real-ip') ||
                      'unknown'
      console.warn('Potential spam detected from IP:', clientIP, { name, email, message: message.substring(0, 100) })
      // Still process but flag for review
    }

    // Create contact message using Prisma
    const contactMessage = await prisma.contactMessage.create({
      data: {
        name,
        email,
        message,
        status: 'new',
        replied: false
      }
    })

    // Send notification and confirmation emails
    try {
      await sendContactNotification({ name, email, message })
    } catch (emailError) {
      console.error('Failed to send contact emails:', emailError)
      // Continue even if email fails - the message is saved in database
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Message sent successfully',
        messageId: contactMessage.id
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Contact message creation error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })

    return NextResponse.json(
      {
        error: 'Failed to send message. Please try again or email us directly.',
        debug: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error)
        } : undefined
      },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}