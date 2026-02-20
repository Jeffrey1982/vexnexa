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
import { grossToNet, BASE_VAT_RATE } from "@/lib/pricing/vat-math";

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

    // Plan prices are stored GROSS (incl. NL 21% VAT).
    // Approach B: convert gross→net using base NL rate, then re-apply
    // the customer's actual country tax to get the final total.
    const planGross = calculatePrice(plan as PlanKey, billingCycle);
    const netBase = grossToNet(planGross, BASE_VAT_RATE);

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

    // Re-apply customer's country tax to the net base price
    const breakdown = calculateTaxBreakdown(netBase, taxDecision);

    return NextResponse.json({
      plan,
      billingCycle,
      currency: "EUR",
      planGross,
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
