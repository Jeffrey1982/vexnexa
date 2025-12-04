import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/admin/audit-logs - Get audit logs (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    if (!await isAdmin(user.id)) {
      return forbiddenResponse('Admin access required')
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const eventType = searchParams.get('eventType')
    const email = searchParams.get('email')

    const skip = (page - 1) * limit

    const where: any = {}

    if (eventType) {
      where.eventType = eventType
    }

    if (email) {
      where.user = {
        email: {
          contains: email,
          mode: 'insensitive',
        },
      }
    }

    const [logs, total] = await Promise.all([
      prisma.userAdminEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userAdminEvent.count({ where }),
    ])

    // Fetch user details separately
    const allUserIds = [...logs.map(l => l.userId), ...logs.map(l => l.adminId).filter(Boolean)] as string[]
    const userIds = Array.from(new Set(allUserIds))
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    const userMap = new Map(users.map(u => [u.id, u]))

    const logsWithUsers = logs.map(log => ({
      ...log,
      user: userMap.get(log.userId) || { email: 'Unknown', firstName: null, lastName: null },
      admin: log.adminId ? (userMap.get(log.adminId) || { email: 'Unknown', firstName: null, lastName: null }) : { email: 'System', firstName: null, lastName: null },
    }))

    return successResponse({
      logs: logsWithUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching audit logs:', error)
    return errorResponse('Failed to fetch audit logs', 500)
  }
}
