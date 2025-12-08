import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse, forbiddenResponse } from '@/lib/api-response'
import { z } from 'zod'

const AddSitesSchema = z.object({
  siteIds: z.array(z.string()).min(1, 'At least one site ID is required'),
})

/**
 * POST /api/portfolios/[id]/sites - Add sites to portfolio
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = AddSitesSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { siteIds } = validation.data

    // Check portfolio ownership
    const portfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      select: { userId: true },
    })

    if (!portfolio) {
      return notFoundResponse('Portfolio')
    }

    if (portfolio.userId !== user.id) {
      return forbiddenResponse()
    }

    // Verify all sites belong to the user
    const sites = await prisma.site.findMany({
      where: {
        id: { in: siteIds },
        userId: user.id,
      },
    })

    if (sites.length !== siteIds.length) {
      return errorResponse('One or more sites not found or access denied', 400)
    }

    // Add sites to portfolio
    await prisma.site.updateMany({
      where: {
        id: { in: siteIds },
      },
      data: {
        portfolioId: id,
      },
    })

    // Update portfolio metrics
    const updatedPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
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
      where: { id: id },
      data: {
        totalSites: updatedPortfolio?._count.sites || 0,
        avgScore,
        totalIssues,
      },
    })

    return successResponse(
      { addedSites: sites.length },
      `Successfully added ${sites.length} site(s) to portfolio`
    )
  } catch (error) {
    console.error('Error adding sites to portfolio:', error)
    return errorResponse('Failed to add sites to portfolio', 500)
  }
}
