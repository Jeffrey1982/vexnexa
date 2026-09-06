import { beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({
  db: { user: { findUnique: vi.fn(), update: vi.fn() }, billingProfile: { findUnique: vi.fn() }, addOn: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn() }, site: { count: vi.fn() }, $transaction: vi.fn() },
  mollie: { customerMandates: { page: vi.fn() }, customerSubscriptions: { create: vi.fn(), update: vi.fn(), cancel: vi.fn() } },
  lock: vi.fn(),
}))
vi.mock('../prisma', () => ({ prisma: mock.db }))
vi.mock('../mollie', () => ({ mollie: mock.mollie, appUrl: 'https://app.test', formatMollieAmount: (n: number) => n.toFixed(2) }))
vi.mock('./webhook-lease', () => ({ withBillingOperationLock: mock.lock }))
vi.mock('./addon-fulfillment', () => ({ assertNoPendingAddOnFulfillment: async () => undefined, fulfillPaidAddOn: vi.fn() }))
import { purchaseAddOn, updateAddOnQuantity, cancelAddOn, getUserAddOns } from './addon-flows'
const seat = (overrides = {}) => ({ id: 'a1', userId: 'u1', type: 'EXTRA_SEAT', quantity: 2, status: 'active', mollieSubscriptionId: 'sub1', user: { mollieCustomerId: 'c1', plan: 'PRO' }, ...overrides })
beforeEach(() => {
  vi.resetAllMocks(); mock.db.user.findUnique.mockResolvedValue({ id: 'u1', email: 'test@example.test', mollieCustomerId: 'c1', plan: 'PRO', subscriptionStatus: 'active' })
  mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'valid' }]); mock.db.billingProfile.findUnique.mockResolvedValue(null)
  mock.db.addOn.findFirst.mockResolvedValue(null); mock.db.addOn.findUnique.mockResolvedValue(seat()); mock.db.addOn.create.mockResolvedValue({ id: 'a1' }); mock.db.addOn.update.mockResolvedValue({ id: 'a1' })
  mock.mollie.customerSubscriptions.create.mockResolvedValue({ id: 'sub1' }); mock.db.addOn.findMany.mockResolvedValue([]); mock.db.site.count.mockResolvedValue(0)
  mock.db.$transaction.mockImplementation(async work => work(mock.db))
  mock.lock.mockImplementation(async (_userId, work) => work())
})

