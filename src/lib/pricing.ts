/**
 * VexNexa Pricing Configuration
 *
 * This file contains all pricing data, billing cycles, and discount logic.
 * Prices are 10% below market average with automatic discounts for longer billing cycles.
 */

export type BillingCycle = 'monthly' | 'semiannual' | 'annual';
export type PlanKey = 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

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
 * Base monthly prices (in EUR, 10% below market average)
 */
export const BASE_PRICES: Record<PlanKey, number> = {
  STARTER: 22,
  PRO: 54,
  BUSINESS: 112,
  ENTERPRISE: 270, // Starting from (custom quote)
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
 * Calculate price for a given plan and billing cycle
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  const basePrice = BASE_PRICES[planKey];

  if (cycle === 'monthly') {
    return basePrice;
  }

  const months = cycle === 'semiannual' ? 6 : 12;
  const discount = BILLING_DISCOUNTS[cycle];
  const totalPrice = basePrice * months * (1 - discount);

  return totalPrice;
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
 * Get CTA button text based on billing cycle
 */
export function getCTAText(cycle: BillingCycle, isEnterprise: boolean = false): string {
  if (isEnterprise) return 'Contact Sales';

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
  STARTER: { amount: BASE_PRICES.STARTER.toFixed(2), currency: "EUR", interval: "1 month" },
  PRO: { amount: BASE_PRICES.PRO.toFixed(2), currency: "EUR", interval: "1 month" },
  BUSINESS: { amount: BASE_PRICES.BUSINESS.toFixed(2), currency: "EUR", interval: "1 month" },
} as const;

export function formatPrice(plan: keyof typeof PRICES) {
  const price = PRICES[plan];
  return `€${price.amount}/${price.interval.split(' ')[1]}`;
}
