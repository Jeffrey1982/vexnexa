import { NextRequest, NextResponse } from 'next/server';
import { getMollieClient } from '@/lib/mollie';
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
    const methods = await mollie.methods.list({
      sequenceType: SequenceType.first,
      amount: tier ? getAmountForTier(tier, billingCycle) : undefined,
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
    console.error('[Billing] Error fetching payment methods:', error);

    // If Mollie is not configured, return a safe fallback
    if (!process.env.MOLLIE_API_KEY) {
      return NextResponse.json({
        methods: getFallbackMethods(),
        count: getFallbackMethods().length,
        fallback: true,
      });
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment methods' },
      { status: 500 }
    );
  }
}

function getAmountForTier(tier: string, billingCycle: string): { value: string; currency: string } | undefined {
  const prices: Record<string, Record<string, number>> = {
    BASIC: { monthly: 9.99, semiannual: 55.99, annual: 101.99 },
    PRO: { monthly: 24.99, semiannual: 137.99, annual: 254.99 },
    PUBLIC_SECTOR: { monthly: 49.99, semiannual: 275.99, annual: 509.99 },
  };

  const price = prices[tier]?.[billingCycle];
  if (!price) return undefined;

  return { value: price.toFixed(2), currency: 'EUR' };
}

function getFallbackMethods(): MethodInfo[] {
  return [
    { id: 'creditcard', description: 'Credit card', imageUrl: '', imageSvg: '' },
    { id: 'ideal', description: 'iDEAL', imageUrl: '', imageSvg: '' },
    { id: 'bancontact', description: 'Bancontact', imageUrl: '', imageSvg: '' },
    { id: 'paypal', description: 'PayPal', imageUrl: '', imageSvg: '' },
  ];
}
