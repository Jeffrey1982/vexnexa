import type { BillingInterval } from "./pricing-config";

/** A provider timestamp must be present: webhook arrival time is not a billing anchor. */
export function requirePaymentDate(value: string | Date | null | undefined): Date {
  if (!value) throw new Error("Payment is missing a valid billing timestamp");
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error("Payment is missing a valid billing timestamp");
  return date;
}

/** UTC calendar arithmetic clamps Jan 31 / Feb 29 instead of overflowing into March. */
export function nextBillingPeriodEnd(value: string | Date, interval: BillingInterval): Date {
  const date = requirePaymentDate(value);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + (interval === "yearly" ? 12 : 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date;
}

export type SubscriptionAccess = {
  subscriptionStatus: string;
  subscriptionCurrentPeriodEnd?: Date | null;
  subscriptionCanceledAt?: Date | null;
};

/** Legacy active subscriptions remain valid; cancellation never creates an unlimited grace period. */
export function hasPaidSubscriptionAccess(user: SubscriptionAccess, now = new Date()): boolean {
  if (user.subscriptionCurrentPeriodEnd && !(user.subscriptionCurrentPeriodEnd.getTime() > now.getTime())) return false;
  if (user.subscriptionStatus === "canceled" || user.subscriptionCanceledAt) {
    return !!user.subscriptionCurrentPeriodEnd && user.subscriptionCurrentPeriodEnd.getTime() > now.getTime();
  }
  return user.subscriptionStatus === "active";
}
