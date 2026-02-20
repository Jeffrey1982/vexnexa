/**
 * Tests for the tax rules engine (computeTaxDecision).
 *
 * Covers all scenarios from the prompt:
 *  - NL B2C → 21%
 *  - NL company (vat valid/invalid) → 21%
 *  - DE company with valid DE VAT → reverse charge 0%
 *  - EU individual → VAT by country (config-driven)
 *  - Non-EU → no_tax default
 *  - Edge cases: missing country, missing VAT ID, etc.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  computeTaxDecision,
  calculateTaxBreakdown,
  formatTaxLineLabel,
} from "../tax/rules";
import { getVatRate, EU_VAT_RATES, MERCHANT_COUNTRY } from "../tax/vat-rates";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

// ── 1. computeTaxDecision runtime tests ──

describe("computeTaxDecision()", () => {
  // NL B2C → 21% standard VAT
  it("NL individual (B2C) → 21% vat_standard", () => {
    const result = computeTaxDecision({
      customerCountry: "NL",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(21);
    expect(result.taxMode).toBe("vat_standard");
    expect(result.vatRateDecimal).toBe(0.21);
    expect(result.countryCode).toBe("NL");
  });

  // NL company with valid VAT → still 21% (domestic B2B)
  it("NL company with valid VAT → 21% vat_standard (domestic)", () => {
    const result = computeTaxDecision({
      customerCountry: "NL",
      customerType: "company",
      vatId: "NL123456789B01",
      vatIdValid: true,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(21);
    expect(result.taxMode).toBe("vat_standard");
  });

  // NL company without valid VAT → still 21%
  it("NL company without valid VAT → 21% vat_standard", () => {
    const result = computeTaxDecision({
      customerCountry: "NL",
      customerType: "company",
      vatId: "NL123456789B01",
      vatIdValid: false,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(21);
    expect(result.taxMode).toBe("vat_standard");
  });

  // DE company with valid DE VAT → reverse charge 0%
  it("DE company with valid VAT → 0% reverse_charge", () => {
    const result = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatId: "DE123456789",
      vatIdValid: true,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("reverse_charge");
    expect(result.vatRateDecimal).toBe(0);
    expect(result.notes).toContain("reverse charge");
  });

  // DE company without valid VAT → DE country rate (19%)
  it("DE company without valid VAT → DE country rate (vat_standard)", () => {
    const result = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatIdValid: false,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(19);
    expect(result.taxMode).toBe("vat_standard");
    expect(result.vatRateDecimal).toBe(0.19);
  });

  // EU individual → VAT by country (config-driven)
  it("FR individual → FR country rate (20%)", () => {
    const result = computeTaxDecision({
      customerCountry: "FR",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(20);
    expect(result.taxMode).toBe("vat_standard");
    expect(result.vatRateDecimal).toBe(0.20);
  });

  it("BE individual → BE country rate (21%)", () => {
    const result = computeTaxDecision({
      customerCountry: "BE",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(21);
    expect(result.taxMode).toBe("vat_standard");
  });

  it("HU individual → HU country rate (27%)", () => {
    const result = computeTaxDecision({
      customerCountry: "HU",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(27);
    expect(result.taxMode).toBe("vat_standard");
  });

  it("SE individual → SE country rate (25%)", () => {
    const result = computeTaxDecision({
      customerCountry: "SE",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(25);
    expect(result.taxMode).toBe("vat_standard");
  });

  // BE company with valid VAT → reverse charge 0%
  it("BE company with valid VAT → 0% reverse_charge", () => {
    const result = computeTaxDecision({
      customerCountry: "BE",
      customerType: "company",
      vatId: "BE0123456789",
      vatIdValid: true,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("reverse_charge");
  });

  // Non-EU → no_tax default
  it("US individual → 0% no_tax", () => {
    const result = computeTaxDecision({
      customerCountry: "US",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("no_tax");
    expect(result.vatRateDecimal).toBe(0);
  });

  it("US company → 0% no_tax", () => {
    const result = computeTaxDecision({
      customerCountry: "US",
      customerType: "company",
      vatIdValid: false,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("no_tax");
  });

  it("JP company → 0% no_tax", () => {
    const result = computeTaxDecision({
      customerCountry: "JP",
      customerType: "company",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("no_tax");
  });

  it("GB company → 0% no_tax (post-Brexit)", () => {
    const result = computeTaxDecision({
      customerCountry: "GB",
      customerType: "company",
      vatIdValid: false,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(0);
    expect(result.taxMode).toBe("no_tax");
  });

  // Edge: company with vatIdValid=null → treated as no valid VAT
  it("DE company with vatIdValid=null → DE country rate", () => {
    const result = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatId: "DE123456789",
      vatIdValid: null,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(19);
    expect(result.taxMode).toBe("vat_standard");
  });

  // Edge: company with valid VAT but no vatId string → treated as no valid VAT
  it("DE company with vatIdValid=true but no vatId → DE country rate", () => {
    const result = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatId: null,
      vatIdValid: true,
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(19);
    expect(result.taxMode).toBe("vat_standard");
  });

  // Case insensitivity
  it("handles lowercase country codes", () => {
    const result = computeTaxDecision({
      customerCountry: "nl",
      customerType: "individual",
      productType: "saas_subscription",
    });
    expect(result.taxRatePercent).toBe(21);
    expect(result.taxMode).toBe("vat_standard");
  });
});

// ── 2. calculateTaxBreakdown ──

describe("calculateTaxBreakdown()", () => {
  it("calculates 21% VAT on €24.99", () => {
    const tax = computeTaxDecision({
      customerCountry: "NL",
      customerType: "individual",
    });
    const breakdown = calculateTaxBreakdown(24.99, tax);
    expect(breakdown.net).toBe(24.99);
    expect(breakdown.vat).toBe(5.25);
    expect(breakdown.gross).toBe(30.24);
  });

  it("calculates 0% VAT for reverse charge", () => {
    const tax = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatId: "DE123456789",
      vatIdValid: true,
    });
    const breakdown = calculateTaxBreakdown(59.99, tax);
    expect(breakdown.net).toBe(59.99);
    expect(breakdown.vat).toBe(0);
    expect(breakdown.gross).toBe(59.99);
  });

  it("calculates 0% VAT for non-EU", () => {
    const tax = computeTaxDecision({
      customerCountry: "US",
      customerType: "individual",
    });
    const breakdown = calculateTaxBreakdown(129, tax);
    expect(breakdown.net).toBe(129);
    expect(breakdown.vat).toBe(0);
    expect(breakdown.gross).toBe(129);
  });

  it("calculates 19% VAT for DE individual", () => {
    const tax = computeTaxDecision({
      customerCountry: "DE",
      customerType: "individual",
    });
    const breakdown = calculateTaxBreakdown(100, tax);
    expect(breakdown.net).toBe(100);
    expect(breakdown.vat).toBe(19);
    expect(breakdown.gross).toBe(119);
  });
});

// ── 3. formatTaxLineLabel ──

describe("formatTaxLineLabel()", () => {
  it("formats standard VAT label", () => {
    const tax = computeTaxDecision({
      customerCountry: "NL",
      customerType: "individual",
    });
    expect(formatTaxLineLabel(tax)).toBe("VAT (21%)");
  });

  it("formats reverse charge label", () => {
    const tax = computeTaxDecision({
      customerCountry: "DE",
      customerType: "company",
      vatId: "DE123456789",
      vatIdValid: true,
    });
    expect(formatTaxLineLabel(tax)).toBe("VAT (0%) – Reverse charge");
  });

  it("formats no-tax label", () => {
    const tax = computeTaxDecision({
      customerCountry: "US",
      customerType: "individual",
    });
    expect(formatTaxLineLabel(tax)).toBe("No VAT");
  });
});

// ── 4. VAT rates config ──

describe("VAT rates config (vat-rates.ts)", () => {
  it("has NL rate of 21%", () => {
    expect(getVatRate("NL")).toBe(0.21);
  });

  it("has DE rate of 19%", () => {
    expect(getVatRate("DE")).toBe(0.19);
  });

  it("has FR rate of 20%", () => {
    expect(getVatRate("FR")).toBe(0.20);
  });

  it("has HU rate of 27% (highest in EU)", () => {
    expect(getVatRate("HU")).toBe(0.27);
  });

  it("has LU rate of 17% (lowest in EU)", () => {
    expect(getVatRate("LU")).toBe(0.17);
  });

  it("returns default rate for unknown EU country", () => {
    expect(getVatRate("XX")).toBe(0.21);
  });

  it("has all 27 EU member states configured", () => {
    expect(Object.keys(EU_VAT_RATES).length).toBe(27);
  });

  it("merchant country is NL", () => {
    expect(MERCHANT_COUNTRY).toBe("NL");
  });
});

// ── 5. Source structure verification ──

describe("Tax rules source structure", () => {
  const rules = readFile("src/lib/tax/rules.ts");
  const rates = readFile("src/lib/tax/vat-rates.ts");

  it("rules.ts exports computeTaxDecision", () => {
    expect(rules).toContain("export function computeTaxDecision(");
  });

  it("rules.ts exports CustomerType type", () => {
    expect(rules).toContain('export type CustomerType = "individual" | "company"');
  });

  it("rules.ts exports TaxMode type", () => {
    expect(rules).toContain("export type TaxMode =");
    expect(rules).toContain('"vat_standard"');
    expect(rules).toContain('"reverse_charge"');
    expect(rules).toContain('"no_tax"');
  });

  it("rules.ts exports TaxDecision interface with taxRatePercent", () => {
    expect(rules).toContain("export interface TaxDecision");
    expect(rules).toContain("taxRatePercent: number");
    expect(rules).toContain("taxMode: TaxMode");
  });

  it("rules.ts has compliance disclaimer", () => {
    expect(rules).toContain("accountant/legal advisor");
  });

  it("vat-rates.ts exports EU_VAT_RATES config map", () => {
    expect(rates).toContain("export const EU_VAT_RATES");
  });

  it("vat-rates.ts exports MERCHANT_COUNTRY", () => {
    expect(rates).toContain('export const MERCHANT_COUNTRY = "NL"');
  });

  it("vat-rates.ts has compliance disclaimer", () => {
    expect(rates).toContain("accountant/legal advisor");
  });

  it("vat-rates.ts exports getVatRate function", () => {
    expect(rates).toContain("export function getVatRate(");
  });
});

// ── 6. Onboarding validation: company name required if company ──

describe("Onboarding validation: company name required", () => {
  const profileRoute = readFile("src/app/api/billing/profile/route.ts");

  it("validates company name required for business billing type", () => {
    expect(profileRoute).toContain(
      'data.billingType === "business" && !data.companyName?.trim()'
    );
    expect(profileRoute).toContain(
      "Company name is required for business billing"
    );
  });
});

// ── 7. Onboarding UI: registration number for non-NL EU ──

describe("Onboarding UI: registration number field", () => {
  const page = readFile("src/app/onboarding/page.tsx");

  it("has registrationNumber in form state", () => {
    expect(page).toContain("registrationNumber: ''");
  });

  it("shows Chamber of Commerce for non-NL EU countries", () => {
    expect(page).toContain("Chamber of Commerce number (optional)");
    expect(page).toContain('id="registrationNumber"');
  });

  it("shows KvK-nummer for NL", () => {
    expect(page).toContain("KvK-nummer (optional)");
  });

  it("conditionally shows registration number for EU non-NL", () => {
    expect(page).toContain(
      "isEuCountry(formData.country) && !isNlCountry(formData.country)"
    );
  });

  it("sends registrationNumber to billing profile API", () => {
    expect(page).toContain(
      "registrationNumber: formData.registrationNumber || undefined"
    );
  });
});

// ── 8. CheckoutQuote model in Prisma schema ──

describe("Prisma schema: CheckoutQuote model", () => {
  const schema = readFile("prisma/schema.prisma");

  it("defines CheckoutQuote model", () => {
    expect(schema).toContain("model CheckoutQuote {");
  });

  it("has tax decision fields", () => {
    expect(schema).toContain("taxRatePercent");
    expect(schema).toContain("taxMode");
    expect(schema).toContain("taxNotes");
  });

  it("has customer snapshot fields", () => {
    expect(schema).toContain("customerType    String");
    expect(schema).toContain("customerCountry String");
    expect(schema).toContain("companyName     String?");
    expect(schema).toContain("vatIdValid      Boolean");
  });

  it("has price breakdown fields", () => {
    expect(schema).toContain("baseAmount");
    expect(schema).toContain("vatAmount");
    expect(schema).toContain("totalAmount");
  });

  it("has molliePaymentId reference", () => {
    expect(schema).toContain("molliePaymentId String?");
  });

  it("BillingProfile has registrationNumber field", () => {
    expect(schema).toContain("registrationNumber String?");
  });

  it("User has checkoutQuotes relation", () => {
    expect(schema).toContain("checkoutQuotes CheckoutQuote[]");
  });
});
