import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, forbiddenResponse } from '@/lib/api-response'
import { isAdmin } from '@/lib/admin'

/**
 * GET /api/admin/system/api-logs - Get recent API request logs (admin only)
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
    const limit = parseInt(searchParams.get('limit') || '50')

    const recentLogs = await prisma.apiLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        method: true,
        path: true,
        statusCode: true,
        duration: true,
        userEmail: true,
        createdAt: true,
        errorMessage: true,
      }
    })

    return successResponse({
      logs: recentLogs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      }))
    })
  } catch (error) {
    console.error('Error fetching API logs:', error)
    return errorResponse('Failed to fetch API logs', 500)
  }
}
