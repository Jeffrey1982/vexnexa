import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getActiveAssuranceSubscription,
  cancelAssuranceSubscription,
  changeAssuranceTier,
} from '@/lib/assurance/billing';
import { getAssurancePlanLimits } from '@/lib/assurance/pricing';
import type { AssuranceTier } from '@prisma/client';
import type { BillingCycle } from '@/lib/assurance/pricing';

/**
 * GET /api/assurance/subscription
 * Get current Assurance subscription details
 */
export async function GET() {
  try {
    const user = await requireAuth();

    // Get active subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json({
        hasSubscription: false,
        subscription: null,
      });
    }

    // Get plan limits
    const limits = getAssurancePlanLimits(subscription.tier);

    // Count active domains
    const activeDomains = subscription.domains.length;

    return NextResponse.json({
      hasSubscription: true,
      subscription: {
        id: subscription.id,
        tier: subscription.tier,
        status: subscription.status,
        billingCycle: subscription.billingCycle,
        pricePerMonth: subscription.pricePerMonth.toString(),
        totalPrice: subscription.totalPrice.toString(),
        activatedAt: subscription.activatedAt,
        canceledAt: subscription.canceledAt,
        expiresAt: subscription.expiresAt,
      },
      limits,
      usage: {
        domains: activeDomains,
        maxDomains: limits.domains,
      },
    });
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error('[Assurance] Error fetching subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/assurance/subscription
 * Update subscription tier
 */
export async function PATCH(req: NextRequest) {
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

    // Get current subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Change tier
    const updated = await changeAssuranceTier({
      subscriptionId: subscription.id,
      newTier: tier,
      billingCycle,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updated.id,
        tier: updated.tier,
        status: updated.status,
        billingCycle: updated.billingCycle,
        pricePerMonth: updated.pricePerMonth.toString(),
        totalPrice: updated.totalPrice.toString(),
      },
    });
  } catch (error) {
    console.error('[Assurance] Error updating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/assurance/subscription
 * Cancel subscription
 */
export async function DELETE() {
  try {
    const user = await requireAuth();

    // Get current subscription
    const subscription = await getActiveAssuranceSubscription(user.id);

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription
    const canceled = await cancelAssuranceSubscription(subscription.id);

    return NextResponse.json({
      success: true,
      subscription: {
        id: canceled.id,
        status: canceled.status,
        canceledAt: canceled.canceledAt,
        expiresAt: canceled.expiresAt,
      },
      message: 'Subscription canceled. You have access until the end of your billing period.',
    });
  } catch (error) {
    console.error('[Assurance] Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
