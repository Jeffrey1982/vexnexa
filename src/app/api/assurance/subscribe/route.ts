import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { createAssuranceCheckoutPayment } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';
import { determineTax } from '@/lib/billing/tax';
import type { AssuranceTier } from '@prisma/client';
import type { BillingCycle } from '@/lib/assurance/pricing';

const VALID_TIERS: AssuranceTier[] = ['BASIC', 'PRO', 'PUBLIC_SECTOR'];
const VALID_CYCLES: BillingCycle[] = ['monthly', 'semiannual', 'annual'];

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function safeError(
  code: string,
  message: string,
  requestId: string,
  status: number
): NextResponse {
  return NextResponse.json(
    { ok: false, code, message, requestId },
    { status }
  );
}

export async function POST(req: NextRequest) {
  const requestId = generateRequestId();

  // 1. Authentication
  let user: { id: string; email: string };
  try {
    user = await requireAuth();
  } catch (authErr) {
    console.error(`[Assurance][${requestId}] Auth failed:`, authErr);
    return safeError('AUTH_REQUIRED', 'Authentication required. Please log in.', requestId, 401);
  }

  // 2. Parse body
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return safeError('INVALID_BODY', 'Request body must be valid JSON.', requestId, 400);
  }

  const tier = body.tier as string | undefined;
  const billingCycle = (body.billingCycle as string) || 'monthly';

  console.log(`[Assurance][${requestId}] Subscribe request:`, {
    userId: user.id,
    email: user.email,
    tier,
    billingCycle,
  });

  // 3. Validate inputs
  if (!tier || !VALID_TIERS.includes(tier as AssuranceTier)) {
    return safeError(
      'INVALID_TIER',
      `Invalid tier. Must be one of: ${VALID_TIERS.join(', ')}`,
      requestId,
      400
    );
  }

  if (!VALID_CYCLES.includes(billingCycle as BillingCycle)) {
    return safeError(
      'INVALID_BILLING_CYCLE',
      `Invalid billing cycle. Must be one of: ${VALID_CYCLES.join(', ')}`,
      requestId,
      400
    );
  }

  // 4. Check required environment variables
  if (!process.env.MOLLIE_API_KEY) {
    console.error(`[Assurance][${requestId}] CRITICAL: MOLLIE_API_KEY is not configured`);
    return safeError('CONFIG_MISSING_ENV', 'Payment service is not configured. Support has been notified.', requestId, 500);
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    console.warn(`[Assurance][${requestId}] NEXT_PUBLIC_APP_URL not set, using fallback`);
  }

  // 5. Fetch billing profile and compute tax
  let taxDecision = undefined;
  let countryCode: string | undefined;
  let vatId: string | undefined;

  try {
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: user.id },
    });

    if (billingProfile) {
      countryCode = billingProfile.countryCode;
      vatId = billingProfile.vatId ?? undefined;
      taxDecision = determineTax({
        countryCode: billingProfile.countryCode,
        billingType: billingProfile.billingType as 'individual' | 'business',
        vatValid: billingProfile.vatValid,
      });

      console.log(`[Assurance][${requestId}] Tax decision:`, {
        regime: taxDecision.regime,
        vatRate: taxDecision.vatRate,
        countryCode,
      });
    }
  } catch (taxErr) {
    console.warn(`[Assurance][${requestId}] Could not fetch billing profile, using default NL VAT:`, taxErr);
  }

  // 6. Create Mollie checkout payment
  try {
    const payment = await createAssuranceCheckoutPayment({
      userId: user.id,
      email: user.email,
      tier: tier as AssuranceTier,
      billingCycle: billingCycle as BillingCycle,
      taxDecision,
      countryCode,
      vatId,
    });

    const checkoutUrl = payment.getCheckoutUrl();

    if (!checkoutUrl) {
      console.error(`[Assurance][${requestId}] Mollie returned payment but no checkoutUrl. Payment ID: ${payment.id}, status: ${payment.status}`);
      return safeError('PROVIDER_NO_CHECKOUT_URL', 'Payment was created but no checkout URL was returned. Please try again.', requestId, 502);
    }

    console.log(`[Assurance][${requestId}] Success: checkoutUrl generated, paymentId=${payment.id}`);

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      paymentId: payment.id,
      requestId,
    });
  } catch (providerErr: unknown) {
    const errObj = providerErr instanceof Error ? providerErr : new Error(String(providerErr));
    const statusCode = (providerErr as any)?.statusCode || (providerErr as any)?.status;
    const providerMessage = (providerErr as any)?.message || 'Unknown provider error';

    console.error(`[Assurance][${requestId}] Provider error:`, {
      message: errObj.message,
      stack: errObj.stack,
      statusCode,
      providerMessage,
      name: errObj.name,
    });

    // Distinguish between config issues and transient provider errors
    if (errObj.message?.includes('MOLLIE_API_KEY') || errObj.message?.includes('environment variable')) {
      return safeError('CONFIG_MISSING_ENV', 'Payment service is not configured. Support has been notified.', requestId, 500);
    }

    return safeError(
      'PROVIDER_ERROR',
      'Payment setup failed. Please try again or contact support.',
      requestId,
      502
    );
  }
}
