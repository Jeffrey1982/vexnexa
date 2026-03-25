/**
 * VexNexa Pricing Configuration
 *
 * 4-tier SaaS pricing: Starter, Pro, Business, Enterprise
 * Billing cycles: monthly + yearly (15% discount)
 * Add-ons: Extra Website Packs, Page Volume Packs, Assurance
 * One-time: Audits, Extras
 *
 * ALL PRICES ARE EXCLUSIVE OF VAT (net).
 * VAT is calculated per-country at checkout via getPriceInclVat().
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

/* ─── VAT configuration ─── */
export const VAT_RATE = 0.21;
export const VAT_RATE_PERCENT = 21;

/* ─── Base monthly prices (EUR, excl. VAT) ─── */
export const BASE_PRICES: Record<PlanKey, number> = {
  STARTER: 19.00,
  PRO: 44.00,
  BUSINESS: 129.00,
  ENTERPRISE: 349.00,
} as const;

/* ─── Old prices for strikethrough display (EUR, excl. VAT equivalent) ─── */
export const OLD_PRICES: Record<PlanKey, number> = {
  STARTER: 14.99,
  PRO: 34.99,
  BUSINESS: 99.99,
  ENTERPRISE: 299.00,
} as const;

/* ─── Fixed annual prices (EUR, excl. VAT — 15% discount on monthly) ─── */
export const ANNUAL_PRICES: Record<PlanKey, number> = {
  STARTER: 193.80,    // €16.15/mo — 15% discount
  PRO: 448.80,        // €37.40/mo — 15% discount
  BUSINESS: 1315.80,  // €109.65/mo — 15% discount
  ENTERPRISE: 3559.80, // €296.65/mo — 15% discount
} as const;

/* ─── Extra Website Pack prices (monthly, excl. VAT) ─── */
export const WEBSITE_PACK_PRICES = {
  EXTRA_WEBSITE_1:  18.00,
  EXTRA_WEBSITE_5:  72.00,
  EXTRA_WEBSITE_10: 120.00,
} as const;

/* ─── Page Volume Pack prices (monthly, excl. VAT) ─── */
export const PAGE_PACK_PRICES = {
  PAGE_PACK_25K:  22.00,
  PAGE_PACK_100K: 89.00,
  PAGE_PACK_250K: 199.00,
} as const;

/* ─── Assurance add-on prices (monthly, per tier, excl. VAT) ─── */
export const ASSURANCE_ADDON_PRICES: Partial<Record<PlanKey, number>> = {
  STARTER: 12.00,
  PRO: 22.00,
  // BUSINESS & ENTERPRISE: included
} as const;

/* ─── Handmatige Audits — eenmalig (excl. VAT) ─── */
export const AUDIT_PRICES = {
  QUICK: { productId: 'vexnexa-audit-quick', price: 249.00, label: 'Quickscan Audit' },
  FULL: { productId: 'vexnexa-audit-full', price: 549.00, label: 'Full Site Audit' },
  ENTERPRISE: { productId: 'vexnexa-audit-enterprise', price: 1199.00, label: 'Enterprise Audit' },
} as const;

/* ─── Audit + Monitoring Bundels — maandelijks (excl. VAT) ─── */
export const AUDIT_BUNDLE_PRICES = {
  STARTER: { productId: 'vexnexa-starter-audit-monthly', price: 49.00, label: 'Starter Audit bundel' },
  PRO: { productId: 'vexnexa-pro-audit-monthly', price: 119.00, label: 'Pro Audit bundel' },
  BUSINESS: { productId: 'vexnexa-business-audit-monthly', price: 279.00, label: 'Business Audit bundel' },
  ENTERPRISE: { productId: 'vexnexa-enterprise-audit-monthly', price: 599.00, label: 'Enterprise Audit bundel' },
} as const;

