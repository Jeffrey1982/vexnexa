import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { mollie } from "@/lib/mollie"
import { prisma } from "@/lib/prisma"
import type { Plan as PrismaPlan } from "@prisma/client"
import { AddOnType } from "@prisma/client"
import { AUDIT_BUNDLE_PRICES, AUDIT_PRICES } from "@/lib/pricing"

export const dynamic = 'force-dynamic'

const auditProductIds = new Set<string>([...Object.values(AUDIT_PRICES), ...Object.values(AUDIT_BUNDLE_PRICES)].map(product => product.productId))

/**
 * GET /api/mollie/payment-status?id=tr_xxx
 *
 * Used by the `/checkout/return` landing page after Mollie redirects the user
 * back. Returns the current payment status AND whether the webhook has already
 * propagated to the User row, so the client can render the correct UI without
 * trusting the redirect URL alone.
 *
 * Security:
 *  - Only the authenticated user that originally created the payment can fetch
 *    its status (we cross-check `metadata.userId === authedUser.id`).
 *  - Returns 403 if the payment belongs to someone else (prevents enumeration).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireAuth()

    const paymentId = request.nextUrl.searchParams.get('id')
    if (!paymentId || !/^tr_[A-Za-z0-9]+$/.test(paymentId)) {
      return NextResponse.json({ error: 'Missing or invalid payment id' }, { status: 400 })
    }

    let payment
    try {
      payment = await mollie.payments.get(paymentId)
    } catch (err) {
      console.error('[payment-status] Mollie fetch failed:', err)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    const metadata = (payment.metadata ?? {}) as Record<string, string>
    if (!metadata.userId || metadata.userId !== user.id) {
      // Don't leak existence of someone else's payment
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Re-read User.plan so the client knows whether the webhook has already
    // applied the upgrade. The /checkout/return page polls this endpoint until
    // either Mollie's status is terminal AND (for paid) the webhook has run.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, subscriptionStatus: true, mollieSubscriptionId: true, subscriptionCurrentPeriodEnd: true },
    })

    const processed = await prisma.processedWebhook.findUnique({
      where: { webhookId_webhookType: { webhookId: paymentId, webhookType: 'payment' } },
      select: { status: true },
    })
    const purchasedPlan = metadata.planKey ?? metadata.plan ?? null
    const isOneOffCheckout = metadata.type === 'audit_payment' || metadata.type === 'addon_checkout'
    const paidPeriodCurrent = !dbUser?.subscriptionCurrentPeriodEnd || dbUser.subscriptionCurrentPeriodEnd.getTime() > Date.now()
    const planActivated = !!purchasedPlan && purchasedPlan !== 'FREE' && dbUser?.plan === purchasedPlan &&
      dbUser.subscriptionStatus === 'active' && !!dbUser.mollieSubscriptionId && paidPeriodCurrent
    let oneOffFulfilled = false
    if (isOneOffCheckout && payment.status === 'paid' && processed?.status === 'processed') {
      const marker = await prisma.processedWebhook.findUnique({
        where: { webhookId_webhookType: { webhookId: paymentId, webhookType: metadata.type === 'audit_payment' ? 'audit_credit_fulfillment' : 'addon_payment_fulfillment' } },
        select: { status: true, metadata: true },
      })
      const proof = marker?.metadata && typeof marker.metadata === 'object' && !Array.isArray(marker.metadata)
        ? marker.metadata as Record<string, unknown> : null
      if (marker?.status === 'processed' && proof !== null && proof.userId === user.id) {
        if (metadata.type === 'audit_payment') {
          const credits = Number(metadata.auditCredits)
          oneOffFulfilled = auditProductIds.has(metadata.productId) && Number.isSafeInteger(credits) && credits > 0 && proof.credits === credits
        } else {
          const quantity = Number(metadata.quantity)
          oneOffFulfilled = Object.values(AddOnType).includes(metadata.addOnType as AddOnType) && Number.isSafeInteger(quantity) && quantity > 0 &&
            proof.type === metadata.addOnType && proof.quantity === quantity && typeof proof.addOnId === 'string' && !!proof.addOnId &&
            typeof proof.subscriptionId === 'string' && !!proof.subscriptionId
        }
      }
    }
    const fulfilled = payment.status === 'paid' && processed?.status === 'processed' && (isOneOffCheckout ? oneOffFulfilled : planActivated)

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status, // 'open' | 'pending' | 'authorized' | 'paid' | 'canceled' | 'expired' | 'failed'
      type: metadata.type ?? null,
      isOneOffCheckout,
      fulfillmentStatus: fulfilled ? 'fulfilled' : 'pending',
      plan: purchasedPlan,
      billingInterval: (metadata.billingInterval ?? metadata.billingCycle ?? null) as string | null,
      user: {
        plan: dbUser?.plan ?? ('FREE' as PrismaPlan),
        subscriptionStatus: dbUser?.subscriptionStatus ?? 'active',
      },
    })
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    console.error('[payment-status] error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
