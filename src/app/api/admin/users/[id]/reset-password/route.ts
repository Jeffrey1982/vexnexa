import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * POST /api/admin/users/[id]/reset-password - Force password reset (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    if (!await isAdmin(user.id)) {
      return forbiddenResponse('Admin access required')
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true },
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Send password reset email via Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      targetUser.email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      }
    )

    if (resetError) {
      return errorResponse(resetError.message, 500)
    }

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: id,
        adminId: user.id,
        eventType: 'EMAIL_SENT',
        description: 'Password reset initiated by admin',
      },
    })

    return successResponse(
      { email: targetUser.email },
      'Password reset email sent successfully'
    )
  } catch (error) {
    console.error('Error resetting password:', error)
    return errorResponse('Failed to reset password', 500)
  }
}
