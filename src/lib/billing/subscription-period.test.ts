import { describe, expect, it } from "vitest";
import { hasPaidSubscriptionAccess, nextBillingPeriodEnd, requirePaymentDate } from "./subscription-period";

describe("paid subscription periods", () => {
  it.each([
    ["2026-01-31T13:45:00Z", "monthly", "2026-02-28T13:45:00.000Z"],
    ["2028-01-31T13:45:00Z", "monthly", "2028-02-29T13:45:00.000Z"],
    ["2028-02-29T13:45:00Z", "yearly", "2029-02-28T13:45:00.000Z"],
    ["2026-12-31T13:45:00Z", "monthly", "2027-01-31T13:45:00.000Z"],
    ["2026-04-30T13:45:00Z", "monthly", "2026-05-30T13:45:00.000Z"],
    ["2026-09-06T13:45:00Z", "yearly", "2027-09-06T13:45:00.000Z"],
  ] as const)("clamps %s + %s to %s", (date, interval, expected) => {
    expect(nextBillingPeriodEnd(date, interval).toISOString()).toBe(expected);
  });
  it("does not mutate an existing persisted date", () => {
    const date = new Date("2026-01-31T12:00:00Z");
    nextBillingPeriodEnd(date, "monthly");
    expect(date.toISOString()).toBe("2026-01-31T12:00:00.000Z");
  });
  it.each([null, undefined, "", "invalid", new Date(NaN)])("rejects missing or invalid timestamp %s", value => {
    expect(() => requirePaymentDate(value)).toThrow("valid billing timestamp");
  });
});

describe("paid access after cancellation", () => {
  const now = new Date("2026-09-06T12:00:00Z");
  it("preserves legacy active subscriptions without inventing an expiry", () => {
    expect(hasPaidSubscriptionAccess({ subscriptionStatus: "active" }, now)).toBe(true);
  });
  it("requires the next paid renewal once a known active period expires", () => {
    expect(hasPaidSubscriptionAccess({ subscriptionStatus: "active", subscriptionCurrentPeriodEnd: now }, now)).toBe(false);
  });
  it.each(["past_due", "failed", "pending", "inactive"])("blocks %s even with an old period record", subscriptionStatus => {
    expect(hasPaidSubscriptionAccess({ subscriptionStatus, subscriptionCurrentPeriodEnd: new Date("2026-10-01Z") }, now)).toBe(false);
  });
  it.each(["canceled", "active"])("retains %s paid time when cancellation is recorded", subscriptionStatus => {
    expect(hasPaidSubscriptionAccess({ subscriptionStatus, subscriptionCanceledAt: now, subscriptionCurrentPeriodEnd: new Date("2026-10-01Z") }, now)).toBe(true);
  });
  it.each([null, new Date("2026-09-06T12:00:00Z"), new Date("2026-09-05Z")])("blocks canceled subscriptions at or after %s", subscriptionCurrentPeriodEnd => {
    expect(hasPaidSubscriptionAccess({ subscriptionStatus: "canceled", subscriptionCurrentPeriodEnd }, now)).toBe(false);
  });
});
