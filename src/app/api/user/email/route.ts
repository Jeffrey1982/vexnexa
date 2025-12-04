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

    // Check if email is already in use
    const existingUser = await supabase.auth.admin.getUserByEmail(newEmail)
    if (existingUser.data.user && existingUser.data.user.id !== user.id) {
      return errorResponse('Email already in use', 409)
    }

    // Update email using Supabase Auth (will send verification email)
    const { error: updateError } = await supabase.auth.updateUser({
      email: newEmail,
    })

    if (updateError) {
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
