import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/admin/system/performance - Performance metrics (admin only)
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

    // Calculate various performance metrics
    const metrics = {
      timestamp: new Date().toISOString(),
      database: {} as any,
      scans: {} as any,
      api: {} as any,
    }

    // Database query performance
    const dbQueryStart = Date.now()
    await prisma.scan.findMany({ take: 10 })
    metrics.database.avgQueryTime = Date.now() - dbQueryStart

    // Connection pool stats (if available)
    metrics.database.activeConnections = 'N/A' // Would need connection pool metrics

    // Scan performance
    const recentScans = await prisma.scan.findMany({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
        scanDuration: { not: null },
      },
      select: { scanDuration: true },
    })

    if (recentScans.length > 0) {
      const avgDuration = recentScans.reduce((sum, scan) => sum + (scan.scanDuration || 0), 0) / recentScans.length
      metrics.scans = {
        count24h: recentScans.length,
        avgDuration: Math.round(avgDuration) + 'ms',
        minDuration: Math.min(...recentScans.map(s => s.scanDuration || 0)) + 'ms',
        maxDuration: Math.max(...recentScans.map(s => s.scanDuration || 0)) + 'ms',
      }
    }

    // System uptime
    metrics.api = {
      uptime: Math.round(process.uptime()) + 's',
      nodeVersion: process.version,
    }

    return successResponse(metrics)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return errorResponse('Failed to fetch performance metrics', 500)
  }
}
