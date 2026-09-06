import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mock = vi.hoisted(() => ({
  auth: vi.fn(), pendingCore: vi.fn(), customer: vi.fn(), cancel: vi.fn(), change: vi.fn(), upgrade: vi.fn(), reset: vi.fn(), usage: vi.fn(), entitlements: vi.fn(), listAddons: vi.fn(), purchase: vi.fn(), updateAddon: vi.fn(), cancelAddon: vi.fn(), testMode: vi.fn(),
  db: { user: { findUnique: vi.fn() }, billingProfile: { upsert: vi.fn() }, checkoutQuote: { create: vi.fn() }, site: { count: vi.fn() }, scan: { count: vi.fn() }, teamMember: { count: vi.fn() }, addOn: { findUnique: vi.fn(), findFirst: vi.fn() } },
  mollie: { payments: { create: vi.fn(), update: vi.fn() }, methods: { list: vi.fn() } },
}))
vi.mock('@/lib/auth', () => ({ requireAuth: mock.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: mock.db }))
vi.mock('@mollie/api-client', () => ({ SequenceType: { first: 'first', oneoff: 'oneoff' } }))
vi.mock('@/lib/mollie', () => ({ mollie: mock.mollie, getMollieClient: () => mock.mollie, appUrl: (path: string) => `https://app.example.test${path}`, formatMollieAmount: (n: number) => n.toFixed(2), isMollieTestMode: mock.testMode }))
vi.mock('@/lib/billing/mollie-flows', () => ({ assertNoPendingCoreFulfillment: mock.pendingCore, createOrGetMollieCustomer: mock.customer, cancelSubscription: mock.cancel, changePlan: mock.change, createUpgradePayment: mock.upgrade, createPaymentMethodResetPayment: mock.reset }))
vi.mock('@/lib/billing/entitlements', () => ({ getCurrentUsage: mock.usage, getTotalEntitlements: mock.entitlements }))
vi.mock('@/lib/billing/addon-flows', () => ({ getUserAddOns: mock.listAddons, purchaseAddOn: mock.purchase, updateAddOnQuantity: mock.updateAddon, cancelAddOn: mock.cancelAddon }))
vi.mock('@/lib/billing/addon-fulfillment', () => ({ assertNoPendingAddOnFulfillment: async () => undefined }))
import { POST as createPayment } from './create-payment/route'
import { POST as createAudit } from './create-audit-payment/route'
import { POST as createAddon } from './create-addon-payment/route'
import { POST as cancel } from './cancel/route'
import { POST as change } from './change-plan/route'
import { POST as reset } from './payment-method/reset/route'
import { GET as billing } from './route'
import { GET as methods } from './methods/route'
import { GET as listAddons, POST as purchase } from './addons/route'
import { PATCH as patchAddon, DELETE as deleteAddon } from './addons/[addonId]/route'
import { AUDIT_PRICES } from '@/lib/pricing'
const req = (body: unknown = {}, method = 'POST') => new NextRequest('https://app.example.test/api/billing', { method, body: JSON.stringify(body) })
const payment = { id: 'tr1', getCheckoutUrl: () => 'https://checkout.example.test/tr1' }
const addonParams = { params: Promise.resolve({ addonId: 'a1' }) }
beforeEach(() => {
  vi.resetAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {})
  mock.auth.mockResolvedValue({ id: 'u1', email: 'user@example.test', plan: 'FREE', subscriptionStatus: 'active' }); mock.customer.mockResolvedValue({ id: 'c1' }); mock.mollie.payments.create.mockResolvedValue(payment); mock.upgrade.mockResolvedValue(payment); mock.reset.mockResolvedValue(payment)
  mock.db.billingProfile.upsert.mockImplementation(({ create }) => ({ ...create, vatValid: false })); mock.change.mockResolvedValue({ success: true }); mock.usage.mockResolvedValue({ pages: 10 }); mock.entitlements.mockResolvedValue({ pagesPerMonth: 100 }); mock.listAddons.mockResolvedValue([]); mock.db.site.count.mockResolvedValue(2); mock.db.scan.count.mockResolvedValue(8); mock.db.teamMember.count.mockResolvedValue(3); mock.db.addOn.findUnique.mockResolvedValue({ id: 'a1', userId: 'u1' }); mock.purchase.mockResolvedValue({ addOn: { id: 'a1' } }); mock.updateAddon.mockResolvedValue({ id: 'a1', quantity: 2 })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs() })

