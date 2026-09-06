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
import { purchaseAddOn } from "./addon-flows";
import type { Customer, Payment, PaymentCreateParams, Subscription } from "@mollie/api-client";
import { SequenceType } from "@mollie/api-client";
import type { Plan as PrismaPlan } from "@prisma/client";
import type { Plan } from "./plans";
import { nextBillingPeriodEnd, requirePaymentDate } from "./subscription-period";
import { withBillingOperationLock } from "./webhook-lease";

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

export async function assertNoPendingCoreFulfillment(userId: string, currentPaymentId?: string): Promise<void> {
  const unresolved = await prisma.processedWebhook.findFirst({
    where: {
      webhookType: "core_subscription_fulfillment", status: { not: "processed" },
      ...(currentPaymentId ? { webhookId: { not: currentPaymentId } } : {}),
      metadata: { path: ["userId"], equals: userId },
    },
    select: { id: true },
  });
  if (unresolved) throw new Error("A previous core subscription creation is unresolved; reconcile it before another paid checkout");
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
    await assertNoPendingCoreFulfillment(userId);

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
      // Placeholder — patched with real paymentId via payments.update right
      // after creation so the /checkout/return landing page can fetch status.
      redirectUrl: appUrl("/checkout/return"),
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

    // Do not expose checkout until the customer can return to this exact
    // payment. A created-but-unpaid payment can safely expire after failure.
    await mollie.payments.update(payment.id, {
      redirectUrl: appUrl(`/checkout/return?paymentId=${payment.id}`),
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
  sourcePayment: Payment;
}) {
  return withBillingOperationLock(opts.userId, () => provisionPaidSubscription(opts));
}

async function provisionPaidSubscription(opts: {
  customerId: string;
  plan: Exclude<Plan, "FREE">;
  userId: string;
  billingCycle?: BillingInterval;
  sourcePayment: Payment;
}) {
  const { customerId, plan, userId, billingCycle = "monthly", sourcePayment } = opts;
  if (billingCycle !== "monthly" && billingCycle !== "yearly") throw new Error("Invalid subscription billing interval");
  if (sourcePayment.status !== "paid" || sourcePayment.sequenceType !== SequenceType.first ||
      sourcePayment.customerId !== customerId || sourcePayment.subscriptionId) {
    throw new Error("Subscription provisioning requires a paid first payment for this customer");
  }
  const metadata = sourcePayment.metadata as Record<string, unknown>;
  if (metadata?.userId !== userId || planKeyFromString(String(metadata.planKey ?? metadata.plan)) !== plan) {
    throw new Error("First payment does not match the subscription owner and plan");
  }
  const sourceInterval = metadata.billingInterval ?? metadata.billingCycle;
  if (sourceInterval && sourceInterval !== billingCycle) throw new Error("First payment billing interval does not match subscription");
  let periodEnd = nextBillingPeriodEnd(requirePaymentDate(sourcePayment.paidAt), billingCycle);
  const sourceCreatedAt = requirePaymentDate(sourcePayment.createdAt);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.mollieCustomerId !== customerId) throw new Error("Subscription customer does not belong to user");
  const fulfillmentKey = { webhookId: sourcePayment.id, webhookType: "core_subscription_fulfillment" };
  const fulfillmentWhere = { webhookId_webhookType: fulfillmentKey };
  const fulfillment = await prisma.processedWebhook.findUnique({ where: fulfillmentWhere });
  const fulfillmentMetadata = fulfillment?.metadata as Record<string, unknown> | null;
  if (fulfillment && (fulfillmentMetadata?.userId !== userId || fulfillmentMetadata.customerId !== customerId ||
      fulfillmentMetadata.plan !== plan || fulfillmentMetadata.billingCycle !== billingCycle ||
      fulfillmentMetadata.amount !== sourcePayment.amount.value || fulfillmentMetadata.currency !== sourcePayment.amount.currency)) {
    throw new Error("Core subscription journal does not match this paid agreement");
  }
  await assertNoPendingCoreFulfillment(userId, sourcePayment.id);

  // Reconcile provider state even when a prior response or database write was lost.
  // Unlike Mollie's one-hour idempotency cache, sourcePaymentId remains durable.
  let subscription: Subscription | undefined;
  let existing: Subscription | undefined;
  for await (const candidate of mollie.customerSubscriptions.iterate({ customerId })) {
    const candidateMetadata = candidate.metadata as Record<string, unknown> | null;
    if (candidateMetadata?.sourcePaymentId === sourcePayment.id) {
      if (candidateMetadata.userId !== userId) throw new Error("Subscription ownership mismatch");
      if (subscription && subscription.id !== candidate.id) throw new Error("Multiple subscriptions match this first payment");
      subscription = candidate;
    }
    if (candidate.id === user.mollieSubscriptionId ||
        (candidateMetadata?.userId === userId && (!candidateMetadata.type || candidateMetadata.type === "upgrade") &&
         (candidateMetadata.planKey || candidateMetadata.plan) && ["active", "pending", "suspended"].includes(candidate.status))) {
      if (existing && existing.id !== candidate.id && ["active", "pending", "suspended"].includes(existing.status)) {
        throw new Error("Multiple existing plan subscriptions require reconciliation");
      }
      existing = candidate;
    }
  }
  if (!subscription && user.mollieSubscriptionId && !existing) {
    existing = await mollie.customerSubscriptions.get(user.mollieSubscriptionId, { customerId });
  }
  for (const candidate of [subscription, existing]) {
    if (!candidate) continue;
    const candidateMetadata = candidate.metadata as Record<string, unknown> | null;
    if (candidate.customerId !== customerId || (candidateMetadata?.userId && candidateMetadata.userId !== userId)) {
      throw new Error("Subscription ownership mismatch");
    }
  }
  if (fulfillment && !subscription) {
    throw new Error("Core subscription creation is uncertain and no matching provider subscription is visible; reconciliation required");
  }
  if (subscription && fulfillmentMetadata?.subscriptionId && fulfillmentMetadata.subscriptionId !== subscription.id) {
    throw new Error("Core subscription journal points to a different provider subscription");
  }
  if (subscription && existing && subscription.id !== existing.id && ["active", "pending", "suspended"].includes(existing.status)) {
    throw new Error("A newer existing subscription must not be overwritten by an old first payment");
  }
  // Ordering applies to canceled/completed subscriptions too: an old first
  // payment must never restart renewal after the customer's newer cancellation.
  if (existing && existing.id !== subscription?.id) {
    const existingMetadata = existing.metadata as Record<string, unknown> | null;
    let latestSourceDate = existingMetadata?.sourcePaymentCreatedAt
      ? requirePaymentDate(String(existingMetadata.sourcePaymentCreatedAt))
      : requirePaymentDate(existing.createdAt);
    if (existingMetadata?.sourcePaymentId && !existingMetadata.sourcePaymentCreatedAt) {
      const previousSource = await mollie.payments.get(String(existingMetadata.sourcePaymentId));
      latestSourceDate = requirePaymentDate(previousSource.createdAt);
    }
    // An old notification cannot downgrade or overwrite a newer paid agreement.
    if (sourceCreatedAt <= latestSourceDate) {
      if (existingMetadata?.sourcePaymentId) throw new Error("Older first payment conflicts with a newer paid subscription; reconciliation required");
      if (user.mollieSubscriptionId !== existing.id || user.plan === "FREE") throw new Error("Legacy subscription requires reconciliation before granting a plan");
      return existing;
    }
  }
  if (!subscription && existing && ["active", "pending", "suspended"].includes(existing.status)) {
    if (existing.status !== "active" || existing.customerId !== customerId) {
      throw new Error("Existing subscription is not safe to change automatically");
    }
    if (user.subscriptionCanceledAt) throw new Error("Canceled paid agreement requires reconciliation before changing plan");
    const existingEnd = user.subscriptionCurrentPeriodEnd ??
      (existing.nextPaymentDate ? requirePaymentDate(existing.nextPaymentDate) : null);
    if (!existingEnd) throw new Error("Cannot safely preserve the existing paid subscription period");
    const paidAt = requirePaymentDate(sourcePayment.paidAt);
    periodEnd = nextBillingPeriodEnd(existingEnd > paidAt ? existingEnd : paidAt, billingCycle);
    if (periodEnd.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10)) {
      throw new Error("First paid period has already ended; refusing an immediate catch-up charge");
    }
    if (sourcePayment.amount.currency !== "EUR" || !/^\d+\.\d{2}$/.test(sourcePayment.amount.value) || Number(sourcePayment.amount.value) <= 0) {
      throw new Error("First payment has an invalid subscription amount");
    }
    subscription = await mollie.customerSubscriptions.update(existing.id, {
      customerId,
      amount: sourcePayment.amount,
      interval: getMollieInterval(billingCycle),
      startDate: periodEnd.toISOString().slice(0, 10),
      description: `VexNexa ${PLAN_DISPLAY_NAMES[plan as PlanKey] ?? plan} Plan (${billingCycle === "yearly" ? "Yearly" : "Monthly"}) — All prices include VAT`,
      metadata: { ...metadata, sourcePaymentId: sourcePayment.id, sourcePaymentCreatedAt: sourceCreatedAt.toISOString(), sourcePaymentPeriodEnd: periodEnd.toISOString() },
    });
  } else if (subscription) {
    const reconciledMetadata = subscription.metadata as Record<string, unknown> | null;
    if (reconciledMetadata?.sourcePaymentPeriodEnd) periodEnd = requirePaymentDate(String(reconciledMetadata.sourcePaymentPeriodEnd));
  }

  const planDisplayName = PLAN_DISPLAY_NAMES[plan as PlanKey] ?? plan;
  const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Yearly";
  if (!subscription) {
    if (existing?.status === "canceled" && user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd > requirePaymentDate(sourcePayment.paidAt)) {
      periodEnd = nextBillingPeriodEnd(user.subscriptionCurrentPeriodEnd, billingCycle);
    }
    const mandates = await mollie.customerMandates.page({ customerId });
    if (!mandates.some(m => m.status === "valid")) throw new Error("No valid mandate found for customer");
    if (periodEnd.toISOString().slice(0, 10) <= new Date().toISOString().slice(0, 10)) {
      throw new Error("First paid period has already ended; refusing an immediate catch-up charge");
    }
    if (sourcePayment.amount.currency !== "EUR" || !/^\d+\.\d{2}$/.test(sourcePayment.amount.value) || Number(sourcePayment.amount.value) <= 0) {
      throw new Error("First payment has an invalid subscription amount");
    }
    // A lost response is ambiguous even after Mollie's one-hour idempotency
    // window. Never issue another create unless no create was attempted yet.
    if (fulfillment) throw new Error("Core subscription creation is uncertain and no matching provider subscription is visible; reconciliation required");
    await prisma.processedWebhook.create({
      data: {
        ...fulfillmentKey, status: "provider_pending",
        metadata: { userId, customerId, plan, billingCycle, amount: sourcePayment.amount.value, currency: sourcePayment.amount.currency, periodEnd: periodEnd.toISOString() },
      },
    });
    subscription = await mollie.customerSubscriptions.create({
      customerId,
      amount: sourcePayment.amount,
      interval: getMollieInterval(billingCycle),
      description: `VexNexa ${planDisplayName} Plan (${billingCycleLabel}) — All prices include VAT`,
      startDate: periodEnd.toISOString().slice(0, 10),
      webhookUrl: appUrl("/api/mollie/webhook"),
      metadata: { ...metadata, sourcePaymentId: sourcePayment.id, sourcePaymentCreatedAt: sourceCreatedAt.toISOString(), sourcePaymentPeriodEnd: periodEnd.toISOString() },
      idempotencyKey: `vexnexa-plan-${sourcePayment.id}`,
    });
  }

  const subscriptionMetadata = subscription.metadata as Record<string, unknown> | null;
  if (subscriptionMetadata?.sourcePaymentId === sourcePayment.id &&
      (subscription.amount.currency !== sourcePayment.amount.currency || subscription.amount.value !== sourcePayment.amount.value ||
       subscription.interval !== getMollieInterval(billingCycle))) {
    throw new Error("Recovered subscription billing terms do not match this paid agreement");
  }
  if (fulfillmentMetadata?.periodEnd) periodEnd = requirePaymentDate(String(fulfillmentMetadata.periodEnd));

  // A replay must never erase a later cancellation or shorten paid access.
  const canceledAt = (subscription.id === user.mollieSubscriptionId ? user.subscriptionCanceledAt : null) ??
    (subscription.status === "canceled" ? requirePaymentDate(subscription.canceledAt) : null);
  const currentPeriodEnd = user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd > periodEnd
    ? user.subscriptionCurrentPeriodEnd : periodEnd;
  await prisma.$transaction(async tx => {
    await tx.user.update({
      where: { id: userId },
      data: {
        plan: plan as PrismaPlan,
        billingInterval: billingCycle,
        subscriptionStatus: "active",
        mollieSubscriptionId: subscription.id,
        subscriptionCurrentPeriodEnd: currentPeriodEnd,
        subscriptionCanceledAt: canceledAt,
        trialEndsAt: null,
      },
    });
    const journalMetadata = { userId, customerId, plan, billingCycle, amount: sourcePayment.amount.value, currency: sourcePayment.amount.currency, periodEnd: currentPeriodEnd.toISOString(), subscriptionId: subscription.id };
    await tx.processedWebhook.upsert({
      where: fulfillmentWhere,
      create: { ...fulfillmentKey, status: "processed", processedAt: new Date(), metadata: journalMetadata },
      update: { status: "processed", processedAt: new Date(), metadata: journalMetadata },
    });
  });

  return subscription;
}

