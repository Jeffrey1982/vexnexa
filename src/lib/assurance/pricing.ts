/**
 * VexNexa Accessibility Assurance Pricing Configuration
 *
 * Low-cost subscription service for schools, governments, and public institutions
 * Monitoring & assurance only (NOT audit, NOT certification, NOT remediation)
 */

import { AssuranceTier, AssuranceFrequency } from '@prisma/client';

export type BillingCycle = 'monthly' | 'semiannual' | 'annual';

export interface AssurancePlanPrice {
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

export interface AssurancePlanLimits {
  domains: number;
  scanFrequencies: AssuranceFrequency[];
  customThreshold: boolean;
  defaultThreshold: number;
}

/**
 * Base monthly prices (EUR)
 */
export const ASSURANCE_BASE_PRICES: Record<AssuranceTier, number> = {
  BASIC: 9.99,
  PRO: 24.99,
  PUBLIC_SECTOR: 49.99,
} as const;

/**
 * Fixed 6-month prices with 8% discount
 */
export const ASSURANCE_SEMIANNUAL_PRICES: Record<AssuranceTier, number> = {
  BASIC: 55.99,       // 7% discount
  PRO: 137.99,        // 8% discount
  PUBLIC_SECTOR: 275.99, // 8% discount
} as const;

/**
 * Fixed annual prices with 15% discount
 */
export const ASSURANCE_ANNUAL_PRICES: Record<AssuranceTier, number> = {
  BASIC: 101.99,      // 15% discount
  PRO: 254.99,        // 15% discount
  PUBLIC_SECTOR: 509.99, // 15% discount
} as const;

/**
 * Domain limits and features per tier
 */
export const ASSURANCE_PLAN_LIMITS: Record<AssuranceTier, AssurancePlanLimits> = {
  BASIC: {
    domains: 1,
    scanFrequencies: ['WEEKLY', 'BIWEEKLY'],
    customThreshold: false,
    defaultThreshold: 90,
  },
  PRO: {
    domains: 5,
    scanFrequencies: ['WEEKLY', 'BIWEEKLY'],
    customThreshold: false,
    defaultThreshold: 90,
  },
  PUBLIC_SECTOR: {
    domains: 20,
    scanFrequencies: ['WEEKLY', 'BIWEEKLY'],
    customThreshold: true, // Can set custom threshold (60-100)
    defaultThreshold: 90,
  },
} as const;

/**
 * Calculate discount percentage for a tier and cycle
 */
export function getAssuranceDiscountPercentage(
  tier: AssuranceTier,
  cycle: BillingCycle
): number {
  if (cycle === 'monthly') return 0;

  const basePrice = ASSURANCE_BASE_PRICES[tier];
  const months = cycle === 'semiannual' ? 6 : 12;
  const fullPrice = basePrice * months;
  const discountedPrice =
    cycle === 'semiannual'
      ? ASSURANCE_SEMIANNUAL_PRICES[tier]
      : ASSURANCE_ANNUAL_PRICES[tier];

  return Math.round(((fullPrice - discountedPrice) / fullPrice) * 100);
}

/**
 * Calculate price for a given tier and billing cycle
 */
export function calculateAssurancePrice(tier: AssuranceTier, cycle: BillingCycle): number {
  if (cycle === 'monthly') {
    return ASSURANCE_BASE_PRICES[tier];
  }

  if (cycle === 'semiannual') {
    return ASSURANCE_SEMIANNUAL_PRICES[tier];
  }

  return ASSURANCE_ANNUAL_PRICES[tier];
}

/**
 * Get all pricing details for a tier
 */
export function getAssurancePlanPricing(tier: AssuranceTier): AssurancePlanPrice {
  const monthly = ASSURANCE_BASE_PRICES[tier];
  const semiannual = ASSURANCE_SEMIANNUAL_PRICES[tier];
  const annual = ASSURANCE_ANNUAL_PRICES[tier];

  return {
    monthly,
    semiannual: {
      total: semiannual,
      perMonth: semiannual / 6,
      discount: getAssuranceDiscountPercentage(tier, 'semiannual'),
    },
    annual: {
      total: annual,
      perMonth: annual / 12,
      discount: getAssuranceDiscountPercentage(tier, 'annual'),
    },
  };
}

/**
 * Get plan limits for a tier
 */
export function getAssurancePlanLimits(tier: AssuranceTier): AssurancePlanLimits {
  return ASSURANCE_PLAN_LIMITS[tier];
}

/**
 * Validate if domain count is within tier limits
 */
export function validateDomainCount(tier: AssuranceTier, count: number): boolean {
  return count <= ASSURANCE_PLAN_LIMITS[tier].domains;
}

/**
 * Validate if threshold is allowed for tier
 */
export function validateThreshold(tier: AssuranceTier, threshold: number): boolean {
  const limits = ASSURANCE_PLAN_LIMITS[tier];

  // For Basic/Pro, threshold must be exactly 90
  if (!limits.customThreshold && threshold !== 90) {
    return false;
  }

  // For Public Sector, threshold can be 60-100
  if (limits.customThreshold && (threshold < 60 || threshold > 100)) {
    return false;
  }

  return true;
}

/**
 * Validate if scan frequency is allowed for tier
 */
export function validateScanFrequency(
  tier: AssuranceTier,
  frequency: AssuranceFrequency
): boolean {
  return ASSURANCE_PLAN_LIMITS[tier].scanFrequencies.includes(frequency);
}

/**
 * Format price in EUR with proper localization
 */
export function formatAssuranceEuro(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format price display based on billing cycle
 */
export function formatAssurancePriceDisplay(
  tier: AssuranceTier,
  cycle: BillingCycle,
  locale?: string
): {
  mainPrice: string;
  period: string;
  subtext?: string;
} {
  const pricing = getAssurancePlanPricing(tier);

  switch (cycle) {
    case 'monthly':
      return {
        mainPrice: formatAssuranceEuro(pricing.monthly, locale),
        period: '/month',
      };

    case 'semiannual':
      return {
        mainPrice: formatAssuranceEuro(pricing.semiannual.total, locale),
        period: '/6 months',
        subtext: `${formatAssuranceEuro(pricing.semiannual.perMonth, locale)}/month`,
      };

    case 'annual':
      return {
        mainPrice: formatAssuranceEuro(pricing.annual.total, locale),
        period: '/year',
        subtext: `${formatAssuranceEuro(pricing.annual.perMonth, locale)}/month`,
      };
  }
}

/**
 * Get discount badge text for a specific tier and cycle
 */
export function getAssuranceDiscountBadge(
  cycle: BillingCycle,
  tier?: AssuranceTier
): string | null {
  if (cycle === 'monthly') return null;

  if (tier) {
    const discount = getAssuranceDiscountPercentage(tier, cycle);
    return `Save ${discount}%`;
  }

  // Generic discount for cycle
  if (cycle === 'semiannual') return 'Save up to 8%';
  if (cycle === 'annual') return 'Save up to 15%';

  return null;
}

/**
 * Get CTA button text based on tier
 */
export function getAssuranceCTAText(tier: AssuranceTier): string {
  switch (tier) {
    case 'BASIC':
      return 'Get Started';
    case 'PRO':
      return 'Upgrade to Pro';
    case 'PUBLIC_SECTOR':
      return 'Contact Sales';
  }
}

/**
 * Get tier name for display
 */
export function getAssuranceTierName(tier: AssuranceTier): string {
  switch (tier) {
    case 'BASIC':
      return 'Basic';
    case 'PRO':
      return 'Pro';
    case 'PUBLIC_SECTOR':
      return 'Public Sector';
  }
}

/**
 * Get tier description
 */
export function getAssuranceTierDescription(tier: AssuranceTier): string {
  switch (tier) {
    case 'BASIC':
      return 'Perfect for single websites and small projects';
    case 'PRO':
      return 'Ideal for agencies and multi-site organizations';
    case 'PUBLIC_SECTOR':
      return 'Built for schools, governments, and public institutions';
  }
}

/**
 * Email recipient limit (same for all tiers)
 */
export const MAX_EMAIL_RECIPIENTS = 5;

/**
 * Scan history retention period (in months)
 */
export const RETENTION_MONTHS = 12;

/**
 * Default scan time (9 AM)
 */
export const DEFAULT_SCAN_TIME = '09:00';

/**
 * Default scan day (Monday = 1)
 */
export const DEFAULT_SCAN_DAY = 1;
