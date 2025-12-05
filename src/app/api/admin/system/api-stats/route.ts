import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/admin/system/api-stats - API usage statistics (admin only)
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

    const now = new Date()
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Gather API usage stats from database operations and API logs
    const [
      scans24h,
      scans7d,
      sites24h,
      users24h,
      apiCalls24h,
      apiErrors24h,
      avgResponseTime,
      topEndpoints
    ] = await Promise.all([
      prisma.scan.count({ where: { createdAt: { gte: last24h } } }),
      prisma.scan.count({ where: { createdAt: { gte: last7d } } }),
      prisma.site.count({ where: { createdAt: { gte: last24h } } }),
      prisma.user.count({ where: { createdAt: { gte: last24h } } }),
      prisma.apiLog.count({ where: { createdAt: { gte: last24h } } }),
      prisma.apiLog.count({
        where: {
          createdAt: { gte: last24h },
          statusCode: { gte: 400 }
        }
      }),
      prisma.apiLog.aggregate({
        where: { createdAt: { gte: last24h } },
        _avg: { duration: true }
      }),
      prisma.apiLog.groupBy({
        by: ['path', 'method'],
        where: { createdAt: { gte: last24h } },
        _count: true,
        orderBy: { _count: { path: 'desc' } },
        take: 10
      })
    ])

    const stats = {
      timestamp: now.toISOString(),
      periods: {
        last24h: {
          scans: scans24h,
          newSites: sites24h,
          newUsers: users24h,
          apiCalls: apiCalls24h,
          apiErrors: apiErrors24h,
          avgResponseTime: Math.round(avgResponseTime._avg.duration || 0),
        },
        last7d: {
          scans: scans7d,
        },
      },
      topEndpoints: topEndpoints.map(ep => ({
        path: ep.path,
        method: ep.method,
        calls: ep._count
      }))
    }

    return successResponse(stats)
  } catch (error) {
    console.error('Error fetching API stats:', error)
    return errorResponse('Failed to fetch API stats', 500)
  }
}