export async function cancelSubscription(userId: string) {
  return withBillingOperationLock(userId, () => cancelPaidSubscription(userId));
}

async function cancelPaidSubscription(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      mollieCustomerId: true,
      mollieSubscriptionId: true,
      subscriptionCurrentPeriodEnd: true,
      subscriptionCanceledAt: true,
      billingInterval: true,
    },
  });

  if (!user) throw new Error("User not found");

  if (!user.mollieCustomerId || !user.mollieSubscriptionId) {
    throw new Error("No active subscription found");
  }

  if (user.subscriptionCanceledAt) return;
  const subscription = await mollie.customerSubscriptions.get(user.mollieSubscriptionId, {
    customerId: user.mollieCustomerId,
  });
  // Existing subscriptions may predate period tracking. Use provider evidence;
  // never invent an expiry or remove paid access simply because it is unknown.
  let periodEnd = user.subscriptionCurrentPeriodEnd;
  if (!periodEnd && subscription.nextPaymentDate) periodEnd = requirePaymentDate(subscription.nextPaymentDate);
  if (!periodEnd) {
    const metadata = subscription.metadata as Record<string, unknown> | null;
    if (metadata?.sourcePaymentPeriodEnd) periodEnd = requirePaymentDate(String(metadata.sourcePaymentPeriodEnd));
    let checked = 0;
    for await (const payment of mollie.customerPayments.iterate({ customerId: user.mollieCustomerId })) {
      if (++checked > 250) throw new Error("Subscription payment history requires manual reconciliation");
      if (payment.status !== "paid" || payment.subscriptionId !== subscription.id || Number(payment.amount.value) <= 0) continue;
      const billingCycle = subscription.interval === "12 months" || user.billingInterval === "yearly" ? "yearly" : "monthly";
      const paidEnd = nextBillingPeriodEnd(requirePaymentDate(payment.createdAt), billingCycle);
      if (!periodEnd || paidEnd > periodEnd) periodEnd = paidEnd;
    }
  }
  if (!periodEnd) throw new Error("Cannot safely determine the paid subscription period");
  const canceled = subscription.status === "canceled" ? subscription : await mollie.customerSubscriptions.cancel(user.mollieSubscriptionId, {
    customerId: user.mollieCustomerId,
  });
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionCurrentPeriodEnd: periodEnd,
      subscriptionCanceledAt: canceled.canceledAt ? requirePaymentDate(canceled.canceledAt) : new Date(),
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

  if (newPlan === "FREE") {
    await cancelSubscription(userId);
    return { success: true };
  }
  // A mandate authorizes collection, but is not evidence that a new plan was paid.
  return { needCheckout: true };
}

