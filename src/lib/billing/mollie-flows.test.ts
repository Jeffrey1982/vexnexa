import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), updateMany: vi.fn() }, billingProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(), processedWebhook: { create: vi.fn(), findUnique: vi.fn(), findFirst: vi.fn(), upsert: vi.fn() },
    checkoutQuote: { create: vi.fn(), findFirst: vi.fn() }, assuranceSubscription: { findMany: vi.fn() }, assuranceDomain: { updateMany: vi.fn() }, addOn: { findFirst: vi.fn(), findUnique: vi.fn() },
  },
  mollie: { customers: { get: vi.fn(), create: vi.fn() }, payments: { create: vi.fn(), update: vi.fn(), get: vi.fn() }, customerPayments: { iterate: vi.fn() }, customerMandates: { page: vi.fn() }, customerSubscriptions: { create: vi.fn(), cancel: vi.fn(), get: vi.fn(), update: vi.fn(), iterate: vi.fn() } },
  invoice: vi.fn(), directInvoice: vi.fn(), purchase: vi.fn(), testMode: vi.fn(),
}))
vi.mock('../prisma', () => ({ prisma: mock.db }))
vi.mock('@mollie/api-client', () => ({ SequenceType: { first: 'first', recurring: 'recurring', oneoff: 'oneoff' } }))
vi.mock('../mollie', () => ({ mollie: mock.mollie, appUrl: (path: string) => `https://app.example.test${path}`, isMollieTestMode: mock.testMode }))
vi.mock('./invoice-service', () => ({ sendInvoiceForPayment: mock.invoice, generateAndSendInvoice: mock.directInvoice }))
vi.mock('./addon-flows', () => ({ purchaseAddOn: mock.purchase }))
vi.mock('./webhook-lease', () => ({ withBillingOperationLock: (_userId: string, work: () => unknown) => work() }))
import { createOrGetMollieCustomer, createUpgradePayment, createSubscription, cancelSubscription, changePlan, processWebhookPayment, processSubscriptionWebhook, createPaymentMethodResetPayment } from './mollie-flows'
const user = (overrides = {}) => ({ id: 'u1', email: 'user@example.test', mollieCustomerId: 'c1', mollieSubscriptionId: null, plan: 'FREE', subscriptionStatus: 'inactive', billingInterval: 'monthly', subscriptionCurrentPeriodEnd: null, subscriptionCanceledAt: null, ...overrides })
const payment = (overrides = {}): any => ({ id: 'tr1', status: 'paid', customerId: 'c1', sequenceType: 'first', createdAt: '2026-09-06T11:00:00Z', paidAt: '2026-09-06T12:00:00Z', amount: { currency: 'EUR', value: '34.95' }, metadata: { userId: 'u1', planKey: 'PRO', type: 'upgrade' }, getCheckoutUrl: () => 'https://checkout.example.test/tr1', ...overrides })
const coreSubscription = (overrides = {}) => ({ id: 'sub1', customerId: 'c1', status: 'active', amount: { currency: 'EUR', value: '34.95' }, interval: '1 month', createdAt: '2026-09-06T12:00:01Z', nextPaymentDate: '2026-10-06', metadata: { userId: 'u1', planKey: 'PRO', type: 'upgrade', billingInterval: 'monthly', sourcePaymentId: 'tr1' }, ...overrides })
beforeEach(() => {
  vi.resetAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-06T12:00:00Z'))
  mock.db.user.findUnique.mockResolvedValue(user()); mock.db.user.create.mockResolvedValue(user({ mollieCustomerId: null })); mock.db.user.update.mockResolvedValue(user()); mock.db.billingProfile.findUnique.mockResolvedValue(null)
  mock.mollie.customers.get.mockResolvedValue({ id: 'c1', name: 'Test Customer', email: 'user@example.test' }); mock.mollie.customers.create.mockResolvedValue({ id: 'c2' }); mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'valid' }]); mock.mollie.customerSubscriptions.create.mockResolvedValue({ id: 'sub1' })
  mock.mollie.payments.create.mockResolvedValue(payment()); mock.mollie.payments.get.mockResolvedValue(payment()); mock.db.assuranceSubscription.findMany.mockResolvedValue([]); mock.db.assuranceDomain.updateMany.mockResolvedValue({ count: 1 }); mock.invoice.mockResolvedValue({ success: true }); mock.db.checkoutQuote.findFirst.mockResolvedValue(null)
  mock.mollie.customerSubscriptions.iterate.mockReturnValue([]); mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription()); mock.mollie.customerSubscriptions.create.mockResolvedValue(coreSubscription()); mock.mollie.customerSubscriptions.cancel.mockResolvedValue(coreSubscription({ status: 'canceled', canceledAt: '2026-09-06T12:00:00Z' })); mock.mollie.customerSubscriptions.update.mockImplementation(async (_id, params) => coreSubscription(params)); mock.db.$transaction.mockImplementation(async work => work(mock.db)); mock.db.processedWebhook.create.mockResolvedValue({ id: 'marker1' }); mock.db.user.updateMany.mockResolvedValue({ count: 1 })
  mock.mollie.customerPayments.iterate.mockReturnValue([])
  mock.mollie.customerSubscriptions.create.mockImplementation(async params => coreSubscription(params))
  mock.db.user.findFirst.mockResolvedValue(user()); mock.db.addOn.findUnique.mockResolvedValue(null)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers() })

