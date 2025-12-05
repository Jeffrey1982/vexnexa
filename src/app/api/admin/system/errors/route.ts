import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/admin/system/errors - Recent errors (admin only)
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

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [totalErrors24h, criticalErrors, recentErrors] = await Promise.all([
      prisma.errorLog.count({
        where: { createdAt: { gte: oneDayAgo } }
      }),
      prisma.errorLog.count({
        where: {
          level: 'critical',
          createdAt: { gte: oneDayAgo }
        }
      }),
      prisma.errorLog.findMany({
        take: 50,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          message: true,
          stack: true,
          level: true,
          source: true,
          statusCode: true,
          userEmail: true,
          url: true,
          method: true,
          createdAt: true,
          resolved: true
        }
      })
    ])

    return successResponse({
      totalErrors24h,
      criticalErrors,
      recentErrors: recentErrors.map(err => ({
        ...err,
        timestamp: err.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching errors:', error)
    return errorResponse('Failed to fetch errors', 500)
  }
}
