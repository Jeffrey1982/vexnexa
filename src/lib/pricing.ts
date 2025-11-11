/**
 * VexNexa Pricing Configuration
 *
 * This file contains all pricing data, billing cycles, and discount logic.
 * Clean 3-tier SaaS pricing with automatic discounts for longer billing cycles.
 */

export type BillingCycle = 'monthly' | 'semiannual' | 'annual';
export type PlanKey = 'STARTER' | 'PRO' | 'BUSINESS';

export interface PlanPrice {
  monthly: number;
  semiannual: {
    total: number;
    perMonth: number;
    discount: number;
  };
  annual: {
    total: number;
    perMonth: number;
    discount: number;
  };
}

/**
 * Base monthly prices (EUR, ending with .99 for psychological pricing)
 */
export const BASE_PRICES: Record<PlanKey, number> = {
  STARTER: 19.99,
  PRO: 49.99,
  BUSINESS: 99.99,
} as const;

/**
 * Discount percentages for different billing cycles
 */
export const BILLING_DISCOUNTS = {
  monthly: 0,
  semiannual: 0.05,  // 5% discount
  annual: 0.10,       // 10% discount
} as const;

/**
 * Calculate semi-annual price (6 months with 5% discount)
 */
export function getSemiAnnualPrice(base: number): number {
  return (base * 6) * 0.95;
}

/**
 * Calculate annual price (12 months with 10% discount)
 */
export function getAnnualPrice(base: number): number {
  return (base * 12) * 0.90;
}

/**
 * Calculate price for a given plan and billing cycle
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  const basePrice = BASE_PRICES[planKey];

  if (cycle === 'monthly') {
    return basePrice;
  }

  if (cycle === 'semiannual') {
    return getSemiAnnualPrice(basePrice);
  }

  return getAnnualPrice(basePrice);
}

/**
 * Get all pricing details for a plan
 */
export function getPlanPricing(planKey: PlanKey): PlanPrice {
  const basePrice = BASE_PRICES[planKey];

  return {
    monthly: basePrice,
    semiannual: {
      total: calculatePrice(planKey, 'semiannual'),
      perMonth: calculatePrice(planKey, 'semiannual') / 6,
      discount: BILLING_DISCOUNTS.semiannual * 100,
    },
    annual: {
      total: calculatePrice(planKey, 'annual'),
      perMonth: calculatePrice(planKey, 'annual') / 12,
      discount: BILLING_DISCOUNTS.annual * 100,
    },
  };
}

/**
 * Format price in EUR with proper localization
 */
export function formatEuro(amount: number, locale: string = 'nl-NL'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price display based on billing cycle
 */
export function formatPriceDisplay(
  planKey: PlanKey,
  cycle: BillingCycle,
  locale?: string
): {
  mainPrice: string;
  period: string;
  subtext?: string;
} {
  const pricing = getPlanPricing(planKey);

  switch (cycle) {
    case 'monthly':
      return {
        mainPrice: formatEuro(pricing.monthly, locale),
        period: '/month',
      };

    case 'semiannual':
      return {
        mainPrice: formatEuro(pricing.semiannual.total, locale),
        period: '/6 months',
        subtext: `${formatEuro(pricing.semiannual.perMonth, locale)}/month`,
      };

    case 'annual':
      return {
        mainPrice: formatEuro(pricing.annual.total, locale),
        period: '/year',
        subtext: `${formatEuro(pricing.annual.perMonth, locale)}/month`,
      };
  }
}

/**
 * Get discount badge text
 */
export function getDiscountBadge(cycle: BillingCycle): string | null {
  if (cycle === 'monthly') return null;

  const discount = BILLING_DISCOUNTS[cycle] * 100;
  return `Save ${discount}%`;
}

/**
 * Get CTA button text based on billing cycle and plan
 */
export function getCTAText(cycle: BillingCycle, planKey?: PlanKey): string {
  // Plan-specific CTAs
  if (planKey === 'STARTER') return 'Get Started';
  if (planKey === 'PRO') return 'Upgrade Now';
  if (planKey === 'BUSINESS') return 'Scale Your Agency';

  // Generic cycle-based CTAs
  switch (cycle) {
    case 'monthly':
      return 'Start Monthly Plan';
    case 'semiannual':
      return 'Start 6-Month Plan';
    case 'annual':
      return 'Start Annual Plan';
  }
}

/**
 * Legacy compatibility - keep old PRICES export for existing code
 */
export const PRICES = {
  STARTER: { amount: "19.99", currency: "EUR", interval: "1 month" },
  PRO: { amount: "49.99", currency: "EUR", interval: "1 month" },
  BUSINESS: { amount: "99.99", currency: "EUR", interval: "1 month" },
} as const;

export function formatPrice(plan: keyof typeof PRICES) {
  const price = PRICES[plan];
  return `€${price.amount}/${price.interval.split(' ')[1]}`;
}
