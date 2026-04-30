import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SequenceType, type PaymentCreateParams } from "@mollie/api-client";
import { requireAuth } from "@/lib/auth";
import { mollie, appUrl, formatMollieAmount } from "@/lib/mollie";
import { createOrGetMollieCustomer } from "@/lib/billing/mollie-flows";
import { AUDIT_BUNDLE_PRICES, AUDIT_PRICES } from "@/lib/pricing";

export const dynamic = "force-dynamic";

const AuditPaymentSchema = z.object({
  productId: z.string().min(1),
});

const AUDIT_PRODUCTS = [
  ...Object.values(AUDIT_PRICES).map((product) => ({
    ...product,
    productType: "audit",
    credits: 1,
  })),
  ...Object.values(AUDIT_BUNDLE_PRICES).map((product) => ({
    ...product,
    productType: "audit_bundle",
    credits: 1,
  })),
] as const;

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validation = AuditPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const product = AUDIT_PRODUCTS.find(
      (candidate) => candidate.productId === validation.data.productId,
    );

    if (!product) {
      return NextResponse.json({ error: "Unknown audit product" }, { status: 400 });
    }

    const customer = await createOrGetMollieCustomer(user.id, user.email);

    const paymentData: PaymentCreateParams = {
      amount: {
        currency: "EUR",
        value: formatMollieAmount(product.price),
      },
      description: `VexNexa ${product.label}`,
      redirectUrl: appUrl("/checkout/return"),
      webhookUrl: appUrl("/api/mollie/webhook"),
      customerId: customer.id,
      sequenceType: SequenceType.oneoff,
      metadata: {
        type: "audit_payment",
        userId: user.id,
        productId: product.productId,
        productType: product.productType,
        label: product.label,
        auditCredits: String(product.credits),
      },
    };

    const payment = await mollie.payments.create(paymentData);

    try {
      await mollie.payments.update(payment.id, {
        redirectUrl: appUrl(`/checkout/return?paymentId=${payment.id}`),
      } as Parameters<typeof mollie.payments.update>[1]);
    } catch (updateError) {
      console.warn("[create-audit-payment] Failed to patch redirectUrl:", updateError);
    }

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie returned payment but no checkout URL");
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
      amount: product.price,
      currency: "EUR",
      productId: product.productId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("[create-audit-payment] Error:", error);
    return NextResponse.json(
      { error: "Failed to create audit payment" },
      { status: 500 },
    );
  }
}