describe('durable first-payment provisioning', () => {
  const create = (sourcePayment = payment()) => createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', sourcePayment })
  const coreJournal = (metadata = {}) => ({ status: 'provider_pending', metadata: { userId: 'u1', customerId: 'c1', plan: 'PRO', billingCycle: 'monthly', amount: '34.95', currency: 'EUR', periodEnd: '2026-10-06T12:00:00Z', ...metadata } })
  it('persists provider_pending before sending any subscription create request', async () => {
    await create()
    expect(mock.db.processedWebhook.create).toHaveBeenCalledWith({ data: expect.objectContaining({ webhookId: 'tr1', webhookType: 'core_subscription_fulfillment', status: 'provider_pending', metadata: expect.objectContaining({ userId: 'u1', customerId: 'c1', amount: '34.95' }) }) })
    expect(mock.db.processedWebhook.create.mock.invocationCallOrder[0]).toBeLessThan(mock.mollie.customerSubscriptions.create.mock.invocationCallOrder[0])
    expect(mock.db.$transaction).toHaveBeenCalledOnce()
    expect(mock.db.processedWebhook.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ status: 'processed', metadata: expect.objectContaining({ subscriptionId: 'sub1' }) }) }))
  })
  it('does not send a provider request when the durable preparation cannot be persisted', async () => {
    mock.db.processedWebhook.create.mockRejectedValue(new Error('journal unavailable'))
    await expect(create()).rejects.toThrow('journal unavailable')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('blocks a different first payment while an earlier creation for the same user remains uncertain', async () => {
    mock.db.processedWebhook.findFirst.mockResolvedValue({ id: 'previous-pending' })
    await expect(create()).rejects.toThrow('previous core subscription creation is unresolved')
    expect(mock.db.processedWebhook.findFirst).toHaveBeenCalledWith({ where: { webhookType: 'core_subscription_fulfillment', webhookId: { not: 'tr1' }, status: { not: 'processed' }, metadata: { path: ['userId'], equals: 'u1' } }, select: { id: true } })
    expect(mock.mollie.customerSubscriptions.iterate).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('never blindly retries a lost provider response beyond the one-hour cache while the subscription is invisible', async () => {
    let persisted: ReturnType<typeof coreJournal> | null = null
    mock.db.processedWebhook.findUnique.mockImplementation(async () => persisted)
    mock.db.processedWebhook.create.mockImplementation(async () => { persisted = coreJournal(); return persisted })
    mock.mollie.customerSubscriptions.create.mockRejectedValue(new Error('response lost'))
    await expect(create()).rejects.toThrow('response lost')
    vi.setSystemTime(new Date('2026-09-07T12:00:00Z'))
    await expect(create()).rejects.toThrow('creation is uncertain')
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledOnce()
    expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('reconciles provider_pending with visible provider evidence and atomically finishes the journal', async () => {
    mock.db.processedWebhook.findUnique.mockResolvedValue(coreJournal())
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription()])
    await create()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
    expect(mock.db.processedWebhook.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: expect.objectContaining({ status: 'processed' }) }))
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: 'PRO', mollieSubscriptionId: 'sub1' }) }))
  })
  it('does not patch a different visible agreement while an earlier create is still uncertain', async () => {
    mock.db.processedWebhook.findUnique.mockResolvedValue(coreJournal())
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'PRO', type: 'upgrade', sourcePaymentId: 'old', sourcePaymentCreatedAt: '2026-08-01Z' } })])
    await expect(create()).rejects.toThrow('creation is uncertain')
    expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it.each([{ userId: 'other' }, { customerId: 'other' }, { plan: 'BUSINESS' }, { billingCycle: 'yearly' }, { amount: '19.00' }])('rejects an immutable journal mismatch %j before provider calls', async metadata => {
    mock.db.processedWebhook.findUnique.mockResolvedValue(coreJournal(metadata))
    await expect(create()).rejects.toThrow('journal does not match')
    expect(mock.mollie.customerSubscriptions.iterate).not.toHaveBeenCalled()
  })
  it.each([{ amount: { currency: 'EUR', value: '19.00' } }, { interval: '12 months' }])('does not grant a recovered subscription with different paid terms %j', async overrides => {
    mock.db.processedWebhook.findUnique.mockResolvedValue(coreJournal())
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription(overrides)])
    await expect(create()).rejects.toThrow('billing terms do not match')
    expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('never starts another subscription for an old checkout after a newer subscription was canceled', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'BUSINESS', subscriptionCanceledAt: new Date('2026-09-06T12:00:00Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ status: 'canceled', canceledAt: '2026-09-06T12:00:00Z', metadata: { userId: 'u1', planKey: 'BUSINESS', sourcePaymentId: 'newer', sourcePaymentCreatedAt: '2026-09-06T11:30:00Z' } })])
    await expect(create()).rejects.toThrow('Older first payment conflicts')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('does not let a matching old provider subscription overwrite a newer canceled agreement', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'newer-sub', plan: 'BUSINESS', subscriptionCanceledAt: new Date('2026-09-06T12:00:00Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([
      coreSubscription({ status: 'canceled', canceledAt: '2026-09-06T11:15:00Z' }),
      coreSubscription({ id: 'newer-sub', status: 'canceled', canceledAt: '2026-09-06T12:00:00Z', metadata: { userId: 'u1', planKey: 'BUSINESS', sourcePaymentId: 'newer', sourcePaymentCreatedAt: '2026-09-06T11:30:00Z' } }),
    ])
    await expect(create()).rejects.toThrow('Older first payment conflicts')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('still recovers a newer matching subscription over an older canceled local agreement', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'older-sub', plan: 'STARTER', subscriptionCanceledAt: new Date('2026-09-01Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([
      coreSubscription({ id: 'older-sub', status: 'canceled', canceledAt: '2026-09-01Z', metadata: { userId: 'u1', sourcePaymentId: 'older', sourcePaymentCreatedAt: '2026-08-01Z' } }),
      coreSubscription(),
    ])
    await create()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mollieSubscriptionId: 'sub1', plan: 'PRO', subscriptionCanceledAt: null }) }))
  })
  it('starts the next month, not another charge on the already paid day', async () => {
    await create()
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-10-06', idempotencyKey: 'vexnexa-plan-tr1', metadata: expect.objectContaining({ sourcePaymentId: 'tr1', sourcePaymentPeriodEnd: '2026-10-06T12:00:00.000Z' }) }))
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled()
  })
  it('clamps a January31 first payment to February28 for both schedule and paid access', async () => {
    vi.setSystemTime(new Date('2026-01-31T12:00:00Z'))
    await create(payment({ createdAt: '2026-01-31T11:00:00Z', paidAt: '2026-01-31T12:00:00Z' }))
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-02-28' }))
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subscriptionCurrentPeriodEnd: new Date('2026-02-28T12:00:00Z') }) }))
  })
  it('uses the actual paid price instead of repricing an older agreement from the current catalog', async () => {
    await create(payment({ amount: { currency: 'EUR', value: '29.00' } }))
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '29.00' } }))
  })
  it('reconciles provider success after a lost DB write, beyond Mollie’s one-hour idempotency cache', async () => {
    mock.db.user.update.mockRejectedValueOnce(new Error('lost write'))
    await expect(create()).rejects.toThrow('lost write')
    vi.setSystemTime(new Date('2026-09-07T12:00:00Z'))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription()])
    await create()
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledOnce()
    expect(mock.db.user.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ mollieSubscriptionId: 'sub1', subscriptionCurrentPeriodEnd: new Date('2026-10-06T12:00:00Z') }) }))
  })
  it('looks beyond the first provider page for a previously created subscription', async () => {
    mock.mollie.customerSubscriptions.iterate.mockImplementation(async function* () {
      yield coreSubscription({ id: 'addon', metadata: { userId: 'u1', type: 'addon_subscription' } })
      yield coreSubscription()
    })
    await create()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('does not create anything when provider reconciliation is unavailable', async () => {
    mock.mollie.customerSubscriptions.iterate.mockImplementation(async function* () { throw new Error('list unavailable') })
    await expect(create()).rejects.toThrow('list unavailable')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('recognizes an existing real upgrade subscription after its local identity was lost', async () => {
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'PRO', type: 'upgrade', sourcePaymentId: 'old', sourcePaymentCreatedAt: '2026-09-01Z' } })])
    await create()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
    expect(mock.mollie.customerSubscriptions.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ startDate: '2026-11-06' }))
  })
  it.each([
    { status: 'open' }, { sequenceType: 'recurring' }, { sequenceType: 'oneoff' }, { customerId: 'other' }, { subscriptionId: 'sub-old' },
    { metadata: { userId: 'other', planKey: 'PRO' } }, { metadata: { userId: 'u1', planKey: 'BUSINESS' } },
    { metadata: { userId: 'u1', planKey: 'PRO', billingInterval: 'yearly' } }, { paidAt: undefined },
  ])('rejects invalid first-payment evidence %j', async overrides => {
    await expect(create(payment(overrides))).rejects.toThrow()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
    expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it.each([null, user({ mollieCustomerId: 'other' })])('requires an owned local customer %j', async record => {
    mock.db.user.findUnique.mockResolvedValue(record)
    await expect(create()).rejects.toThrow('does not belong')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it.each([{ currency: 'USD', value: '34.95' }, { currency: 'EUR', value: '0.00' }, { currency: 'EUR', value: 'invalid' }])('does not create automatic collection with invalid amount %j', async amount => {
    await expect(create(payment({ amount }))).rejects.toThrow('invalid subscription amount')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('refuses a stale first payment whose prepaid period ended instead of starting a catch-up charge', async () => {
    vi.setSystemTime(new Date('2026-11-01Z'))
    await expect(create()).rejects.toThrow('already ended')
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('does not silently choose between duplicate provider subscriptions', async () => {
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription(), coreSubscription({ id: 'duplicate' })])
    await expect(create()).rejects.toThrow('Multiple subscriptions')
    expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('does not claim a source payment tagged to another owner', async () => {
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { sourcePaymentId: 'tr1', userId: 'other' } })])
    await expect(create()).rejects.toThrow('ownership mismatch')
  })
  it('never erases a later cancellation when the first payment is replayed', async () => {
    const canceledAt = new Date('2026-09-06T12:00:00Z')
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', subscriptionCanceledAt: canceledAt, subscriptionCurrentPeriodEnd: new Date('2026-12-01Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription()])
    await create()
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subscriptionCanceledAt: canceledAt, subscriptionCurrentPeriodEnd: new Date('2026-12-01Z') }) }))
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('keeps legacy schedule and prices untouched for an old first-payment notification', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'PRO' }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', plan: 'PRO' }, amount: { currency: 'EUR', value: '9.00' } })])
    await create()
    expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
    expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('does not overwrite a newer plan when an old checkout is delivered late', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'BUSINESS' }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'BUSINESS', sourcePaymentId: 'newer', sourcePaymentCreatedAt: '2026-09-06T11:30:00Z' } })])
    await expect(create()).rejects.toThrow('Older first payment conflicts')
    expect(mock.db.user.update).not.toHaveBeenCalled()
    expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled()
  })
  it('patches an explicitly paid upgrade and appends its paid month without losing existing time', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'STARTER', subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'STARTER', sourcePaymentId: 'old', sourcePaymentCreatedAt: '2026-09-01T12:00:00Z' } })])
    await create()
    expect(mock.mollie.customerSubscriptions.update).toHaveBeenCalledWith('sub1', expect.objectContaining({ amount: { currency: 'EUR', value: '34.95' }, startDate: '2026-11-01', metadata: expect.objectContaining({ sourcePaymentPeriodEnd: '2026-11-01T00:00:00.000Z' }) }))
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled()
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('recovers an upgrade PATCH after a crash without appending the paid term twice', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'STARTER', subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'PRO', sourcePaymentId: 'tr1', sourcePaymentPeriodEnd: '2026-11-01T00:00:00Z' } })])
    await create()
    expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled()
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ plan: 'PRO', subscriptionCurrentPeriodEnd: new Date('2026-11-01Z') }) }))
  })
  it('refuses a stale upgrade PATCH instead of charging its elapsed prepaid period again', async () => {
    vi.setSystemTime(new Date('2027-01-01Z'))
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', plan: 'STARTER', subscriptionCurrentPeriodEnd: new Date('2026-09-01Z') }))
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription({ metadata: { userId: 'u1', planKey: 'STARTER', sourcePaymentId: 'old', sourcePaymentCreatedAt: '2026-08-01Z' } })])
    await expect(create()).rejects.toThrow('already ended')
    expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('clears the old cancellation only for a newly paid new subscription, preserving its remaining paid time', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'old', plan: 'PRO', subscriptionCanceledAt: new Date('2026-09-01Z'), subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }))
    const old = coreSubscription({ id: 'old', status: 'canceled', canceledAt: '2026-09-01Z', metadata: { userId: 'u1', sourcePaymentId: 'old-payment', sourcePaymentCreatedAt: '2026-08-01Z' } })
    mock.mollie.customerSubscriptions.iterate.mockReturnValue([old])
    await create()
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-11-01' }))
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ mollieSubscriptionId: 'sub1', subscriptionCanceledAt: null, subscriptionCurrentPeriodEnd: new Date('2026-11-01Z') }) }))
  })
})

