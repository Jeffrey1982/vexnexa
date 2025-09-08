import { NextRequest, NextResponse } from 'next/server'
import { createContactMessage } from '@/lib/supabaseServer'
import { z } from 'zod'

const ContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email format'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(2000, 'Message too long'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate input
    const validation = ContactSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { name, email, message } = validation.data

    // Rate limiting check (simple IP-based)
    const clientIP = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown'
    
    // TODO: Implement proper rate limiting
    // For now, we rely on natural limits

    // Basic spam detection
    const spamKeywords = ['crypto', 'bitcoin', 'loan', 'casino', 'viagra', 'cialis']
    const messageContent = message.toLowerCase()
    const hasSpam = spamKeywords.some(keyword => messageContent.includes(keyword))
    
    if (hasSpam) {
      console.warn('Potential spam detected from IP:', clientIP, { name, email, message: message.substring(0, 100) })
      // Still process but flag for review
    }

    // Create contact message
    const contactMessage = await createContactMessage(name, email, message)

    // TODO: Send notification email to team
    // TODO: Send confirmation email to user

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

    return NextResponse.json(
      { error: 'Failed to send message. Please try again or email us directly.' },
      { status: 500 }
    )
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 })
}