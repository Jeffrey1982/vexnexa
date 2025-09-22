import { NextRequest, NextResponse } from 'next/server'
import { sendEmailVerification } from '@/lib/email'
import { z } from 'zod'

const VerificationSchema = z.object({
  email: z.string().email('Invalid email format'),
  confirmUrl: z.string().url('Invalid confirmation URL'),
  firstName: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = VerificationSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.issues },
        { status: 400 }
      )
    }

    const { email, confirmUrl, firstName } = validation.data

    // Send email verification
    try {
      const result = await sendEmailVerification({ email, confirmUrl, firstName })

      return NextResponse.json(
        {
          success: true,
          message: 'Email verification sent successfully',
          emailId: result?.data?.id
        },
        { status: 200 }
      )
    } catch (emailError) {
      console.error('Failed to send email verification:', emailError)
      return NextResponse.json(
        { error: 'Failed to send email verification' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to process email verification request' },
      { status: 500 }
    )
  }
}