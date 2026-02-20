import { NextRequest, NextResponse } from "next/server";
import { getVatRate, DEFAULT_EU_VAT_RATE } from "@/lib/tax/vat-rates";
import { isEuCountry } from "@/lib/billing/countries";

export const dynamic = "force-dynamic";

/**
 * GET /api/tax/display-rate?country=XX
 *
 * Returns the best-effort VAT rate for a given country, used for
 * client-side price display only. Server is source of truth at checkout.
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const country = req.nextUrl.searchParams.get("country")?.toUpperCase() ?? "NL";

  let vatRate: number;
  let isEstimate: boolean;

  if (isEuCountry(country)) {
    vatRate = getVatRate(country);
    isEstimate = country !== "NL"; // NL is exact, others are best-effort
  } else {
    // Non-EU: no VAT for display purposes
    vatRate = 0;
    isEstimate = true;
  }

  return NextResponse.json({
    country,
    vatRate,
    vatRatePercent: Math.round(vatRate * 10000) / 100,
    isEstimate,
    disclaimer: isEstimate
      ? "Taxes may vary by country; final tax shown at checkout."
      : null,
  });
}