async function fulfillAuditCredits(payment: Payment, userId: string, credits: number): Promise<void> {
  const marker = { webhookId: payment.id, webhookType: "audit_credit_fulfillment" };
  try {
    await prisma.$transaction(async tx => {
      await tx.processedWebhook.create({ data: { ...marker, status: "processed", processedAt: new Date(), metadata: { userId, credits } } });
      await tx.user.update({ where: { id: userId }, data: { auditCredits: { increment: credits } } });
    });
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "P2002")) throw error;
    const existing = await prisma.processedWebhook.findUnique({ where: { webhookId_webhookType: marker } });
    const metadata = existing?.metadata as { userId?: string; credits?: number } | null;
    if (existing?.status !== "processed" || metadata?.userId !== userId || metadata.credits !== credits) throw error;
  }
}

async function recordRecurringPayment(payment: Payment, userId: string, billingCycle: BillingInterval): Promise<void> {
  await withBillingOperationLock(userId, async () => {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !payment.customerId || user.mollieCustomerId !== payment.customerId || !payment.subscriptionId) {
      throw new Error("Recurring payment does not match a known subscription owner");
    }
    // Late payments of an obsolete subscription cannot alter the replacement plan.
    if (user.mollieSubscriptionId !== payment.subscriptionId) return;
    const subscription = await mollie.customerSubscriptions.get(payment.subscriptionId, { customerId: payment.customerId });
    const metadata = subscription.metadata as Record<string, unknown> | null;
    if (subscription.customerId !== payment.customerId || (metadata?.userId && metadata.userId !== userId)) {
      throw new Error("Recurring subscription ownership mismatch");
    }
    const paymentMetadata = payment.metadata as Record<string, unknown> | null;
    const recordedCycle = paymentMetadata?.billingInterval ?? paymentMetadata?.billingCycle;
    const paidInterval = recordedCycle === "yearly" || (!recordedCycle && subscription.interval === "12 months") ? "yearly" : billingCycle;
    const periodEnd = nextBillingPeriodEnd(requirePaymentDate(payment.createdAt), paidInterval);
    // The amount and interval of live agreements come from Mollie; never reprice
    // or recreate them from today's catalog after a successful renewal.
    await prisma.user.updateMany({
      where: {
        id: userId, mollieSubscriptionId: payment.subscriptionId,
        OR: [{ subscriptionCurrentPeriodEnd: null }, { subscriptionCurrentPeriodEnd: { lt: periodEnd } }],
      },
      data: { subscriptionCurrentPeriodEnd: periodEnd },
    });
    if (!user.subscriptionCanceledAt && subscription.status === "active" && periodEnd > new Date() &&
        (!user.subscriptionCurrentPeriodEnd || periodEnd >= user.subscriptionCurrentPeriodEnd)) {
      await prisma.user.updateMany({
        where: { id: userId, mollieSubscriptionId: payment.subscriptionId, subscriptionCanceledAt: null, subscriptionCurrentPeriodEnd: { lte: periodEnd } },
        data: { subscriptionStatus: "active", lastFailedPaymentAt: null, lastFailedPaymentReason: null },
      });
    } else if (subscription.status === "canceled" && subscription.canceledAt) {
      await prisma.user.updateMany({
        where: { id: userId, mollieSubscriptionId: payment.subscriptionId, subscriptionCanceledAt: null },
        data: { subscriptionCanceledAt: requirePaymentDate(subscription.canceledAt) },
      });
    }
  });
}

