import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse, forbiddenResponse } from '@/lib/api-response'
import { createHmac } from 'crypto'

/**
 * POST /api/webhooks/[id]/test - Test webhook endpoint
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

    const webhook = await prisma.webhookEndpoint.findUnique({
      where: { id: id },
    })

    if (!webhook) {
      return notFoundResponse('Webhook not found')
    }

    if (webhook.userId !== user.id) {
      return forbiddenResponse('You can only test your own webhooks')
    }

    // Create test payload
    const testPayload = {
      event: 'TEST',
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test webhook from Tutusporta',
        webhookId: webhook.id,
        webhookName: webhook.name,
      },
    }

    const payloadString = JSON.stringify(testPayload)

    // Generate HMAC signature
    const signature = createHmac('sha256', webhook.secret)
      .update(payloadString)
      .digest('hex')

    // Send test webhook
    try {
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'Tutusporta-Webhook/1.0',
        },
        body: payloadString,
      })

      const success = response.ok

      // Update webhook statistics
      await prisma.webhookEndpoint.update({
        where: { id: id },
        data: {
          lastTriggered: new Date(),
          ...(success
            ? { successCount: { increment: 1 } }
            : { failureCount: { increment: 1 } }),
        },
      })

      return successResponse({
        success,
        statusCode: response.status,
        statusText: response.statusText,
        message: success
          ? 'Webhook test successful'
          : 'Webhook test failed - endpoint returned error',
      })
    } catch (fetchError: any) {
      // Update failure count
      await prisma.webhookEndpoint.update({
        where: { id: id },
        data: {
          lastTriggered: new Date(),
          failureCount: { increment: 1 },
        },
      })

      return successResponse({
        success: false,
        error: fetchError.message,
        message: 'Webhook test failed - could not reach endpoint',
      })
    }
  } catch (error) {
    console.error('Error testing webhook:', error)
    return errorResponse('Failed to test webhook', 500)
  }
}
