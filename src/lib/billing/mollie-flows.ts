import { mollie, appUrl, isMollieTestMode } from "../mollie";
import { prisma } from "../prisma";
import { planKeyFromString } from "./plans";
import {
  getMollieAmount,
  toMollieAmountString,
  buildPaymentMetadata,
  deriveVatBreakdown,
  PLAN_DISPLAY_NAMES,
  getMollieInterval,
  type PlanKey,
  type BillingInterval,
} from "./pricing-config";
import { sendInvoiceForPayment } from "./invoice-service";
import type { PaymentCreateParams } from "@mollie/api-client";
import { SequenceType } from "@mollie/api-client";
import type { Plan as PrismaPlan } from "@prisma/client";
import type { Plan } from "./plans";

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
    GB: "en_GB",
    US: "en_US",
    CA: "en_CA",
    AU: "en_AU",
    CH: "de_CH",
    DK: "da_DK",
    NO: "no_NO",
    SE: "sv_SE",
    FI: "fi_FI",
    PL: "pl_PL",
    CZ: "cs_CZ",
    SK: "sk_SK",
    HU: "hu_HU",
    RO: "ro_RO",
    BG: "bg_BG",
    HR: "hr_HR",
    SI: "sl_SI",
    EE: "et_EE",
    LV: "lv_LV",
    LT: "lt_LT",
    GR: "el_GR",
    CY: "cy_CY",
    MT: "mt_MT",
    IS: "is_IS",
    LI: "de_LI",
    LU: "fr_LU",
  };
  return map[country.toUpperCase()];
}

export async function createOrGetMollieCustomer(userId: string, email: string) {
  console.log("Looking for user with ID:", userId, "and email:", email);

  // First try to find existing user by ID
  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      mollieCustomerId: true,
      mollieSubscriptionId: true,
      plan: true,
      subscriptionStatus: true,
    },
  });

  // If user doesn't exist by ID, try to find by email
  if (!user) {
    console.log("User not found by ID, checking by email...");
    user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        mollieCustomerId: true,
        mollieSubscriptionId: true,
        plan: true,
        subscriptionStatus: true,
      },
    });

    if (user) {
      console.log("Found existing user by email with different ID:", user.id, "vs expected:", userId);
      user = await prisma.user.update({
        where: { email: email },
        data: { id: userId },
        select: {
          id: true,
          email: true,
          mollieCustomerId: true,
          mollieSubscriptionId: true,
          plan: true,
          subscriptionStatus: true,
        },
      });
      console.log("Updated user ID to match Supabase:", user.id);
    }
  }

  // If user still doesn't exist, create them
  if (!user) {
    console.log("User not found in database, creating new user:", { userId, email });
    try {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          plan: "FREE" as any,
          subscriptionStatus: "inactive",
        },
        select: {
          id: true,
          email: true,
          mollieCustomerId: true,
          mollieSubscriptionId: true,
          plan: true,
          subscriptionStatus: true,
        },
      });
      console.log("User created successfully:", user.id);
    } catch (error) {
      console.error("Failed to create user, trying to find existing user again:", error);
      user = await prisma.user.findUnique({
        where: { email: email },
        select: {
          id: true,
          email: true,
          mollieCustomerId: true,
          mollieSubscriptionId: true,
          plan: true,
          subscriptionStatus: true,
        },
      });
      if (!user) {
        throw new Error("Unable to create or find user");
      }
    }
  }

  // If user already has a Mollie customer ID, return it
  if (user.mollieCustomerId) {
    try {
      const customer = await mollie.customers.get(user.mollieCustomerId);
      return customer;
    } catch (error) {
      // Customer doesn't exist anymore, create a new one
    }
  }

  // Create new Mollie customer
  console.log("Creating new Mollie customer with data:", {
    email: email,
    name: email.split("@")[0],
    metadata: { userId: userId },
  });

  const customer = await mollie.customers.create({
    email: email,
    name: email.split("@")[0],
    metadata: {
      userId: userId,
    },
  });

  console.log("Mollie customer created:", {
    id: customer.id,
    email: customer.email,
    name: customer.name,
    mode: customer.mode,
  });

  // Save customer ID to database
  await prisma.user.update({
    where: { id: userId },
    data: { mollieCustomerId: customer.id },
  });

  console.log("Customer ID saved to database");

  return customer;
}

