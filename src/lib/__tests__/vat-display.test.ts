/**
 * Tests for VAT display mode, gross→net conversions,
 * checkout validation, and server-side totals logic.
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
} from "../pricing/vat-math";

function readFile(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf-8");
}

// ── 1. grossToNet conversions ──

describe("grossToNet()", () => {
  it("€9.99 incl 21% → €8.26 excl (prompt example)", () => {
    expect(grossToNet(9.99, 0.21)).toBe(8.26);
  });

  it("€24.99 incl 21% → €20.65 excl", () => {
    expect(grossToNet(24.99, 0.21)).toBe(20.65);
  });

  it("€59.99 incl 21% → €49.58 excl", () => {
    expect(grossToNet(59.99, 0.21)).toBe(49.58);
  });

  it("€129.00 incl 21% → €106.61 excl", () => {
    expect(grossToNet(129.0, 0.21)).toBe(106.61);
  });

  it("€249.00 incl 21% → €205.79 excl", () => {
    expect(grossToNet(249.0, 0.21)).toBe(205.79);
  });

  it("€599.00 incl 21% → €495.04 excl", () => {
    expect(grossToNet(599.0, 0.21)).toBe(495.04);
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

  it("handles 27% HU rate", () => {
    expect(grossToNet(127, 0.27)).toBe(100);
  });

  it("throws on negative VAT rate", () => {
    expect(() => grossToNet(100, -0.1)).toThrow("VAT rate cannot be negative");
  });

  it("avoids floating-point drift on tricky values", () => {
    // 0.1 + 0.2 !== 0.3 in JS, but our function should handle it
    const result = grossToNet(1.21, 0.21);
    expect(result).toBe(1.0);
  });
});

// ── 2. netToGross conversions ──

describe("netToGross()", () => {
  it("€8.26 excl 21% → €9.99 incl", () => {
    expect(netToGross(8.26, 0.21)).toBe(9.99);
  });

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

  it("€24.99 at 21% → €4.34 VAT", () => {
    expect(vatFromGross(24.99, 0.21)).toBe(4.34);
  });

  it("€100 at 0% → €0 VAT", () => {
    expect(vatFromGross(100, 0)).toBe(0);
  });
});

// ── 4. formatMoney ──

describe("formatMoney()", () => {
  it("formats EUR with 2 decimals", () => {
    const result = formatMoney(24.99);
    expect(result).toContain("24,99");
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

// ── 6. Display mode persistence (source structure) ──

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

  it("defaults to incl mode", () => {
    expect(src).toContain('const DEFAULT_MODE: PriceDisplayMode = "incl"');
  });
});

// ── 7. PriceModeToggle component structure ──

describe("PriceModeToggle component", () => {
  const src = readFile("src/components/pricing/PriceModeToggle.tsx");

  it("renders Incl. VAT option", () => {
    expect(src).toContain('"Incl. VAT"');
  });

  it("renders Excl. VAT option", () => {
    expect(src).toContain('"Excl. VAT"');
  });

  it("has tooltip about billing country", () => {
    expect(src).toContain("Final tax depends on billing country");
  });

  it("uses usePriceDisplayMode hook", () => {
    expect(src).toContain("usePriceDisplayMode");
  });

  it("uses radiogroup role for accessibility", () => {
    expect(src).toContain('role="radiogroup"');
  });
});

// ── 8. Checkout validation: modal-based company field gating ──

describe("Checkout validation: modal-based company field gating", () => {
  const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");

  it("has purchaseAs state (individual/company)", () => {
    expect(pricingPage).toContain("purchaseAs");
    expect(pricingPage).toContain("'individual' | 'company'");
  });

  it("requires company details when displayMode is excl", () => {
    expect(pricingPage).toContain("displayMode === 'excl'");
    expect(pricingPage).toContain("requiresCompanyDetails");
  });

  it("requires company details when purchaseAs is company", () => {
    expect(pricingPage).toContain("purchaseAs === 'company'");
  });

  it("opens CompanyDetailsModal when company details required", () => {
    expect(pricingPage).toContain("setCompanyModalOpen(true)");
  });

  it("proceeds directly when individual + incl mode", () => {
    expect(pricingPage).toContain("callCreatePayment()");
  });

  it("uses unified /api/billing/create-payment endpoint", () => {
    expect(pricingPage).toContain("/api/billing/create-payment");
  });

  it("sends company fields from modal to server", () => {
    expect(pricingPage).toContain("companyFields.companyName");
    expect(pricingPage).toContain("companyFields.billingCountry");
    expect(pricingPage).toContain("companyFields.registrationNumber");
    expect(pricingPage).toContain("companyFields.vatId");
  });

  it("sends priceMode and purchaseAs to server", () => {
    expect(pricingPage).toContain("priceMode: displayMode");
    expect(pricingPage).toContain("purchaseAs,");
  });
});

// ── 9. Server-side totals: approach B (gross→net→re-apply) ──

describe("Server-side totals: approach B", () => {
  const mollieFlows = readFile("src/lib/billing/mollie-flows.ts");
  const quoteRoute = readFile("src/app/api/checkout/quote/route.ts");

  it("mollie-flows imports grossToNet", () => {
    expect(mollieFlows).toContain('import { grossToNet, BASE_VAT_RATE }');
  });

  it("mollie-flows converts plan gross to net base", () => {
    expect(mollieFlows).toContain("grossToNet(planGross, BASE_VAT_RATE)");
  });

  it("mollie-flows re-applies customer tax to net base", () => {
    expect(mollieFlows).toContain("calculateTaxBreakdown(netBase, taxDecision)");
  });

  it("mollie-flows documents approach B", () => {
    expect(mollieFlows).toContain("Approach B");
    expect(mollieFlows).toContain("GROSS (incl. NL 21% VAT)");
  });

  it("quote route imports grossToNet", () => {
    expect(quoteRoute).toContain('import { grossToNet, BASE_VAT_RATE }');
  });

  it("quote route converts plan gross to net base", () => {
    expect(quoteRoute).toContain("grossToNet(planGross, BASE_VAT_RATE)");
  });

  it("quote route returns planGross in response", () => {
    expect(quoteRoute).toContain("planGross,");
  });
});

// ── 10. Pricing page has PriceModeToggle ──

describe("Pricing pages include PriceModeToggle", () => {
  const pricingPage = readFile("src/app/(marketing)/pricing/page.tsx");
  const assurancePage = readFile("src/app/dashboard/subscribe-assurance/page.tsx");

  it("pricing page imports PriceModeToggle", () => {
    expect(pricingPage).toContain('import { PriceModeToggle }');
  });

  it("pricing page renders PriceModeToggle", () => {
    expect(pricingPage).toContain("<PriceModeToggle");
  });

  it("pricing page imports usePriceDisplayMode", () => {
    expect(pricingPage).toContain("usePriceDisplayMode");
  });

  it("pricing page imports grossToNet", () => {
    expect(pricingPage).toContain("grossToNet");
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

  it("pricing page shows excl VAT note when in excl mode", () => {
    expect(pricingPage).toContain("excl. VAT");
    expect(pricingPage).toContain("Company details required at checkout");
  });

  it("assurance page shows excl VAT note when in excl mode", () => {
    expect(assurancePage).toContain("excl. VAT");
    expect(assurancePage).toContain("Company details required at checkout");
  });
});

// ── 11. Roundtrip: grossToNet → netToGross ──

describe("Roundtrip: grossToNet → netToGross", () => {
  const testPrices = [9.99, 24.99, 59.99, 129.0, 249.0, 599.0, 1299.0];

  testPrices.forEach((gross) => {
    it(`roundtrip €${gross} at 21%: gross→net→gross ≈ original`, () => {
      const net = grossToNet(gross, 0.21);
      const backToGross = netToGross(net, 0.21);
      // Allow ±€0.01 rounding tolerance
      expect(Math.abs(backToGross - gross)).toBeLessThanOrEqual(0.01);
    });
  });
});

// ── 12. Billing settings page includes PriceModeToggle ──

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

  it("imports grossToNet", () => {
    expect(billingPage).toContain("grossToNet");
  });

  it("has fmtPlanPrice helper that respects display mode", () => {
    expect(billingPage).toContain("fmtPlanPrice");
    expect(billingPage).toContain("displayMode === 'excl'");
  });

  it("shows excl. VAT suffix when in excl mode", () => {
    expect(billingPage).toContain("excl. VAT");
  });
});

// ── 13. Prompt-specified grossToNet example ──

describe("grossToNet prompt example", () => {
  it("€49.99 incl @21% → €41.31 net (rounded)", () => {
    expect(grossToNet(49.99, 0.21)).toBe(41.31);
  });

  it("no double VAT: grossToNet then netToGross roundtrips", () => {
    const gross = 49.99;
    const net = grossToNet(gross, 0.21);
    const backToGross = netToGross(net, 0.21);
    expect(Math.abs(backToGross - gross)).toBeLessThanOrEqual(0.01);
  });

  it("gross should not be multiplied again without net conversion", () => {
    // Ensure grossToNet(gross) !== gross * 0.21 (that would be double-apply)
    const gross = 121;
    const net = grossToNet(gross, 0.21);
    expect(net).toBe(100);
    // Wrong: gross * (1 + 0.21) = 146.41 — that's double-applying
    expect(net).not.toBe(gross * (1 + 0.21));
  });
});

// ── 14. create-payment endpoint: server-side validation ──

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

  it("requires companyName server-side", () => {
    expect(src).toContain("Company name is required");
  });

  it("requires billingCountry server-side", () => {
    expect(src).toContain("Billing country is required");
  });

  it("requires registrationNumber server-side", () => {
    expect(src).toContain("Registration number is required");
  });

  it("requires vatId server-side", () => {
    expect(src).toContain("VAT / Tax number is required");
  });

  it("upserts billing profile before payment", () => {
    expect(src).toContain("prisma.billingProfile.upsert");
  });

  it("uses approach B: grossToNet then calculateTaxBreakdown", () => {
    expect(src).toContain("grossToNet(planGross, BASE_VAT_RATE)");
    expect(src).toContain("calculateTaxBreakdown(netBase, taxDecision)");
  });

  it("creates Mollie payment with breakdown.gross as amount", () => {
    expect(src).toContain("formatMollieAmount(breakdown.gross)");
  });

  it("includes priceMode and purchaseAs in metadata", () => {
    expect(src).toContain("priceMode,");
    expect(src).toContain("purchaseAs,");
  });

  it("includes company fields in metadata", () => {
    expect(src).toContain('companyName: billingProfile.companyName');
    expect(src).toContain('registrationNumber: billingProfile.registrationNumber');
    expect(src).toContain('vatId: billingProfile.vatId');
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

  it("does not force Mollie payment methods", () => {
    expect(src).not.toContain('"method":');
    expect(src).not.toContain("methods:");
  });
});

// ── 15. CompanyDetailsModal structure ──

describe("CompanyDetailsModal component", () => {
  const src = readFile("src/components/checkout/CompanyDetailsModal.tsx");

  it("has Dutch title", () => {
    expect(src).toContain("Bedrijfsgegevens nodig voor excl. btw");
  });

  it("has Dutch subtitle", () => {
    expect(src).toContain("Vul dit in om excl. btw af te rekenen");
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

  it("validates billingCountry required", () => {
    expect(src).toContain("Landcode is verplicht");
  });

  it("validates registrationNumber required", () => {
    expect(src).toContain("KvK-nummer is verplicht");
  });

  it("validates vatId required", () => {
    expect(src).toContain("BTW-nummer is verplicht");
  });

  it("shows KvK label for NL", () => {
    expect(src).toContain("KvK-nummer");
  });

  it("shows Chamber of Commerce label for non-NL", () => {
    expect(src).toContain("Chamber of Commerce / Registration number");
  });

  it("pre-fills from billing profile", () => {
    expect(src).toContain("/api/billing/profile");
    expect(src).toContain("profile.companyName");
  });

  it("exports CompanyFields type", () => {
    expect(src).toContain("export interface CompanyFields");
  });

  it("calls onSubmit with validated fields", () => {
    expect(src).toContain("onSubmit(fields)");
  });

  it("shows server error when provided", () => {
    expect(src).toContain("serverError");
  });
});

// ── 16. Pricing page uses CompanyDetailsModal + new endpoint ──

describe("Pricing page uses CompanyDetailsModal + create-payment", () => {
  const src = readFile("src/app/(marketing)/pricing/page.tsx");

  it("imports CompanyDetailsModal", () => {
    expect(src).toContain('import { CompanyDetailsModal');
  });

  it("renders CompanyDetailsModal", () => {
    expect(src).toContain("<CompanyDetailsModal");
  });

  it("calls /api/billing/create-payment", () => {
    expect(src).toContain("/api/billing/create-payment");
  });

  it("sends priceMode to server", () => {
    expect(src).toContain("priceMode: displayMode");
  });

  it("sends purchaseAs to server", () => {
    expect(src).toContain("purchaseAs,");
  });

  it("has 'Verder naar betaling' button text", () => {
    expect(src).toContain("Verder naar betaling");
  });

  it("has 'Annuleren' cancel text", () => {
    expect(src).toContain("Annuleren");
  });

  it("opens modal when company details required", () => {
    expect(src).toContain("setCompanyModalOpen(true)");
  });

  it("proceeds directly for individual incl mode", () => {
    expect(src).toContain("callCreatePayment()");
  });

  it("shows 'You will pay' confirmation with Mollie amount", () => {
    expect(src).toContain("You will pay");
    expect(src).toContain("at Mollie");
  });

  it("shows disclaimer about final taxes", () => {
    expect(src).toContain("Final taxes are calculated at checkout based on billing details");
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

  it("returns disclaimer for estimates", () => {
    expect(src).toContain("Taxes may vary by country");
  });
});
