import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/supabaseServer'
import { newsletterLimiter } from '@/lib/rate-limit'
import { z } from 'zod'

const LeadSchema = z.object({
  email: z.string().email('Invalid email format'),
  source: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = newsletterLimiter(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Too many newsletter signups. Please try again later.',
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
    const validation = LeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, source } = validation.data

    // Create lead
    const lead = await createLead(email, source)

    return NextResponse.json(
      { 
        success: true, 
        message: 'Successfully subscribed to newsletter',
        leadId: lead.id 
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Lead creation error:', error)

    if (error instanceof Error && error.message === 'Email already exists') {
      return NextResponse.json(
        { error: 'This email address is already subscribed' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}