describe('renewal and cancellation safety', () => {
  beforeEach(() => {
    mock.db.user.findUnique.mockResolvedValue(user({ plan: 'PRO', subscriptionStatus: 'active', mollieSubscriptionId: 'sub1', subscriptionCurrentPeriodEnd: new Date('2026-09-06Z') }))
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId: 'sub1' }))
  })
  it('renews paid access without another provider create, patch, cancel, mandate lookup or catalog reprice', async () => {
    await processWebhookPayment('tr1')
    expect(mock.mollie.customerSubscriptions.get).toHaveBeenCalledWith('sub1', { customerId: 'c1' })
    expect(mock.db.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { subscriptionCurrentPeriodEnd: new Date('2026-10-06T11:00:00Z') }, where: expect.objectContaining({ mollieSubscriptionId: 'sub1', OR: [{ subscriptionCurrentPeriodEnd: null }, { subscriptionCurrentPeriodEnd: { lt: new Date('2026-10-06T11:00:00Z') } }] }) }))
    expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.update).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled(); expect(mock.mollie.customerMandates.page).not.toHaveBeenCalled()
  })
  it('does not extend from webhook arrival time on replay', async () => {
    await processWebhookPayment('tr1')
    vi.setSystemTime(new Date('2026-09-20Z'))
    await processWebhookPayment('tr1')
    const periods = mock.db.user.updateMany.mock.calls.filter(([args]) => args.data.subscriptionCurrentPeriodEnd).map(([args]) => args.data.subscriptionCurrentPeriodEnd.toISOString())
    expect(periods).toEqual(['2026-10-06T11:00:00.000Z', '2026-10-06T11:00:00.000Z'])
  })
  it('uses the provider annual interval for legacy recurring payment metadata without an interval', async () => {
    mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription({ interval: '12 months' }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { subscriptionCurrentPeriodEnd: new Date('2027-09-06T11:00:00Z') } }))
  })
  it('retains a recorded cancellation on later paid recurring notifications', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', subscriptionCanceledAt: new Date('2026-09-01Z') }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.updateMany.mock.calls.some(([args]) => args.data.subscriptionStatus || args.data.subscriptionCanceledAt === null)).toBe(false)
  })
  it('records a provider-side cancellation discovered while reconciling a paid renewal', async () => {
    mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription({ status: 'canceled', canceledAt: '2026-09-06T11:30:00Z' }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.updateMany).toHaveBeenCalledWith(expect.objectContaining({ data: { subscriptionCanceledAt: new Date('2026-09-06T11:30:00Z') } }))
  })
  it.each([{ customerId: 'other' }, { subscriptionId: undefined }])('rejects unknown renewal identity %j', async overrides => {
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId: 'sub1', ...overrides }))
    await expect(processWebhookPayment('tr1')).rejects.toThrow('known subscription owner')
    expect(mock.db.user.updateMany).not.toHaveBeenCalled()
  })
  it('does not change the replacement plan after a payment from an older subscription', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId: 'old' }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.updateMany).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('does not restore access from an old paid period after a later failure', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId: 'sub1', createdAt: '2026-06-01T00:00:00Z' }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.updateMany.mock.calls.some(([args]) => args.data.subscriptionStatus)).toBe(false)
  })
  it.each([
    ['old', new Date('2026-09-01Z'), '2026-09-06T11:00:00Z'],
    ['sub1', new Date('2026-10-01Z'), '2026-09-06T11:00:00Z'],
    ['sub1', new Date('2026-09-01Z'), '2026-06-01T00:00:00Z'],
  ])('does not block a paid account for stale failed subscription %s', async (subscriptionId, end, createdAt) => {
    mock.db.user.findUnique.mockResolvedValue(user({ plan: 'PRO', mollieSubscriptionId: 'sub1', subscriptionCurrentPeriodEnd: end }))
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId, status: 'failed', createdAt }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.update.mock.calls[0][0].data).not.toHaveProperty('subscriptionStatus')
  })
  it('marks a genuinely unpaid current renewal past due', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ sequenceType: 'recurring', subscriptionId: 'sub1', status: 'failed' }))
    await processWebhookPayment('tr1')
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subscriptionStatus: 'past_due' }) }))
  })
  it('does not re-cancel an already recorded cancellation', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1', subscriptionCanceledAt: new Date('2026-09-01Z') }))
    await cancelSubscription('u1')
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('preserves the stored exact paid timestamp at cancellation', async () => {
    await cancelSubscription('u1')
    expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { subscriptionCurrentPeriodEnd: new Date('2026-09-06Z'), subscriptionCanceledAt: new Date('2026-09-06T12:00:00Z') } })
  })
  it('recovers legacy cancellation from paid subscription history, ignoring open and foreign payments', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' }))
    mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription({ status: 'canceled', canceledAt: '2026-09-06T12:00:00Z', nextPaymentDate: undefined, interval: '1 month' }))
    mock.mollie.customerPayments.iterate.mockReturnValue([payment({ subscriptionId: 'sub1', createdAt: '2026-09-01Z' }), payment({ subscriptionId: 'other', createdAt: '2027-01-01Z' }), payment({ subscriptionId: 'sub1', status: 'open', createdAt: '2027-01-01Z' })])
    await cancelSubscription('u1')
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled()
    expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subscriptionCurrentPeriodEnd: new Date('2026-10-01Z') }) }))
  })
  it('refuses to cancel when no reliable paid period can be determined', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' }))
    mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription({ nextPaymentDate: undefined }))
    await expect(cancelSubscription('u1')).rejects.toThrow('Cannot safely determine')
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled(); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('bounds legacy history reconciliation before any provider cancellation', async () => {
    mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' }))
    mock.mollie.customerSubscriptions.get.mockResolvedValue(coreSubscription({ nextPaymentDate: undefined }))
    mock.mollie.customerPayments.iterate.mockReturnValue(Array.from({ length: 251 }, () => payment({ status: 'open' })))
    await expect(cancelSubscription('u1')).rejects.toThrow('history requires manual reconciliation')
    expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled()
  })
})

