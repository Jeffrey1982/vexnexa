/**
 * VexNexa Pricing Configuration — Single Source of Truth
 *
 * ALL prices are INCLUSIVE of VAT (gross).
 * These are the exact amounts charged via Mollie.
 * No dynamic VAT calculation — the price is the price.
 *
 * Plan mapping (Prisma enum → display name):
 *   FREE       → "Free"
 *   STARTER    → "Starter" (legacy, hidden from new signups)
 *   PRO        → "Pro"
 *   BUSINESS   → "Agency"
 *   PIONEER    → "Pioneer Deal"
 *   ENTERPRISE → "Enterprise"
 */

export type PlanKey = "FREE" | "STARTER" | "PRO" | "BUSINESS" | "PIONEER" | "ENTERPRISE";
export type BillingInterval = "monthly" | "yearly";

/** Plans available for new self-serve signups */
export const SELF_SERVE_PLANS: PlanKey[] = ["PRO", "BUSINESS", "PIONEER"] as const;

/** Plans shown on the public pricing page */
export const PUBLIC_PLANS: PlanKey[] = ["FREE", "PRO", "BUSINESS", "PIONEER"] as const;

export const PLAN_IDS: Record<PlanKey, string> = {
  FREE: "VN-F-0",
  STARTER: "VN-S-19",
  PRO: "VN-PRO-3495",
  BUSINESS: "VN-B-9995",
  PIONEER: "VN-P-499",
  ENTERPRISE: "VN-E-1500",
} as const;

/**
 * Fixed VAT-inclusive prices charged via Mollie.
 * These amounts are final — they never change based on customer
 * country, business type, or VAT validation status.
 */
export const PLAN_PRICES: Record<
  PlanKey,
  { monthly: number; yearly: number }
> = {
  FREE: { monthly: 0, yearly: 0 },
  STARTER: { monthly: 19.0, yearly: 193.8 }, // legacy — kept for existing users
  PRO: { monthly: 34.95, yearly: 349.5 },
  BUSINESS: { monthly: 99.95, yearly: 999.5 },
  PIONEER: { monthly: 499.0, yearly: 5988.0 },
  ENTERPRISE: { monthly: 1500.0, yearly: 18000.0 },
} as const;

/** Human-readable plan display names */
export const PLAN_DISPLAY_NAMES: Record<PlanKey, string> = {
  FREE: "Free",
  STARTER: "Starter",
  PRO: "Pro",
  BUSINESS: "Agency",
  PIONEER: "Pioneer Deal",
  ENTERPRISE: "Enterprise",
} as const;

/** Short plan descriptions for checkout and admin */
export const PLAN_DESCRIPTIONS: Record<PlanKey, string> = {
  FREE: "Basic accessibility scanning for one website",
  STARTER: "Starter plan for small websites",
  PRO: "Professional scanning for growing teams",
  BUSINESS: "Full-featured plan for agencies and large teams",
  PIONEER: "Pioneer partner deal with premium reporting access",
  ENTERPRISE: "Custom solution with dedicated support",
} as const;

/**
 * Get the exact Mollie amount for a plan and billing interval.
 *
 * This is the ONLY function that should be used to determine
 * how much to charge via Mollie. Do not compute amounts elsewhere.
 *
 * @returns Amount in EUR (e.g. 34.95)
 * @throws If plan is FREE or ENTERPRISE (no self-serve checkout)
 */
export function getMollieAmount(
  plan: PlanKey,
  interval: BillingInterval
): number {
  if (plan === "FREE") {
    throw new Error("[pricing] FREE plan does not require payment");
  }
  if (plan === "ENTERPRISE") {
    throw new Error("[pricing] ENTERPRISE plan has no self-serve checkout");
  }

  const amount = PLAN_PRICES[plan][interval];
  if (amount <= 0) {
    throw new Error(`[pricing] Invalid amount for ${plan}/${interval}: ${amount}`);
  }

  return amount;
}