it.each([0, -1])('rejects non-positive purchase quantity %i before service calls', async quantity => { await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT', quantity })).rejects.toThrow('at least 1'); expect(mock.db.user.findUnique).not.toHaveBeenCalled() })
it('rejects multiple scan packs in one quantity', async () => { await expect(purchaseAddOn({ userId: 'u1', type: 'SCAN_PACK_100', quantity: 2 })).rejects.toThrow('quantity 1') })
it('rejects a missing customer record', async () => { mock.db.user.findUnique.mockResolvedValue(null); await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT' })).rejects.toThrow('User not found') })
it('requires a payment method before creating any addon', async () => { mock.db.user.findUnique.mockResolvedValue({ mollieCustomerId: null }); await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT' })).rejects.toMatchObject({ code: 'NO_PAYMENT_METHOD', action: 'setup_payment' }); expect(mock.db.addOn.create).not.toHaveBeenCalled() })
it('rejects expired mandates without granting entitlements', async () => { mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'invalid' }]); await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT' })).rejects.toMatchObject({ code: 'PAYMENT_METHOD_EXPIRED' }); expect(mock.db.addOn.create).not.toHaveBeenCalled() })
it('charges the configured gross seat price and stores invoice-only VAT breakdown', async () => {
  const result = await purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT', quantity: 2, firstBillingDate: '2026-10-01' })
  expect(result).toMatchObject({ subscription: { id: 'sub1' } })
  expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'c1', amount: { currency: 'EUR', value: '30.00' }, startDate: '2026-10-01', metadata: expect.objectContaining({ userId: 'u1', addOnId: 'a1', quantity: '2', netAmount: '24.79', vatAmount: '5.21' }) }))
  expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { extraSeats: { increment: 2 } } })
  expect(mock.db.addOn.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'pending' }) })
  expect(mock.db.addOn.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { mollieSubscriptionId: 'sub1', status: 'active', activatedAt: expect.any(Date) } })
})
it('does not add VAT on top of a zero-rated business pack', async () => {
  mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'DE', billingType: 'business', vatValid: true })
  await purchaseAddOn({ userId: 'u1', type: 'SCAN_PACK_100' })
  expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '19.00' }, metadata: expect.objectContaining({ vatRate: '0', vatAmount: '0', netAmount: '19' }) }))
  expect(mock.db.user.update).not.toHaveBeenCalled()
})
it('blocks duplicate active scan packs', async () => { mock.db.addOn.findFirst.mockResolvedValue({ id: 'existing' }); await expect(purchaseAddOn({ userId: 'u1', type: 'SCAN_PACK_100' })).rejects.toMatchObject({ code: 'ALREADY_ACTIVE' }); expect(mock.db.addOn.create).not.toHaveBeenCalled() })
it('leaves a lost provider response pending and blocks another create on retry', async () => {
  mock.mollie.customerSubscriptions.create.mockRejectedValueOnce(new Error('provider offline'))
  await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT' })).rejects.toThrow('provider offline')
  expect(mock.db.addOn.create).toHaveBeenCalledWith({ data: expect.objectContaining({ status: 'pending' }) })
  expect(mock.db.addOn.update).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1', status: 'pending' })
  await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT' })).rejects.toMatchObject({ code: 'ADDON_RECONCILIATION_REQUIRED' })
  expect(mock.db.addOn.findFirst).toHaveBeenCalledWith({ where: { userId: 'u1', type: 'EXTRA_SEAT', status: { in: ['active', 'pending'] } } })
  expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledOnce()
  expect(mock.db.addOn.update).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
})
it('requires absolute quantity management for an existing seat bundle without incrementing on POST retry', async () => {
  mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1', quantity: 2, status: 'active' })
  for (let i = 0; i < 2; i++) await expect(purchaseAddOn({ userId: 'u1', type: 'EXTRA_SEAT', quantity: 3 })).rejects.toMatchObject({ code: 'EXISTING_SEAT_BUNDLE' })
  expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled(); expect(mock.db.addOn.create).not.toHaveBeenCalled()
})
it.each(['EXTRA_SEAT', 'PAGE_PACK_25K'] as const)('blocks another %s creation after provider success and local activation failure', async type => {
  mock.db.addOn.update.mockRejectedValueOnce(new Error('database offline'))
  await expect(purchaseAddOn({ userId: 'u1', type })).rejects.toThrow('database offline')
  mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1', status: 'pending' })
  await expect(purchaseAddOn({ userId: 'u1', type })).rejects.toMatchObject({ code: 'ADDON_RECONCILIATION_REQUIRED' })
  expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledOnce()
  expect(mock.db.addOn.create).toHaveBeenCalledOnce(); expect(mock.db.user.update).not.toHaveBeenCalled()
})
it.each([
  [null, 'Add-on not found'], [seat({ type: 'SCAN_PACK_100' }), 'Only seat'], [seat({ status: 'canceled' }), 'inactive'], [seat({ mollieSubscriptionId: null }), 'Missing Mollie'],
])('rejects invalid quantity-change state %j', async (record, message) => { mock.db.addOn.findUnique.mockResolvedValue(record); await expect(updateAddOnQuantity({ addOnId: 'a1', newQuantity: 3 })).rejects.toThrow(message as string); expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled() })
it('rejects zero seats and reduces entitlement by the exact delta', async () => {
  await expect(updateAddOnQuantity({ addOnId: 'a1', newQuantity: 0 })).rejects.toThrow('at least 1')
  mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'NL', billingType: 'individual', vatValid: false }); await updateAddOnQuantity({ addOnId: 'a1', newQuantity: 1 })
  expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { extraSeats: { increment: -1 } } })
  expect(mock.db.addOn.update).toHaveBeenCalledWith({ where: { id: 'a1' }, data: { quantity: 1, totalPrice: 15 } })
})
it('does not change local quantity after provider update failure', async () => { mock.mollie.customerSubscriptions.update.mockRejectedValue(new Error('provider offline')); await expect(updateAddOnQuantity({ addOnId: 'a1', newQuantity: 4 })).rejects.toThrow('provider offline'); expect(mock.db.addOn.update).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled() })
it('rolls back quantity and counter together when a local PATCH write fails, then applies an absolute retry once', async () => {
  let row = seat(); let extraSeats = 2
  mock.db.addOn.findUnique.mockImplementation(async () => structuredClone(row))
  mock.db.addOn.update.mockImplementation(async ({ data }) => { Object.assign(row, data); return structuredClone(row) })
  mock.db.user.update.mockImplementation(async ({ data }) => { extraSeats += data.extraSeats.increment })
  mock.db.$transaction.mockImplementation(async work => {
    const snapshot = structuredClone({ row, extraSeats })
    try { return await work(mock.db) } catch (error) { ({ row, extraSeats } = snapshot); throw error }
  })
  mock.db.user.update.mockRejectedValueOnce(new Error('local counter write failed'))
  await expect(updateAddOnQuantity({ addOnId: 'a1', newQuantity: 4 })).rejects.toThrow('local counter')
  expect(row.quantity).toBe(2); expect(extraSeats).toBe(2)
  await updateAddOnQuantity({ addOnId: 'a1', newQuantity: 4 })
  await updateAddOnQuantity({ addOnId: 'a1', newQuantity: 4 })
  expect(row.quantity).toBe(4); expect(extraSeats).toBe(4)
  expect(mock.lock).toHaveBeenCalledWith('u1', expect.any(Function))
  expect(mock.mollie.customerSubscriptions.update).toHaveBeenCalledTimes(3)
  for (const [, args] of mock.mollie.customerSubscriptions.update.mock.calls) expect(args.amount.value).toBe('60.00')
})
it('does not PATCH provider or local quantity when another billing operation owns the lease', async () => {
  mock.lock.mockRejectedValue(new Error('billing operation in progress'))
  await expect(updateAddOnQuantity({ addOnId: 'a1', newQuantity: 4 })).rejects.toThrow('in progress')
  expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled(); expect(mock.db.addOn.update).not.toHaveBeenCalled()
})
it.each([[null, 'Add-on not found'], [seat({ status: 'canceled' }), 'already canceled'], [seat({ user: { mollieCustomerId: null } }), 'Missing Mollie']])('rejects invalid cancellation state %j', async (record, message) => { mock.db.addOn.findUnique.mockResolvedValue(record); await expect(cancelAddOn('a1')).rejects.toThrow(message as string); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled() })
it('cancels provider billing before removing seat entitlements', async () => { await cancelAddOn('a1'); expect(mock.mollie.customerSubscriptions.cancel).toHaveBeenCalledWith('sub1', { customerId: 'c1' }); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { extraSeats: { decrement: 2 } } }) })
it('preserves entitlements when cancellation fails at provider', async () => { mock.mollie.customerSubscriptions.cancel.mockRejectedValue(new Error('offline')); await expect(cancelAddOn('a1')).rejects.toThrow('offline'); expect(mock.db.addOn.update).not.toHaveBeenCalled() })
it('prevents cancellation of website capacity that is in use', async () => {
  mock.db.addOn.findUnique.mockResolvedValue(seat({ type: 'EXTRA_WEBSITE_5' })); mock.db.site.count.mockResolvedValue(4)
  await expect(cancelAddOn('a1')).rejects.toMatchObject({ code: 'CAPACITY_IN_USE', current: 4, limitAfterCancellation: 3 }); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled()
})
it('permits cancellation when other packs retain enough capacity', async () => {
  mock.db.addOn.findUnique.mockResolvedValue(seat({ type: 'EXTRA_WEBSITE_5' })); mock.db.site.count.mockResolvedValue(4); mock.db.addOn.findMany.mockResolvedValue([{ type: 'EXTRA_WEBSITE_1', quantity: 1, status: 'active' }])
  await cancelAddOn('a1'); expect(mock.mollie.customerSubscriptions.cancel).toHaveBeenCalledOnce(); expect(mock.db.user.update).not.toHaveBeenCalled()
})
it('lists add-ons only for the requested user', async () => { await getUserAddOns('u1'); expect(mock.db.addOn.findMany).toHaveBeenCalledWith({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } }) })