describe('atomic audit-credit fulfillment', () => {
  beforeEach(() => mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment', userId: 'u1', auditCredits: '2' } })))
  it('writes the durable marker and credits in the same transaction', async () => {
    await processWebhookPayment('tr1')
    expect(mock.db.$transaction).toHaveBeenCalledOnce()
    expect(mock.db.processedWebhook.create).toHaveBeenCalledWith({ data: expect.objectContaining({ webhookId: 'tr1', webhookType: 'audit_credit_fulfillment', status: 'processed', metadata: { userId: 'u1', credits: 2 } }) })
    expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { auditCredits: { increment: 2 } } })
  })
  it('never increments again when the transaction committed but the webhook acknowledgement was lost', async () => {
    mock.db.processedWebhook.create.mockRejectedValue({ code: 'P2002' })
    mock.db.processedWebhook.findUnique.mockResolvedValue({ status: 'processed', metadata: { userId: 'u1', credits: 2 } })
    await expect(processWebhookPayment('tr1')).resolves.toBe('processed')
    expect(mock.db.user.update).not.toHaveBeenCalled()
    expect(mock.invoice).toHaveBeenCalledWith('tr1')
  })
  it.each([null, { status: 'failed', metadata: { userId: 'u1', credits: 2 } }, { status: 'processed', metadata: { userId: 'other', credits: 2 } }, { status: 'processed', metadata: { userId: 'u1', credits: 3 } }])('does not hide a conflicting marker %j', async marker => {
    mock.db.processedWebhook.create.mockRejectedValue({ code: 'P2002' }); mock.db.processedWebhook.findUnique.mockResolvedValue(marker)
    await expect(processWebhookPayment('tr1')).rejects.toEqual({ code: 'P2002' }); expect(mock.db.user.update).not.toHaveBeenCalled()
  })
  it('propagates transaction failure for retry instead of acknowledging unfulfilled credits', async () => {
    mock.db.$transaction.mockRejectedValue(new Error('transaction rollback'))
    await expect(processWebhookPayment('tr1')).rejects.toThrow('transaction rollback')
    expect(mock.invoice).not.toHaveBeenCalled()
  })
})

