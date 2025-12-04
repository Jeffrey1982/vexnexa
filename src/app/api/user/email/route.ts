import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const ChangeEmailSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
})

/**
 * PUT /api/user/email - Change email
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = ChangeEmailSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { newEmail } = validation.data

    // Update email using Supabase Auth (will send verification email)
    // Supabase will handle duplicate email validation
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (updateError) {
      // Handle specific error for email already in use
      if (updateError.message.includes('already') || updateError.message.includes('exists')) {
        return errorResponse('Email already in use', 409)
      }
      return errorResponse(updateError.message, 400)
    }

    return successResponse(
      { newEmail },
      'Verification email sent to new address. Please verify to complete the change.'
    )
  } catch (error) {
    console.error('Error changing email:', error)
    return errorResponse('Failed to change email', 500)
  }
}
