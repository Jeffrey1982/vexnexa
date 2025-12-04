import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * PUT /api/notifications/[id] - Mark notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    if (notification.userId !== user.id) {
      return forbiddenResponse('You can only mark your own notifications as read')
    }

    const updated = await prisma.notification.update({
      where: { id: params.id },
      data: {
        read: true,
        readAt: new Date(),
      },
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return errorResponse('Failed to mark notification as read', 500)
  }
}

/**
 * DELETE /api/notifications/[id] - Delete notification
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const notification = await prisma.notification.findUnique({
      where: { id: params.id },
    })

    if (!notification) {
      return notFoundResponse('Notification not found')
    }

    if (notification.userId !== user.id) {
      return forbiddenResponse('You can only delete your own notifications')
    }

    await prisma.notification.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Notification deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return errorResponse('Failed to delete notification', 500)
  }
}
