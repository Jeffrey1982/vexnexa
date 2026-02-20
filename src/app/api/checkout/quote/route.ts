import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePrice, type PlanKey } from "@/lib/pricing";
import {
  computeTaxDecision,
  calculateTaxBreakdown,
  formatTaxLineLabel,
  type CustomerType,
} from "@/lib/tax/rules";

export const dynamic = "force-dynamic";

const QuoteSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

/**
 * POST /api/checkout/quote
 *
 * Computes a server-side tax quote for a plan + billing cycle.
 * Uses the authenticated user's billing profile to determine tax.
 *
 * IMPORTANT: Tax logic depends on jurisdiction and product classification.
 * This implementation is a configurable baseline and should be reviewed
 * with an accountant/legal advisor before relying on it for compliance.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const validation = QuoteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { plan, billingCycle } = validation.data;

    // Calculate base price (net, ex-VAT)
    const basePrice = calculatePrice(plan as PlanKey, billingCycle);

    // Fetch billing profile for tax computation
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: user.id },
      select: {
        billingType: true,
        countryCode: true,
        vatId: true,
        vatValid: true,
        companyName: true,
      },
    });

    // Compute tax decision server-side
    const taxDecision = computeTaxDecision({
      customerCountry: billingProfile?.countryCode ?? "NL",
      customerType: (billingProfile?.billingType ?? "individual") as CustomerType,
      vatId: billingProfile?.vatId,
      vatIdValid: billingProfile?.vatValid,
      productType: "saas_subscription",
    });

    // Calculate breakdown
    const breakdown = calculateTaxBreakdown(basePrice, taxDecision);

    return NextResponse.json({
      plan,
      billingCycle,
      currency: "EUR",
      baseAmount: breakdown.net,
      vatAmount: breakdown.vat,
      totalAmount: breakdown.gross,
      tax: {
        ratePercent: taxDecision.taxRatePercent,
        mode: taxDecision.taxMode,
        label: formatTaxLineLabel(taxDecision),
        notes: taxDecision.notes,
        country: taxDecision.countryCode,
      },
      customer: {
        type: billingProfile?.billingType ?? "individual",
        country: billingProfile?.countryCode ?? "NL",
        companyName: billingProfile?.companyName ?? null,
        hasValidVat: billingProfile?.vatValid ?? false,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("[checkout/quote] Error:", error);
    return NextResponse.json(
      { error: "Failed to compute quote" },
      { status: 500 }
    );
  }
}
