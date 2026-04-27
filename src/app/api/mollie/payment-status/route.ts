import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { mollie } from "@/lib/mollie"
import { prisma } from "@/lib/prisma"
import type { Plan as PrismaPlan } from "@prisma/client"

export const dynamic = 'force-dynamic'

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
    if (!paymentId || typeof paymentId !== 'string' || !paymentId.startsWith('tr_')) {
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
    if (metadata.userId && metadata.userId !== user.id) {
      // Don't leak existence of someone else's payment
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Re-read User.plan so the client knows whether the webhook has already
    // applied the upgrade. The /checkout/return page polls this endpoint until
    // either Mollie's status is terminal AND (for paid) the webhook has run.
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true, subscriptionStatus: true },
    })

    return NextResponse.json({
      paymentId: payment.id,
      status: payment.status, // 'open' | 'pending' | 'authorized' | 'paid' | 'canceled' | 'expired' | 'failed'
      plan: (metadata.planKey ?? metadata.plan ?? null) as string | null,
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