/* ─── Eenmalige Extras (excl. VAT) ─── */
export const EXTRA_SERVICES_PRICES = {
  A11Y_STATEMENT: { productId: 'vexnexa-a11y-statement', price: 79.00, label: 'Accessibility statement' },
  VPAT: { productId: 'vexnexa-vpat', price: 149.00, label: 'VPAT template' },
  REMEDIATION_DOC: { productId: 'vexnexa-remediation-doc', price: 99.00, label: 'Remediation roadmap' },
  DEV_TRAINING: { productId: 'vexnexa-dev-training', price: 199.00, label: 'Developer training (1u)' },
} as const;

/* ─── Mollie Product IDs for subscriptions ─── */
export const PLAN_PRODUCT_IDS: Record<PlanKey, { monthly: string; yearly: string }> = {
  STARTER: { monthly: 'vexnexa-starter-monthly', yearly: 'vexnexa-starter-yearly' },
  PRO: { monthly: 'vexnexa-pro-monthly', yearly: 'vexnexa-pro-yearly' },
  BUSINESS: { monthly: 'vexnexa-business-monthly', yearly: 'vexnexa-business-yearly' },
  ENTERPRISE: { monthly: 'vexnexa-enterprise-monthly', yearly: 'vexnexa-enterprise-yearly' },
} as const;

export const ASSURANCE_PRODUCT_IDS = {
  STARTER: 'vexnexa-assurance-starter',
  PRO: 'vexnexa-assurance-pro',
} as const;

export const WEBSITE_PACK_PRODUCT_IDS = {
  EXTRA_WEBSITE_1: 'vexnexa-extra-1site',
  EXTRA_WEBSITE_5: 'vexnexa-extra-5sites',
  EXTRA_WEBSITE_10: 'vexnexa-extra-10sites',
} as const;

export const PAGE_PACK_PRODUCT_IDS = {
  PAGE_PACK_25K: 'vexnexa-pages-25k',
  PAGE_PACK_100K: 'vexnexa-pages-100k',
  PAGE_PACK_250K: 'vexnexa-pages-250k',
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
  const fullPrice = BASE_PRICES[planKey] * 12;
  const annualPrice = ANNUAL_PRICES[planKey];
  return Math.round(((fullPrice - annualPrice) / fullPrice) * 100);
}

/**
 * Calculate price for a given plan and billing cycle (excl. VAT)
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === 'monthly') return BASE_PRICES[planKey];
  return ANNUAL_PRICES[planKey];
}

/**
 * Get all pricing details for a plan (excl. VAT)
 */
export function getPlanPricing(planKey: PlanKey): PlanPrice {
  const monthly = BASE_PRICES[planKey];
  const annual = ANNUAL_PRICES[planKey];

  return {
    monthly,
    yearly: {
      total: annual,
      perMonth: annual > 0 ? Math.round((annual / 12) * 100) / 100 : 0,
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
    if (cycle === 'yearly') {
      return { mainPrice: formatEuro(pricing.yearly.total, locale), period: '/year', subtext: `${formatEuro(pricing.yearly.perMonth, locale)}/month` };
    }
    return { mainPrice: formatEuro(pricing.monthly, locale), period: '/month' };
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

  if (planKey) {
    const discount = getDiscountPercentage(planKey, cycle);
    return discount > 0 ? `Save ${discount}%` : null;
  }

  return 'Save 15%';
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
 * Calculate total monthly price including add-ons (excl. VAT)
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
  STARTER: { amount: "19.00", currency: "EUR", interval: "1 month" },
  PRO: { amount: "44.00", currency: "EUR", interval: "1 month" },
  BUSINESS: { amount: "129.00", currency: "EUR", interval: "1 month" },
  ENTERPRISE: { amount: "349.00", currency: "EUR", interval: "1 month" },
} as const;

export function formatPrice(plan: keyof typeof PRICES): string {
  const price = PRICES[plan];
  return `€${price.amount}/${price.interval.split(' ')[1]}`;
}
