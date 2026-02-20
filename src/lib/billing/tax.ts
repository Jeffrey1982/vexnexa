/**
 * VAT / Tax determination logic for VexNexa billing.
 *
 * Rules:
 *  1. NL customers (any type)        → 21% NL VAT
 *  2. EU business + valid VAT + ≠ NL → 0% reverse charge
 *  3. Non-EU customers               → 0% no VAT
 *  4. EU B2C (individual)            → 21% NL VAT (simplified; OSS future extension)
 *  5. EU business without valid VAT  → 21% NL VAT (cannot prove B2B)
 */

import { isEuCountry, isNlCountry } from "./countries";

export { isEuCountry, isNlCountry } from "./countries";

export type TaxRegime = "NL_VAT" | "EU_REVERSE_CHARGE" | "NON_EU_NO_VAT";

export interface TaxDecision {
  vatRate: number;
  regime: TaxRegime;
  invoiceNote: string;
}

export interface BillingProfileForTax {
  countryCode: string;
  billingType: "individual" | "business";
  vatValid: boolean;
}

/**
 * Determine the applicable VAT rate and regime for a billing profile.
 */
export function determineTax(profile: BillingProfileForTax): TaxDecision {
  const country = profile.countryCode.toUpperCase();

  // Rule 1: NL customers always pay 21% NL VAT
  if (isNlCountry(country)) {
    return {
      vatRate: 0.21,
      regime: "NL_VAT",
      invoiceNote: "BTW 21% (NL)",
    };
  }

  // Rule 2: EU business with valid VAT → reverse charge 0%
  if (
    isEuCountry(country) &&
    profile.billingType === "business" &&
    profile.vatValid
  ) {
    return {
      vatRate: 0,
      regime: "EU_REVERSE_CHARGE",
      invoiceNote: "VAT 0% – reverse charge (EU B2B, valid VAT ID)",
    };
  }

  // Rule 4/5: EU individual or EU business without valid VAT → NL VAT
  if (isEuCountry(country)) {
    return {
      vatRate: 0.21,
      regime: "NL_VAT",
      invoiceNote: "BTW 21% (NL)",
    };
  }

  // Rule 3: Non-EU → 0%
  return {
    vatRate: 0,
    regime: "NON_EU_NO_VAT",
    invoiceNote: "VAT 0% – outside EU",
  };
}

/**
 * Calculate amount breakdown given net price and tax decision.
 */
export function calculateAmountBreakdown(
  netAmount: number,
  tax: TaxDecision
): { net: number; vat: number; gross: number } {
  const vat = Math.round(netAmount * tax.vatRate * 100) / 100;
  return {
    net: netAmount,
    vat,
    gross: Math.round((netAmount + vat) * 100) / 100,
  };
}

/**
 * EU VAT ID format patterns per country (basic regex, not exhaustive).
 * Used for client-side pre-validation before VIES check.
 */
export const VAT_ID_PATTERNS: Record<string, RegExp> = {
  AT: /^ATU\d{8}$/,
  BE: /^BE0\d{9}$/,
  BG: /^BG\d{9,10}$/,
  HR: /^HR\d{11}$/,
  CY: /^CY\d{8}[A-Z]$/,
  CZ: /^CZ\d{8,10}$/,
  DK: /^DK\d{8}$/,
  EE: /^EE\d{9}$/,
  FI: /^FI\d{8}$/,
  FR: /^FR[A-HJ-NP-Z0-9]{2}\d{9}$/,
  DE: /^DE\d{9}$/,
  GR: /^EL\d{9}$/,
  HU: /^HU\d{8}$/,
  IE: /^IE\d{7}[A-Z]{1,2}$|^IE\d[A-Z+*]\d{5}[A-Z]$/,
  IT: /^IT\d{11}$/,
  LV: /^LV\d{11}$/,
  LT: /^LT(\d{9}|\d{12})$/,
  LU: /^LU\d{8}$/,
  MT: /^MT\d{8}$/,
  NL: /^NL\d{9}B\d{2}$/,
  PL: /^PL\d{10}$/,
  PT: /^PT\d{9}$/,
  RO: /^RO\d{2,10}$/,
  SK: /^SK\d{10}$/,
  SI: /^SI\d{8}$/,
  ES: /^ES[A-Z0-9]\d{7}[A-Z0-9]$/,
  SE: /^SE\d{12}$/,
};

/**
 * Basic local format validation for EU VAT IDs.
 * Returns true if the format matches the expected pattern for the country.
 */
export function validateVatIdFormat(
  countryCode: string,
  vatId: string
): boolean {
  const cleaned = vatId.replace(/[\s.-]/g, "").toUpperCase();
  const pattern = VAT_ID_PATTERNS[countryCode.toUpperCase()];
  if (!pattern) return false;
  return pattern.test(cleaned);
}

/**
 * Normalize a VAT ID: strip whitespace, dots, dashes, uppercase.
 */
export function normalizeVatId(vatId: string): string {
  return vatId.replace(/[\s.-]/g, "").toUpperCase();
}
