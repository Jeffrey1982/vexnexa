import { z } from "zod";
import { AddOnType, type Prisma } from "@prisma/client";
import type { Subscription } from "@mollie/api-client";
import { mollie, appUrl, formatMollieAmount } from "../mollie";
import { prisma } from "../prisma";
import { ADDON_NAMES } from "./addons";
import { determineTax } from "./tax";
import { deriveVatBreakdown } from "./pricing-config";

const FULFILLMENT_TYPE = "addon_payment_fulfillment";
const JournalSchema = z.object({
  userId: z.string(), customerId: z.string(), addOnId: z.string(), type: z.nativeEnum(AddOnType),
  quantity: z.number().int().positive(), firstBillingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  pricePerUnit: z.number().positive(), totalPrice: z.number().positive(),
  vatRate: z.number(), taxRegime: z.string(), netAmount: z.number(), vatAmount: z.number(),
  subscriptionId: z.string().optional(),
});
type Journal = z.infer<typeof JournalSchema>;
export type PaidAddOnOptions = {
  userId: string; type: AddOnType; quantity: number; sourcePaymentId: string; firstBillingDate: string;
  sourceCustomerId: string; sourceAmount: { currency: string; value: string };
};

function reconciliationError(message: string) {
  return Object.assign(new Error(message), { code: "ADDON_RECONCILIATION_REQUIRED" });
}

/** Do not interleave a new purchase with a provider call awaiting reconciliation. */
export async function assertNoPendingAddOnFulfillment(userId: string, currentPaymentId?: string) {
  const pending = await prisma.processedWebhook.findFirst({
    where: {
      webhookType: FULFILLMENT_TYPE, status: { not: "processed" },
      ...(currentPaymentId ? { webhookId: { not: currentPaymentId } } : {}),
      metadata: { path: ["userId"], equals: userId },
    },
    select: { id: true },
  });
  if (pending) throw reconciliationError("A previous add-on payment must be reconciled before another purchase.");
}

