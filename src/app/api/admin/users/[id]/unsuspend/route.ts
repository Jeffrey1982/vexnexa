import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * POST /api/admin/users/[id]/unsuspend - Unsuspend user (admin only)
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
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Restore subscription status
    await prisma.user.update({
      where: { id: id },
      data: {
        subscriptionStatus: 'active',
      },
    })

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: id,
        adminId: user.id,
        eventType: 'MANUAL_ACTIVATION',
        description: 'User unsuspended by admin',
      },
    })

    return successResponse(null, 'User unsuspended successfully')
  } catch (error) {
    console.error('Error unsuspending user:', error)
    return errorResponse('Failed to unsuspend user', 500)
  }
}
