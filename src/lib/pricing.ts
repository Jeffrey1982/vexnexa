/**
 * VexNexa Pricing Configuration
 *
 * 4-tier SaaS pricing: Starter, Pro, Business, Enterprise
 * Billing cycles: monthly + yearly (semiannual removed)
 * Add-ons: Extra Website Packs, Page Volume Packs, Assurance
 */

export type BillingCycle = 'monthly' | 'yearly';
export type PlanKey = 'STARTER' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';

export interface PlanPrice {
  monthly: number;
  yearly: {
    total: number;
    perMonth: number;
    discount: number;
  };
}

/* ─── Base monthly prices (EUR) ─── */
export const BASE_PRICES: Record<PlanKey, number> = {
  STARTER: 24.99,
  PRO: 59.99,
  BUSINESS: 129.00,
  ENTERPRISE: 299.00,
} as const;

/* ─── Fixed annual prices ─── */
export const ANNUAL_PRICES: Record<PlanKey, number> = {
  STARTER: 249.00,   // ~17% discount
  PRO: 599.00,       // ~17% discount
  BUSINESS: 1299.00, // ~16% discount
  ENTERPRISE: 0,     // Custom billing
} as const;

/* ─── Extra Website Pack prices (monthly) ─── */
export const WEBSITE_PACK_PRICES = {
  EXTRA_WEBSITE_1:  15.00,
  EXTRA_WEBSITE_5:  59.00,
  EXTRA_WEBSITE_10: 99.00,
} as const;

/* ─── Page Volume Pack prices (monthly) ─── */
export const PAGE_PACK_PRICES = {
  PAGE_PACK_25K:  19.00,
  PAGE_PACK_100K: 79.00,
  PAGE_PACK_250K: 179.00,
} as const;

/* ─── Assurance add-on prices (monthly, per tier) ─── */
export const ASSURANCE_ADDON_PRICES: Partial<Record<PlanKey, number>> = {
  STARTER: 9.00,
  PRO: 19.00,
  // BUSINESS & ENTERPRISE: included
} as const;

/* ─── History retention per tier (months) ─── */
export const HISTORY_MONTHS: Record<PlanKey, number> = {
  STARTER: 6,
  PRO: 12,
  BUSINESS: 24,
  ENTERPRISE: 36,
} as const;

/**
 * Calculate discount percentage for a plan and cycle
 */
export function getDiscountPercentage(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === 'monthly') return 0;
  if (planKey === 'ENTERPRISE') return 0; // custom billing

  const fullPrice = BASE_PRICES[planKey] * 12;
  const annualPrice = ANNUAL_PRICES[planKey];
  return Math.round(((fullPrice - annualPrice) / fullPrice) * 100);
}

/**
 * Calculate price for a given plan and billing cycle
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === 'monthly') return BASE_PRICES[planKey];
  return ANNUAL_PRICES[planKey];
}

/**
 * Get all pricing details for a plan
 */
export function getPlanPricing(planKey: PlanKey): PlanPrice {
  const monthly = BASE_PRICES[planKey];
  const annual = ANNUAL_PRICES[planKey];

  return {
    monthly,
    yearly: {
      total: annual,
      perMonth: annual > 0 ? annual / 12 : 0,
      discount: getDiscountPercentage(planKey, 'yearly'),
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

  if (planKey === 'ENTERPRISE') {
    return { mainPrice: formatEuro(pricing.monthly, locale), period: '/month', subtext: 'Custom billing available' };
  }

  if (cycle === 'yearly') {
    return {
      mainPrice: formatEuro(pricing.yearly.total, locale),
      period: '/year',
      subtext: `${formatEuro(pricing.yearly.perMonth, locale)}/month`,
    };
  }

  return { mainPrice: formatEuro(pricing.monthly, locale), period: '/month' };
}

/**
 * Get discount badge text for a specific plan and cycle
 */
export function getDiscountBadge(cycle: BillingCycle, planKey?: PlanKey): string | null {
  if (cycle === 'monthly') return null;
  if (planKey === 'ENTERPRISE') return null;

  if (planKey) {
    const discount = getDiscountPercentage(planKey, cycle);
    return discount > 0 ? `Save ${discount}%` : null;
  }

  return 'Save up to 17%';
}

/**
 * Get CTA button text based on billing cycle and plan
 */
export function getCTAText(cycle: BillingCycle, planKey?: PlanKey): string {
  if (planKey === 'STARTER') return 'Get Started';
  if (planKey === 'PRO') return 'Upgrade Now';
  if (planKey === 'BUSINESS') return 'Scale Your Agency';
  if (planKey === 'ENTERPRISE') return 'Contact Sales';

  return cycle === 'monthly' ? 'Start Monthly Plan' : 'Start Annual Plan';
}

/**
 * Whether a plan includes Assurance for free
 */
export function planIncludesAssurance(planKey: PlanKey): boolean {
  return planKey === 'BUSINESS' || planKey === 'ENTERPRISE';
}

/**
 * Get assurance add-on price for a tier (0 if included)
 */
export function getAssurancePrice(planKey: PlanKey): number {
  if (planIncludesAssurance(planKey)) return 0;
  return ASSURANCE_ADDON_PRICES[planKey] ?? 0;
}

/**
 * Calculate total monthly price including add-ons
 */
export function calculateTotalMonthly(opts: {
  planKey: PlanKey;
  extraWebsitePack?: keyof typeof WEBSITE_PACK_PRICES | null;
  assurance?: boolean;
}): number {
  let total = BASE_PRICES[opts.planKey];

  if (opts.extraWebsitePack) {
    total += WEBSITE_PACK_PRICES[opts.extraWebsitePack];
  }

  if (opts.assurance && !planIncludesAssurance(opts.planKey)) {
    total += getAssurancePrice(opts.planKey);
  }

  return total;
}

/**
 * Legacy compatibility — keep old PRICES export for existing code
 */
export const PRICES = {
  STARTER: { amount: "24.99", currency: "EUR", interval: "1 month" },
  PRO: { amount: "59.99", currency: "EUR", interval: "1 month" },
  BUSINESS: { amount: "129.00", currency: "EUR", interval: "1 month" },
  ENTERPRISE: { amount: "299.00", currency: "EUR", interval: "1 month" },
} as const;

export function formatPrice(plan: keyof typeof PRICES): string {
  const price = PRICES[plan];
  return `€${price.amount}/${price.interval.split(' ')[1]}`;
}