describe('Mollie customer identity', () => {
  it('reuses an existing provider customer without creating another', async () => { expect(await createOrGetMollieCustomer('u1', 'user@example.test')).toMatchObject({ id: 'c1' }); expect(mock.mollie.customers.get).toHaveBeenCalledWith('c1'); expect(mock.mollie.customers.create).not.toHaveBeenCalled() })
  it('creates a replacement when the referenced customer no longer exists', async () => { mock.mollie.customers.get.mockRejectedValue(new Error('not found')); expect(await createOrGetMollieCustomer('u1', 'user@example.test')).toEqual({ id: 'c2' }); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { mollieCustomerId: 'c2' } }) })
  it('creates a free local user and provider customer for a first checkout', async () => {
    mock.db.user.findUnique.mockResolvedValue(null); await createOrGetMollieCustomer('u1', 'user@example.test')
    expect(mock.db.user.create).toHaveBeenCalledWith(expect.objectContaining({ data: { id: 'u1', email: 'user@example.test', plan: 'FREE', subscriptionStatus: 'inactive' } })); expect(mock.mollie.customers.create).toHaveBeenCalledWith({ email: 'user@example.test', name: 'user', metadata: { userId: 'u1' } })
  })
  it('reconciles an existing email with its authenticated user ID', async () => { mock.db.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(user({ id: 'old' })); await createOrGetMollieCustomer('u1', 'user@example.test'); expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ where: { email: 'user@example.test' }, data: { id: 'u1' } })) })
  it('recovers a concurrent user creation conflict by looking up the existing email', async () => { mock.db.user.findUnique.mockResolvedValueOnce(null).mockResolvedValueOnce(null).mockResolvedValueOnce(user()); mock.db.user.create.mockRejectedValue(new Error('unique constraint')); expect(await createOrGetMollieCustomer('u1', 'user@example.test')).toMatchObject({ id: 'c1' }) })
  it('fails safely when neither creation nor recovery can find a user', async () => { mock.db.user.findUnique.mockResolvedValue(null); mock.db.user.create.mockRejectedValue(new Error('offline')); await expect(createOrGetMollieCustomer('u1', 'user@example.test')).rejects.toThrow('Unable to create or find user'); expect(mock.mollie.customers.create).not.toHaveBeenCalled() })
})

