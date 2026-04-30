import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AddOnType } from "@prisma/client";
import { SequenceType, type PaymentCreateParams } from "@mollie/api-client";
import { requireAuth } from "@/lib/auth";
import { mollie, appUrl, formatMollieAmount } from "@/lib/mollie";
import { createOrGetMollieCustomer } from "@/lib/billing/mollie-flows";
import { getAddOnPricing, ADDON_NAMES } from "@/lib/billing/addons";

export const dynamic = "force-dynamic";

const AddOnPaymentSchema = z.object({
  type: z.nativeEnum(AddOnType),
  quantity: z.number().int().min(1).optional().default(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const user = await requireAuth();
    const body = await req.json();
    const validation = AddOnPaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 },
      );
    }

    const { type, quantity } = validation.data;
    const pricing = getAddOnPricing(type);
    const amount = pricing.pricePerUnit * quantity;
    const customer = await createOrGetMollieCustomer(user.id, user.email);

    const paymentData: PaymentCreateParams = {
      amount: {
        currency: "EUR",
        value: formatMollieAmount(amount),
      },
      description: `VexNexa ${ADDON_NAMES[type]}${quantity > 1 ? ` x${quantity}` : ""}`,
      redirectUrl: appUrl("/checkout/return"),
      webhookUrl: appUrl("/api/mollie/webhook"),
      customerId: customer.id,
      sequenceType: SequenceType.first,
      metadata: {
        type: "addon_checkout",
        userId: user.id,
        addOnType: type,
        quantity: String(quantity),
      },
    };

    const payment = await mollie.payments.create(paymentData);

    try {
      await mollie.payments.update(payment.id, {
        redirectUrl: appUrl(`/checkout/return?paymentId=${payment.id}`),
      } as Parameters<typeof mollie.payments.update>[1]);
    } catch (updateError) {
      console.warn("[create-addon-payment] Failed to patch redirectUrl:", updateError);
    }

    const checkoutUrl = payment.getCheckoutUrl();
    if (!checkoutUrl) {
      throw new Error("Mollie returned payment but no checkout URL");
    }

    return NextResponse.json({
      checkoutUrl,
      paymentId: payment.id,
      amount,
      currency: "EUR",
      type,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    console.error("[create-addon-payment] Error:", error);
    return NextResponse.json(
      { error: "Failed to create add-on payment" },
      { status: 500 },
    );
  }
}
