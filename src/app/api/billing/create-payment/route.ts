import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculatePrice, type PlanKey, type BillingCycle } from "@/lib/pricing";
import { PRICES } from "@/lib/billing/plans";
import { createOrGetMollieCustomer } from "@/lib/billing/mollie-flows";
import {
  computeTaxDecision,
  calculateTaxBreakdown,
  formatTaxLineLabel,
  type CustomerType,
} from "@/lib/tax/rules";
import { grossToNet, BASE_VAT_RATE } from "@/lib/pricing/vat-math";
import { mollie, appUrl, formatMollieAmount, isMollieTestMode } from "@/lib/mollie";
import type { PaymentCreateParams } from "@mollie/api-client";
import { SequenceType } from "@mollie/api-client";

export const dynamic = "force-dynamic";

/** Map billing country to Mollie locale hint (best-effort, not forced) */
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
  priceMode: z.enum(["incl", "excl"]).default("incl"),
  purchaseAs: z.enum(["individual", "company"]).default("individual"),
  // Company fields — conditionally required server-side
  companyName: z.string().max(200).optional(),
  billingCountry: z.string().length(2).optional(),
  registrationNumber: z.string().max(50).optional(),
  vatId: z.string().max(50).optional(),
});

/**
 * POST /api/billing/create-payment
 *
 * Unified payment creation endpoint. Single source of truth for:
 * 1. Server-side company field validation (when excl/company mode)
 * 2. Billing profile upsert
 * 3. Tax computation (approach B: gross→net→re-apply country tax)
 * 4. Mollie payment creation
 * 5. Tax quote snapshot persistence
 *
 * Returns: { checkoutUrl, paymentId, breakdown }
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
      priceMode,
      purchaseAs,
      companyName,
      billingCountry,
      registrationNumber,
      vatId,
    } = validation.data;

    // Validate plan exists
    if (!PRICES[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    // ── Server-side company field validation ──
    const requiresCompanyDetails =
      priceMode === "excl" || purchaseAs === "company";

    if (requiresCompanyDetails) {
      const fieldErrors: Record<string, string> = {};
      if (!companyName?.trim())
        fieldErrors.companyName = "Company name is required";
      if (!billingCountry?.trim() || billingCountry.length !== 2)
        fieldErrors.billingCountry = "Billing country is required (ISO2)";
      if (!registrationNumber?.trim())
        fieldErrors.registrationNumber = "Registration number is required";
      if (!vatId?.trim()) fieldErrors.vatId = "VAT / Tax number is required";

      if (Object.keys(fieldErrors).length > 0) {
        return NextResponse.json(
          {
            error: "Company details required for excl. VAT checkout",
            fieldErrors,
          },
          { status: 400 }
        );
      }
    }

    // ── Upsert billing profile with company fields ──
    const billingType = purchaseAs === "company" ? "business" : "individual";
    const countryCode = billingCountry?.toUpperCase() || "NL";

    const profileData = {
      billingType,
      countryCode,
      ...(companyName ? { companyName } : {}),
      ...(vatId ? { vatId } : {}),
      ...(registrationNumber ? { registrationNumber } : {}),
      ...(registrationNumber && countryCode === "NL"
        ? { kvkNumber: registrationNumber }
        : {}),
    };

    const billingProfile = await prisma.billingProfile.upsert({
      where: { userId: user.id },
      create: { userId: user.id, ...profileData },
      update: profileData,
    });

    // ── Approach B: gross → net → re-apply country tax ──
    const planGross = calculatePrice(plan as PlanKey, billingCycle as BillingCycle);
    const netBase = grossToNet(planGross, BASE_VAT_RATE);

    const taxDecision = computeTaxDecision({
      customerCountry: billingProfile.countryCode,
      customerType: billingProfile.billingType as CustomerType,
      vatId: billingProfile.vatId ?? undefined,
      vatIdValid: billingProfile.vatValid,
      productType: "saas_subscription",
    });

    const breakdown = calculateTaxBreakdown(netBase, taxDecision);

    // ── Create Mollie payment ──
    const billingCycleLabel =
      billingCycle === "monthly" ? "Monthly" : "Annual";
    const taxLabel =
      taxDecision.taxMode === "reverse_charge"
        ? " (Reverse charge)"
        : taxDecision.taxMode === "vat_standard"
          ? " (incl. VAT)"
          : "";
    const description = `VexNexa ${plan} Plan (${billingCycleLabel})${taxLabel}`;

    const customer = await createOrGetMollieCustomer(user.id, user.email);

    const locale = countryToMollieLocale(billingProfile.countryCode);

    const paymentData: PaymentCreateParams = {
      amount: {
        currency: "EUR",
        value: formatMollieAmount(breakdown.gross),
      },
      description,
      redirectUrl: appUrl("/dashboard?checkout=success"),
      webhookUrl: appUrl("/api/mollie/webhook"),
      customerId: customer.id,
      sequenceType: SequenceType.first,
      ...(locale ? { locale: locale as PaymentCreateParams["locale"] } : {}),
      metadata: {
        userId: user.id,
        plan,
        billingCycle,
        type: "upgrade",
        priceMode,
        purchaseAs,
        taxRatePercent: String(taxDecision.taxRatePercent),
        taxMode: taxDecision.taxMode,
        customerCountry: billingProfile.countryCode,
        customerType: billingProfile.billingType,
        companyName: billingProfile.companyName ?? "",
        registrationNumber: billingProfile.registrationNumber ?? "",
        vatId: billingProfile.vatId ?? "",
        vatIdValid: String(billingProfile.vatValid),
        netAmount: String(breakdown.net),
        vatAmount: String(breakdown.vat),
      },
    };

    if (process.env.NODE_ENV === "development" || isMollieTestMode()) {
      console.log("[create-payment] Payload:", {
        amount: paymentData.amount,
        locale,
        tax: { taxDecision, breakdown },
      });
    }

    const payment = await mollie.payments.create(paymentData);

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie returned payment but no checkout URL");
    }

    // ── Persist tax quote snapshot ──
    try {
      await prisma.checkoutQuote.create({
        data: {
          userId: user.id,
          product: "subscription",
          plan,
          billingCycle,
          baseAmount: breakdown.net,
          vatAmount: breakdown.vat,
          totalAmount: breakdown.gross,
          currency: "EUR",
          taxRatePercent: taxDecision.taxRatePercent,
          taxMode: taxDecision.taxMode,
          taxNotes: taxDecision.notes,
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
      breakdown: {
        planGross,
        netBase: breakdown.net,
        vatAmount: breakdown.vat,
        totalToCharge: breakdown.gross,
        taxLabel: formatTaxLineLabel(taxDecision),
        taxMode: taxDecision.taxMode,
        taxRatePercent: taxDecision.taxRatePercent,
      },
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
