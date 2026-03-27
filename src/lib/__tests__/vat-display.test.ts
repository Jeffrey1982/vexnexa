/**
 * Tests for VAT display and pricing structure.
 *
 * Updated for VAT-inclusive pricing: all prices are fixed and include VAT.
 * No more PriceModeToggle, netToGross, or dynamic VAT display.
 */

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  grossToNet,
  netToGross,
  vatFromGross,
  formatMoney,
  BASE_VAT_RATE,
} from "../pricing/vat-math";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

// ── 1. grossToNet conversions (kept for internal invoice math) ──

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

// ── 4. formatMoney ──

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

// ── 5. BASE_VAT_RATE constant ──

describe("BASE_VAT_RATE", () => {
  it("is 0.21 (NL 21%)", () => {
    expect(BASE_VAT_RATE).toBe(0.21);
  });
});

// ── 6. Display mode store still exists (legacy, not imported by active code) ──

describe("Display mode store (display-mode.ts)", () => {
  const src = readFile("src/lib/pricing/display-mode.ts");

  it("exports PriceDisplayMode type", () => {
    expect(src).toContain('export type PriceDisplayMode = "incl" | "excl"');
  });

  it("exports country state management", () => {
    expect(src).toContain("export function getPricingCountry");
    expect(src).toContain("export function setPricingCountry");
    expect(src).toContain("export function onPricingCountryChange");
  });
});

// ── 7. PriceModeToggle still exists (legacy, not imported by active code) ──

describe("PriceModeToggle component (legacy)", () => {
  const src = readFile("src/components/pricing/PriceModeToggle.tsx");

  it("renders Incl. BTW option", () => {
    expect(src).toContain('"Incl. BTW"');
  });

  it("renders Excl. BTW option", () => {
    expect(src).toContain('"Excl. BTW"');
  });

  it("has country dropdown", () => {
    expect(src).toContain("PRICING_COUNTRY_OPTIONS");
  });

  it("uses radiogroup role for accessibility", () => {
    expect(src).toContain('role="radiogroup"');
  });
});

// ── 8. CheckoutDialog uses fixed VAT-inclusive pricing ──

describe("Checkout validation: CheckoutDialog handles Individual/Company flow", () => {
  const checkoutDialog = readFile("src/components/checkout/CheckoutDialog.tsx");

  it("has purchaseAs state (individual/company)", () => {
    expect(checkoutDialog).toContain("purchaseAs");
    expect(checkoutDialog).toContain('"individual"');
    expect(checkoutDialog).toContain('"company"');
  });

  it("uses fixed VAT-inclusive price from PLAN_PRICES", () => {
    expect(checkoutDialog).toContain("PLAN_PRICES");
    expect(checkoutDialog).toContain("All prices include VAT");
  });

  it("uses unified /api/billing/create-payment endpoint", () => {
    expect(checkoutDialog).toContain("/api/billing/create-payment");
  });

  it("sends company fields to server when company selected", () => {
    expect(checkoutDialog).toContain("companyFields.companyName");
    expect(checkoutDialog).toContain("companyFields.billingCountry");
    expect(checkoutDialog).toContain("companyFields.vatId");
  });

  it("company details don't change price", () => {
    expect(checkoutDialog).toContain("The total price does not change");
  });

  it("pricing page delegates to CheckoutDialog", () => {
    const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");
    expect(pricingPage).toContain("<CheckoutDialog");
    expect(pricingPage).toContain("checkoutPlan");
  });
});

// ── 9. Server-side totals: VAT-inclusive pricing ──

describe("Server-side totals: VAT-inclusive pricing", () => {
  const mollieFlows = readFile("src/lib/billing/mollie-flows.ts");
  const quoteRoute = readFile("src/app/api/checkout/quote/route.ts");

  it("mollie-flows uses getMollieAmount for fixed price", () => {
    expect(mollieFlows).toContain("getMollieAmount");
  });

  it("mollie-flows uses deriveVatBreakdown for invoice accounting", () => {
    expect(mollieFlows).toContain("deriveVatBreakdown");
  });

  it("quote route uses getMollieAmount for fixed price", () => {
    expect(quoteRoute).toContain("getMollieAmount");
  });

  it("quote route includes vatNote", () => {
    expect(quoteRoute).toContain("All prices include VAT");
  });
});

// ── 10. Pricing pages show VAT-inclusive badge (not PriceModeToggle) ──

describe("Pricing pages show VAT-inclusive badge", () => {
  const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");
  const assurancePage = readFile("src/app/dashboard/subscribe-assurance/page.tsx");

  it("pricing page does NOT import PriceModeToggle", () => {
    expect(pricingPage).not.toContain("import { PriceModeToggle }");
  });

  it("pricing page shows 'All prices include VAT'", () => {
    expect(pricingPage).toContain("All prices include VAT");
  });

  it("pricing page has audit services section", () => {
    expect(pricingPage).toContain("AuditServicesSection");
  });

  it("pricing page has audit bundles section", () => {
    expect(pricingPage).toContain("AuditBundlesSection");
  });

  it("assurance page does NOT import PriceModeToggle", () => {
    expect(assurancePage).not.toContain("import { PriceModeToggle }");
  });

  it("assurance page shows 'All prices include VAT'", () => {
    expect(assurancePage).toContain("All prices include VAT");
  });
});

// ── 11. Roundtrip: grossToNet → netToGross ──

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

// ── 12. Billing settings page shows VAT-inclusive badge ──

describe("Billing settings page uses VAT-inclusive display", () => {
  const billingPage = readFile("src/app/settings/billing/page.tsx");

  it("does NOT import PriceModeToggle", () => {
    expect(billingPage).not.toContain("import { PriceModeToggle }");
  });

  it("does NOT import netToGross", () => {
    expect(billingPage).not.toContain("netToGross");
  });

  it("shows 'All prices include VAT'", () => {
    expect(billingPage).toContain("All prices include VAT");
  });
});

// ── 13. create-payment endpoint: VAT-inclusive ──

describe("POST /api/billing/create-payment structure", () => {
  const src = readFile("src/app/api/billing/create-payment/route.ts");

  it("exports POST handler", () => {
    expect(src).toContain("export async function POST");
  });

  it("accepts purchaseAs parameter", () => {
    expect(src).toContain('purchaseAs: z.enum(["individual", "company"])');
  });

  it("uses getMollieAmount for fixed pricing", () => {
    expect(src).toContain("getMollieAmount");
  });

  it("persists tax quote snapshot", () => {
    expect(src).toContain("prisma.checkoutQuote.create");
  });

  it("adds locale hint from billing country", () => {
    expect(src).toContain("countryToMollieLocale");
  });
});

// ── 14. CompanyDetailsModal (legacy) ──

describe("CompanyDetailsModal component (legacy)", () => {
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

// ── 15. Pricing page uses CheckoutDialog ──

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

// ── 16. CheckoutDialog uses fixed pricing (not netToGross) ──

describe("CheckoutDialog component", () => {
  const src = readFile("src/components/checkout/CheckoutDialog.tsx");

  it("has Individual and Company purchase-as buttons", () => {
    expect(src).toContain("Individual");
    expect(src).toContain("Company");
  });

  it("calls /api/billing/create-payment", () => {
    expect(src).toContain("/api/billing/create-payment");
  });

  it("does NOT import netToGross (prices are fixed VAT-inclusive)", () => {
    expect(src).not.toContain("netToGross");
  });

  it("uses PLAN_PRICES for fixed price display", () => {
    expect(src).toContain("PLAN_PRICES");
  });
});

// ── 17. Display rate API route structure ──

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
