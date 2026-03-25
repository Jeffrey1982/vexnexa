/**
 * Tests for VAT display mode, gross↔net conversions,
 * checkout validation, and server-side totals logic.
 *
 * Updated for net-based pricing: all prices are stored excl. VAT.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  grossToNet,
  netToGross,
  vatFromGross,
  formatMoney,
  BASE_VAT_RATE,
  getPriceInclVat,
  getClientVatRate,
} from "../pricing/vat-math";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

// ── 1. grossToNet conversions ──

describe("grossToNet()", () => {
  it("€9.99 incl 21% → €8.26 excl (prompt example)", () => {
    expect(grossToNet(9.99, 0.21)).toBe(8.26);
  });

  it("€14.99 incl 21% → €12.39 excl", () => {
    expect(grossToNet(14.99, 0.21)).toBe(12.39);
  });

  it("€0 → €0", () => {
    expect(grossToNet(0, 0.21)).toBe(0);
  });

  it("uses default NL 21% rate", () => {
    expect(grossToNet(12.1)).toBe(10.0);
  });

  it("handles 0% VAT rate", () => {
    expect(grossToNet(100, 0)).toBe(100);
  });

  it("handles 19% DE rate", () => {
    expect(grossToNet(119, 0.19)).toBe(100);
  });

  it("throws on negative VAT rate", () => {
    expect(() => grossToNet(100, -0.1)).toThrow("VAT rate cannot be negative");
  });
});

// ── 2. netToGross conversions ──

describe("netToGross()", () => {
  it("€100 excl 21% → €121 incl", () => {
    expect(netToGross(100, 0.21)).toBe(121);
  });

  it("€100 excl 0% → €100 incl", () => {
    expect(netToGross(100, 0)).toBe(100);
  });

  it("€0 → €0", () => {
    expect(netToGross(0, 0.21)).toBe(0);
  });

  it("uses default NL 21% rate", () => {
    expect(netToGross(10)).toBe(12.1);
  });

  it("throws on negative VAT rate", () => {
    expect(() => netToGross(100, -0.1)).toThrow("VAT rate cannot be negative");
  });
});

// ── 3. vatFromGross ──

describe("vatFromGross()", () => {
  it("€121 at 21% → €21 VAT", () => {
    expect(vatFromGross(121, 0.21)).toBe(21);
  });

  it("€100 at 0% → €0 VAT", () => {
    expect(vatFromGross(100, 0)).toBe(0);
  });
});

// ── 4. getPriceInclVat ──

describe("getPriceInclVat()", () => {
  it("€19.00 excl + NL 21% → €22.99", () => {
    expect(getPriceInclVat(19.00, 'NL')).toBe(22.99);
  });

  it("€44.00 excl + DE 19% → €52.36", () => {
    expect(getPriceInclVat(44.00, 'DE')).toBe(52.36);
  });

  it("€129.00 excl + US 0% → €129.00", () => {
    expect(getPriceInclVat(129.00, 'US')).toBe(129.00);
  });

  it("€349.00 excl + CH 8.1% → €377.27", () => {
    expect(getPriceInclVat(349.00, 'CH')).toBe(377.27);
  });

  it("falls back to NL 21% for unknown country", () => {
    expect(getPriceInclVat(100, 'XX')).toBe(121);
  });
});

// ── 5. getClientVatRate ──

describe("getClientVatRate()", () => {
  it("NL → 0.21", () => {
    expect(getClientVatRate('NL')).toBe(0.21);
  });

  it("DE → 0.19", () => {
    expect(getClientVatRate('DE')).toBe(0.19);
  });

  it("US → 0", () => {
    expect(getClientVatRate('US')).toBe(0);
  });

  it("unknown → 0.21 (default)", () => {
    expect(getClientVatRate('XX')).toBe(0.21);
  });
});

// ── 6. formatMoney ──

describe("formatMoney()", () => {
  it("formats EUR with 2 decimals", () => {
    const result = formatMoney(14.99);
    expect(result).toContain("14,99");
    expect(result).toContain("€");
  });

  it("formats zero", () => {
    const result = formatMoney(0);
    expect(result).toContain("0,00");
  });
});

// ── 7. BASE_VAT_RATE constant ──

describe("BASE_VAT_RATE", () => {
  it("is 0.21 (NL 21%)", () => {
    expect(BASE_VAT_RATE).toBe(0.21);
  });
});

// ── 8. Display mode persistence (source structure) ──

describe("Display mode store (display-mode.ts)", () => {
  const src = readFile("src/lib/pricing/display-mode.ts");

  it("exports PriceDisplayMode type", () => {
    expect(src).toContain('export type PriceDisplayMode = "incl" | "excl"');
  });

  it("uses localStorage key vexnexa_price_display_mode", () => {
    expect(src).toContain('"vexnexa_price_display_mode"');
  });

  it("exports getPriceDisplayMode", () => {
    expect(src).toContain("export function getPriceDisplayMode");
  });

  it("exports setPriceDisplayMode", () => {
    expect(src).toContain("export function setPriceDisplayMode");
  });

  it("exports onPriceDisplayModeChange for subscriptions", () => {
    expect(src).toContain("export function onPriceDisplayModeChange");
  });

  it("defaults to excl mode (prices stored excl. VAT)", () => {
    expect(src).toContain('const DEFAULT_MODE: PriceDisplayMode = "excl"');
  });

  it("exports country state management", () => {
    expect(src).toContain("export function getPricingCountry");
    expect(src).toContain("export function setPricingCountry");
    expect(src).toContain("export function onPricingCountryChange");
  });
});

// ── 9. PriceModeToggle component structure ──

describe("PriceModeToggle component", () => {
  const src = readFile("src/components/pricing/PriceModeToggle.tsx");

  it("renders Incl. BTW option", () => {
    expect(src).toContain('"Incl. BTW"');
  });

  it("renders Excl. BTW option", () => {
    expect(src).toContain('"Excl. BTW"');
  });

  it("has country dropdown", () => {
    expect(src).toContain("PRICING_COUNTRY_OPTIONS");
    expect(src).toContain("usePricingCountry");
  });

  it("uses usePriceDisplayMode hook", () => {
    expect(src).toContain("usePriceDisplayMode");
  });

  it("uses radiogroup role for accessibility", () => {
    expect(src).toContain('role="radiogroup"');
  });
});

// ── 10. Checkout validation: CheckoutDialog ──

describe("Checkout validation: CheckoutDialog handles Individual/Company flow", () => {
  const checkoutDialog = readFile("src/components/checkout/CheckoutDialog.tsx");

  it("has purchaseAs state (individual/company)", () => {
    expect(checkoutDialog).toContain("purchaseAs");
    expect(checkoutDialog).toContain('"individual"');
    expect(checkoutDialog).toContain('"company"');
  });

  it("validates company fields before submission", () => {
    expect(checkoutDialog).toContain("Company name is required");
    expect(checkoutDialog).toContain("Country is required");
    expect(checkoutDialog).toContain("VAT number is required");
  });

  it("uses unified /api/billing/create-payment endpoint", () => {
    expect(checkoutDialog).toContain("/api/billing/create-payment");
  });

  it("sends company fields to server when company selected", () => {
    expect(checkoutDialog).toContain("companyFields.companyName");
    expect(checkoutDialog).toContain("companyFields.billingCountry");
    expect(checkoutDialog).toContain("companyFields.vatId");
  });

  it("sends priceMode and purchaseAs to server", () => {
    expect(checkoutDialog).toContain("priceMode:");
    expect(checkoutDialog).toContain("purchaseAs,");
  });

  it("pricing page delegates to CheckoutDialog", () => {
    const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");
    expect(pricingPage).toContain("<CheckoutDialog");
    expect(pricingPage).toContain("checkoutPlan");
  });
});

// ── 11. Server-side totals: net-based pricing ──

describe("Server-side totals: net-based pricing", () => {
  const mollieFlows = readFile("src/lib/billing/mollie-flows.ts");
  const quoteRoute = readFile("src/app/api/checkout/quote/route.ts");

  it("mollie-flows uses calculatePrice for net base", () => {
    expect(mollieFlows).toContain("calculatePrice(plan as PlanKey, billingCycle)");
  });

  it("mollie-flows applies customer tax to net base", () => {
    expect(mollieFlows).toContain("calculateTaxBreakdown(netBase, taxDecision)");
  });

  it("mollie-flows documents net-based pricing", () => {
    expect(mollieFlows).toContain("NET (excl. VAT)");
  });

  it("quote route uses calculatePrice for net base", () => {
    expect(quoteRoute).toContain("calculatePrice(plan as PlanKey, billingCycle)");
  });
});

// ── 12. Pricing page structure ──

describe("Pricing pages include PriceModeToggle", () => {
  const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");
  const assurancePage = readFile("src/app/dashboard/subscribe-assurance/page.tsx");

  it("pricing page imports PriceModeToggle", () => {
    expect(pricingPage).toContain('import { PriceModeToggle }');
  });

  it("pricing page renders PriceModeToggle", () => {
    expect(pricingPage).toContain("<PriceModeToggle");
  });

  it("pricing page imports getPriceInclVat for country-aware display", () => {
    expect(pricingPage).toContain("getPriceInclVat");
  });

  it("pricing page has audit services section", () => {
    expect(pricingPage).toContain("AuditServicesSection");
    expect(pricingPage).toContain("EAA Audit Diensten");
  });

  it("pricing page has audit bundles section", () => {
    expect(pricingPage).toContain("AuditBundlesSection");
    expect(pricingPage).toContain("Audit + Monitoring Bundels");
  });

  it("pricing page has country-aware VAT display", () => {
    expect(pricingPage).toContain("usePricingCountry");
    expect(pricingPage).toContain("excl. BTW");
    expect(pricingPage).toContain("incl.");
  });

  it("assurance page imports PriceModeToggle", () => {
    expect(assurancePage).toContain('import { PriceModeToggle }');
  });

  it("assurance page renders PriceModeToggle", () => {
    expect(assurancePage).toContain("<PriceModeToggle");
  });

  it("assurance page uses display mode for prices", () => {
    expect(assurancePage).toContain("dp(");
  });
});

// ── 13. Roundtrip: grossToNet → netToGross ──

describe("Roundtrip: grossToNet → netToGross", () => {
  const testPrices = [9.99, 14.99, 34.99, 99.99, 149.99, 349.99, 999.99];

  testPrices.forEach((gross) => {
    it(`roundtrip €${gross} at 21%: gross→net→gross ≈ original`, () => {
      const net = grossToNet(gross, 0.21);
      const backToGross = netToGross(net, 0.21);
      // Allow ±€0.01 rounding tolerance
      expect(Math.abs(backToGross - gross)).toBeLessThanOrEqual(0.01);
    });
  });
});

// ── 14. Billing settings page includes PriceModeToggle ──

describe("Billing settings page includes PriceModeToggle", () => {
  const billingPage = readFile("src/app/settings/billing/page.tsx");

  it("imports PriceModeToggle", () => {
    expect(billingPage).toContain('import { PriceModeToggle }');
  });

  it("renders PriceModeToggle", () => {
    expect(billingPage).toContain("<PriceModeToggle");
  });

  it("imports usePriceDisplayMode", () => {
    expect(billingPage).toContain("usePriceDisplayMode");
  });

  it("imports netToGross for display mode", () => {
    expect(billingPage).toContain("netToGross");
  });
});

// ── 15. create-payment endpoint: server-side validation ──

describe("POST /api/billing/create-payment structure", () => {
  const src = readFile("src/app/api/billing/create-payment/route.ts");

  it("exports POST handler", () => {
    expect(src).toContain("export async function POST");
  });

  it("accepts priceMode parameter", () => {
    expect(src).toContain('priceMode: z.enum(["incl", "excl"])');
  });

  it("accepts purchaseAs parameter", () => {
    expect(src).toContain('purchaseAs: z.enum(["individual", "company"])');
  });

  it("validates company fields when excl mode", () => {
    expect(src).toContain('priceMode === "excl"');
    expect(src).toContain('purchaseAs === "company"');
  });

  it("returns 400 with fieldErrors when company fields missing", () => {
    expect(src).toContain("fieldErrors");
    expect(src).toContain("Company details required for excl. VAT checkout");
  });

  it("uses net-based pricing (no grossToNet)", () => {
    expect(src).toContain("Plan prices are stored NET (excl. VAT)");
    expect(src).toContain("calculatePrice(plan as PlanKey, billingCycle as BillingCycle)");
  });

  it("creates Mollie payment with breakdown.gross as amount", () => {
    expect(src).toContain("formatMollieAmount(breakdown.gross)");
  });

  it("persists tax quote snapshot", () => {
    expect(src).toContain("prisma.checkoutQuote.create");
  });

  it("returns checkoutUrl and breakdown", () => {
    expect(src).toContain("checkoutUrl,");
    expect(src).toContain("breakdown:");
    expect(src).toContain("totalToCharge: breakdown.gross");
  });

  it("adds locale hint from billing country", () => {
    expect(src).toContain("countryToMollieLocale");
    expect(src).toContain("nl_NL");
  });
});

// ── 16. CompanyDetailsModal structure ──

describe("CompanyDetailsModal component", () => {
  const src = readFile("src/components/checkout/CompanyDetailsModal.tsx");

  it("has Dutch title", () => {
    expect(src).toContain("Bedrijfsgegevens nodig voor excl. btw");
  });

  it("has 'Verder naar betaling' submit button", () => {
    expect(src).toContain("Verder naar betaling");
  });

  it("has 'Annuleren' cancel button", () => {
    expect(src).toContain("Annuleren");
  });

  it("validates companyName required", () => {
    expect(src).toContain("Bedrijfsnaam is verplicht");
  });

  it("exports CompanyFields type", () => {
    expect(src).toContain("export interface CompanyFields");
  });
});

// ── 17. Pricing page uses CheckoutDialog ──

describe("Pricing page uses CheckoutDialog", () => {
  const src = readFile("src/app/(marketing)/pricing/page.tsx");

  it("imports CheckoutDialog", () => {
    expect(src).toContain('import { CheckoutDialog }');
  });

  it("renders CheckoutDialog component", () => {
    expect(src).toContain("<CheckoutDialog");
  });

  it("passes planKey and billingCycle to CheckoutDialog", () => {
    expect(src).toContain("planKey={checkoutPlan}");
    expect(src).toContain("billingCycle={billingCycle}");
  });

  it("manages checkoutPlan state", () => {
    expect(src).toContain("setCheckoutPlan(");
  });
});

// ── 18. CheckoutDialog uses netToGross ──

describe("CheckoutDialog component", () => {
  const src = readFile("src/components/checkout/CheckoutDialog.tsx");

  it("has Individual and Company purchase-as buttons", () => {
    expect(src).toContain("Individual");
    expect(src).toContain("Company");
  });

  it("calls /api/billing/create-payment", () => {
    expect(src).toContain("/api/billing/create-payment");
  });

  it("imports netToGross for client-side price computation", () => {
    expect(src).toContain("netToGross");
  });

  it("computes client-side prices from net base", () => {
    expect(src).toContain("computeClientPrices");
    expect(src).toContain("Prices are stored NET");
  });
});

// ── 19. Display rate API route structure ──

describe("Display rate API route", () => {
  const src = readFile("src/app/api/tax/display-rate/route.ts");

  it("exports GET handler", () => {
    expect(src).toContain("export async function GET");
  });

  it("accepts country query param", () => {
    expect(src).toContain('searchParams.get("country")');
  });

  it("returns vatRate and vatRatePercent", () => {
    expect(src).toContain("vatRate");
    expect(src).toContain("vatRatePercent");
  });
});
