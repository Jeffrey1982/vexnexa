import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse, validationErrorResponse } from '@/lib/api-response'
import { z } from 'zod'

/**
 * PUT /api/webhooks/[id] - Update webhook endpoint
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const webhook = await prisma.webhookEndpoint.findUnique({
      where: { id: params.id },
    })

    if (!webhook) {
      return notFoundResponse('Webhook not found')
    }

    if (webhook.userId !== user.id) {
      return forbiddenResponse('You can only update your own webhooks')
    }

    const body = await request.json()

    const UpdateWebhookSchema = z.object({
      name: z.string().min(1).max(100).optional(),
      url: z.string().url().optional(),
      events: z.array(z.enum([
        'SCAN_COMPLETED',
        'SCAN_FAILED',
        'ISSUE_CREATED',
        'ISSUE_UPDATED',
        'ISSUE_RESOLVED',
        'ALERT_TRIGGERED',
        'REGRESSION_DETECTED',
      ])).min(1).optional(),
      active: z.boolean().optional(),
    })

    const result = UpdateWebhookSchema.safeParse(body)
    if (!result.success) {
      return validationErrorResponse(result.error)
    }

    const updated = await prisma.webhookEndpoint.update({
      where: { id: params.id },
      data: result.data,
    })

    return successResponse(updated)
  } catch (error) {
    console.error('Error updating webhook:', error)
    return errorResponse('Failed to update webhook', 500)
  }
}

/**
 * DELETE /api/webhooks/[id] - Delete webhook endpoint
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const webhook = await prisma.webhookEndpoint.findUnique({
      where: { id: params.id },
    })

    if (!webhook) {
      return notFoundResponse('Webhook not found')
    }

    if (webhook.userId !== user.id) {
      return forbiddenResponse('You can only delete your own webhooks')
    }

    await prisma.webhookEndpoint.delete({
      where: { id: params.id },
    })

    return successResponse({ message: 'Webhook deleted successfully' })
  } catch (error) {
    console.error('Error deleting webhook:', error)
    return errorResponse('Failed to delete webhook', 500)
  }
}
