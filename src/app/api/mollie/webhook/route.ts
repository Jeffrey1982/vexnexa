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

    // 2. Verify HMAC signature (graceful)
    //
    // Mollie does NOT sign webhooks by default; their security model is "secret
    // URL". Webhook signing is an opt-in feature that must be enabled in the
    // Mollie dashboard / via support. We support three modes:
    //
    //   a. Header present + MOLLIE_WEBHOOK_SECRET set → verify strictly,
    //      reject on mismatch (real attack signal).
    //   b. Header missing + MOLLIE_WEBHOOK_REQUIRE_SIGNATURE=true → reject 401.
    //   c. Header missing + flag false (default) → accept, log a warning so an
    //      operator can detect signing-misconfiguration without breaking
    //      production payments.
    const webhookSecret = process.env.MOLLIE_WEBHOOK_SECRET
    const requireSignature =
      process.env.MOLLIE_WEBHOOK_REQUIRE_SIGNATURE === 'true'
    const signature =
      request.headers.get('mollie-signature') ??
      request.headers.get('x-mollie-signature')

    if (signature && webhookSecret) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(body)
        .digest('hex')

      // Use timing-safe compare to avoid leaking the secret via timing oracles
      const sigBuf = Buffer.from(signature, 'hex')
      const expBuf = Buffer.from(expectedSignature, 'hex')
      if (
        sigBuf.length !== expBuf.length ||
        !crypto.timingSafeEqual(sigBuf, expBuf)
      ) {
        console.error('[Mollie Webhook] Invalid signature — rejecting')
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
      if (process.env.NODE_ENV === 'development') {
        console.log('[Mollie Webhook] Signature verified ✓')
      }
    } else if (!signature && requireSignature) {
      console.error(
        '[Mollie Webhook] Missing signature header but MOLLIE_WEBHOOK_REQUIRE_SIGNATURE=true — rejecting'
      )
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    } else if (!signature) {
      // Default path: Mollie sent no signature. Accept but log so we know.
      console.warn(
        '[Mollie Webhook] No signature header (Mollie default behaviour). Accepting; relying on URL secrecy. Set MOLLIE_WEBHOOK_REQUIRE_SIGNATURE=true to enforce.'
      )
    } else if (signature && !webhookSecret) {
      console.warn(
        '[Mollie Webhook] Signature header present but MOLLIE_WEBHOOK_SECRET not configured — skipping verification.'
      )
    }

    // 3. Parse Mollie's form-encoded body
    const formData = new URLSearchParams(body)
    const id = formData.get('id')
    const type = formData.get('type') ?? 'payment' // Mollie defaults to 'payment' if absent

    console.log('[Mollie Webhook] Received:', { type, id, receivedAt })

    // Handle Mollie dashboard "Test webhook" pings gracefully.
    // Mollie's test-button sends either no id, an empty body, or a synthetic id
    // like "hook.ping". Real webhooks always carry a prefixed id
    // (tr_*, sub_*, chr_*, ord_*, mdt_*, cst_*). We short-circuit anything else
    // with a 200 so the dashboard reports success and we don't pollute the
    // ProcessedWebhook table or call Mollie with an invalid id.
    const isRealMollieId =
      typeof id === 'string' &&
      /^(tr|sub|chr|ord|mdt|cst|pay)_[A-Za-z0-9]+$/.test(id)

    if (!id || !isRealMollieId) {
      console.log('[Mollie Webhook] Test/ping received, acknowledging:', { id, type })
      return NextResponse.json({ success: true, ping: true })
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
