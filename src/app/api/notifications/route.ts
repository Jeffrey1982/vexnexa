import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

/**
 * POST /api/notifications - Create a notification
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const CreateNotificationSchema = z.object({
      type: z.enum([
        'SCAN_COMPLETE',
        'ISSUE_ASSIGNED',
        'ISSUE_RESOLVED',
        'TEAM_INVITE',
        'PAYMENT_SUCCESS',
        'PAYMENT_FAILED',
        'SUBSCRIPTION_EXPIRING',
        'TRIAL_EXPIRING',
        'REGRESSION_DETECTED',
        'ALERT_TRIGGERED',
        'SYSTEM_ANNOUNCEMENT',
      ]),
      title: z.string().min(1).max(200),
      message: z.string().min(1).max(5000),
      link: z.string().url().optional().nullable(),
      metadata: z.record(z.string(), z.any()).optional(),
    })

    const result = CreateNotificationSchema.safeParse(body)
    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        type: result.data.type,
        title: result.data.title,
        message: result.data.message,
        link: result.data.link,
        metadata: result.data.metadata,
      },
    })

    return successResponse(notification, undefined, 201)
  } catch (error) {
    console.error('Error creating notification:', error)
    return errorResponse('Failed to create notification', 500)
  }
}

/**
 * GET /api/notifications - List user notifications
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const unreadOnly = searchParams.get('unread') === 'true'

    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(unreadOnly && { read: false }),
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: user.id,
          read: false,
        },
      }),
    ])

    return successResponse({
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return errorResponse('Failed to fetch notifications', 500)
  }
}