export async function processWebhookPayment(paymentId: string) {
  // Fetch payment details from Mollie (never trust webhook data directly)
  const payment = await mollie.payments.get(paymentId);
  const terminalFailureStatuses = ["canceled", "expired", "failed"] as const;
  const isTerminalFailure = (terminalFailureStatuses as readonly string[]).includes(payment.status);

  // Check if this is an add-on related payment
  const metadata = payment.metadata as any;
  if (metadata?.type === "addon_subscription") {
    return "processed";
  }

  if (metadata?.type === "payment_method_reset") {
    return "processed";
  }

  if (metadata?.type === "audit_payment") {
    if (!metadata?.userId) {
      console.error("Audit payment missing userId:", payment.id);
      return "processed";
    }

    if (payment.status !== "paid") {
      return isTerminalFailure ? "processed" : "pending";
    }

    if (payment.status === "paid") {
      const credits = Number.parseInt(metadata.auditCredits ?? "1", 10);
      await fulfillAuditCredits(payment, metadata.userId, Number.isFinite(credits) && credits > 0 ? credits : 1);

      try {
        await sendInvoiceForPayment(paymentId);
      } catch (invoiceError) {
        console.error("[Webhook] Failed to send audit invoice:", invoiceError);
      }
      return "processed";
    }
  }

  if (metadata?.type === "addon_checkout") {
    if (!metadata?.userId || !metadata?.addOnType) {
      console.error("Add-on checkout payment missing metadata:", payment.id);
      return "processed";
    }

    if (payment.status !== "paid") {
      if (isTerminalFailure) {
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            lastFailedPaymentAt: new Date(),
            lastFailedPaymentReason: `mollie:${payment.status}`,
          },
        });
      }
      return isTerminalFailure ? "processed" : "pending";
    }

    if (payment.status === "paid") {
      const nextBillingDate = nextBillingPeriodEnd(requirePaymentDate(payment.paidAt), "monthly");
      if (!payment.customerId) throw new Error("Paid add-on checkout has no customer identity");
      const rawQuantity = metadata.quantity ?? "1";
      if (!/^[1-9]\d*$/.test(String(rawQuantity)) || !Number.isSafeInteger(Number(rawQuantity))) {
        throw new Error("Paid add-on checkout has invalid quantity metadata");
      }

      await purchaseAddOn({
        userId: metadata.userId,
        type: metadata.addOnType,
        quantity: Number(rawQuantity),
        sourcePaymentId: payment.id,
        sourceCustomerId: payment.customerId,
        sourceAmount: payment.amount,
        firstBillingDate: nextBillingDate.toISOString().split("T")[0],
      });
      return "processed";
    }
  }

  if (!metadata?.userId || !metadata?.planKey) {
    // Fall back to legacy metadata format
    if (!metadata?.userId || !metadata?.plan) {
      console.error("Payment missing required metadata:", payment.id);
      return "processed";
    }
  }

  const userId = metadata.userId;
  const plan = planKeyFromString(metadata.planKey ?? metadata.plan);
  const billingCycle = (metadata?.billingInterval ?? metadata?.billingCycle ?? "monthly") as BillingInterval;

  // Non-paid terminal statuses: record on the User row so the dashboard /
  // pricing page can show a friendly message and so operators have visibility
  // (without this, ProcessedWebhook silently records the event as "processed"
  // and the user is left in the dark).
  if (payment.status !== "paid") {
    if (isTerminalFailure) {
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || (payment.customerId && user.mollieCustomerId !== payment.customerId)) throw new Error("Payment owner mismatch");
        const shouldMarkPastDue = payment.status === "failed" && payment.sequenceType === SequenceType.recurring &&
          !!payment.subscriptionId && payment.subscriptionId === user.mollieSubscriptionId &&
          !user.subscriptionCanceledAt && (!user.subscriptionCurrentPeriodEnd ||
            (user.subscriptionCurrentPeriodEnd <= new Date() && nextBillingPeriodEnd(requirePaymentDate(payment.createdAt), billingCycle) > user.subscriptionCurrentPeriodEnd));
        await prisma.user.update({
          where: { id: userId },
          data: {
            ...(shouldMarkPastDue ? { subscriptionStatus: "past_due" } : {}),
            lastFailedPaymentAt: new Date(),
            lastFailedPaymentReason: `mollie:${payment.status}`,
          },
        });
        console.log(
          `[Webhook] Recorded ${payment.status} payment for user:`,
          userId,
          payment.id
        );
      } catch (recordError) {
        console.error("[Webhook] Failed to record failed-payment:", recordError);
        throw recordError;
      }
    }
    // Open / pending / authorized statuses: do nothing — Mollie will send a
    // follow-up webhook when the payment reaches a terminal state.
    return isTerminalFailure ? "processed" : "pending";
  }

  if (payment.customerId && plan !== "FREE") {
    if (payment.sequenceType === SequenceType.recurring) {
      await recordRecurringPayment(payment, userId, billingCycle);
    } else if (payment.sequenceType === SequenceType.first && !payment.subscriptionId) {
      await createSubscription({ customerId: payment.customerId, plan: plan as Exclude<Plan, "FREE">, userId, billingCycle, sourcePayment: payment });
    } else {
      throw new Error("Paid plan payment has no recognized recurring sequence");
    }
  }

  // Backfill BillingProfile from Mollie customer + payment metadata so we have
  // a complete invoice record for AVG/VAT compliance. Idempotent — uses upsert.
  try {
    await backfillBillingProfileFromPayment(userId, payment, metadata);
  } catch (billingError) {
    console.error("[Webhook] Failed to backfill BillingProfile:", billingError);
  }

  // Activate any AssuranceDomain rows tied to this user's active subscription so
  // the Axe-core scanner treats the domain as authorised. Safe to run on every
  // successful payment because we only flip `active=true` (no destructive ops).
  try {
    await activateAssuranceDomainsForUser(userId);
  } catch (activationError) {
    console.error("[Webhook] Failed to activate AssuranceDomains:", activationError);
  }

  // Send invoice email (idempotent)
  try {
    await sendInvoiceForPayment(paymentId);
  } catch (invoiceError) {
    console.error("[Webhook] Failed to send invoice:", invoiceError);
  }

  return "processed";
}