describe('checkout and subscription amounts', () => {
  it('blocks a new checkout before any provider payment while an earlier activation is uncertain', async () => {
    mock.db.processedWebhook.findFirst.mockResolvedValue({ id: 'old-uncertain' })
    await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).rejects.toThrow('previous core subscription creation is unresolved')
    expect(mock.db.processedWebhook.findFirst).toHaveBeenCalledWith({ where: { webhookType: 'core_subscription_fulfillment', status: { not: 'processed' }, metadata: { path: ['userId'], equals: 'u1' } }, select: { id: true } })
    expect(mock.mollie.payments.create).not.toHaveBeenCalled(); expect(mock.mollie.customers.create).not.toHaveBeenCalled()
  })
  it('charges fixed monthly price and records a matching invoice snapshot', async () => {
    await createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })
    expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '34.95' }, customerId: 'c1', sequenceType: 'first', locale: 'nl_NL', metadata: expect.objectContaining({ userId: 'u1', planKey: 'PRO', billingInterval: 'monthly', chargedAmount: '34.95' }) }))
    expect(mock.mollie.payments.update).toHaveBeenCalledWith('tr1', { redirectUrl: 'https://app.example.test/checkout/return?paymentId=tr1' }); expect(mock.db.checkoutQuote.create).toHaveBeenCalledWith({ data: expect.objectContaining({ totalAmount: 34.95, baseAmount: 28.88, vatAmount: 6.07, molliePaymentId: 'tr1' }) })
  })
  it('preserves gross annual pricing with business metadata and automatic methods', async () => {
    mock.db.billingProfile.findUnique.mockResolvedValue({ billingType: 'business', countryCode: 'DE', vatValid: true, vatId: 'DE123456789', companyName: 'Example GmbH', kvkNumber: '12345678' }); mock.testMode.mockReturnValue(true)
    await createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'BUSINESS', billingCycle: 'yearly' })
    const args = mock.mollie.payments.create.mock.calls[0][0]; expect(args.amount.value).toBe('999.50'); expect(args.locale).toBe('de_DE'); expect(args.metadata).toMatchObject({ customerType: 'company', companyName: 'Example GmbH', vatNumber: 'DE123456789' }); expect(args).not.toHaveProperty('method')
  })
  it('omits unsupported locale hints and tolerates quote persistence failures', async () => {
    mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'ZZ' }); mock.db.checkoutQuote.create.mockRejectedValue(new Error('db unavailable'))
    expect(await createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).toMatchObject({ id: 'tr1' }); expect(mock.mollie.payments.create.mock.calls[0][0]).not.toHaveProperty('locale')
  })
  it('does not expose a checkout when redirect binding to its payment ID fails', async () => {
    mock.mollie.payments.update.mockRejectedValue(new Error('redirect unavailable'))
    await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).rejects.toThrow('redirect unavailable')
    expect(mock.db.checkoutQuote.create).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('rejects enterprise self-service before any provider calls', async () => { await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'ENTERPRISE' })).rejects.toThrow('no self-serve'); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('propagates structured payment provider errors', async () => { const error = { field: 'amount', statusCode: 422, title: 'invalid' }; mock.mollie.payments.create.mockRejectedValue(error); await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).rejects.toEqual(error) })
  it('requires a valid mandate before setting a paid plan', async () => { mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'invalid' }]); await expect(createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', sourcePayment: payment() })).rejects.toThrow('No valid mandate'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('creates annual billing and grants entitlements only after provider success', async () => {
    await createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', billingCycle: 'yearly', sourcePayment: payment({ amount: { currency: 'EUR', value: '349.50' } }) })
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ interval: '12 months', amount: { currency: 'EUR', value: '349.50' }, startDate: '2027-09-06', idempotencyKey: 'vexnexa-plan-tr1' })); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { plan: 'PRO', billingInterval: 'yearly', subscriptionStatus: 'active', mollieSubscriptionId: 'sub1', trialEndsAt: null, subscriptionCurrentPeriodEnd: new Date('2027-09-06T12:00:00Z'), subscriptionCanceledAt: null } })
  })
  it('preserves an existing subscription on a first-payment replay', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' })); mock.mollie.customerSubscriptions.iterate.mockReturnValue([coreSubscription()]); await createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', sourcePayment: payment() }); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it('does not grant a paid plan when creating provider subscription fails', async () => { mock.mollie.customerSubscriptions.create.mockRejectedValue(new Error('provider down')); await expect(createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', sourcePayment: payment() })).rejects.toThrow('provider down'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, user({ mollieCustomerId: null }), user({ mollieSubscriptionId: null })])('rejects cancellation without subscription identity', async record => { mock.db.user.findUnique.mockResolvedValue(record); await expect(cancelSubscription('u1')).rejects.toThrow(); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled() })
  it('preserves the plan and paid time after provider cancellation succeeds', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' })); await cancelSubscription('u1'); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { subscriptionCurrentPeriodEnd: new Date('2026-10-06Z'), subscriptionCanceledAt: new Date('2026-09-06T12:00:00Z') } }) })
  it('preserves subscription state if provider cancellation fails', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' })); mock.mollie.customerSubscriptions.cancel.mockRejectedValue(new Error('offline')); await expect(cancelSubscription('u1')).rejects.toThrow('offline'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, user({ mollieCustomerId: null })])('rejects plan changes without billing customer identity', async record => { mock.db.user.findUnique.mockResolvedValue(record); await expect(changePlan({ userId: 'u1', newPlan: 'PRO' })).rejects.toThrow(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it('requests checkout when a plan-change mandate is missing', async () => { mock.mollie.customerMandates.page.mockResolvedValue([]); expect(await changePlan({ userId: 'u1', newPlan: 'PRO' })).toEqual({ needCheckout: true }) })
  it('requires a paid checkout even if the customer already has a valid mandate', async () => { expect(await changePlan({ userId: 'u1', newPlan: 'PRO' })).toEqual({ needCheckout: true }); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
})

describe('payment webhook evidence and outcomes', () => {
  it.each(['addon_subscription', 'payment_method_reset'])('does not apply plan changes to %s notifications', async type => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, {}, { userId: 'u1' }])('ignores incomplete plan metadata %j', async metadata => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it.each(['open', 'pending', 'authorized'])('keeps %s payments pending without entitlements', async status => { mock.mollie.payments.get.mockResolvedValue(payment({ status })); expect(await processWebhookPayment('tr1')).toBe('pending'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each(['failed', 'canceled', 'expired'])('records terminal %s failures from fetched provider data', async status => {
    mock.mollie.payments.get.mockResolvedValue(payment({ status })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.mollie.payments.get).toHaveBeenCalledWith('tr1')
    const data = mock.db.user.update.mock.calls[0][0].data; expect(data.lastFailedPaymentReason).toBe(`mollie:${status}`); expect(data).not.toHaveProperty('subscriptionStatus')
  })
  it('retries failed-payment recording errors without granting access', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ status: 'failed' })); mock.db.user.update.mockRejectedValue(new Error('not found')); await expect(processWebhookPayment('tr1')).rejects.toThrow('not found'); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it.each([['3', 3], ['not-a-number', 1], ['0', 1], [undefined, 1]])('credits only positive validated audit amounts %s', async (auditCredits, expected) => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment', userId: 'u1', auditCredits } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { auditCredits: { increment: expected } } }); expect(mock.invoice).toHaveBeenCalledWith('tr1') })
  it.each(['open', 'failed'])('does not grant audit credits for %s payments', async status => { mock.mollie.payments.get.mockResolvedValue(payment({ status, metadata: { type: 'audit_payment', userId: 'u1' } })); expect(await processWebhookPayment('tr1')).toBe(status === 'open' ? 'pending' : 'processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('ignores audit payments lacking a user', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment' } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('does not fail a paid audit after an invoice exception', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment', userId: 'u1' } })); mock.invoice.mockRejectedValue(new Error('mail down')); expect(await processWebhookPayment('tr1')).toBe('processed') })
  it('schedules a paid add-on after the prepaid first month', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-06T12:00:00Z')); mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT', quantity: '2' } }))
    expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.purchase).toHaveBeenCalledWith({ userId: 'u1', type: 'EXTRA_SEAT', quantity: 2, firstBillingDate: '2026-10-06', sourcePaymentId: 'tr1', sourceCustomerId: 'c1', sourceAmount: { currency: 'EUR', value: '34.95' } })
  })
  it.each(['2seats', '0', '-1', '1.5', 'NaN', '9007199254740992'])('rejects malformed paid add-on quantity %s before provisioning', async quantity => {
    mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT', quantity } }))
    await expect(processWebhookPayment('tr1')).rejects.toThrow('invalid quantity'); expect(mock.purchase).not.toHaveBeenCalled()
  })
  it('rejects paid add-on checkout without provider customer identity', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ customerId: null, metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT' } }))
    await expect(processWebhookPayment('tr1')).rejects.toThrow('no customer identity'); expect(mock.purchase).not.toHaveBeenCalled()
  })
  it.each(['failed', 'canceled', 'pending'])('handles add-on %s payment without purchase', async status => { mock.mollie.payments.get.mockResolvedValue(payment({ status, metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT' } })); expect(await processWebhookPayment('tr1')).toBe(status === 'pending' ? 'pending' : 'processed'); expect(mock.purchase).not.toHaveBeenCalled() })
  it('ignores incomplete add-on checkout metadata', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'addon_checkout', userId: 'u1' } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.purchase).not.toHaveBeenCalled() })
  it('activates only this customer’s assurance domains after a paid plan payment', async () => {
    mock.db.assuranceSubscription.findMany.mockResolvedValue([{ id: 'as1' }, { id: 'as2' }]); expect(await processWebhookPayment('tr1')).toBe('processed')
    expect(mock.db.assuranceSubscription.findMany).toHaveBeenCalledWith({ where: { userId: 'u1', status: 'active' }, select: { id: true } }); expect(mock.db.assuranceDomain.updateMany).toHaveBeenCalledWith({ where: { subscriptionId: { in: ['as1', 'as2'] }, active: false }, data: { active: true } }); expect(mock.invoice).toHaveBeenCalledWith('tr1')
  })
  it('supports legacy metadata and backfills invoice address without overwriting supplied fields', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { userId: 'u1', plan: 'PRO', billingCycle: 'yearly', customerType: 'company', companyName: 'New Co', billingCountry: 'DE', vatNumber: 'DE123', vatValid: true }, billingAddress: { streetAndNumber: 'New Street 1', city: 'Berlin', postalCode: '10115', region: 'Berlin' } }))
    mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'NL', companyName: 'Kept Company', fullName: '', vatId: null, vatValid: false, addressLine1: 'Kept Street' })
    await processWebhookPayment('tr1'); const patch = mock.db.billingProfile.update.mock.calls[0][0].data
    expect(patch).toMatchObject({ fullName: 'Test Customer', countryCode: 'DE', vatId: 'DE123', vatValid: true, addressCity: 'Berlin' }); expect(patch).not.toHaveProperty('companyName'); expect(patch).not.toHaveProperty('addressLine1')
  })
  it('does not issue profile updates when metadata adds nothing', async () => {
    mock.mollie.payments.get.mockResolvedValue(payment({ customerId: null, metadata: { userId: 'u1', planKey: 'FREE' } })); mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'NL', fullName: 'Kept', vatValid: true }); await processWebhookPayment('tr1'); expect(mock.db.billingProfile.update).not.toHaveBeenCalled(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled()
  })
  it('does not roll back a paid subscription due to optional invoice/profile/domain errors', async () => {
    mock.db.billingProfile.create.mockRejectedValue(new Error('profile unavailable')); mock.db.assuranceSubscription.findMany.mockRejectedValue(new Error('domain unavailable')); mock.invoice.mockRejectedValue(new Error('mail down')); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ subscriptionStatus: 'active' }) }))
  })
  it('uses payment metadata when the provider customer lookup fails', async () => { mock.mollie.customers.get.mockRejectedValue(new Error('customer missing')); mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { userId: 'u1', planKey: 'PRO', fullName: 'Metadata Name', vatId: 'NL123' } })); await processWebhookPayment('tr1'); expect(mock.db.billingProfile.create).toHaveBeenCalledWith({ data: expect.objectContaining({ fullName: 'Metadata Name', vatId: 'NL123', countryCode: 'NL' }) }) })
})

