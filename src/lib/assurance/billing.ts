/**
 * VexNexa Accessibility Assurance - Mollie Billing Integration
 *
 * Handles subscription management for Assurance product
 * Separate from main VexNexa scanner subscriptions
 */

import { mollie, appUrl } from '../mollie';
import { prisma } from '../prisma';
import {
  calculateAssurancePrice,
  type BillingCycle,
  ASSURANCE_BASE_PRICES,
} from './pricing';
import type { AssuranceTier } from '@prisma/client';
import type { PaymentCreateParams } from '@mollie/api-client';
import { SequenceType } from '@mollie/api-client';

/**
 * Create Mollie checkout payment for Assurance subscription
 */
export async function createAssuranceCheckoutPayment(opts: {
  userId: string;
  email: string;
  tier: AssuranceTier;
  billingCycle?: BillingCycle;
  mollieCustomerId?: string;
}) {
  try {
    const { userId, email, tier, billingCycle = 'monthly', mollieCustomerId } = opts;

    console.log('[Assurance] Creating checkout payment:', {
      userId,
      email,
      tier,
      billingCycle,
    });

    // Calculate price for tier and cycle
    const amount = calculateAssurancePrice(tier, billingCycle);

    // Create or get Mollie customer
    const { createOrGetMollieCustomer } = await import('../billing/mollie-flows');
    const customer = mollieCustomerId
      ? await mollie.customers.get(mollieCustomerId)
      : await createOrGetMollieCustomer(userId, email);

    console.log('[Assurance] Using Mollie customer:', customer.id);

    // Create payment
    const paymentData: PaymentCreateParams = {
      amount: {
        value: amount.toFixed(2),
        currency: 'EUR',
      },
      description: `VexNexa Assurance ${tier} - ${billingCycle}`,
      redirectUrl: appUrl('/dashboard/assurance?payment=success'),
      webhookUrl: appUrl('/api/assurance/webhook'),
      customerId: customer.id,
      sequenceType: SequenceType.first, // First payment for mandate creation
      metadata: {
        userId,
        tier,
        billingCycle,
        product: 'assurance',
      },
    };

    console.log('[Assurance] Creating payment with data:', {
      amount: paymentData.amount,
      description: paymentData.description,
      customerId: customer.id,
    });

    const payment = await mollie.payments.create(paymentData);

    console.log('[Assurance] Payment created:', {
      id: payment.id,
      status: payment.status,
      checkoutUrl: payment.getCheckoutUrl(),
    });

    return payment;
  } catch (error) {
    console.error('[Assurance] Error creating checkout payment:', error);
    throw error;
  }
}

/**
 * Create Mollie subscription for Assurance (after successful payment)
 */
export async function createAssuranceSubscription(opts: {
  userId: string;
  tier: AssuranceTier;
  mollieCustomerId: string;
  billingCycle?: BillingCycle;
}) {
  try {
    const { userId, tier, mollieCustomerId, billingCycle = 'monthly' } = opts;

    console.log('[Assurance] Creating subscription:', {
      userId,
      tier,
      mollieCustomerId,
      billingCycle,
    });

    // Calculate price
    const monthlyPrice = ASSURANCE_BASE_PRICES[tier];
    const totalPrice = calculateAssurancePrice(tier, billingCycle);

    // Determine interval for Mollie
    let interval = '1 month';
    if (billingCycle === 'semiannual') {
      interval = '6 months';
    } else if (billingCycle === 'annual') {
      interval = '12 months';
    }

    // Check if user already has an active Assurance subscription
    const existingSubscription = await prisma.assuranceSubscription.findFirst({
      where: {
        userId,
        status: {
          in: ['active', 'past_due'],
        },
      },
    });

    // Cancel existing subscription if exists
    if (existingSubscription?.mollieSubscriptionId) {
      console.log('[Assurance] Canceling existing subscription:', existingSubscription.mollieSubscriptionId);
      try {
        await mollie.customerSubscriptions.cancel(
          existingSubscription.mollieSubscriptionId,
          { customerId: mollieCustomerId }
        );
      } catch (error) {
        console.warn('[Assurance] Failed to cancel existing subscription:', error);
      }

      // Mark as canceled in database
      await prisma.assuranceSubscription.update({
        where: { id: existingSubscription.id },
        data: {
          status: 'canceled',
          canceledAt: new Date(),
        },
      });
    }

    // Create Mollie subscription
    const subscription = await (mollie.customerSubscriptions as any).create({
      customerId: mollieCustomerId,
      amount: {
        value: totalPrice.toFixed(2),
        currency: 'EUR',
      },
      interval,
      description: `VexNexa Assurance ${tier}`,
      webhookUrl: appUrl('/api/assurance/webhook'),
      metadata: {
        userId,
        tier,
        billingCycle,
        product: 'assurance',
      },
    });

    console.log('[Assurance] Mollie subscription created:', {
      id: subscription.id,
      status: subscription.status,
      amount: subscription.amount,
      interval: subscription.interval,
    });

    // Create or update AssuranceSubscription in database
    const assuranceSubscription = await prisma.assuranceSubscription.upsert({
      where: {
        id: existingSubscription?.id || 'new',
      },
      create: {
        userId,
        tier,
        status: 'active',
        mollieSubscriptionId: subscription.id,
        billingCycle,
        pricePerMonth: monthlyPrice,
        totalPrice,
        activatedAt: new Date(),
      },
      update: {
        tier,
        status: 'active',
        mollieSubscriptionId: subscription.id,
        billingCycle,
        pricePerMonth: monthlyPrice,
        totalPrice,
        activatedAt: new Date(),
        canceledAt: null,
        expiresAt: null,
      },
    });

    console.log('[Assurance] Database subscription created/updated:', assuranceSubscription.id);

    return assuranceSubscription;
  } catch (error) {
    console.error('[Assurance] Error creating subscription:', error);
    throw error;
  }
}

