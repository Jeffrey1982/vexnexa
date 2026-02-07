import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

/**
 * GET /api/user/activity - User activity log
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Gather recent activity from various sources
    const [recentScans, recentSites, recentIssues, recentAudits] = await Promise.all([
      // Recent scans
      prisma.scan.findMany({
        where: {
          site: {
            userId: user.id,
          },
        },
        select: {
          id: true,
          status: true,
          score: true,
          createdAt: true,
          site: {
            select: {
              url: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Math.floor(limit / 4),
      }),

      // Recently added sites
      prisma.site.findMany({
        where: {
          userId: user.id,
        },
        select: {
          id: true,
          url: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: Math.floor(limit / 4),
      }),

      // Recent issues
      prisma.issue.findMany({
        where: {
          OR: [
            { createdById: user.id },
            { assignedToId: user.id },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: Math.floor(limit / 4),
      }),

      // Recent audits
      prisma.manualAudit.findMany({
        where: {
          OR: [
            { createdById: user.id },
            { assignedToId: user.id },
          ],
        },
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          site: {
            select: {
              url: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
        take: Math.floor(limit / 4),
      }),
    ])

    // Format activities with type
    const activities = [
      ...recentScans.map(scan => ({
        type: 'scan',
        id: scan.id,
        title: `Scan completed for ${scan.site.url}`,
        status: scan.status,
        score: scan.score,
        timestamp: scan.createdAt,
      })),
      ...recentSites.map(site => ({
        type: 'site',
        id: site.id,
        title: `Added site ${site.url}`,
        timestamp: site.createdAt,
      })),
      ...recentIssues.map(issue => ({
        type: 'issue',
        id: issue.id,
        title: issue.title,
        status: issue.status,
        priority: issue.priority,
        timestamp: issue.updatedAt,
      })),
      ...recentAudits.map(audit => ({
        type: 'audit',
        id: audit.id,
        title: audit.name,
        status: audit.status,
        siteUrl: audit.site.url,
        timestamp: audit.updatedAt,
      })),
    ]

    // Sort by timestamp descending and limit
    activities.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    return successResponse({
      activities: activities.slice(0, limit),
      total: activities.length,
    })
  } catch (error) {
    console.error('Error fetching activity:', error)
    return errorResponse('Failed to fetch activity log', 500)
  }
}
