import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * GET /api/sites/[siteId]/history - Site history
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { siteId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check ownership
    const site = await prisma.site.findUnique({
      where: { id: params.siteId },
      select: { userId: true },
    })

    if (!site) {
      return notFoundResponse('Site')
    }

    if (site.userId !== user.id) {
      return forbiddenResponse()
    }

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Gather comprehensive site history
    const [scans, crawls, audits, pages] = await Promise.all([
      // All scans for this site
      prisma.scan.findMany({
        where: { siteId: params.siteId },
        select: {
          id: true,
          status: true,
          score: true,
          issues: true,
          impactCritical: true,
          impactSerious: true,
          impactModerate: true,
          impactMinor: true,
          wcagAACompliance: true,
          wcagAAACompliance: true,
          performanceScore: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),

      // All crawls for this site
      prisma.crawl.findMany({
        where: { siteId: params.siteId },
        select: {
          id: true,
          status: true,
          maxPages: true,
          pagesDone: true,
          pagesError: true,
          startedAt: true,
          finishedAt: true,
        },
        orderBy: { startedAt: 'desc' },
        take: 20,
      }),

      // All manual audits for this site
      prisma.manualAudit.findMany({
        where: { siteId: params.siteId },
        select: {
          id: true,
          name: true,
          status: true,
          overallScore: true,
          wcagLevel: true,
          compliant: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),

      // Page count over time
      prisma.page.count({
        where: { siteId: params.siteId },
      }),
    ])

    // Calculate score trend
    const scoreTrend = scans
      .filter(scan => scan.score !== null)
      .map((scan, index, array) => ({
        date: scan.createdAt,
        score: scan.score,
        change: index < array.length - 1 ? (scan.score || 0) - (array[index + 1].score || 0) : 0,
      }))

    // Calculate compliance trend
    const complianceTrend = scans
      .filter(scan => scan.wcagAACompliance !== null)
      .map(scan => ({
        date: scan.createdAt,
        wcagAA: scan.wcagAACompliance,
        wcagAAA: scan.wcagAAACompliance,
      }))

    return successResponse({
      scans,
      crawls,
      audits,
      totalPages: pages,
      trends: {
        scores: scoreTrend,
        compliance: complianceTrend,
      },
      summary: {
        totalScans: scans.length,
        totalCrawls: crawls.length,
        totalAudits: audits.length,
        latestScore: scans[0]?.score || null,
        scoreImprovement: scoreTrend.length > 0 ? scoreTrend[0].change : 0,
      },
    })
  } catch (error) {
    console.error('Error fetching site history:', error)
    return errorResponse('Failed to fetch site history', 500)
  }
}
