import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * POST /api/admin/users/[id]/verify-email - Force verify email (admin only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
      where: { id: params.id },
      select: { id: true, email: true },
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Update user email verification status in Supabase
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      params.id,
      { email_confirm: true }
    )

    if (updateError) {
      return errorResponse(updateError.message, 500)
    }

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: params.id,
        adminId: user.id,
        eventType: 'EMAIL_SENT',
        description: 'Email verified by admin override',
      },
    })

    return successResponse(null, 'Email verified successfully')
  } catch (error) {
    console.error('Error verifying email:', error)
    return errorResponse('Failed to verify email', 500)
  }
}
