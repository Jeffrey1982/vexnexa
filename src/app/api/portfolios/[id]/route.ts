import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, validationErrorResponse, forbiddenResponse } from '@/lib/api-response'
import { z } from 'zod'

const UpdatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
})

/**
 * GET /api/portfolios/[id] - Get portfolio details
 */
export async function GET(
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

    const portfolio = await prisma.portfolio.findUnique({
      where: {
        id: id,
      },
      include: {
        sites: {
          include: {
            scans: {
              orderBy: {
                createdAt: 'desc',
              },
              take: 1,
              select: {
                id: true,
                score: true,
                issues: true,
                status: true,
                createdAt: true,
              },
            },
            _count: {
              select: {
                scans: true,
              },
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

    if (!portfolio) {
      return notFoundResponse('Portfolio')
    }

    // Check ownership
    if (portfolio.userId !== user.id) {
      return forbiddenResponse()
    }

    return successResponse(portfolio)
  } catch (error) {
    console.error('Error fetching portfolio:', error)
    return errorResponse('Failed to fetch portfolio', 500)
  }
}

/**
 * PUT /api/portfolios/[id] - Update portfolio
 */
export async function PUT(
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
    const validation = UpdatePortfolioSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    // Check ownership
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      select: { userId: true },
    })

    if (!existingPortfolio) {
      return notFoundResponse('Portfolio')
    }

    if (existingPortfolio.userId !== user.id) {
      return forbiddenResponse()
    }

    const portfolio = await prisma.portfolio.update({
      where: {
        id: id,
      },
      data: validation.data,
      include: {
        _count: {
          select: {
            sites: true,
          },
        },
      },
    })

    return successResponse(portfolio, 'Portfolio updated successfully')
  } catch (error) {
    console.error('Error updating portfolio:', error)
    return errorResponse('Failed to update portfolio', 500)
  }
}

/**
 * DELETE /api/portfolios/[id] - Delete portfolio
 */
export async function DELETE(
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

    // Check ownership
    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id: id },
      select: { userId: true },
    })

    if (!existingPortfolio) {
      return notFoundResponse('Portfolio')
    }

    if (existingPortfolio.userId !== user.id) {
      return forbiddenResponse()
    }

    await prisma.portfolio.delete({
      where: {
        id: id,
      },
    })

    return successResponse(null, 'Portfolio deleted successfully')
  } catch (error) {
    console.error('Error deleting portfolio:', error)
    return errorResponse('Failed to delete portfolio', 500)
  }
}
