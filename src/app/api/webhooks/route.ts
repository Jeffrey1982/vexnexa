import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'
import { randomBytes } from 'crypto'

/**
 * POST /api/webhooks - Create a webhook endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const body = await request.json()

    const CreateWebhookSchema = z.object({
      name: z.string().min(1).max(100),
      url: z.string().url(),
      events: z.array(z.enum([
        'SCAN_COMPLETED',
        'SCAN_FAILED',
        'ISSUE_CREATED',
        'ISSUE_UPDATED',
        'ISSUE_RESOLVED',
        'ALERT_TRIGGERED',
        'REGRESSION_DETECTED',
      ])).min(1),
    })

    const result = CreateWebhookSchema.safeParse(body)
    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    // Generate a secure webhook secret
    const secret = randomBytes(32).toString('hex')

    const webhook = await prisma.webhookEndpoint.create({
      data: {
        userId: user.id,
        name: result.data.name,
        url: result.data.url,
        secret,
        events: result.data.events,
      },
    })

    return successResponse(webhook, undefined, 201)
  } catch (error) {
    console.error('Error creating webhook:', error)
    return errorResponse('Failed to create webhook', 500)
  }
}

/**
 * GET /api/webhooks - List user webhooks
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const activeOnly = searchParams.get('active') === 'true'

    const skip = (page - 1) * limit

    const where = {
      userId: user.id,
      ...(activeOnly && { active: true }),
    }

    const [webhooks, total] = await Promise.all([
      prisma.webhookEndpoint.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.webhookEndpoint.count({ where }),
    ])

    return successResponse({
      webhooks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching webhooks:', error)
    return errorResponse('Failed to fetch webhooks', 500)
  }
}
