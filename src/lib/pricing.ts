/**
 * VexNexa Pricing Utilities
 *
 * ALL PRICES ARE INCLUSIVE OF VAT.
 * The single source of truth is src/lib/billing/pricing-config.ts.
 * This file re-exports key values and provides display helpers.
 */

import {
  PLAN_PRICES,
  PLAN_DISPLAY_NAMES,
  formatEurPrice,
  getYearlyDiscountPercent,
  getMonthlyEquivalent,
  type PlanKey,
  type BillingInterval,
} from "./billing/pricing-config";

// Re-export core types used across the codebase
export type BillingCycle = BillingInterval;
export type { PlanKey } from "./billing/pricing-config";

export interface PlanPrice {
  monthly: number;
  yearly: {
    total: number;
    perMonth: number;
    discount: number;
  };
}

/* ─── Fixed VAT-inclusive monthly prices (EUR) ─── */
export const BASE_PRICES: Record<PlanKey, number> = {
  FREE: PLAN_PRICES.FREE.monthly,
  STARTER: PLAN_PRICES.STARTER.monthly,
  PRO: PLAN_PRICES.PRO.monthly,
  BUSINESS: PLAN_PRICES.BUSINESS.monthly,
  ENTERPRISE: PLAN_PRICES.ENTERPRISE.monthly,
} as const;

/* ─── Fixed VAT-inclusive annual prices (EUR) ─── */
export const ANNUAL_PRICES: Record<PlanKey, number> = {
  FREE: PLAN_PRICES.FREE.yearly,
  STARTER: PLAN_PRICES.STARTER.yearly,
  PRO: PLAN_PRICES.PRO.yearly,
  BUSINESS: PLAN_PRICES.BUSINESS.yearly,
  ENTERPRISE: PLAN_PRICES.ENTERPRISE.yearly,
} as const;

/* ─── Extra Website Pack prices (monthly, incl. VAT) ─── */
export const WEBSITE_PACK_PRICES = {
  EXTRA_WEBSITE_1: 18.0,
  EXTRA_WEBSITE_5: 72.0,
  EXTRA_WEBSITE_10: 120.0,
} as const;

/* ─── Page Volume Pack prices (monthly, incl. VAT) ─── */
export const PAGE_PACK_PRICES = {
  PAGE_PACK_25K: 22.0,
  PAGE_PACK_100K: 89.0,
  PAGE_PACK_250K: 199.0,
} as const;

/* ─── Assurance add-on prices (monthly, per tier, incl. VAT) ─── */
export const ASSURANCE_ADDON_PRICES: Partial<Record<PlanKey, number>> = {
  STARTER: 12.0,
  PRO: 22.0,
  // BUSINESS & ENTERPRISE: included
} as const;

/* ─── Handmatige Audits — eenmalig (incl. VAT) ─── */
export const AUDIT_PRICES = {
  QUICK: { productId: "vexnexa-audit-quick", price: 249.0, label: "Quickscan Audit" },
  FULL: { productId: "vexnexa-audit-full", price: 549.0, label: "Full Site Audit" },
  ENTERPRISE: { productId: "vexnexa-audit-enterprise", price: 1199.0, label: "Enterprise Audit" },
} as const;

/* ─── Audit + Monitoring Bundels — maandelijks (incl. VAT) ─── */
export const AUDIT_BUNDLE_PRICES = {
  STARTER: { productId: "vexnexa-starter-audit-monthly", price: 49.0, label: "Starter Audit bundel" },
  PRO: { productId: "vexnexa-pro-audit-monthly", price: 119.0, label: "Pro Audit bundel" },
  BUSINESS: { productId: "vexnexa-business-audit-monthly", price: 279.0, label: "Business Audit bundel" },
  ENTERPRISE: { productId: "vexnexa-enterprise-audit-monthly", price: 599.0, label: "Enterprise Audit bundel" },
} as const;

/* ─── Eenmalige Extras (incl. VAT) ─── */
export const EXTRA_SERVICES_PRICES = {
  A11Y_STATEMENT: { productId: "vexnexa-a11y-statement", price: 79.0, label: "Accessibility statement" },
  VPAT: { productId: "vexnexa-vpat", price: 149.0, label: "VPAT template" },
  REMEDIATION_DOC: { productId: "vexnexa-remediation-doc", price: 99.0, label: "Remediation roadmap" },
  DEV_TRAINING: { productId: "vexnexa-dev-training", price: 199.0, label: "Developer training (1u)" },
} as const;

/* ─── Mollie Product IDs for subscriptions ─── */
export const PLAN_PRODUCT_IDS: Record<PlanKey, { monthly: string; yearly: string }> = {
  FREE: { monthly: "free", yearly: "free" },
  STARTER: { monthly: "vexnexa-starter-monthly", yearly: "vexnexa-starter-yearly" },
  PRO: { monthly: "vexnexa-pro-monthly", yearly: "vexnexa-pro-yearly" },
  BUSINESS: { monthly: "vexnexa-business-monthly", yearly: "vexnexa-business-yearly" },
  ENTERPRISE: { monthly: "vexnexa-enterprise-monthly", yearly: "vexnexa-enterprise-yearly" },
} as const;