/**
 * Cancel Assurance subscription
 */
export async function cancelAssuranceSubscription(subscriptionId: string) {
  try {
    console.log('[Assurance] Canceling subscription:', subscriptionId);

    // Get subscription from database
    const subscription = await prisma.assuranceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel at Mollie if exists
    if (subscription.mollieSubscriptionId && subscription.user.mollieCustomerId) {
      try {
        await mollie.customerSubscriptions.cancel(subscription.mollieSubscriptionId, {
          customerId: subscription.user.mollieCustomerId,
        });
        console.log('[Assurance] Mollie subscription canceled');
      } catch (error) {
        console.warn('[Assurance] Failed to cancel at Mollie:', error);
      }
    }

    // Set grace period (7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Update database
    const updated = await prisma.assuranceSubscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        expiresAt,
      },
    });

    console.log('[Assurance] Subscription canceled with 7-day grace period');

    return updated;
  } catch (error) {
    console.error('[Assurance] Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Change Assurance tier (upgrade/downgrade)
 */
export async function changeAssuranceTier(opts: {
  subscriptionId: string;
  newTier: AssuranceTier;
  billingCycle?: BillingCycle;
}) {
  try {
    const { subscriptionId, newTier, billingCycle = 'monthly' } = opts;

    console.log('[Assurance] Changing tier:', {
      subscriptionId,
      newTier,
      billingCycle,
    });

    // Get current subscription
    const subscription = await prisma.assuranceSubscription.findUnique({
      where: { id: subscriptionId },
      include: { user: true },
    });

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    if (!subscription.user.mollieCustomerId) {
      throw new Error('User has no Mollie customer ID');
    }

    // Cancel old subscription
    if (subscription.mollieSubscriptionId) {
      try {
        await mollie.customerSubscriptions.cancel(subscription.mollieSubscriptionId, {
          customerId: subscription.user.mollieCustomerId,
        });
      } catch (error) {
        console.warn('[Assurance] Failed to cancel old subscription:', error);
      }
    }

    // Create new subscription with new tier
    const newSubscription = await createAssuranceSubscription({
      userId: subscription.userId,
      tier: newTier,
      mollieCustomerId: subscription.user.mollieCustomerId,
      billingCycle,
    });

    console.log('[Assurance] Tier changed successfully');

    return newSubscription;
  } catch (error) {
    console.error('[Assurance] Error changing tier:', error);
    throw error;
  }
}

/**
 * Process webhook payment for Assurance
 */
export async function processAssuranceWebhookPayment(paymentId: string) {
  try {
    console.log('[Assurance] Processing webhook payment:', paymentId);

    // Get payment from Mollie
    const payment = await mollie.payments.get(paymentId);

    console.log('[Assurance] Payment status:', {
      id: payment.id,
      status: payment.status,
      metadata: payment.metadata,
    });

    // Only process paid payments
    if (payment.status !== 'paid') {
      console.log('[Assurance] Payment not paid, skipping');
      return null;
    }

    // Extract metadata
    const metadata = payment.metadata as {
      userId?: string;
      tier?: AssuranceTier;
      billingCycle?: BillingCycle;
      product?: string;
    };

    if (!metadata.userId || !metadata.tier || metadata.product !== 'assurance') {
      console.warn('[Assurance] Invalid payment metadata:', metadata);
      return null;
    }

    // Check if subscription already exists (prevent duplicate processing)
    const existingSubscription = await prisma.assuranceSubscription.findFirst({
      where: {
        userId: metadata.userId,
        status: 'active',
      },
    });

    if (existingSubscription) {
      console.log('[Assurance] Subscription already exists, skipping creation');
      return existingSubscription;
    }

    // Create subscription
    const subscription = await createAssuranceSubscription({
      userId: metadata.userId,
      tier: metadata.tier,
      mollieCustomerId: payment.customerId!,
      billingCycle: metadata.billingCycle || 'monthly',
    });

    console.log('[Assurance] Subscription created from webhook:', subscription.id);

    return subscription;
  } catch (error) {
    console.error('[Assurance] Error processing webhook payment:', error);
    throw error;
  }
}

/**
 * Get active Assurance subscription for user
 */
export async function getActiveAssuranceSubscription(userId: string) {
  return prisma.assuranceSubscription.findFirst({
    where: {
      userId,
      status: {
        in: ['active', 'past_due'],
      },
    },
    include: {
      domains: {
        where: { active: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
}

/**
 * Check if user has active Assurance subscription
 */
export async function hasActiveAssuranceSubscription(userId: string): Promise<boolean> {
  const subscription = await getActiveAssuranceSubscription(userId);
  return subscription !== null;
}
