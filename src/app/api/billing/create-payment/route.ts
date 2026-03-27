import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getMollieAmount,
  toMollieAmountString,
  buildPaymentMetadata,
  deriveVatBreakdown,
  PLAN_DISPLAY_NAMES,
  isSelfServePlan,
  type PlanKey,
  type BillingInterval,
} from "@/lib/billing/pricing-config";
import { createOrGetMollieCustomer } from "@/lib/billing/mollie-flows";
import { mollie, appUrl, isMollieTestMode } from "@/lib/mollie";
import type { PaymentCreateParams } from "@mollie/api-client";
import { SequenceType } from "@mollie/api-client";

export const dynamic = "force-dynamic";

/** Map billing country to Mollie locale hint */
function countryToMollieLocale(country: string): string | undefined {
  const map: Record<string, string> = {
    NL: "nl_NL",
    BE: "nl_BE",
    DE: "de_DE",
    AT: "de_AT",
    FR: "fr_FR",
    ES: "es_ES",
    IT: "it_IT",
    PT: "pt_PT",
    FI: "fi_FI",
    SE: "sv_SE",
    DK: "da_DK",
    NO: "nb_NO",
    PL: "pl_PL",
    HU: "hu_HU",
    GB: "en_GB",
    US: "en_US",
  };
  return map[country.toUpperCase()];
}

const CreatePaymentSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS", "ENTERPRISE"]),
  billingCycle: z.enum(["monthly", "yearly"]).default("monthly"),
  purchaseAs: z.enum(["individual", "company"]).default("individual"),
  // Company fields — optional, for invoice/data quality only
  companyName: z.string().max(200).optional(),
  billingCountry: z.string().length(2).optional(),
  registrationNumber: z.string().max(50).optional(),
  vatId: z.string().max(50).optional(),
  kvkNumber: z.string().max(20).optional(),
});

/**
 * POST /api/billing/create-payment
 *
 * Creates a Mollie payment with a FIXED VAT-inclusive amount.
 * Company details are stored for invoicing — they never change the price.
 *
 * Returns: { checkoutUrl, paymentId, amount }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const validation = CreatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const {
      plan,
      billingCycle,
      purchaseAs,
      companyName,
      billingCountry,
      registrationNumber,
      vatId,
      kvkNumber,
    } = validation.data;

    // Validate plan supports self-serve checkout
    if (!isSelfServePlan(plan as PlanKey)) {
      return NextResponse.json(
        { error: "This plan does not support self-serve checkout" },
        { status: 400 }
      );
    }

    // Get the FIXED amount from the single source of truth
    const chargedAmount = getMollieAmount(plan as PlanKey, billingCycle as BillingInterval);

    // Upsert billing profile with company fields (for invoicing, not pricing)
    const billingType = purchaseAs === "company" ? "business" : "individual";
    const countryCode = billingCountry?.toUpperCase() || "NL";

    const profileData = {
      billingType,
      countryCode,
      ...(companyName ? { companyName } : {}),
      ...(vatId ? { vatId } : {}),
      ...(registrationNumber ? { registrationNumber } : {}),
      ...(kvkNumber ? { kvkNumber } : {}),
      ...(registrationNumber && countryCode === "NL" && !kvkNumber
        ? { kvkNumber: registrationNumber }
        : {}),
    };

    const billingProfile = await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...profileData },
      update: profileData,
    });

    // Build payment description
    const planDisplayName = PLAN_DISPLAY_NAMES[plan as PlanKey] ?? plan;
    const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Annual";
    const description = `VexNexa ${planDisplayName} Plan (${billingCycleLabel}) — All prices include VAT`;

    // Create Mollie customer
    const customer = await createOrGetMollieCustomer(user.id, user.email);

    const locale = countryToMollieLocale(billingProfile.countryCode);

    // Build metadata
    const metadata = buildPaymentMetadata({
      userId: user.id,
      planKey: plan as PlanKey,
      billingInterval: billingCycle as BillingInterval,
      customerType: purchaseAs === "company" ? "company" : "individual",
      companyName: billingProfile.companyName ?? undefined,
      vatNumber: billingProfile.vatId ?? undefined,
      kvkNumber: billingProfile.kvkNumber ?? undefined,
      chargedAmount,
      billingCountry: billingProfile.countryCode,
    });

    // Create Mollie payment with EXACT fixed amount
    const paymentData: PaymentCreateParams = {
      amount: {
        currency: "EUR",
        value: toMollieAmountString(chargedAmount),
      },
      description,
      redirectUrl: appUrl("/dashboard?checkout=success"),
      webhookUrl: appUrl("/api/mollie/webhook"),
      customerId: customer.id,
      sequenceType: SequenceType.first,
      ...(locale ? { locale: locale as PaymentCreateParams["locale"] } : {}),
      metadata,
    };

    if (process.env.NODE_ENV === "development" || isMollieTestMode()) {
      console.log("[create-payment] Payload:", {
        amount: paymentData.amount,
        locale,
        plan,
        billingCycle,
        chargedAmount,
      });
    }

    const payment = await mollie.payments.create(paymentData);

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie returned payment but no checkout URL");
    }

    // Persist checkout quote snapshot for invoice/audit trail
    const vatBreakdown = deriveVatBreakdown(chargedAmount, 0.21);

    try {
      await prisma.checkoutQuote.create({
        data: {
          userId: user.id,
          product: "subscription",
          plan,
          billingCycle,
          baseAmount: vatBreakdown.net,
          vatAmount: vatBreakdown.vat,
          totalAmount: chargedAmount,
          currency: "EUR",
          taxRatePercent: 21,
          taxMode: "vat_standard",
          taxNotes: "All prices include VAT",
          customerType: billingProfile.billingType,
          customerCountry: billingProfile.countryCode,
          companyName: billingProfile.companyName,
          vatId: billingProfile.vatId,
          vatIdValid: billingProfile.vatValid,
          molliePaymentId: payment.id,
        },
      });
    } catch (quoteError) {
      console.error("[create-payment] Failed to persist quote:", quoteError);
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
      amount: chargedAmount,
      currency: "EUR",
      plan: planDisplayName,
      billingCycle,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "Authentication required"
    ) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.error("[create-payment] Error:", error);
    return NextResponse.json(
      {
        error: "Failed to create payment",
        details:
          process.env.NODE_ENV === "development" && error instanceof Error
            ? error.message
            : "Please try again or contact support",
      },
      { status: 500 }
    );
  }
}
