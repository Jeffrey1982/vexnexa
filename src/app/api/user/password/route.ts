import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
})

/**
 * PUT /api/user/password - Change password
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = ChangePasswordSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { newPassword } = validation.data

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (updateError) {
      return errorResponse(updateError.message, 400)
    }

    return successResponse(null, 'Password changed successfully')
  } catch (error) {
    console.error('Error changing password:', error)
    return errorResponse('Failed to change password', 500)
  }
}