export const ASSURANCE_PRODUCT_IDS = {
  STARTER: "vexnexa-assurance-starter",
  PRO: "vexnexa-assurance-pro",
} as const;

export const WEBSITE_PACK_PRODUCT_IDS = {
  EXTRA_WEBSITE_1: "vexnexa-extra-1site",
  EXTRA_WEBSITE_5: "vexnexa-extra-5sites",
  EXTRA_WEBSITE_10: "vexnexa-extra-10sites",
} as const;

export const PAGE_PACK_PRODUCT_IDS = {
  PAGE_PACK_25K: "vexnexa-pages-25k",
  PAGE_PACK_100K: "vexnexa-pages-100k",
  PAGE_PACK_250K: "vexnexa-pages-250k",
} as const;

/* ─── History retention per tier (months) ─── */
export const HISTORY_MONTHS: Record<PlanKey, number> = {
  FREE: 1,
  STARTER: 6,
  PRO: 12,
  BUSINESS: 24,
  ENTERPRISE: 36,
} as const;

/**
 * Get the fixed price for a plan and billing cycle (incl. VAT).
 */
export function calculatePrice(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === "monthly") return BASE_PRICES[planKey];
  return ANNUAL_PRICES[planKey];
}

/**
 * Get all pricing details for a plan (incl. VAT).
 */
export function getPlanPricing(planKey: PlanKey): PlanPrice {
  const monthly = BASE_PRICES[planKey];
  const annual = ANNUAL_PRICES[planKey];

  return {
    monthly,
    yearly: {
      total: annual,
      perMonth: getMonthlyEquivalent(planKey),
      discount: getYearlyDiscountPercent(planKey),
    },
  };
}

/**
 * Calculate discount percentage for a plan and cycle.
 */
export function getDiscountPercentage(planKey: PlanKey, cycle: BillingCycle): number {
  if (cycle === "monthly") return 0;
  return getYearlyDiscountPercent(planKey);
}

/**
 * Format price in EUR with proper localization.
 */
export function formatEuro(amount: number, locale: string = "nl-NL"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price display based on billing cycle.
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

  if (planKey === "FREE") {
    return { mainPrice: "Free", period: "forever" };
  }

  if (planKey === "ENTERPRISE") {
    return { mainPrice: "Custom", period: "" };
  }

  if (cycle === "yearly") {
    return {
      mainPrice: formatEuro(pricing.yearly.total, locale),
      period: "/year",
      subtext: `${formatEuro(pricing.yearly.perMonth, locale)}/month`,
    };
  }

  return { mainPrice: formatEuro(pricing.monthly, locale), period: "/month" };
}

/**
 * Get discount badge text for a specific plan and cycle.
 */
export function getDiscountBadge(cycle: BillingCycle, planKey?: PlanKey): string | null {
  if (cycle === "monthly") return null;

  if (planKey) {
    const discount = getDiscountPercentage(planKey, cycle);
    return discount > 0 ? `Save ${discount}%` : null;
  }

  return "Save 17%";
}

/**
 * Get CTA button text based on plan.
 */
export function getCTAText(cycle: BillingCycle, planKey?: PlanKey): string {
  if (planKey === "FREE") return "Start Free";
  if (planKey === "PRO") return "Get Pro";
  if (planKey === "BUSINESS") return "Get Agency";
  if (planKey === "ENTERPRISE") return "Contact Sales";
  return cycle === "monthly" ? "Start Monthly Plan" : "Start Annual Plan";
}

/**
 * Whether a plan includes Assurance for free.
 */
export function planIncludesAssurance(planKey: PlanKey): boolean {
  return planKey === "BUSINESS" || planKey === "ENTERPRISE";
}

/**
 * Get assurance add-on price for a tier (0 if included).
 */
export function getAssurancePrice(planKey: PlanKey): number {
  if (planIncludesAssurance(planKey)) return 0;
  return ASSURANCE_ADDON_PRICES[planKey] ?? 0;
}

/**
 * Calculate total monthly price including add-ons (incl. VAT).
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
 * Legacy compatibility — keep old PRICES export shape.
 */
export const PRICES = {
  STARTER: { amount: "19.00", currency: "EUR", interval: "1 month" },
  PRO: { amount: "34.95", currency: "EUR", interval: "1 month" },
  BUSINESS: { amount: "99.95", currency: "EUR", interval: "1 month" },
  ENTERPRISE: { amount: "349.00", currency: "EUR", interval: "1 month" },
} as const;

export function formatPrice(plan: keyof typeof PRICES): string {
  const price = PRICES[plan];
  return `€${price.amount}/${price.interval.split(" ")[1]}`;
}

// Re-export for convenience
export { PLAN_DISPLAY_NAMES, formatEurPrice };
