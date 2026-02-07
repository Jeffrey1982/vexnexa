import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/admin/system/health - Detailed health check (admin only)
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

    const healthChecks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      checks: {} as any,
    }

    // Database health
    try {
      const dbStart = Date.now()
      await prisma.$queryRaw`SELECT 1`
      healthChecks.checks.database = {
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      }
    } catch (error) {
      healthChecks.status = 'unhealthy'
      healthChecks.checks.database = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Supabase auth health
    try {
      const authStart = Date.now()
      await supabase.auth.getUser()
      healthChecks.checks.authentication = {
        status: 'healthy',
        responseTime: Date.now() - authStart,
      }
    } catch (error) {
      healthChecks.status = 'degraded'
      healthChecks.checks.authentication = {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }

    // Get system stats
    const [userCount, siteCount, scanCount, recentScans] = await Promise.all([
      prisma.user.count(),
      prisma.site.count(),
      prisma.scan.count(),
      prisma.scan.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
          },
        },
      }),
    ])

    healthChecks.checks.system = {
      status: 'healthy',
      stats: {
        totalUsers: userCount,
        totalSites: siteCount,
        totalScans: scanCount,
        scansLast24h: recentScans,
      },
    }

    // Memory usage (Node.js)
    const memoryUsage = process.memoryUsage()
    healthChecks.checks.memory = {
      status: 'healthy',
      heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + 'MB',
      rss: Math.round(memoryUsage.rss / 1024 / 1024) + 'MB',
    }

    return successResponse(healthChecks)
  } catch (error) {
    console.error('Error checking system health:', error)
    return errorResponse('Failed to check system health', 500)
  }
}