/**
 * Backfill the user's BillingProfile from Mollie customer + payment metadata.
 *
 * Uses upsert so it is safe on retries. We never overwrite a non-null DB value
 * with a null/empty Mollie value — only fill in fields the customer hasn't
 * explicitly set themselves.
 */
async function backfillBillingProfileFromPayment(
  userId: string,
  payment: Payment,
  metadata: any
): Promise<void> {
  // Fetch the Mollie customer for name / email
  let mollieCustomer: Customer | null = null;
  if (payment.customerId) {
    try {
      mollieCustomer = await mollie.customers.get(payment.customerId);
    } catch (err) {
      console.warn("[Webhook] Could not fetch Mollie customer:", err);
    }
  }

  const fullName: string | undefined =
    metadata?.fullName || mollieCustomer?.name || undefined;

  // Mollie's billingAddress is on the payment object when present
  const billingAddress = (payment as any).billingAddress as
    | {
        streetAndNumber?: string;
        city?: string;
        postalCode?: string;
        region?: string;
        country?: string;
      }
    | undefined;

  const countryCode: string =
    metadata?.billingCountry ||
    billingAddress?.country ||
    "NL";

  const profileData = {
    billingType:
      metadata?.customerType === "company" ? "business" : "individual",
    fullName: fullName ?? null,
    companyName: metadata?.companyName ?? null,
    countryCode,
    vatId: metadata?.vatNumber ?? metadata?.vatId ?? null,
    vatValid: Boolean(metadata?.vatIdValid ?? metadata?.vatValid ?? false),
    kvkNumber: metadata?.kvkNumber ?? null,
    addressLine1: billingAddress?.streetAndNumber ?? null,
    addressCity: billingAddress?.city ?? null,
    addressPostal: billingAddress?.postalCode ?? null,
    addressRegion: billingAddress?.region ?? null,
  };

  const existing = await prisma.billingProfile.findUnique({
    where: { userId },
  });

  if (!existing) {
    await prisma.billingProfile.create({
      data: {
        userId,
        ...profileData,
      },
    });
    console.log("[Webhook] Created BillingProfile for user:", userId);
    return;
  }

  // Build a "fill-only-if-empty" patch so we never blow away user-edited fields
  const patch: Record<string, unknown> = {};
  const fillIfEmpty = <K extends keyof typeof profileData>(key: K) => {
    const current = (existing as any)[key];
    const incoming = profileData[key];
    if ((current === null || current === undefined || current === "") && incoming) {
      patch[key as string] = incoming;
    }
  };
  fillIfEmpty("fullName");
  fillIfEmpty("companyName");
  fillIfEmpty("vatId");
  fillIfEmpty("kvkNumber");
  fillIfEmpty("addressLine1");
  fillIfEmpty("addressCity");
  fillIfEmpty("addressPostal");
  fillIfEmpty("addressRegion");

  // Country is special: we trust Mollie's value over a default "NL" only if
  // the existing row is still on the default and we have a more specific signal.
  if (
    (existing.countryCode === "NL" || !existing.countryCode) &&
    profileData.countryCode &&
    profileData.countryCode !== existing.countryCode
  ) {
    patch.countryCode = profileData.countryCode;
  }

  // VAT validity should reflect the latest known truth from the payment metadata.
  if (profileData.vatValid && !existing.vatValid) {
    patch.vatValid = true;
    patch.vatCheckedAt = new Date();
  }

  if (Object.keys(patch).length > 0) {
    await prisma.billingProfile.update({
      where: { userId },
      data: patch,
    });
    console.log("[Webhook] Backfilled BillingProfile fields for user:", userId, Object.keys(patch));
  }
}