describe('checkout API', () => {
  it('does not create another checkout while previous paid activation requires reconciliation', async () => {
    mock.pendingCore.mockRejectedValue(new Error('Previous paid activation is still pending'));
    expect((await createPayment(req({ plan: 'PRO' }))).status).toBe(500);
    expect(mock.mollie.payments.create).not.toHaveBeenCalled();
    expect(mock.customer).not.toHaveBeenCalled();
  });
  it.each([createPayment, createAudit, createAddon])('requires authentication before charging', async handler => { mock.auth.mockRejectedValue(new Error('Authentication required')); expect((await handler(req())).status).toBe(401); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it.each([{ plan: 'FREE' }, { plan: 'unknown' }, { plan: 'PRO', billingCycle: 'invalid' }])('rejects invalid checkout input %j', async body => { expect((await createPayment(req(body))).status).toBe(400); expect(mock.customer).not.toHaveBeenCalled() })
  it.each(['STARTER', 'PIONEER', 'ENTERPRISE'])('rejects non-self-service %s plans', async plan => { expect((await createPayment(req({ plan }))).status).toBe(400); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('charges the fixed monthly amount for the authenticated identity', async () => {
    const response = await createPayment(req({ plan: 'PRO', userId: 'attacker' })); expect(await response.json()).toMatchObject({ amount: 34.95, paymentId: 'tr1', plan: 'Pro', billingCycle: 'monthly' })
    expect(mock.customer).toHaveBeenCalledWith('u1', 'user@example.test'); expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '34.95' }, sequenceType: 'first', metadata: expect.objectContaining({ userId: 'u1' }) })); expect(mock.db.checkoutQuote.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'u1', totalAmount: 34.95, baseAmount: 28.88, vatAmount: 6.07 }) })
  })
  it('stores company metadata without discounting the gross annual amount', async () => {
    mock.testMode.mockReturnValue(true); const response = await createPayment(req({ plan: 'BUSINESS', billingCycle: 'yearly', purchaseAs: 'company', companyName: 'Example GmbH', billingCountry: 'de', vatId: 'DE123456789', registrationNumber: 'REG1', kvkNumber: '12345678' }))
    expect(await response.json()).toMatchObject({ amount: 999.5, plan: 'Agency' }); expect(mock.db.billingProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ userId: 'u1', billingType: 'business', countryCode: 'DE', companyName: 'Example GmbH' }) })); expect(mock.mollie.payments.create.mock.calls[0][0].locale).toBe('de_DE')
  })
  it('maps a Dutch registration number to KVK when no KVK is given', async () => { await createPayment(req({ plan: 'PRO', billingCountry: 'nl', registrationNumber: '12345678' })); expect(mock.db.billingProfile.upsert.mock.calls[0][0].create.kvkNumber).toBe('12345678') })
  it('omits unknown locale hints and tolerates optional quote persistence failure', async () => { mock.db.checkoutQuote.create.mockRejectedValue(new Error('db down')); expect((await createPayment(req({ plan: 'PRO', billingCountry: 'ZZ' }))).status).toBe(200); expect(mock.mollie.payments.create.mock.calls[0][0]).not.toHaveProperty('locale') })
  it('does not expose a checkout URL if the payment return URL cannot be prepared', async () => {
    mock.mollie.payments.update.mockRejectedValue(new Error('provider unavailable'));
    const response = await createPayment(req({ plan: 'PRO' }));
    expect(response.status).toBe(500);
    expect(await response.json()).not.toHaveProperty('checkoutUrl');
  });
  it('reports missing checkout URL without exposing provider details', async () => { mock.mollie.payments.create.mockResolvedValue({ id: 'tr1', getCheckoutUrl: () => null }); const response = await createPayment(req({ plan: 'PRO' })); expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: 'Failed to create payment', details: 'Please try again or contact support' }) })
  it('limits verbose diagnostics to development', async () => { vi.stubEnv('NODE_ENV', 'development'); mock.mollie.payments.create.mockRejectedValue(new Error('unit provider detail')); expect(await (await createPayment(req({ plan: 'PRO' }))).json()).toMatchObject({ details: 'unit provider detail' }) })
  it('handles structured non-Error provider failures safely', async () => { mock.mollie.payments.create.mockRejectedValue({ status: 422, field: 'amount' }); expect((await createPayment(req({ plan: 'PRO' }))).status).toBe(500) })
  it.each([{}, { productId: '' }, { productId: 'unknown' }])('rejects invalid audit product %j', async body => { expect((await createAudit(req(body))).status).toBe(400); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('creates one-off audit checkout at the configured amount', async () => { const product = Object.values(AUDIT_PRICES)[0]; const response = await createAudit(req({ productId: product.productId })); expect(await response.json()).toMatchObject({ amount: product.price, productId: product.productId }); expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ sequenceType: 'oneoff', amount: { currency: 'EUR', value: product.price.toFixed(2) }, metadata: expect.objectContaining({ userId: 'u1', type: 'audit_payment', auditCredits: '1' }) })) })
  it.each([{}, { type: 'UNKNOWN' }, { type: 'EXTRA_SEAT', quantity: 0 }, { type: 'EXTRA_SEAT', quantity: 1.5 }])('rejects invalid addon checkout %j', async body => { expect((await createAddon(req(body))).status).toBe(400); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it.each([[undefined, 15, '1'], [3, 45, '3']] as const)('charges exact seat quantity %s', async (quantity, amount, encoded) => { expect(await (await createAddon(req({ type: 'EXTRA_SEAT', quantity }))).json()).toMatchObject({ amount, type: 'EXTRA_SEAT' }); expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: amount.toFixed(2) }, metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT', quantity: encoded } })) })
  it.each(['active', 'pending'])('blocks a new prepaid checkout for an existing %s seat bundle before any provider write', async status => {
    mock.db.addOn.findFirst.mockResolvedValue({ id: 'existing-seats', userId: 'u1', status, quantity: 2 })
    const response = await createAddon(req({ type: 'EXTRA_SEAT', quantity: 3, userId: 'other' }))
    expect(response.status).toBe(409)
    expect(await response.json()).toMatchObject({ code: 'EXISTING_SEAT_BUNDLE' })
    expect(mock.db.addOn.findFirst).toHaveBeenCalledWith({ where: { userId: 'u1', type: 'EXTRA_SEAT', status: { in: ['active', 'pending'] } } })
    expect(mock.customer).not.toHaveBeenCalled()
    expect(mock.mollie.payments.create).not.toHaveBeenCalled()
    expect(mock.mollie.payments.update).not.toHaveBeenCalled()
  })
  it('rejects multi-quantity non-seat checkout before taking a payment that cannot be fulfilled', async () => {
    expect((await createAddon(req({ type: 'PAGE_PACK_25K', quantity: 2 }))).status).toBe(400)
    expect(mock.customer).not.toHaveBeenCalled()
    expect(mock.mollie.payments.create).not.toHaveBeenCalled()
  })
  it.each([['audit', createAudit, { productId: Object.values(AUDIT_PRICES)[0].productId }], ['addon', createAddon, { type: 'EXTRA_SEAT' }]] as const)('withholds %s checkout on redirect failure and missing checkout link', async (_, handler, body) => { mock.mollie.payments.update.mockRejectedValue(new Error('unsupported')); const response = await handler(req(body)); expect(response.status).toBe(500); expect(await response.json()).not.toHaveProperty('checkoutUrl'); mock.mollie.payments.update.mockResolvedValue({}); mock.mollie.payments.create.mockResolvedValue({ id: 'tr1', getCheckoutUrl: () => null }); expect((await handler(req(body))).status).toBe(500) })
})

describe('subscription management routes', () => {
  it.each([cancel, change, reset])('denies unauthenticated subscription mutations', async handler => { mock.auth.mockRejectedValue(new Error('Authentication required')); expect((await handler(req({ plan: 'PRO' }))).status).toBe(401) })
  it('cancels only the authenticated customer', async () => { expect((await cancel(req({ userId: 'other' }))).status).toBe(200); expect(mock.cancel).toHaveBeenCalledWith('u1') })
  it.each([['No active subscription found', 400], ['provider unavailable', 500]])('maps cancellation failure %s', async (message, status) => { mock.cancel.mockRejectedValue(new Error(message as string)); expect((await cancel(req())).status).toBe(status) })
  it('validates new plans and rejects a no-op plan change', async () => { expect((await change(req({ plan: 'UNKNOWN' }))).status).toBe(400); mock.auth.mockResolvedValue({ id: 'u1', plan: 'PRO' }); expect((await change(req({ plan: 'PRO' }))).status).toBe(400); expect(mock.change).not.toHaveBeenCalled() })
  it('applies a direct plan change to the authenticated identity', async () => { expect(await (await change(req({ plan: 'PRO', userId: 'other' }))).json()).toEqual({ success: true, plan: 'PRO' }); expect(mock.change).toHaveBeenCalledWith({ userId: 'u1', newPlan: 'PRO' }) })
  it('provides checkout when the mandate is missing', async () => { mock.change.mockResolvedValue({ needCheckout: true }); expect(await (await change(req({ plan: 'PRO' }))).json()).toMatchObject({ needCheckout: true, paymentId: 'tr1' }); expect(mock.upgrade).toHaveBeenCalledWith({ userId: 'u1', email: 'user@example.test', plan: 'PRO' }) })
  it.each([new Error('customer missing'), 'customer missing'])('falls back to checkout after a direct-change failure', async error => { mock.change.mockRejectedValue(error); expect((await change(req({ plan: 'PRO' }))).status).toBe(200); expect(mock.upgrade).toHaveBeenCalledOnce() })
  it('returns a controlled error when both direct change and checkout fail', async () => { mock.change.mockRejectedValue(new Error('no mandate')); mock.upgrade.mockRejectedValue(new Error('provider down')); expect((await change(req({ plan: 'PRO' }))).status).toBe(500) })
  it('rejects unexpected direct-change outcomes', async () => { mock.change.mockResolvedValue({}); expect((await change(req({ plan: 'PRO' }))).status).toBe(500) })
  it('starts payment-method setup for the session user only', async () => { expect(await (await reset(req())).json()).toMatchObject({ paymentId: 'tr1', url: 'https://checkout.example.test/tr1' }); expect(mock.reset).toHaveBeenCalledWith('u1', 'user@example.test'); mock.reset.mockRejectedValue(new Error('provider down')); expect((await reset(req())).status).toBe(500) })
})

describe('billing and add-on views', () => {
  it('shows the authenticated account paid-through date and stopped renewal', async () => {
    mock.db.user.findUnique.mockResolvedValue({ subscriptionCurrentPeriodEnd: new Date('2026-10-06T12:00:00Z'), subscriptionCanceledAt: new Date('2026-09-06T12:00:00Z') });
    expect(await (await billing()).json()).toMatchObject({ user: { subscriptionCurrentPeriodEnd: '2026-10-06T12:00:00.000Z', subscriptionCanceledAt: '2026-09-06T12:00:00.000Z' } });
    expect(mock.db.user.findUnique).toHaveBeenCalledWith({ where: { id: 'u1' }, select: { subscriptionCurrentPeriodEnd: true, subscriptionCanceledAt: true } });
  });
  it('uses scoped real usage counts and includes the team owner', async () => { expect(await (await billing()).json()).toMatchObject({ actualUsage: { sites: 2, scansThisMonth: 8, teamMembers: 4 } }); expect(mock.db.site.count).toHaveBeenCalledWith({ where: { userId: 'u1' } }); expect(mock.db.teamMember.count).toHaveBeenCalledWith({ where: { team: { ownerId: 'u1' } } }) })
  it.each([billing, () => listAddons(req())])('protects billing read APIs and handles internal failures', async handler => { mock.auth.mockRejectedValueOnce(new Error('Authentication required')).mockRejectedValueOnce(new Error('db failed')); expect((await handler()).status).toBe(401); expect((await handler()).status).toBe(500) })
  it('lists only the authenticated user’s addons', async () => { expect((await listAddons(req())).status).toBe(200); expect(mock.listAddons).toHaveBeenCalledWith('u1') })
  it.each([undefined, 'UNKNOWN', 'SCAN_PACK_100'])('rejects unavailable addon purchases %s', async type => { expect((await purchase(req({ type }))).status).toBe(400); expect(mock.purchase).not.toHaveBeenCalled() })
  it('purchases a supported addon with normalized provider result shape', async () => { expect(await (await purchase(req({ type: 'EXTRA_SEAT', quantity: 2 }))).json()).toMatchObject({ success: true, addOn: { id: 'a1' } }); expect(mock.purchase).toHaveBeenCalledWith({ userId: 'u1', type: 'EXTRA_SEAT', quantity: 2 }); mock.purchase.mockResolvedValue({ id: 'a2' }); expect(await (await purchase(req({ type: 'EXTRA_SEAT' }))).json()).toMatchObject({ addOn: { id: 'a2' } }) })
  it.each([{ message: 'trial', code: 'TRIAL_USER', action: 'upgrade' }, new Error('provider offline'), 'offline'])('returns add-on purchase error details without success', async error => { mock.purchase.mockRejectedValue(error); const response = await purchase(req({ type: 'EXTRA_SEAT' })); expect(response.status).toBe(typeof error === 'object' && 'code' in error ? 403 : 500); expect(await response.json()).toHaveProperty('error') })
  it.each([null, { id: 'a1', userId: 'other' }])('does not disclose or mutate unowned addons %j', async record => { mock.db.addOn.findUnique.mockResolvedValue(record); expect((await patchAddon(req({ quantity: 2 }), addonParams)).status).toBe(404); expect((await deleteAddon(req(), addonParams)).status).toBe(404); expect(mock.updateAddon).not.toHaveBeenCalled(); expect(mock.cancelAddon).not.toHaveBeenCalled() })
  it.each([undefined, 0, -1])('rejects invalid seat-update quantity %s', async quantity => { expect((await patchAddon(req({ quantity }), addonParams)).status).toBe(400); expect(mock.updateAddon).not.toHaveBeenCalled() })
  it('updates and cancels only after ownership checks', async () => { expect((await patchAddon(req({ quantity: 2 }), addonParams)).status).toBe(200); expect(mock.updateAddon).toHaveBeenCalledWith({ addOnId: 'a1', newQuantity: 2 }); expect((await deleteAddon(req(), addonParams)).status).toBe(200); expect(mock.cancelAddon).toHaveBeenCalledWith('a1') })
  it.each([new Error('provider offline'), 'offline'])('maps update failures into controlled responses', async error => { mock.updateAddon.mockRejectedValue(error); expect((await patchAddon(req({ quantity: 2 }), addonParams)).status).toBe(500) })
  it('returns a conflict when website capacity is in use', async () => { mock.cancelAddon.mockRejectedValue(Object.assign(new Error('capacity used'), { code: 'CAPACITY_IN_USE' })); expect((await deleteAddon(req(), addonParams)).status).toBe(409); mock.cancelAddon.mockRejectedValue('provider failed'); expect((await deleteAddon(req(), addonParams)).status).toBe(500) })
})

describe('payment method listing', () => {
  it('maps provider images with fallbacks and passes tier amount inside currency object', async () => {
    mock.mollie.methods.list.mockResolvedValue([{ id: 'ideal', description: 'iDEAL', image: { size2x: '2x', size1x: '1x', svg: 'svg' } }, { id: 'card', description: 'Card', image: { size1x: '1x' } }, { id: 'bank', description: 'Bank' }])
    const response = await methods(new NextRequest('https://app.example.test/api/billing/methods?tier=PRO&billingCycle=yearly')); expect(await response.json()).toMatchObject({ count: 3, methods: [{ imageUrl: '2x', imageSvg: 'svg' }, { imageUrl: '1x', imageSvg: '' }, { imageUrl: '', imageSvg: '' }] }); expect(mock.mollie.methods.list).toHaveBeenCalledWith({ sequenceType: 'first', amount: { value: '349.50', currency: 'EUR' } })
  })
  it.each(['', '?tier=UNKNOWN', '?tier=PRO'])('handles empty results and optional amount %s', async query => { mock.mollie.methods.list.mockResolvedValue(null); expect(await (await methods(new NextRequest(`https://app.example.test/api/billing/methods${query}`))).json()).toEqual({ methods: [], count: 0 }) })
  it.each(['', 'test_fake_key', 'live_fake_key', 'invalid'])('returns safe fallback methods on provider error for mode %s', async key => { vi.stubEnv('MOLLIE_API_KEY', key); mock.mollie.methods.list.mockRejectedValue(new Error('unavailable')); expect(await (await methods(new NextRequest('https://app.example.test/api/billing/methods'))).json()).toMatchObject({ fallback: true, count: 4 }) })
})