export async function createUpgradePayment(opts: {
  userId: string;
  email: string;
  plan: Exclude<Plan, "FREE">;
  billingCycle?: BillingInterval;
}) {
  try {
    const { userId, email, plan, billingCycle = "monthly" } = opts;

    console.log("=== Creating Upgrade Payment ===");
    console.log("Input:", { userId, email, plan, billingCycle });

    // Get the fixed VAT-inclusive amount from the single source of truth
    const chargedAmount = getMollieAmount(plan as PlanKey, billingCycle);
    const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Annual";
    const planDisplayName = PLAN_DISPLAY_NAMES[plan as PlanKey] ?? plan;

    // Fetch billing profile for metadata (NOT for price calculation)
    const billingProfile = await prisma.billingProfile.findUnique({
      where: { userId },
      select: {
        billingType: true,
        countryCode: true,
        vatId: true,
        vatValid: true,
        companyName: true,
        kvkNumber: true,
      },
    });

    const description = `VexNexa ${planDisplayName} Plan (${billingCycleLabel}) — All prices include VAT`;

    // Get or create Mollie customer
    console.log("Getting or creating Mollie customer...");
    const customer = await createOrGetMollieCustomer(userId, email);
    console.log("Customer details:", {
      id: customer.id,
      email: customer.email,
      name: customer.name,
      mode: customer.mode,
    });

    const locale = countryToMollieLocale(billingProfile?.countryCode ?? "NL");

    // Build metadata for audit trail
    const metadata = buildPaymentMetadata({
      userId,
      planKey: plan as PlanKey,
      billingInterval: billingCycle,
      customerType: billingProfile?.billingType === "business" ? "company" : "individual",
      companyName: billingProfile?.companyName ?? undefined,
      vatNumber: billingProfile?.vatId ?? undefined,
      kvkNumber: billingProfile?.kvkNumber ?? undefined,
      chargedAmount,
      billingCountry: billingProfile?.countryCode ?? "NL",
    });

    // Create payment with the EXACT fixed amount — no dynamic VAT computation
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
      console.log("[Mollie] Payment payload:", {
        amount: paymentData.amount,
        currency: "EUR",
        sequenceType: "first",
        forcedMethods: "none (automatic)",
        mode: isMollieTestMode() ? "TEST (limited methods expected)" : "LIVE",
        chargedAmount,
        plan,
        billingCycle,
      });
    }

    const payment = await mollie.payments.create(paymentData);
    console.log("Payment created successfully:", {
      id: payment.id,
      status: payment.status,
      sequenceType: payment.sequenceType,
      checkoutUrl: payment.getCheckoutUrl(),
    });

    // Persist checkout quote snapshot for invoice/audit trail
    // Derive internal VAT breakdown for accounting (21% NL VAT as default)
    const vatBreakdown = deriveVatBreakdown(chargedAmount, 0.21);

    try {
      await prisma.checkoutQuote.create({
        data: {
          userId,
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
          customerType: billingProfile?.billingType ?? "individual",
          customerCountry: billingProfile?.countryCode ?? "NL",
          companyName: billingProfile?.companyName,
          vatId: billingProfile?.vatId,
          vatIdValid: billingProfile?.vatValid ?? false,
          molliePaymentId: payment.id,
        },
      });
    } catch (quoteError) {
      // Non-fatal: don't block payment if quote persistence fails
      console.error("[Mollie] Failed to persist checkout quote:", quoteError);
    }

    return payment;
  } catch (error) {
    console.error("=== Error in createUpgradePayment ===");
    console.error("Error type:", error instanceof Error ? error.constructor.name : "Unknown");
    console.error("Error message:", error instanceof Error ? error.message : String(error));
    console.error("Error details:", error);
    if (error && typeof error === "object" && "field" in error) console.error("Error field:", (error as any).field);
    if (error && typeof error === "object" && "statusCode" in error) console.error("Status code:", (error as any).statusCode);
    if (error && typeof error === "object" && "title" in error) console.error("Error title:", (error as any).title);
    throw error;
  }
}