/**
 * Check whether a plan supports self-serve Mollie checkout.
 */
export function isSelfServePlan(plan: PlanKey): boolean {
  return SELF_SERVE_PLANS.includes(plan);
}

/**
 * Get the Mollie subscription interval string.
 */
export function getMollieInterval(interval: BillingInterval): string {
  return interval === "monthly" ? "1 month" : "12 months";
}

/**
 * Format a EUR amount to Mollie's required string format ("34.95").
 */
export function toMollieAmountString(amount: number): string {
  if (amount < 0) {
    throw new Error(`[pricing] Invalid negative amount: ${amount}`);
  }
  return amount.toFixed(2);
}

/**
 * Get the display price string for a plan.
 * Returns the VAT-inclusive price formatted as EUR.
 */
export function getDisplayPrice(
  plan: PlanKey,
  interval: BillingInterval
): string {
  const amount = PLAN_PRICES[plan][interval];
  if (amount === 0) return "Free";
  return formatEurPrice(amount);
}

/**
 * Format a number as EUR price string.
 */
export function formatEurPrice(amount: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Get the equivalent monthly price for display (yearly / 12).
 */
export function getMonthlyEquivalent(plan: PlanKey): number {
  const yearly = PLAN_PRICES[plan].yearly;
  if (yearly === 0) return 0;
  return Math.round((yearly / 12) * 100) / 100;
}

/**
 * Get the yearly savings compared to paying monthly.
 */
export function getYearlySavings(plan: PlanKey): number {
  const monthlyTotal = PLAN_PRICES[plan].monthly * 12;
  const yearly = PLAN_PRICES[plan].yearly;
  return Math.round((monthlyTotal - yearly) * 100) / 100;
}

/**
 * Get the yearly discount percentage.
 */
export function getYearlyDiscountPercent(plan: PlanKey): number {
  const monthlyTotal = PLAN_PRICES[plan].monthly * 12;
  if (monthlyTotal === 0) return 0;
  const yearly = PLAN_PRICES[plan].yearly;
  return Math.round(((monthlyTotal - yearly) / monthlyTotal) * 100);
}

/**
 * Derive the internal VAT breakdown from a fixed inclusive price.
 * Used for invoice/accounting purposes only — never for checkout pricing.
 *
 * @param grossAmount - The fixed inclusive price charged
 * @param vatRate - VAT rate as decimal (e.g. 0.21 for 21%)
 * @returns { net, vat, gross } breakdown
 */
export function deriveVatBreakdown(
  grossAmount: number,
  vatRate: number = 0.21
): { net: number; vat: number; gross: number } {
  const grossCents = Math.round(grossAmount * 100);
  const netCents = Math.round(grossCents / (1 + vatRate));
  const vatCents = grossCents - netCents;
  return {
    net: netCents / 100,
    vat: vatCents / 100,
    gross: grossAmount,
  };
}

/**
 * Build Mollie payment metadata.
 * Standardized metadata attached to every payment/subscription.
 */
export function buildPaymentMetadata(opts: {
  userId: string;
  planKey: PlanKey;
  billingInterval: BillingInterval;
  customerType: "individual" | "company";
  companyName?: string;
  vatNumber?: string;
  kvkNumber?: string;
  chargedAmount: number;
  currency?: string;
  billingCountry?: string;
}): Record<string, string> {
  return {
    userId: opts.userId,
    planKey: opts.planKey,
    planId: PLAN_IDS[opts.planKey],
    billingInterval: opts.billingInterval,
    customerType: opts.customerType,
    companyName: opts.companyName ?? "",
    vatNumber: opts.vatNumber ?? "",
    kvkNumber: opts.kvkNumber ?? "",
    chargedAmount: String(opts.chargedAmount),
    currency: opts.currency ?? "EUR",
    billingCountry: opts.billingCountry ?? "",
    type: "upgrade",
  };
}
