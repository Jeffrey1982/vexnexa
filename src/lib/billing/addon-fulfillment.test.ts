import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), update: vi.fn() }, addOn: { findFirst: vi.fn(), create: vi.fn(), update: vi.fn() },
    billingProfile: { findUnique: vi.fn() }, processedWebhook: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() }, $transaction: vi.fn(),
  },
  provider: { customerMandates: { page: vi.fn() }, customerSubscriptions: { iterate: vi.fn(), create: vi.fn(), update: vi.fn(), get: vi.fn() } },
  lock: vi.fn(),
}));
vi.mock("../prisma", () => ({ prisma: m.db }));
vi.mock("../mollie", () => ({ mollie: m.provider, appUrl: (path: string) => `https://app.example${path}`, formatMollieAmount: (amount: number) => amount.toFixed(2) }));
vi.mock("./webhook-lease", () => ({ withBillingOperationLock: m.lock }));
import { purchaseAddOn } from "./addon-flows";
import { assertNoPendingAddOnFulfillment } from "./addon-fulfillment";

type Row = Record<string, any>;
let rows: Row[];
let journals: Row[];
let subscriptions: Row[];
let extraSeats: number;
const opts = { userId: "u1", type: "EXTRA_SEAT" as const, quantity: 3, sourcePaymentId: "tr_paid", firstBillingDate: "2026-10-06", sourceCustomerId: "c1", sourceAmount: { currency: "EUR", value: "45.00" } };
const matches = (row: Row, where: Row) => Object.entries(where).every(([field, value]) => {
  if (field === "status" && typeof value === "object") return value.in ? value.in.includes(row[field]) : row[field] !== value.not;
  return row[field] === value;
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-06T12:00:00Z"));
  vi.stubGlobal("fetch", vi.fn(() => { throw new Error("Provider IO must stay mocked"); }));
  rows = []; journals = []; subscriptions = []; extraSeats = 0;
  m.lock.mockImplementation(async (_userId, work) => work());
  m.db.user.findUnique.mockResolvedValue({ id: "u1", mollieCustomerId: "c1", plan: "PRO", subscriptionStatus: "active" });
  m.db.user.update.mockImplementation(async ({ data }) => { extraSeats += data.extraSeats?.increment ?? 0; return { id: "u1", extraSeats }; });
  m.db.billingProfile.findUnique.mockResolvedValue(null);
  m.db.addOn.findFirst.mockImplementation(async ({ where }) => rows.find(row => matches(row, where)) ?? null);
  m.db.addOn.create.mockImplementation(async ({ data }) => { const row = { id: `addon-${rows.length + 1}`, ...data }; rows.push(row); return row; });
  m.db.addOn.update.mockImplementation(async ({ where, data }) => { const row = rows.find(row => row.id === where.id)!; Object.assign(row, data); return row; });
  m.db.processedWebhook.findUnique.mockImplementation(async ({ where }) => journals.find(row => matches(row, where.webhookId_webhookType)) ?? null);
  m.db.processedWebhook.findFirst.mockImplementation(async ({ where }) => journals.find(row => row.webhookType === where.webhookType && row.status !== "processed" && row.metadata.userId === where.metadata.equals && row.webhookId !== where.webhookId?.not) ?? null);
  m.db.processedWebhook.create.mockImplementation(async ({ data }) => { const row = { id: `journal-${journals.length + 1}`, ...data }; journals.push(row); return row; });
  m.db.processedWebhook.update.mockImplementation(async ({ where, data }) => { const row = journals.find(row => matches(row, where.webhookId_webhookType))!; Object.assign(row, data); return row; });
  m.db.processedWebhook.updateMany.mockImplementation(async ({ where, data }) => { const row = journals.find(row => matches(row, where)); if (!row) return { count: 0 }; Object.assign(row, data); return { count: 1 }; });
  // Emulate transaction rollback so failures expose non-atomic application writes.
  m.db.$transaction.mockImplementation(async work => {
    const snapshot = structuredClone({ rows, journals, extraSeats });
    try { return await work(m.db); } catch (error) { ({ rows, journals, extraSeats } = snapshot); throw error; }
  });
  m.provider.customerMandates.page.mockResolvedValue([{ status: "valid" }]);
  m.provider.customerSubscriptions.iterate.mockImplementation(() => subscriptions);
  m.provider.customerSubscriptions.create.mockImplementation(async parameters => {
    const subscription = { id: `sub-${subscriptions.length + 1}`, status: "active", ...parameters };
    subscriptions.push(subscription);
    return subscription;
  });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("durable paid add-on fulfillment", () => {
  it("grants a paid add-on once, retaining stable provider metadata, key and first billing date", async () => {
    await purchaseAddOn(opts);
    await purchaseAddOn(opts);
    expect(m.lock).toHaveBeenCalledWith("u1", expect.any(Function));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quantity: 3, status: "active", mollieSubscriptionId: "sub-1" });
    expect(extraSeats).toBe(3);
    expect(journals[0].status).toBe("processed");
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({
      amount: { currency: "EUR", value: "45.00" }, startDate: "2026-10-06", idempotencyKey: "vexnexa-addon-tr_paid",
      metadata: expect.objectContaining({ sourcePaymentId: "tr_paid", userId: "u1", addOnId: "addon-1", quantity: "3" }),
    }));
    expect(m.db.user.update).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("recovers provider success after a lost response without creating another subscription", async () => {
    const create = m.provider.customerSubscriptions.create.getMockImplementation()!;
    m.provider.customerSubscriptions.create.mockImplementationOnce(async params => { await create(params); throw new Error("response lost"); });
    await expect(purchaseAddOn(opts)).rejects.toThrow("response lost");
    expect(extraSeats).toBe(0);
    expect(rows[0].status).toBe("pending");
    await purchaseAddOn(opts);
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
    expect(subscriptions).toHaveLength(1);
    expect(extraSeats).toBe(3);
  });
  it("rolls back marker and capacity together after a local write failure, then recovers", async () => {
    m.db.user.update.mockRejectedValueOnce(new Error("database interrupted"));
    await expect(purchaseAddOn(opts)).rejects.toThrow("database interrupted");
    expect(rows[0].status).toBe("pending");
    expect(journals[0].status).toBe("provider_pending");
    expect(extraSeats).toBe(0);
    await purchaseAddOn(opts);
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
    expect(extraSeats).toBe(3);
    expect(journals[0].status).toBe("processed");
  });
  it("does not blindly retry an uncertain creation when no provider match is visible", async () => {
    m.provider.customerSubscriptions.create.mockRejectedValueOnce(new Error("connection lost"));
    await expect(purchaseAddOn(opts)).rejects.toThrow("connection lost");
    vi.setSystemTime(new Date("2026-09-10T12:00:00Z"));
    await expect(purchaseAddOn(opts)).rejects.toMatchObject({ code: "ADDON_RECONCILIATION_REQUIRED" });
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
    expect(extraSeats).toBe(0);
  });
  it("blocks a second payment while the previous provider result is unresolved", async () => {
    m.provider.customerSubscriptions.create.mockRejectedValueOnce(new Error("uncertain"));
    await expect(purchaseAddOn(opts)).rejects.toThrow("uncertain");
    await expect(purchaseAddOn({ ...opts, sourcePaymentId: "tr_second" })).rejects.toThrow("previous add-on payment");
    expect(rows).toHaveLength(1);
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
  });
  it("never merges a legacy paid checkout into existing seats or increments them on retry", async () => {
    rows.push({ id: "existing", userId: "u1", type: "EXTRA_SEAT", quantity: 2, status: "active", mollieSubscriptionId: "existing-sub" });
    extraSeats = 2;
    for (let attempt = 0; attempt < 2; attempt++) await expect(purchaseAddOn(opts)).rejects.toThrow("cannot be merged");
    expect(rows[0].quantity).toBe(2);
    expect(extraSeats).toBe(2);
    expect(m.provider.customerSubscriptions.create).not.toHaveBeenCalled();
    expect(m.provider.customerSubscriptions.update).not.toHaveBeenCalled();
    expect(m.db.user.update).not.toHaveBeenCalled();
  });
  it.each([{ userId: "other" }, { quantity: 5 }, { type: "SCAN_PACK_100" as const, quantity: 1 }, { firstBillingDate: "2026-11-06" }, { sourceCustomerId: "other-customer" }, { sourceAmount: { currency: "EUR", value: "60.00" } }])("rejects mutated replay data %j", async override => {
    await purchaseAddOn(opts);
    await expect(purchaseAddOn({ ...opts, ...override })).rejects.toThrow("does not match");
    expect(extraSeats).toBe(3);
    expect(subscriptions).toHaveLength(1);
  });
  it("does not restore an addon canceled after successful fulfillment", async () => {
    await purchaseAddOn(opts);
    rows[0].status = "canceled"; extraSeats = 0;
    await purchaseAddOn(opts);
    expect(rows[0].status).toBe("canceled");
    expect(extraSeats).toBe(0);
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledOnce();
  });
  it("refuses a customer mismatch before reserving or provisioning an add-on", async () => {
    await expect(purchaseAddOn({ ...opts, sourceCustomerId: "another-customer" })).rejects.toThrow("matching Mollie customer");
    expect(rows).toHaveLength(0);
    expect(m.provider.customerSubscriptions.create).not.toHaveBeenCalled();
  });
  it("preserves an already-paid checkout amount instead of repricing from the current catalog", async () => {
    await purchaseAddOn({ ...opts, sourceAmount: { currency: "EUR", value: "36.00" } });
    expect(rows[0]).toMatchObject({ quantity: 3, pricePerUnit: 12, totalPrice: 36 });
    expect(m.provider.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: "EUR", value: "36.00" } }));
  });
  it.each([{ currency: "USD", value: "45.00" }, { currency: "EUR", value: "0.00" }, { currency: "EUR", value: "44.99" }, { currency: "EUR", value: "garbage" }])("rejects invalid paid amounts %j before provider work", async sourceAmount => {
    await expect(purchaseAddOn({ ...opts, sourceAmount })).rejects.toThrow("valid recurring unit price");
    expect(rows).toHaveLength(0);
    expect(m.provider.customerSubscriptions.create).not.toHaveBeenCalled();
  });
  it.each(["duplicate", "wrong-owner", "canceled"])("fails closed on %s provider recovery", async failure => {
    m.db.user.update.mockRejectedValueOnce(new Error("pause local commit"));
    await expect(purchaseAddOn(opts)).rejects.toThrow("pause local commit");
    if (failure === "duplicate") subscriptions.push({ ...subscriptions[0], id: "duplicate-sub" });
    if (failure === "wrong-owner") subscriptions[0].metadata.userId = "other";
    if (failure === "canceled") subscriptions[0].status = "canceled";
    await expect(purchaseAddOn(opts)).rejects.toMatchObject({ code: "ADDON_RECONCILIATION_REQUIRED" });
    expect(extraSeats).toBe(0);
    expect(rows[0].status).toBe("pending");
  });
  it.each(["2026-09-06", "2026-02-30", "invalid"])("rejects unsafe first billing date %s before provider work", async firstBillingDate => {
    await expect(purchaseAddOn({ ...opts, firstBillingDate })).rejects.toMatchObject({ code: "ADDON_RECONCILIATION_REQUIRED" });
    expect(m.provider.customerSubscriptions.create).not.toHaveBeenCalled();
    expect(rows).toHaveLength(0);
  });
  it("scopes pending journal checks to the billing user", async () => {
    await assertNoPendingAddOnFulfillment("u1", "tr_paid");
    expect(m.db.processedWebhook.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ metadata: { path: ["userId"], equals: "u1" }, webhookId: { not: "tr_paid" } }) }));
  });
  it("does not run fulfillment when another user billing operation holds the lock", async () => {
    m.lock.mockRejectedValueOnce(new Error("billing operation in progress"));
    await expect(purchaseAddOn(opts)).rejects.toThrow("in progress");
    expect(m.db.user.findUnique).not.toHaveBeenCalled();
    expect(m.provider.customerSubscriptions.create).not.toHaveBeenCalled();
  });
});
