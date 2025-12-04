import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'

/**
 * DELETE /api/portfolios/[id]/sites/[siteId] - Remove site from portfolio
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; siteId: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Check portfolio ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      select: { userId: true },
    })

    if (!portfolio) {
      return notFoundResponse('Portfolio')
    }

    if (portfolio.userId !== user.id) {
      return forbiddenResponse()
    }

    // Check site ownership and portfolio membership
    const site = await prisma.site.findUnique({
      where: { id: params.siteId },
      select: { userId: true, portfolioId: true },
    })

    if (!site) {
      return notFoundResponse('Site')
    }

    if (site.userId !== user.id) {
      return forbiddenResponse()
    }

    if (site.portfolioId !== params.id) {
      return errorResponse('Site is not in this portfolio', 400)
    }

    // Remove site from portfolio
    await prisma.site.update({
      where: { id: params.siteId },
      data: {
        portfolioId: null,
      },
    })

    // Update portfolio metrics
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: params.id },
      include: {
        sites: {
          include: {
            scans: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
            },
          },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
    })

    // Calculate average score and total issues
    const sitesWithScans = updatedPortfolio?.sites.filter(site => site.scans.length > 0) || []
    const avgScore = sitesWithScans.length > 0
      ? sitesWithScans.reduce((sum, site) => sum + (site.scans[0]?.score || 0), 0) / sitesWithScans.length
      : null
    const totalIssues = sitesWithScans.reduce((sum, site) => sum + (site.scans[0]?.issues || 0), 0)

    // Update portfolio metrics
    await prisma.portfolio.update({
      where: { id: params.id },
      data: {
        totalSites: updatedPortfolio?._count.sites || 0,
        avgScore,
        totalIssues,
      },
    })

    return successResponse(null, 'Site removed from portfolio successfully')
  } catch (error) {
    console.error('Error removing site from portfolio:', error)
    return errorResponse('Failed to remove site from portfolio', 500)
  }
}