describe('subscription events and payment-method setup', () => {
  const subscription = (overrides = {}) => ({ id: 'sub1', customerId: 'c1', status: 'active', amount: { value: '15.00' }, metadata: { userId: 'u1', addOnType: 'EXTRA_SEAT', addOnId: 'a1' }, ...overrides })
  it.each([{ status: 'canceled' }, { metadata: {} }])('ignores non-active or non-addon subscriptions', async overrides => { mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription(overrides)); await processSubscriptionWebhook('sub1'); expect(mock.db.addOn.findFirst).not.toHaveBeenCalled() })
  it('requires the add-on ID to belong to the declared user, type and provider subscription', async () => { mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue(null); await processSubscriptionWebhook('sub1'); expect(mock.db.addOn.findFirst).toHaveBeenCalledWith({ where: { id: 'a1', userId: 'u1', type: 'EXTRA_SEAT', mollieSubscriptionId: 'sub1' } }); expect(mock.directInvoice).not.toHaveBeenCalled() })
  it('does not fetch an unknown subscription with missing customer identity', async () => { mock.db.user.findFirst.mockResolvedValue(null); await processSubscriptionWebhook('unknown'); expect(mock.mollie.customerSubscriptions.get).not.toHaveBeenCalled() })
  it('resolves add-on ownership before one correctly scoped provider lookup', async () => {
    mock.db.user.findFirst.mockResolvedValue(null); mock.db.addOn.findUnique.mockResolvedValue({ user: { id: 'u1', mollieCustomerId: 'c1' } }); mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription())
    await processSubscriptionWebhook('sub1')
    expect(mock.mollie.customerSubscriptions.get).toHaveBeenCalledExactlyOnceWith('sub1', { customerId: 'c1' })
    expect(mock.mollie.customers.get).not.toHaveBeenCalled()
  })
  it.each([{ customerId: 'foreign' }, { metadata: { userId: 'other', addOnType: 'EXTRA_SEAT' } }])('rejects mismatched provider ownership %j', async overrides => {
    mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription(overrides)); await expect(processSubscriptionWebhook('sub1')).rejects.toThrow('ownership mismatch'); expect(mock.directInvoice).not.toHaveBeenCalled()
  })
  it('skips a previously sent subscription invoice', async () => { mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.findFirst.mockResolvedValue({ id: 'q1', invoiceSentAt: new Date() }); await processSubscriptionWebhook('sub1'); expect(mock.directInvoice).not.toHaveBeenCalled() })
  it('retries an existing unsent quote using its stable quote ID', async () => { mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.findFirst.mockResolvedValue({ id: 'q1', invoiceSentAt: null }); await processSubscriptionWebhook('sub1'); expect(mock.directInvoice).toHaveBeenCalledWith('q1', { force: false }); expect(mock.db.checkoutQuote.create).not.toHaveBeenCalled() })
  it('sends a newly created invoice using the quote ID, never the subscription ID', async () => {
    mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.create.mockResolvedValue({ id: 'q-new' })
    await processSubscriptionWebhook('sub1')
    expect(mock.db.checkoutQuote.create).toHaveBeenCalledWith({ data: expect.objectContaining({ userId: 'u1', totalAmount: 15, baseAmount: 12.4, vatAmount: 2.6, molliePaymentId: 'sub1' }) })
    expect(mock.directInvoice).toHaveBeenCalledWith('q-new', { force: false })
  })
  it('does not attempt delivery against an invalid ID when creating a quote fails', async () => {
    mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.create.mockRejectedValueOnce(new Error('database unavailable'))
    await expect(processSubscriptionWebhook('sub1')).rejects.toThrow('database unavailable'); expect(mock.directInvoice).not.toHaveBeenCalled()
    mock.db.checkoutQuote.create.mockResolvedValue({ id: 'q-retry' }); await processSubscriptionWebhook('sub1'); expect(mock.directInvoice).toHaveBeenCalledWith('q-retry', { force: false })
  })
  it('propagates provider and invoice errors so the webhook can request retry', async () => { mock.mollie.customerSubscriptions.get.mockRejectedValueOnce(new Error('offline')); await expect(processSubscriptionWebhook('sub1')).rejects.toThrow('offline'); mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.findFirst.mockResolvedValue({ id: 'q1' }); mock.directInvoice.mockRejectedValue(new Error('mail failed')); await expect(processSubscriptionWebhook('sub1')).rejects.toThrow('mail failed') })
  it('requires a known user for payment-method reset', async () => { mock.db.user.findUnique.mockResolvedValue(null); await expect(createPaymentMethodResetPayment('missing', 'nobody@example.test')).rejects.toThrow('User not found'); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('creates exactly a one-cent first payment tagged as method setup', async () => { mock.testMode.mockReturnValue(true); await createPaymentMethodResetPayment('u1', 'user@example.test'); expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '0.01' }, sequenceType: 'first', metadata: { userId: 'u1', type: 'payment_method_reset' } })) })
})
