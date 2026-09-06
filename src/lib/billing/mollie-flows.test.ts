import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({
  db: {
    user: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() }, billingProfile: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    checkoutQuote: { create: vi.fn(), findFirst: vi.fn() }, assuranceSubscription: { findMany: vi.fn() }, assuranceDomain: { updateMany: vi.fn() }, addOn: { findFirst: vi.fn() },
  },
  mollie: { customers: { get: vi.fn(), create: vi.fn() }, payments: { create: vi.fn(), update: vi.fn(), get: vi.fn() }, customerMandates: { page: vi.fn() }, customerSubscriptions: { create: vi.fn(), cancel: vi.fn(), get: vi.fn() } },
  invoice: vi.fn(), directInvoice: vi.fn(), purchase: vi.fn(), testMode: vi.fn(),
}))
vi.mock('../prisma', () => ({ prisma: mock.db }))
vi.mock('@mollie/api-client', () => ({ SequenceType: { first: 'first', recurring: 'recurring', oneoff: 'oneoff' } }))
vi.mock('../mollie', () => ({ mollie: mock.mollie, appUrl: (path: string) => `https://app.example.test${path}`, isMollieTestMode: mock.testMode }))
vi.mock('./invoice-service', () => ({ sendInvoiceForPayment: mock.invoice, generateAndSendInvoice: mock.directInvoice }))
vi.mock('./addon-flows', () => ({ purchaseAddOn: mock.purchase }))
import { createOrGetMollieCustomer, createUpgradePayment, createSubscription, cancelSubscription, changePlan, processWebhookPayment, processSubscriptionWebhook, createPaymentMethodResetPayment } from './mollie-flows'
const user = (overrides = {}) => ({ id: 'u1', email: 'user@example.test', mollieCustomerId: 'c1', mollieSubscriptionId: null, plan: 'FREE', subscriptionStatus: 'inactive', ...overrides })
const payment = (overrides = {}) => ({ id: 'tr1', status: 'paid', customerId: 'c1', metadata: { userId: 'u1', planKey: 'PRO' }, getCheckoutUrl: () => 'https://checkout.example.test/tr1', ...overrides })
beforeEach(() => {
  vi.resetAllMocks(); vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {})
  mock.db.user.findUnique.mockResolvedValue(user()); mock.db.user.create.mockResolvedValue(user({ mollieCustomerId: null })); mock.db.user.update.mockResolvedValue(user()); mock.db.billingProfile.findUnique.mockResolvedValue(null)
  mock.mollie.customers.get.mockResolvedValue({ id: 'c1', name: 'Test Customer', email: 'user@example.test' }); mock.mollie.customers.create.mockResolvedValue({ id: 'c2' }); mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'valid' }]); mock.mollie.customerSubscriptions.create.mockResolvedValue({ id: 'sub1' })
  mock.mollie.payments.create.mockResolvedValue(payment()); mock.mollie.payments.get.mockResolvedValue(payment()); mock.db.assuranceSubscription.findMany.mockResolvedValue([]); mock.db.assuranceDomain.updateMany.mockResolvedValue({ count: 1 }); mock.invoice.mockResolvedValue({ success: true }); mock.db.checkoutQuote.findFirst.mockResolvedValue(null)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.useRealTimers() })

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
  it('omits unsupported locale hints and tolerates redirect/quote persistence failures', async () => {
    mock.db.billingProfile.findUnique.mockResolvedValue({ countryCode: 'ZZ' }); mock.mollie.payments.update.mockRejectedValue(new Error('immutable')); mock.db.checkoutQuote.create.mockRejectedValue(new Error('db unavailable'))
    expect(await createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).toMatchObject({ id: 'tr1' }); expect(mock.mollie.payments.create.mock.calls[0][0]).not.toHaveProperty('locale')
  })
  it('rejects enterprise self-service before any provider calls', async () => { await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'ENTERPRISE' })).rejects.toThrow('no self-serve'); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('propagates structured payment provider errors', async () => { const error = { field: 'amount', statusCode: 422, title: 'invalid' }; mock.mollie.payments.create.mockRejectedValue(error); await expect(createUpgradePayment({ userId: 'u1', email: 'user@example.test', plan: 'PRO' })).rejects.toEqual(error) })
  it('requires a valid mandate before setting a paid plan', async () => { mock.mollie.customerMandates.page.mockResolvedValue([{ status: 'invalid' }]); await expect(createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO' })).rejects.toThrow('No valid mandate'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('creates annual billing and grants entitlements only after provider success', async () => {
    mock.db.billingProfile.findUnique.mockResolvedValue({ billingType: 'business', countryCode: 'DE', companyName: 'Acme', vatId: 'DE123', kvkNumber: '12345678' }); await createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO', billingCycle: 'yearly' })
    expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledWith(expect.objectContaining({ interval: '12 months', amount: { currency: 'EUR', value: '349.50' } })); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { plan: 'PRO', billingInterval: 'yearly', subscriptionStatus: 'active', mollieSubscriptionId: 'sub1', trialEndsAt: null } })
  })
  it('cancels an existing subscription during replacement', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'old' })); await createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO' }); expect(mock.mollie.customerSubscriptions.cancel).toHaveBeenCalledWith('old', { customerId: 'c1' }) })
  it('does not grant a paid plan when creating provider subscription fails', async () => { mock.mollie.customerSubscriptions.create.mockRejectedValue(new Error('provider down')); await expect(createSubscription({ userId: 'u1', customerId: 'c1', plan: 'PRO' })).rejects.toThrow('provider down'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, user({ mollieCustomerId: null }), user({ mollieSubscriptionId: null })])('rejects cancellation without subscription identity', async record => { mock.db.user.findUnique.mockResolvedValue(record); await expect(cancelSubscription('u1')).rejects.toThrow(); expect(mock.mollie.customerSubscriptions.cancel).not.toHaveBeenCalled() })
  it('downgrades only after provider cancellation succeeds', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' })); await cancelSubscription('u1'); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { plan: 'FREE', subscriptionStatus: 'canceled', mollieSubscriptionId: null, trialEndsAt: null } }) })
  it('preserves subscription state if provider cancellation fails', async () => { mock.db.user.findUnique.mockResolvedValue(user({ mollieSubscriptionId: 'sub1' })); mock.mollie.customerSubscriptions.cancel.mockRejectedValue(new Error('offline')); await expect(cancelSubscription('u1')).rejects.toThrow('offline'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, user({ mollieCustomerId: null })])('rejects plan changes without billing customer identity', async record => { mock.db.user.findUnique.mockResolvedValue(record); await expect(changePlan({ userId: 'u1', newPlan: 'PRO' })).rejects.toThrow(); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it('requests checkout when a plan-change mandate is missing', async () => { mock.mollie.customerMandates.page.mockResolvedValue([]); expect(await changePlan({ userId: 'u1', newPlan: 'PRO' })).toEqual({ needCheckout: true }) })
  it('changes plan directly for a customer with an active mandate', async () => { expect(await changePlan({ userId: 'u1', newPlan: 'PRO' })).toEqual({ success: true }); expect(mock.mollie.customerSubscriptions.create).toHaveBeenCalledOnce() })
})

describe('payment webhook evidence and outcomes', () => {
  it.each(['addon_subscription', 'payment_method_reset'])('does not apply plan changes to %s notifications', async type => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each([null, {}, { userId: 'u1' }])('ignores incomplete plan metadata %j', async metadata => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it.each(['open', 'pending', 'authorized'])('keeps %s payments pending without entitlements', async status => { mock.mollie.payments.get.mockResolvedValue(payment({ status })); expect(await processWebhookPayment('tr1')).toBe('pending'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it.each(['failed', 'canceled', 'expired'])('records terminal %s failures from fetched provider data', async status => {
    mock.mollie.payments.get.mockResolvedValue(payment({ status })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.mollie.payments.get).toHaveBeenCalledWith('tr1')
    const data = mock.db.user.update.mock.calls[0][0].data; expect(data.lastFailedPaymentReason).toBe(`mollie:${status}`); if (status === 'failed') expect(data.subscriptionStatus).toBe('past_due'); else expect(data).not.toHaveProperty('subscriptionStatus')
  })
  it('acknowledges failed-payment recording errors without granting access', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ status: 'failed' })); mock.db.user.update.mockRejectedValue(new Error('not found')); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.mollie.customerSubscriptions.create).not.toHaveBeenCalled() })
  it.each([['3', 3], ['not-a-number', 1], ['0', 1], [undefined, 1]])('credits only positive validated audit amounts %s', async (auditCredits, expected) => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment', userId: 'u1', auditCredits } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).toHaveBeenCalledWith({ where: { id: 'u1' }, data: { auditCredits: { increment: expected } } }); expect(mock.invoice).toHaveBeenCalledWith('tr1') })
  it.each(['open', 'failed'])('does not grant audit credits for %s payments', async status => { mock.mollie.payments.get.mockResolvedValue(payment({ status, metadata: { type: 'audit_payment', userId: 'u1' } })); expect(await processWebhookPayment('tr1')).toBe(status === 'open' ? 'pending' : 'processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('ignores audit payments lacking a user', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment' } })); expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.db.user.update).not.toHaveBeenCalled() })
  it('does not fail a paid audit after an invoice exception', async () => { mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'audit_payment', userId: 'u1' } })); mock.invoice.mockRejectedValue(new Error('mail down')); expect(await processWebhookPayment('tr1')).toBe('processed') })
  it('schedules a paid add-on after the prepaid first month', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-06T12:00:00Z')); mock.mollie.payments.get.mockResolvedValue(payment({ metadata: { type: 'addon_checkout', userId: 'u1', addOnType: 'EXTRA_SEAT', quantity: '2' } }))
    expect(await processWebhookPayment('tr1')).toBe('processed'); expect(mock.purchase).toHaveBeenCalledWith({ userId: 'u1', type: 'EXTRA_SEAT', quantity: 2, firstBillingDate: '2026-10-06' })
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
  it('requires the add-on ID to belong to the declared user and type', async () => { mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue(null); await processSubscriptionWebhook('sub1'); expect(mock.db.addOn.findFirst).toHaveBeenCalledWith({ where: { id: 'a1', userId: 'u1', type: 'EXTRA_SEAT' } }); expect(mock.directInvoice).not.toHaveBeenCalled() })
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
    await processSubscriptionWebhook('sub1'); expect(mock.directInvoice).not.toHaveBeenCalled()
    mock.db.checkoutQuote.create.mockResolvedValue({ id: 'q-retry' }); await processSubscriptionWebhook('sub1'); expect(mock.directInvoice).toHaveBeenCalledWith('q-retry', { force: false })
  })
  it('contains provider lookup and retry invoice errors', async () => { mock.mollie.customerSubscriptions.get.mockRejectedValueOnce(new Error('offline')); await expect(processSubscriptionWebhook('sub1')).resolves.toBeUndefined(); mock.mollie.customerSubscriptions.get.mockResolvedValue(subscription()); mock.db.addOn.findFirst.mockResolvedValue({ id: 'a1' }); mock.db.checkoutQuote.findFirst.mockResolvedValue({ id: 'q1' }); mock.directInvoice.mockRejectedValue(new Error('mail failed')); await expect(processSubscriptionWebhook('sub1')).resolves.toBeUndefined() })
  it('requires a known user for payment-method reset', async () => { mock.db.user.findUnique.mockResolvedValue(null); await expect(createPaymentMethodResetPayment('missing', 'nobody@example.test')).rejects.toThrow('User not found'); expect(mock.mollie.payments.create).not.toHaveBeenCalled() })
  it('creates exactly a one-cent first payment tagged as method setup', async () => { mock.testMode.mockReturnValue(true); await createPaymentMethodResetPayment('u1', 'user@example.test'); expect(mock.mollie.payments.create).toHaveBeenCalledWith(expect.objectContaining({ amount: { currency: 'EUR', value: '0.01' }, sequenceType: 'first', metadata: { userId: 'u1', type: 'payment_method_reset' } })) })
})
