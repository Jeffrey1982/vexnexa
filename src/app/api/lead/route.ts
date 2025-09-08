import { NextRequest, NextResponse } from 'next/server'
import { createLead } from '@/lib/supabaseServer'
import { z } from 'zod'

const LeadSchema = z.object({
  email: z.string().email('Invalid email format'),
  source: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = LeadSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { email, source } = validation.data

    // Rate limiting check (simple IP-based)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // TODO: Implement proper rate limiting with Redis or similar
    // For now, we rely on Supabase's natural rate limits

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