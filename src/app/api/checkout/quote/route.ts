import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMollieAmount,
  PLAN_DISPLAY_NAMES,
  deriveVatBreakdown,
  isSelfServePlan,
  type PlanKey,
  type BillingInterval,
} from "@/lib/billing/pricing-config";

export const dynamic = "force-dynamic";

const QuoteSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "PIONEER", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).optional().default("monthly"),
});

/**
 * POST /api/checkout/quote
 *
 * Returns the fixed VAT-inclusive price for a plan + billing cycle.
 * No dynamic tax computation — the price is the price.
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

    if (!isSelfServePlan(plan as PlanKey)) {
      return NextResponse.json(
        { error: "This plan does not support self-serve checkout" },
        { status: 400 }
      );
    }

    // Get the fixed amount
    const totalAmount = getMollieAmount(plan as PlanKey, billingCycle as BillingInterval);

    // Internal VAT breakdown for display purposes
    const vatBreakdown = deriveVatBreakdown(totalAmount, 0.21);

    // Fetch billing profile for customer info
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId: user.id },
      select: {
        billingType: true,
        countryCode: true,
        companyName: true,
        vatValid: true,
      },
    });

    return NextResponse.json({
      plan,
      planDisplayName: PLAN_DISPLAY_NAMES[plan as PlanKey],
      billingCycle,
      currency: "EUR",
      totalAmount,
      vatNote: "All prices include VAT",
      // Internal breakdown for reference
      breakdown: {
        net: vatBreakdown.net,
        vat: vatBreakdown.vat,
        gross: vatBreakdown.gross,
        vatRatePercent: 21,
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