export async function createSubscription(opts: {
  customerId: string;
  plan: Exclude<Plan, "FREE">;
  userId: string;
  billingCycle?: BillingInterval;
}) {
  const { customerId, plan, userId, billingCycle = "monthly" } = opts;

  // Get the fixed VAT-inclusive amount
  const chargedAmount = getMollieAmount(plan as PlanKey, billingCycle);
  const planDisplayName = PLAN_DISPLAY_NAMES[plan as PlanKey] ?? plan;
  const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Yearly";

  // Check if customer has valid mandates
  const mandates = await mollie.customerMandates.page({ customerId });
  const validMandate = mandates.find((m: any) => m.status === "valid");

  if (!validMandate) {
    throw new Error("No valid mandate found for customer");
  }

  // Cancel existing subscription if any
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { mollieSubscriptionId: true },
  });
  if (user?.mollieSubscriptionId) {
    try {
      await mollie.customerSubscriptions.cancel(user.mollieSubscriptionId, { customerId });
    } catch (error) {
      // Failed to cancel existing subscription
    }
  }

  // Fetch billing profile for metadata only
  const billingProfile = await prisma.billingProfile.findUnique({
    where: { userId },
    select: {
      billingType: true,
      countryCode: true,
      vatId: true,
      companyName: true,
      kvkNumber: true,
    },
  });

  // Create new subscription with the EXACT fixed amount
  const subscription = await (mollie.customerSubscriptions as any).create({
    customerId,
    amount: {
      currency: "EUR",
      value: toMollieAmountString(chargedAmount),
    },
    interval: getMollieInterval(billingCycle),
    description: `VexNexa ${planDisplayName} Plan (${billingCycleLabel}) — All prices include VAT`,
    startDate: new Date().toISOString().split("T")[0],
    metadata: buildPaymentMetadata({
      userId,
      planKey: plan as PlanKey,
      billingInterval: billingCycle,
      customerType: billingProfile?.billingType === "business" ? "company" : "individual",
      companyName: billingProfile?.companyName ?? undefined,
      vatNumber: billingProfile?.vatId ?? undefined,
      kvkNumber: billingProfile?.kvkNumber ?? undefined,
      chargedAmount,
      billingCountry: billingProfile?.countryCode ?? "NL",
    }),
  });

  // Update user in database
  await prisma.user.update({
    where: { id: userId },
    data: {
      plan: plan as PrismaPlan,
      billingInterval: billingCycle,
      subscriptionStatus: "active",
      mollieSubscriptionId: subscription.id,
      trialEndsAt: null,
    },
  });

  return subscription;
}

export async function cancelSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mollieCustomerId: true,
      mollieSubscriptionId: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.mollieCustomerId || !user.mollieSubscriptionId) {
    throw new Error("No active subscription found");
  }

  // Cancel subscription at Mollie
  await mollie.customerSubscriptions.cancel(user.mollieSubscriptionId, {
    customerId: user.mollieCustomerId,
  });

  // Update user status
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: "canceled",
      plan: "FREE" as PrismaPlan,
      mollieSubscriptionId: null,
      trialEndsAt: null,
    },
  });
}

export async function changePlan(opts: { userId: string; newPlan: Exclude<Plan, "TRIAL"> }) {
  const { userId, newPlan } = opts;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mollieCustomerId: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.mollieCustomerId) {
    throw new Error("User has no Mollie customer ID");
  }

  // Check if user has valid mandate
  const mandates = await mollie.customerMandates.page({ customerId: user.mollieCustomerId });
  const validMandate = mandates.find((m: any) => m.status === "valid");

  if (!validMandate) {
    // Need new checkout flow for mandate
    return { needCheckout: true };
  }

  // Can create subscription directly
  await createSubscription({
    customerId: user.mollieCustomerId,
    plan: newPlan as any,
    userId,
  });

  return { success: true };
}

export async function processWebhookPayment(paymentId: string) {
  // Fetch payment details from Mollie (never trust webhook data directly)
  const payment = await mollie.payments.get(paymentId);

  // Check if this is an add-on related payment
  const metadata = payment.metadata as any;
  if (metadata?.type === "addon_subscription") {
    return;
  }

  if (metadata?.type === "payment_method_reset") {
    return;
  }

  if (!metadata?.userId || !metadata?.planKey) {
    // Fall back to legacy metadata format
    if (!metadata?.userId || !metadata?.plan) {
      console.error("Payment missing required metadata:", payment.id);
      return;
    }
  }

  const userId = metadata.userId;
  const plan = planKeyFromString(metadata.planKey ?? metadata.plan);
  const billingCycle = (metadata?.billingInterval ?? metadata?.billingCycle ?? "monthly") as BillingInterval;

  if (payment.status !== "paid") {
    return;
  }

  // Payment is successful, create subscription
  if (payment.customerId && plan !== "FREE") {
    await createSubscription({
      customerId: payment.customerId,
      plan: plan as Exclude<Plan, "FREE">,
      userId,
      billingCycle,
    });
  }

  // Send invoice email (idempotent)
  try {
    await sendInvoiceForPayment(paymentId);
  } catch (invoiceError) {
    console.error("[Webhook] Failed to send invoice:", invoiceError);
  }
}

