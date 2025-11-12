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
 * Fixed 6-month prices with custom discounts
 */
export const SEMIANNUAL_PRICES: Record<PlanKey, number> = {
  STARTER: 99.99,    // 16.6% discount
  PRO: 274.99,       // 8.3% discount
  BUSINESS: 549.99,  // 8.3% discount
} as const;

/**
 * Fixed annual prices with custom discounts
 */
export const ANNUAL_PRICES: Record<PlanKey, number> = {
  STARTER: 199.99,   // 16.6% discount
  PRO: 529.99,       // 11.7% discount
  BUSINESS: 999.00,  // 16.7% discount
} as const;

/**
 * Calculate discount percentage for a plan and cycle
 */
export function getDiscountPercentage(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === 'monthly') return 0;

  const basePrice = BASE_PRICES[planKey];
  const months = cycle === 'semiannual' ? 6 : 12;
  const fullPrice = basePrice * months;
  const discountedPrice = cycle === 'semiannual'
    ? SEMIANNUAL_PRICES[planKey]
    : ANNUAL_PRICES[planKey];

  return Math.round(((fullPrice - discountedPrice) / fullPrice) * 100);
}

/**
 * Get semi-annual price for a plan
 */
export function getSemiAnnualPrice(planKey: PlanKey): number {
  return SEMIANNUAL_PRICES[planKey];
}

/**
 * Get annual price for a plan
 */
export function getAnnualPrice(planKey: PlanKey): number {
  return ANNUAL_PRICES[planKey];
}

/**
 * Calculate price for a given plan and billing cycle
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === 'monthly') {
    return BASE_PRICES[planKey];
  }

  if (cycle === 'semiannual') {
    return SEMIANNUAL_PRICES[planKey];
  }

  return ANNUAL_PRICES[planKey];
}

/**
 * Get all pricing details for a plan
 */
export function getPlanPricing(planKey: PlanKey): PlanPrice {
  const monthly = BASE_PRICES[planKey];
  const semiannual = SEMIANNUAL_PRICES[planKey];
  const annual = ANNUAL_PRICES[planKey];

  return {
    monthly,
    semiannual: {
      total: semiannual,
      perMonth: semiannual / 6,
      discount: getDiscountPercentage(planKey, 'semiannual'),
    },
    annual: {
      total: annual,
      perMonth: annual / 12,
      discount: getDiscountPercentage(planKey, 'annual'),
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
 * Get discount badge text for a specific plan and cycle
 */
export function getDiscountBadge(cycle: BillingCycle, planKey?: PlanKey): string | null {
  if (cycle === 'monthly') return null;

  // If planKey is provided, calculate specific discount
  if (planKey) {
    const discount = getDiscountPercentage(planKey, cycle);
    return `Save ${discount}%`;
  }

  // Generic discount for cycle (use highest discount as reference)
  if (cycle === 'semiannual') return 'Save up to 17%';
  if (cycle === 'annual') return 'Save up to 17%';

  return null;
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
