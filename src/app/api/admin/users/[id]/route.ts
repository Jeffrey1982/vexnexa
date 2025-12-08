import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse, notFoundResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * DELETE /api/admin/users/[id] - Delete user (admin only)
 */
export async function DELETE(
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

    // Check admin status
    if (!await isAdmin(user.id)) {
      return forbiddenResponse('Admin access required')
    }

    // Prevent self-deletion
    if (user.id === id) {
      return errorResponse('Cannot delete your own account', 400)
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: id },
      select: { id: true, email: true },
    })

    if (!targetUser) {
      return notFoundResponse('User')
    }

    // Delete user from database (cascades will handle related data)
    await prisma.user.delete({
      where: { id: id },
    })

    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(id)

    if (deleteError) {
      console.error('Error deleting user from Supabase:', deleteError)
    }

    // Log admin action
    await prisma.userAdminEvent.create({
      data: {
        userId: id,
        adminId: user.id,
        eventType: 'MANUAL_SUSPENSION',
        description: `User account deleted by admin`,
      },
    })

    return successResponse(null, 'User deleted successfully')
  } catch (error) {
    console.error('Error deleting user:', error)
    return errorResponse('Failed to delete user', 500)
  }
}
