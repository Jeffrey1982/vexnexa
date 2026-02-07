import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * POST /api/admin/users/[id]/impersonate - Impersonate user (debug - admin only)
 * WARNING: This is a powerful debug feature. Use with caution.
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

    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return forbiddenResponse('User impersonation is disabled in production')
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true },
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: id,
        adminId: user.id,
        eventType: 'NOTE_ADDED',
        description: `Admin ${user.email} started impersonating user`,
        metadata: {
          action: 'impersonate_start',
          timestamp: new Date().toISOString(),
        },
      },
    })

    // Return user details for frontend to handle session switch
    return successResponse(
      {
        userId: targetUser.id,
        email: targetUser.email,
        message: 'Impersonation initiated. Handle session switch on frontend.',
      },
      'Ready to impersonate user'
    )
  } catch (error) {
    console.error('Error impersonating user:', error)
    return errorResponse('Failed to impersonate user', 500)
  }
}
