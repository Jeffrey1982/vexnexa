import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

const CreatePortfolioSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
})

/**
 * GET /api/portfolios - List all portfolios for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const portfolios = await prisma.portfolio.findMany({
      where: {
        userId: user.id,
      },
      include: {
        sites: {
          select: {
            id: true,
            url: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            sites: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return successResponse(portfolios)
  } catch (error) {
    console.error('Error fetching portfolios:', error)
    return errorResponse('Failed to fetch portfolios', 500)
  }
}

/**
 * POST /api/portfolios - Create a new portfolio
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const validation = CreatePortfolioSchema.safeParse(body)

    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { name, description } = validation.data

    const portfolio = await prisma.portfolio.create({
      data: {
        userId: user.id,
        name,
        description,
      },
      include: {
        _count: {
          select: {
            sites: true,
          },
        },
      },
    })

    return successResponse(portfolio, 'Portfolio created successfully', 201)
  } catch (error) {
    console.error('Error creating portfolio:', error)
    return errorResponse('Failed to create portfolio', 500)
  }
}