// ── Subscription Webhook Handler ───────────────────────────────

import { generateAndSendInvoice } from "./invoice-service";

export async function processSubscriptionWebhook(subscriptionId: string) {
  try {
    const subscription = await (mollie.customerSubscriptions as any).get(subscriptionId);
    const customer = await mollie.customers.get(subscription.customerId);
    const fullSubscription = await (mollie.customerSubscriptions as any).get(subscriptionId, {
      customerId: customer.id,
    });

    console.log("[Subscription Webhook] Processing subscription:", {
      id: fullSubscription.id,
      status: fullSubscription.status,
      customerId: fullSubscription.customerId,
      metadata: fullSubscription.metadata,
    });

    if (subscription.status !== "active") {
      console.log("[Subscription Webhook] Subscription not active, skipping");
      return;
    }

    const metadata = subscription.metadata as any;
    if (!metadata?.userId || !metadata?.addOnType) {
      console.log("[Subscription Webhook] Not an add-on subscription, skipping");
      return;
    }

    const userId = metadata.userId;
    const addOnType = metadata.addOnType;
    const addOnId = metadata.addOnId;

    const addOn = await prisma.addOn.findFirst({
      where: {
        id: addOnId,
        userId,
        type: addOnType,
      },
    });

    if (!addOn) {
      console.error("[Subscription Webhook] Add-on not found:", { addOnId, userId, addOnType });
      return;
    }

    const existingQuote = await prisma.checkoutQuote.findFirst({
      where: { molliePaymentId: subscriptionId },
    });

    if (existingQuote && existingQuote.invoiceSentAt) {
      console.log("[Subscription Webhook] Invoice already sent, skipping");
      return;
    }

    if (!existingQuote) {
      try {
        const billingProfile = await prisma.billingProfile.findUnique({
          where: { userId },
          select: {
            countryCode: true,
            billingType: true,
            vatValid: true,
            vatId: true,
            companyName: true,
          },
        });

        const totalAmount = parseFloat(subscription.amount.value);
        const vatBreakdown = deriveVatBreakdown(totalAmount, 0.21);

        await prisma.checkoutQuote.create({
          data: {
            userId,
            product: "addon",
            plan: addOnType,
            billingCycle: "monthly",
            baseAmount: vatBreakdown.net,
            vatAmount: vatBreakdown.vat,
            totalAmount: totalAmount,
            currency: "EUR",
            taxRatePercent: 21,
            taxMode: "vat_standard",
            taxNotes: "All prices include VAT",
            customerType: billingProfile?.billingType ?? "individual",
            customerCountry: billingProfile?.countryCode ?? "NL",
            companyName: billingProfile?.companyName,
            vatId: billingProfile?.vatId,
            vatIdValid: billingProfile?.vatValid ?? false,
            molliePaymentId: subscriptionId,
          },
        });
        console.log("[Subscription Webhook] Created CheckoutQuote for add-on:", subscriptionId);
      } catch (quoteError) {
        console.error("[Subscription Webhook] Failed to create CheckoutQuote:", quoteError);
      }
    }

    try {
      const result = await generateAndSendInvoice(existingQuote?.id || subscriptionId, { force: false });
      console.log("[Subscription Webhook] Invoice sent:", result);
    } catch (invoiceError) {
      console.error("[Subscription Webhook] Failed to send invoice:", invoiceError);
    }
  } catch (error) {
    console.error("[Subscription Webhook] Error processing subscription:", error);
  }
}

export async function createPaymentMethodResetPayment(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  const customer = await createOrGetMollieCustomer(userId, email);

  const paymentData: PaymentCreateParams = {
    amount: {
      currency: "EUR",
      value: toMollieAmountString(0.01),
    },
    description: "VexNexa - Payment Method Setup",
    customerId: customer.id,
    sequenceType: SequenceType.first,
    redirectUrl: appUrl("/settings/billing?setup=success"),
    webhookUrl: appUrl("/api/mollie/webhook"),
    metadata: {
      userId,
      type: "payment_method_reset",
    },
  };

  if (process.env.NODE_ENV === "development" || isMollieTestMode()) {
    console.log("[Mollie] Payment method reset payload:", {
      amount: paymentData.amount,
      mode: isMollieTestMode() ? "TEST" : "LIVE",
    });
  }

  const payment = await mollie.payments.create(paymentData);

  return payment;
}
