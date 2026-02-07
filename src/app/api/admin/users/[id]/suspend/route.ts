import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'
import { z } from 'zod'

const SuspendSchema = z.object({
  reason: z.string().optional(),
})

/**
 * POST /api/admin/users/[id]/suspend - Suspend user (admin only)
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

    if (user.id === id) {
      return errorResponse('Cannot suspend your own account', 400)
    }

    const body = await request.json()
    const { reason } = SuspendSchema.parse(body)

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: id },
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Update subscription status to suspended
    await prisma.user.update({
      where: { id: id },
      data: {
        subscriptionStatus: 'suspended',
      },
    })

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: id,
        adminId: user.id,
        eventType: 'MANUAL_SUSPENSION',
        description: reason || 'User suspended by admin',
      },
    })

    return successResponse(null, 'User suspended successfully')
  } catch (error) {
    console.error('Error suspending user:', error)
    return errorResponse('Failed to suspend user', 500)
  }
}
