import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  processAssuranceWebhookPayment,
  getActiveAssuranceSubscription,
} from '@/lib/assurance/billing';

/**
 * POST /api/assurance/reconcile
 *
 * Self-heal endpoint for cases where the Mollie webhook failed to deliver
 * (e.g. transient network issue or — historically — our /api/assurance/webhook
 * handler crashing on form-encoded body parsing).
 *
 * Looks up the most recent assurance CheckoutQuote for the authenticated user
 * and re-runs the same processing the webhook would have done. Idempotent:
 * if a subscription is already active it just returns it.
 *
 * The dashboard billing-success page calls this on mount so users who paid
 * during the broken webhook window are healed automatically the first time
 * they revisit it.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();

    // Optional: caller may provide an explicit Mollie payment id.
    let paymentId: string | null = null;
    try {
      const body = await req.json();
      if (typeof body?.paymentId === 'string' && /^tr_[A-Za-z0-9]+$/.test(body.paymentId)) {
        paymentId = body.paymentId;
      }
    } catch {
      // Empty body is fine — fall through to lookup.
    }

    // Fast path: subscription already active → nothing to do.
    const existing = await getActiveAssuranceSubscription(user.id);
    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyActive: true,
        subscription: {
          id: existing.id,
          tier: existing.tier,
          status: existing.status,
          billingCycle: existing.billingCycle,
        },
      });
    }

    // No subscription yet — look up the most recent assurance CheckoutQuote
    // for this user (created at payment time in createAssuranceCheckoutPayment).
    if (!paymentId) {
      const latestQuote = await prisma.checkoutQuote.findFirst({
        where: { userId: user.id, product: 'assurance' },
        orderBy: { createdAt: 'desc' },
        select: { molliePaymentId: true },
      });
      paymentId = latestQuote?.molliePaymentId ?? null;
    }

    if (!paymentId) {
      return NextResponse.json(
        { ok: false, error: 'NO_PENDING_PAYMENT', message: 'No assurance payment found for this user.' },
        { status: 404 }
      );
    }

    console.log('[Assurance Reconcile] Processing payment for user', user.id, paymentId);
    const subscription = await processAssuranceWebhookPayment(paymentId);

    if (!subscription) {
      return NextResponse.json({
        ok: false,
        error: 'PAYMENT_NOT_PAID',
        message: 'Payment is not in a paid state yet — please retry shortly.',
      }, { status: 409 });
    }

    return NextResponse.json({
      ok: true,
      reconciled: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Authentication required') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    const e = error as Record<string, unknown>;
    console.error('[Assurance Reconcile] Error:', {
      message: error instanceof Error ? error.message : String(error),
      statusCode: e?.statusCode ?? e?.status,
      title: e?.title,
      detail: e?.detail,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { ok: false, error: 'RECONCILE_FAILED', message: 'Failed to reconcile payment.' },
      { status: 500 }
    );
  }
}
