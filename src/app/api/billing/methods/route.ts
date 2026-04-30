import { NextRequest, NextResponse } from 'next/server';
import { getMollieClient, formatMollieAmount, isMollieTestMode } from '@/lib/mollie';
import { calculatePrice, type PlanKey } from '@/lib/pricing';
import { SequenceType } from '@mollie/api-client';

/**
 * GET /api/billing/methods?tier=BASIC&billingCycle=monthly
 *
 * Returns available Mollie payment methods for the current profile.
 * Used by the checkout UI to render only methods that are actually available.
 */

interface MethodInfo {
  id: string;
  description: string;
  imageUrl: string;
  imageSvg: string;
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);
    const tier = searchParams.get('tier');
    const billingCycle = searchParams.get('billingCycle') || 'monthly';

    // Mollie methods.list returns all enabled methods for the profile
    // sequenceType: 'first' returns methods usable as first payment in recurring
    const mollie = getMollieClient();
    const amount = tier ? getAmountForTier(tier, billingCycle) : undefined;
    // Note: do NOT pass a top-level `currency` — Mollie rejects it.
    // The currency lives inside `amount: { value, currency }`.
    const methods = await mollie.methods.list({
      sequenceType: SequenceType.first,
      ...(amount ? { amount } : {}),
    });

    const available: MethodInfo[] = [];
    const methodList = Array.isArray(methods) ? methods : [];

    for (const method of methodList) {
      available.push({
        id: method.id,
        description: method.description,
        imageUrl: (method as any).image?.size2x || (method as any).image?.size1x || '',
        imageSvg: (method as any).image?.svg || '',
      });
    }

    return NextResponse.json({
      methods: available,
      count: available.length,
    });
  } catch (error) {
    const e = error as Record<string, unknown>;
    const apiKey = process.env.MOLLIE_API_KEY ?? '';
    const keyMode = apiKey.startsWith('live_')
      ? 'live'
      : apiKey.startsWith('test_')
        ? 'test'
        : 'missing/invalid';

    // Surface ALL Mollie SDK error fields so we can see exactly why methods.list
    // failed (e.g. "Invalid API key", "Inactive profile", "Unauthorized").
    console.error('[Billing] Error fetching payment methods:', {
      message: error instanceof Error ? error.message : String(error),
      name: error instanceof Error ? error.name : undefined,
      statusCode: e?.statusCode ?? e?.status,
      title: e?.title,
      detail: e?.detail,
      field: e?.field,
      links: e?.links,
      cause: e?.cause,
      keyMode,
      keyPrefix: apiKey ? `${apiKey.slice(0, 8)}…` : '(empty)',
      isMollieTestMode: isMollieTestMode(),
    });

    // If Mollie is not configured, return a safe fallback
    if (!process.env.MOLLIE_API_KEY) {
      return NextResponse.json({
        methods: getFallbackMethods(),
        count: getFallbackMethods().length,
        fallback: true,
      });
    }

    // For real Mollie errors, also return safe fallback methods so the UI
    // doesn't break. The detailed error is in the logs.
    return NextResponse.json({
      methods: getFallbackMethods(),
      count: getFallbackMethods().length,
      fallback: true,
      error: error instanceof Error ? error.message : 'Failed to fetch payment methods',
    });
  }
}

function getAmountForTier(tier: string, billingCycle: string): { value: string; currency: string } | undefined {
  const validPlans: PlanKey[] = ['STARTER', 'PRO', 'BUSINESS', 'PIONEER', 'ENTERPRISE'];
  if (!validPlans.includes(tier as PlanKey)) return undefined;

  const cycle = billingCycle === 'yearly' ? 'yearly' : 'monthly';
  try {
    const price = calculatePrice(tier as PlanKey, cycle);
    return { value: formatMollieAmount(price), currency: 'EUR' };
  } catch {
    return undefined;
  }
}

function getFallbackMethods(): MethodInfo[] {
  return [
    { id: 'creditcard', description: 'Credit card', imageUrl: '', imageSvg: '' },
    { id: 'ideal', description: 'iDEAL', imageUrl: '', imageSvg: '' },
    { id: 'bancontact', description: 'Bancontact', imageUrl: '', imageSvg: '' },
    { id: 'paypal', description: 'PayPal', imageUrl: '', imageSvg: '' },
  ];
}
