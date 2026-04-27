import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { processWebhookPayment, processSubscriptionWebhook } from "@/lib/billing/mollie-flows"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic'

/**
 * Mollie webhook handler.
 *
 * Hardening guarantees:
 *  1. Signature verification (HMAC-SHA256) is required in production.
 *  2. Idempotency: every (webhookId, webhookType) pair is logged in
 *     `ProcessedWebhook`. A second delivery for an already-processed pair
 *     short-circuits to 200 OK without re-running side effects.
 *  3. The handler ALWAYS returns 200 (success or expected failure) so Mollie
 *     does not enter an aggressive retry loop on permanent errors. Transient
 *     failures are recorded in ProcessedWebhook with status="failed" so an
 *     operator (or a retry job) can replay them.
 */
export async function POST(request: NextRequest) {
  const receivedAt = new Date().toISOString()

  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('Mollie webhook received at', receivedAt)
    }

    // 1. Read raw body (needed for signature verification)
    const body = await request.text()

    // 2. Verify HMAC signature
    const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET
    if (!webhookSecret) {
      if (process.env.NODE_ENV === 'production') {
        console.error('MOLLIE_WEBHOOK_SECRET is not configured — rejecting webhook')
        return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
      }
      console.warn('MOLLIE_WEBHOOK_SECRET not set — skipping signature check in development')
    } else {
      const signature = request.headers.get('mollie-signature')
      if (!signature) {
        console.error('Missing Mollie signature header')
        return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
      }
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      // Use timing-safe compare to avoid leaking the secret via timing oracles
      const sigBuf = Buffer.from(signature, 'hex')
      const expBuf = Buffer.from(expectedSignature, 'hex')
      if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
        console.error('Invalid webhook signature')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('Webhook signature verified ✓')
      }
    }

    // 3. Parse Mollie's form-encoded body
    const formData = new URLSearchParams(body)
    const id = formData.get('id')
    const type = formData.get('type') ?? 'payment' // Mollie defaults to 'payment' if absent

    console.log('[Mollie Webhook] Received:', { type, id, receivedAt })

    if (!id || typeof id !== 'string') {
      console.error('Missing or invalid ID')
      return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
    }

    // 4. Idempotency: check ProcessedWebhook before doing real work
    const existing = await prisma.processedWebhook.findUnique({
      where: {
        webhookId_webhookType: { webhookId: id, webhookType: type },
      },
    })

    if (existing && existing.status === 'processed') {
      console.log('[Mollie Webhook] Already processed, skipping:', { id, type })
      return NextResponse.json({ success: true, idempotent: true })
    }

    // Upsert to "received" — ensures we have a row even if the worker crashes
    await prisma.processedWebhook.upsert({
      where: {
        webhookId_webhookType: { webhookId: id, webhookType: type },
      },
      create: {
        webhookId: id,
        webhookType: type,
        status: 'received',
      },
      update: {
        status: 'received',
        attempts: { increment: 1 },
        errorMessage: null,
      },
    })

    // 5. Dispatch to the correct worker
    try {
      if (type === 'payment') {
        await processWebhookPayment(id)
      } else if (type === 'subscription') {
        await processSubscriptionWebhook(id)
      } else {
        console.warn('[Mollie Webhook] Unknown type, recording as processed:', type)
      }

      // 6. Mark as processed
      await prisma.processedWebhook.update({
        where: {
          webhookId_webhookType: { webhookId: id, webhookType: type },
        },
        data: {
          status: 'processed',
          processedAt: new Date(),
          errorMessage: null,
        },
      })

      return NextResponse.json({ success: true })
    } catch (workerError) {
      const message = workerError instanceof Error ? workerError.message : String(workerError)
      console.error('[Mollie Webhook] Worker error:', message)

      // Record the failure so an operator can replay or inspect
      await prisma.processedWebhook
        .update({
          where: {
            webhookId_webhookType: { webhookId: id, webhookType: type },
          },
          data: {
            status: 'failed',
            errorMessage: message.slice(0, 1000),
          },
        })
        .catch((logErr) => {
          console.error('[Mollie Webhook] Failed to record worker failure:', logErr)
        })

      // Return 200 so Mollie does not retry forever; the row in ProcessedWebhook
      // is the single source of truth for "this needs human attention".
      return NextResponse.json({ success: false, error: 'Worker error logged' })
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('=== Webhook Processing Error ===')
      console.error('Error:', error)
      console.error('Stack:', error instanceof Error ? error.stack : 'No stack')
    } else {
      console.error('Mollie webhook processing failed:', {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }

    // Still return 200 so Mollie doesn't retry permanent errors aggressively.
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