/**
 * Mark every AssuranceDomain belonging to this user's active AssuranceSubscription
 * as `active=true` so the scanner treats the domain as authorised.
 *
 * Idempotent: re-running on already-active rows is a no-op (Prisma updateMany
 * with the same value returns count=0 work but does not error).
 */
async function activateAssuranceDomainsForUser(userId: string): Promise<void> {
  const activeSubs = await prisma.assuranceSubscription.findMany({
    where: { userId, status: "active" },
    select: { id: true },
  });
  if (activeSubs.length === 0) return;

  const subscriptionIds = activeSubs.map((s) => s.id);
  const result = await prisma.assuranceDomain.updateMany({
    where: {
      subscriptionId: { in: subscriptionIds },
      active: false,
    },
    data: { active: true },
  });
  if (result.count > 0) {
    console.log(
      `[Webhook] Activated ${result.count} AssuranceDomain row(s) for user:`,
      userId
    );
  }
}

// ── Subscription Webhook Handler ───────────────────────────────

import { generateAndSendInvoice } from "./invoice-service";

export async function processSubscriptionWebhook(subscriptionId: string) {
  try {
    let owner = await prisma.user.findFirst({
      where: { mollieSubscriptionId: subscriptionId },
      select: { id: true, mollieCustomerId: true },
    });
    if (!owner) {
      const localAddOn = await prisma.addOn.findUnique({
        where: { mollieSubscriptionId: subscriptionId },
        select: { user: { select: { id: true, mollieCustomerId: true } } },
      });
      owner = localAddOn?.user ?? null;
    }
    if (!owner?.mollieCustomerId) return;
    // Both IDs are required by Mollie. Resolve customer ownership locally.
    const subscription = await mollie.customerSubscriptions.get(subscriptionId, { customerId: owner.mollieCustomerId });
    if (subscription.customerId !== owner.mollieCustomerId) throw new Error("Subscription ownership mismatch");

    if (subscription.status !== "active") {
      console.log("[Subscription Webhook] Subscription not active, skipping");
      return;
    }

    const metadata = subscription.metadata as any;
    if (!metadata?.userId || !metadata?.addOnType) {
      console.log("[Subscription Webhook] Not an add-on subscription, skipping");
      return;
    }

    if (metadata.userId !== owner.id) throw new Error("Subscription metadata ownership mismatch");
    const userId = metadata.userId;
    const addOnType = metadata.addOnType;
    const addOnId = metadata.addOnId;

    const addOn = await prisma.addOn.findFirst({
      where: {
        id: addOnId,
        userId,
        type: addOnType,
        mollieSubscriptionId: subscriptionId,
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

    let invoiceQuoteId = existingQuote?.id;
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

        const createdQuote = await prisma.checkoutQuote.create({
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
        invoiceQuoteId = createdQuote.id;
        console.log("[Subscription Webhook] Created CheckoutQuote for add-on:", subscriptionId);
      } catch (quoteError) {
        console.error("[Subscription Webhook] Failed to create CheckoutQuote:", quoteError);
        throw quoteError;
      }
    }

    if (!invoiceQuoteId) {
      console.error('[Subscription Webhook] No invoice quote available; delivery remains retryable');
      throw new Error('Subscription invoice quote is unavailable; retry required');
    }

    try {
      const result = await generateAndSendInvoice(invoiceQuoteId, { force: false });
      console.log("[Subscription Webhook] Invoice sent:", result);
    } catch (invoiceError) {
      console.error("[Subscription Webhook] Failed to send invoice:", invoiceError);
      throw invoiceError;
    }
  } catch (error) {
    console.error("[Subscription Webhook] Error processing subscription:", error);
    throw error;
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