/** Called only for provider-verified paid checkouts, while holding the user billing lock. */
export async function fulfillPaidAddOn(opts: PaidAddOnOptions) {
  const { userId, type, quantity, sourcePaymentId, firstBillingDate, sourceCustomerId, sourceAmount } = opts;
  const sourceCents = Math.round(Number(sourceAmount.value) * 100);
  if (sourceAmount.currency !== "EUR" || !/^\d+\.\d{2}$/.test(sourceAmount.value) || !Number.isSafeInteger(sourceCents) || sourceCents <= 0 || sourceCents % quantity !== 0) {
    throw reconciliationError("Paid add-on amount does not match a valid recurring unit price.");
  }
  const sourceTotal = sourceCents / 100;
  const key = { webhookId: sourcePaymentId, webhookType: FULFILLMENT_TYPE };
  const where = { webhookId_webhookType: key };
  let record = await prisma.processedWebhook.findUnique({ where });
  let journal: Journal;

  if (record) {
    journal = JournalSchema.parse(record.metadata);
    if (journal.userId !== userId || journal.customerId !== sourceCustomerId || journal.type !== type || journal.quantity !== quantity || journal.firstBillingDate !== firstBillingDate || journal.totalPrice !== sourceTotal) {
      throw reconciliationError("Paid add-on replay does not match its original fulfillment.");
    }
    if (record.status === "processed") {
      const addOn = await prisma.addOn.findFirst({ where: { id: journal.addOnId, userId, type } });
      if (!addOn) throw reconciliationError("Fulfilled add-on no longer exists; refusing to create it again.");
      return { addOn, subscription: { id: journal.subscriptionId } };
    }
  } else {
    const billingDate = new Date(`${firstBillingDate}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstBillingDate) || Number.isNaN(billingDate.getTime()) ||
        billingDate.toISOString().slice(0, 10) !== firstBillingDate || firstBillingDate <= new Date().toISOString().slice(0, 10)) {
      throw reconciliationError("Paid add-on requires a future first billing date; refusing an immediate duplicate charge.");
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, mollieCustomerId: true } });
    if (!user) throw new Error("User not found");
    if (!user.mollieCustomerId || user.mollieCustomerId !== sourceCustomerId) throw reconciliationError("Paid add-on has no matching Mollie customer.");
    const existing = await prisma.addOn.findFirst({ where: { userId, type, status: { in: ["active", "pending"] } } });
    if (existing) {
      throw reconciliationError(type === "EXTRA_SEAT"
        ? "A paid checkout cannot be merged into an existing seat bundle without billing-period reconciliation. Use seat quantity management for future changes."
        : "This add-on already exists; reconcile the paid checkout before applying it.");
    }
    // Preserve the provider-verified checkout amount, even if the catalog changed
    // before webhook delivery. Never reprice an already-paid agreement here.
    const totalPrice = sourceTotal;
    const pricePerUnit = totalPrice / quantity;
    const profile = await prisma.billingProfile.findUnique({ where: { userId }, select: { countryCode: true, billingType: true, vatValid: true } });
    const tax = profile ? determineTax({ countryCode: profile.countryCode, billingType: profile.billingType as "individual" | "business", vatValid: profile.vatValid }) : { vatRate: 0.21, regime: "NL_VAT" };
    const breakdown = deriveVatBreakdown(totalPrice, tax.vatRate);
    const prepared = await prisma.$transaction(async tx => {
      const addOn = await tx.addOn.create({ data: { userId, type, quantity, status: "pending", pricePerUnit, totalPrice } });
      const metadata: Journal = { userId, customerId: sourceCustomerId, addOnId: addOn.id, type, quantity, firstBillingDate, pricePerUnit, totalPrice, vatRate: tax.vatRate, taxRegime: tax.regime, netAmount: breakdown.net, vatAmount: breakdown.vat };
      const marker = await tx.processedWebhook.create({ data: { ...key, status: "pending", metadata: metadata as Prisma.InputJsonObject } });
      return { marker, metadata };
    });
    record = prepared.marker;
    journal = prepared.metadata;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { mollieCustomerId: true } });
  if (!user || user.mollieCustomerId !== journal.customerId) throw reconciliationError("Add-on customer ownership changed; reconciliation required.");
  const addOn = await prisma.addOn.findFirst({ where: { id: journal.addOnId, userId, type } });
  if (!addOn || addOn.status !== "pending" || addOn.quantity !== journal.quantity) {
    throw reconciliationError("Pending add-on no longer matches its payment; refusing to overwrite it.");
  }

  // Provider metadata is durable; unlike the idempotency cache, it survives a
  // retry days later after a successful provider call and failed local write.
  let subscription: Subscription | undefined;
  for await (const candidate of mollie.customerSubscriptions.iterate({ customerId: journal.customerId })) {
    const metadata = candidate.metadata as Record<string, unknown> | null;
    if (metadata?.sourcePaymentId !== sourcePaymentId) continue;
    if (candidate.customerId !== journal.customerId || metadata.userId !== userId || metadata.addOnId !== journal.addOnId || metadata.addOnType !== type || Number(metadata.quantity) !== quantity) {
      throw reconciliationError("Provider add-on metadata does not match this payment owner.");
    }
    if (subscription && subscription.id !== candidate.id) throw reconciliationError("Multiple subscriptions match this add-on payment.");
    subscription = candidate;
  }
  if (!subscription) {
    if (record.status !== "pending") {
      throw reconciliationError("A previous provider creation may have succeeded; no matching subscription is visible yet. Retry reconciliation, not a new charge.");
    }
    if (firstBillingDate <= new Date().toISOString().slice(0, 10)) {
      throw reconciliationError("The prepaid add-on period has ended; refusing a catch-up charge.");
    }
    const mandates = await mollie.customerMandates.page({ customerId: journal.customerId });
    if (!mandates.some(mandate => mandate.status === "valid")) throw reconciliationError("Paid add-on requires a valid recurring payment mandate.");
    await prisma.processedWebhook.update({ where, data: { status: "provider_pending" } });
    subscription = await mollie.customerSubscriptions.create({
      customerId: journal.customerId, amount: { currency: "EUR", value: formatMollieAmount(journal.totalPrice) },
      interval: "1 month", startDate: journal.firstBillingDate,
      description: `VexNexa - ${ADDON_NAMES[type]}${quantity > 1 ? ` x${quantity}` : ""} (incl. ${Math.round(journal.vatRate * 100)}% BTW)`,
      webhookUrl: appUrl("/api/mollie/webhook"),
      metadata: { type: "addon_subscription", userId, addOnId: journal.addOnId, addOnType: type, quantity: String(quantity), sourcePaymentId, firstBillingDate, taxRegime: journal.taxRegime, vatRate: String(journal.vatRate), netAmount: String(journal.netAmount), vatAmount: String(journal.vatAmount) },
      idempotencyKey: `vexnexa-addon-${sourcePaymentId}`,
    });
  }
  if (subscription.customerId !== journal.customerId || !["active", "pending"].includes(subscription.status)) {
    throw reconciliationError("Add-on subscription is not active or pending; refusing to restore canceled access.");
  }
  if (subscription.amount.currency !== "EUR" || subscription.amount.value !== formatMollieAmount(journal.totalPrice) || subscription.interval !== "1 month") {
    throw reconciliationError("Provider add-on billing terms differ from the paid agreement.");
  }
  const subscriptionId = subscription.id;
  const activated = await prisma.$transaction(async tx => {
    const completed = await tx.processedWebhook.updateMany({
      where: { ...key, status: { in: ["pending", "provider_pending"] } },
      data: { status: "processed", processedAt: new Date(), metadata: { ...journal, subscriptionId } as Prisma.InputJsonObject },
    });
    if (completed.count !== 1) throw reconciliationError("Add-on fulfillment was already claimed; retry reconciliation.");
    const updated = await tx.addOn.update({ where: { id: journal.addOnId }, data: { status: "active", mollieSubscriptionId: subscriptionId, activatedAt: new Date() } });
    if (type === "EXTRA_SEAT") await tx.user.update({ where: { id: userId }, data: { extraSeats: { increment: quantity } } });
    return updated;
  });
  return { addOn: activated, subscription };
}
