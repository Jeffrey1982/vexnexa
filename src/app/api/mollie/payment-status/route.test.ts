import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { AUDIT_PRICES } from '@/lib/pricing'
const mock = vi.hoisted(() => ({ auth: vi.fn(), payment: vi.fn(), user: vi.fn(), webhook: vi.fn() }))
vi.mock('@/lib/auth', () => ({ requireAuth: mock.auth }))
vi.mock('@/lib/mollie', () => ({ mollie: { payments: { get: mock.payment } } }))
vi.mock('@/lib/prisma', () => ({ prisma: { user: { findUnique: mock.user }, processedWebhook: { findUnique: mock.webhook } } }))
import { GET } from './route'
const req = (id = 'tr_test') => new NextRequest(`https://app.test/api/mollie/payment-status?id=${encodeURIComponent(id)}`)
const account = (overrides = {}) => ({ plan: 'BUSINESS', subscriptionStatus: 'active', mollieSubscriptionId: 'sub_test', subscriptionCurrentPeriodEnd: new Date(Date.now() + 86_400_000), ...overrides })
beforeEach(() => {
  vi.clearAllMocks()
  mock.auth.mockResolvedValue({ id: 'u1' })
  mock.payment.mockResolvedValue({ id: 'tr_test', status: 'paid', metadata: { userId: 'u1', planKey: 'BUSINESS', billingInterval: 'yearly' } })
  mock.user.mockResolvedValue(account())
  mock.webhook.mockResolvedValue({ status: 'processed' })
})
describe('exact-payment fulfillment status', () => {
  it('confirms the purchased active plan only after this payment was processed', async () => {
    expect(await (await GET(req())).json()).toMatchObject({ status: 'paid', plan: 'BUSINESS', fulfillmentStatus: 'fulfilled' })
    expect(mock.webhook).toHaveBeenCalledWith({ where: { webhookId_webhookType: { webhookId: 'tr_test', webhookType: 'payment' } }, select: { status: true } })
  })
  it.each([null, { status: 'received' }, { status: 'failed' }])('keeps payment pending without processed evidence %j', async record => {
    mock.webhook.mockResolvedValue(record)
    expect(await (await GET(req())).json()).toMatchObject({ status: 'paid', fulfillmentStatus: 'pending' })
  })
  it.each([null, account({ plan: 'PRO' }), account({ plan: 'FREE' }), account({ subscriptionStatus: 'past_due' }), account({ subscriptionStatus: 'canceled' }), account({ mollieSubscriptionId: null }), account({ subscriptionCurrentPeriodEnd: new Date(0) })])('does not claim activation for incompatible account %j', async record => {
    mock.user.mockResolvedValue(record)
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'pending' })
  })
  it('permits known active legacy subscriptions without a stored period end', async () => {
    mock.user.mockResolvedValue(account({ subscriptionCurrentPeriodEnd: null }))
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'fulfilled' })
  })
  it.each(['open', 'pending', 'failed', 'canceled'])('never fulfills provider status %s', async status => {
    mock.payment.mockResolvedValue({ id: 'tr_test', status, metadata: { userId: 'u1', planKey: 'BUSINESS' } })
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'pending' })
  })
  it.each(['audit_payment', 'addon_checkout'])('waits for the exact %s fulfillment marker', async type => {
    mock.payment.mockResolvedValue({ id: 'tr_test', status: 'paid', metadata: { userId: 'u1', type, auditCredits: '1', productId: Object.values(AUDIT_PRICES)[0].productId, addOnType: 'EXTRA_SEAT', quantity: '2' } })
    mock.user.mockResolvedValue(account({ plan: 'FREE', mollieSubscriptionId: null }))
    mock.webhook.mockResolvedValueOnce(null).mockResolvedValueOnce({ status: 'processed' }).mockResolvedValueOnce({ status: 'processed', metadata: { userId: 'u1', credits: 1, type: 'EXTRA_SEAT', quantity: 2, addOnId: 'a1', subscriptionId: 'sub1' } })
    expect(await (await GET(req())).json()).toMatchObject({ isOneOffCheckout: true, fulfillmentStatus: 'pending' })
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'fulfilled' })
    expect(mock.webhook).toHaveBeenLastCalledWith({ where: { webhookId_webhookType: { webhookId: 'tr_test', webhookType: type === 'audit_payment' ? 'audit_credit_fulfillment' : 'addon_payment_fulfillment' } }, select: { status: true, metadata: true } })
  })
  it.each(['audit_payment', 'addon_checkout'])('does not fulfill malformed %s metadata despite a processed payment webhook', async type => {
    mock.payment.mockResolvedValue({ id: 'tr_test', status: 'paid', metadata: { userId: 'u1', type } })
    mock.webhook.mockResolvedValue({ status: 'processed', metadata: { userId: 'u1' } })
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'pending' })
  })
  it.each([null, { status: 'pending' }, { status: 'processed', metadata: { userId: 'other', credits: 1 } }, { status: 'processed', metadata: { userId: 'u1', credits: 2 } }])('rejects absent, unfinished or mismatched audit proof %j', async marker => {
    mock.payment.mockResolvedValue({ id: 'tr_test', status: 'paid', metadata: { userId: 'u1', type: 'audit_payment', auditCredits: '1', productId: Object.values(AUDIT_PRICES)[0].productId } })
    mock.webhook.mockResolvedValueOnce({ status: 'processed' }).mockResolvedValueOnce(marker)
    expect(await (await GET(req())).json()).toMatchObject({ fulfillmentStatus: 'pending' })
  })
  it.each([{}, { userId: 'another' }])('rejects absent or foreign payment ownership %j', async metadata => {
    mock.payment.mockResolvedValue({ id: 'tr_test', status: 'paid', metadata })
    expect((await GET(req())).status).toBe(403)
    expect(mock.user).not.toHaveBeenCalled()
  })
  it.each(['', 'tr_../secret', 'other_test'])('rejects malformed payment id %s', async id => {
    expect((await GET(req(id))).status).toBe(400)
    expect(mock.payment).not.toHaveBeenCalled()
  })
  it('requires authentication before looking up a payment', async () => {
    mock.auth.mockRejectedValue(new Error('Authentication required'))
    expect((await GET(req())).status).toBe(401)
    expect(mock.payment).not.toHaveBeenCalled()
  })
})
