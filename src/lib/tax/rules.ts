/**
 * Tax rules engine for VexNexa billing.
 *
 * IMPORTANT: Tax logic depends on jurisdiction and product classification.
 * This implementation is a configurable baseline and should be reviewed
 * with an accountant/legal advisor before relying on it for compliance.
 *
 * Rules implemented:
 *  1. NL customers (any type)                    → NL standard VAT (21%)
 *  2. EU B2B + valid VAT ID (country ≠ NL)       → reverse charge (0%)
 *  3. EU B2C or EU B2B without valid VAT          → VAT at customer country rate (OSS)
 *  4. Non-EU customers                            → no VAT (0%)
 *
 * The rates are loaded from the config-driven vat-rates.ts map.
 * For B2C EU sales of digital services, the place-of-supply rule
 * requires charging VAT at the customer's country rate (OSS style).
 */

import { isEuCountry, isNlCountry } from "../billing/countries";
import { getVatRate, getVatRateLabel, MERCHANT_COUNTRY } from "./vat-rates";

// ── Types ──

export type CustomerType = "individual" | "company";

export type TaxMode = "vat_standard" | "reverse_charge" | "no_tax";

export interface TaxDecision {
  /** VAT rate as a percentage number (e.g. 21 for 21%) */
  taxRatePercent: number;
  /** Tax mode classification */
  taxMode: TaxMode;
  /** Human-readable note for invoices/receipts */
  notes?: string;
  /** VAT rate as a decimal (e.g. 0.21) — for calculation convenience */
  vatRateDecimal: number;
  /** Country code used for this decision */
  countryCode: string;
}

export interface ComputeTaxParams {
  /** Merchant's country (default: 'NL') */
  merchantCountry?: string;
  /** Customer's billing country (ISO 3166-1 alpha-2) */
  customerCountry: string;
  /** Customer type: individual (B2C) or company (B2B) */
  customerType: CustomerType;
  /** Customer's VAT ID (if provided) */
  vatId?: string | null;
  /** Whether the VAT ID has been validated as valid */
  vatIdValid?: boolean | null;
  /** Product type — future-proof for different tax treatments */
  productType?: "saas_subscription";
}

/**
 * Compute the tax decision for a given customer profile.
 *
 * This is the single source of truth for tax calculation in VexNexa.
 * All checkout flows must use this function server-side.
 *
 * @see vat-rates.ts for the config-driven rate map
 */
export function computeTaxDecision(params: ComputeTaxParams): TaxDecision {
  const {
    merchantCountry = MERCHANT_COUNTRY,
    customerCountry,
    customerType,
    vatId,
    vatIdValid,
  } = params;

  const country = customerCountry.toUpperCase();
  const merchant = merchantCountry.toUpperCase();

  // ── Rule 1: Domestic (customer country == merchant country, e.g. NL) ──
  // Both B2C and B2B pay standard domestic VAT.
  // For NL B2B with valid NL VAT ID: domestic VAT still applies (no reverse charge for domestic).
  if (country === merchant && isNlCountry(country)) {
    const rate = getVatRate(country);
    return {
      taxRatePercent: Math.round(rate * 10000) / 100,
      taxMode: "vat_standard",
      notes: `BTW ${(rate * 100).toFixed(rate % 0.01 === 0 ? 0 : 1)}% (NL)`,
      vatRateDecimal: rate,
      countryCode: country,
    };
  }

  // ── Rule 2: EU B2B with valid VAT ID (country ≠ merchant) → reverse charge ──
  if (
    isEuCountry(country) &&
    customerType === "company" &&
    vatIdValid === true &&
    vatId
  ) {
    return {
      taxRatePercent: 0,
      taxMode: "reverse_charge",
      notes: "VAT 0% – reverse charge (EU B2B, valid VAT ID)",
      vatRateDecimal: 0,
      countryCode: country,
    };
  }

  // ── Rule 3: EU B2C, or EU B2B without valid VAT → customer country VAT rate ──
  // Under OSS (One-Stop-Shop) rules for digital services, VAT is charged
  // at the customer's country rate for B2C sales.
  // EU B2B without valid VAT is treated as B2C (cannot prove B2B status).
  if (isEuCountry(country)) {
    const rate = getVatRate(country);
    const label = getVatRateLabel(country);
    return {
      taxRatePercent: Math.round(rate * 10000) / 100,
      taxMode: "vat_standard",
      notes: `${label} (${country})`,
      vatRateDecimal: rate,
      countryCode: country,
    };
  }

  // ── Rule 4: Non-EU → no VAT ──
  return {
    taxRatePercent: 0,
    taxMode: "no_tax",
    notes: "VAT 0% – outside EU",
    vatRateDecimal: 0,
    countryCode: country,
  };
}

/**
 * Calculate amount breakdown from a net (ex-VAT) price and a tax decision.
 */
export function calculateTaxBreakdown(
  netAmount: number,
  tax: TaxDecision
): { net: number; vat: number; gross: number } {
  const vat = Math.round(netAmount * tax.vatRateDecimal * 100) / 100;
  return {
    net: netAmount,
    vat,
    gross: Math.round((netAmount + vat) * 100) / 100,
  };
}

/**
 * Format a tax line item for display in checkout/invoices.
 *
 * Examples:
 *  - "VAT (21%)" for NL standard
 *  - "VAT (0%) – Reverse charge" for EU B2B
 *  - "No VAT" for non-EU
 */
export function formatTaxLineLabel(tax: TaxDecision): string {
  switch (tax.taxMode) {
    case "vat_standard":
      return `VAT (${tax.taxRatePercent}%)`;
    case "reverse_charge":
      return "VAT (0%) – Reverse charge";
    case "no_tax":
      return "No VAT";
  }
}
