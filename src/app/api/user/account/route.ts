import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const DeleteAccountSchema = z.object({
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'You must type DELETE to confirm account deletion' })
  }),
})

/**
 * DELETE /api/user/account - Delete account (self-service)
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = DeleteAccountSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Delete user data from database (cascades will handle related data)
    await prisma.user.delete({
      where: { id: user.id },
    })

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error('Error deleting user from Supabase:', deleteError)
      // Continue anyway as database record is already deleted
    }

    // Sign out the user
    await supabase.auth.signOut()

    return successResponse(null, 'Account deleted successfully')
  } catch (error) {
    console.error('Error deleting account:', error)
    return errorResponse('Failed to delete account', 500)
  }
}
