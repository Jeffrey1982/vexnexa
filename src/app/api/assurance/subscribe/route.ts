import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAssuranceCheckoutPayment } from '@/lib/assurance/billing';
import type { AssuranceTier } from '@prisma/client';
import type { BillingCycle } from '@/lib/assurance/pricing';

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await req.json();

    const { tier, billingCycle = 'monthly' } = body as {
      tier: AssuranceTier;
      billingCycle?: BillingCycle;
    };

    if (!tier || !['BASIC', 'PRO', 'PUBLIC_SECTOR'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid tier specified' },
        { status: 400 }
      );
    }

    if (!['monthly', 'semiannual', 'annual'].includes(billingCycle)) {
      return NextResponse.json(
        { error: 'Invalid billing cycle specified' },
        { status: 400 }
      );
    }

    // Create Mollie checkout payment
    const payment = await createAssuranceCheckoutPayment({
      userId: user.id,
      email: user.email,
      tier,
      billingCycle,
    });

    const checkoutUrl = payment.getCheckoutUrl();

    if (!checkoutUrl) {
      throw new Error('Failed to generate checkout URL');
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
      tier,
      billingCycle,
    });
  } catch (error) {
    console.error('[Assurance] Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
