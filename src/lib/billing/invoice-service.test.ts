import { beforeEach, afterEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({
  db: { checkoutQuote: { findFirst: vi.fn(), findUnique: vi.fn(), update: vi.fn() } },
  send: vi.fn(), pdf: vi.fn(), number: vi.fn(), build: vi.fn(),
}))
vi.mock('../prisma', () => ({ prisma: mock.db }))
vi.mock('resend', () => ({ Resend: class { emails = { send: mock.send } } }))
vi.mock('./invoice-pdf', () => ({ generateInvoicePdfBuffer: mock.pdf, generateInvoiceNumber: mock.number }))
vi.mock('./invoice-template', () => ({ buildInvoiceDataFromQuote: mock.build }))
const quote = (overrides = {}) => ({ id: 'q1', userId: 'u1', molliePaymentId: 'tr_test', invoiceNumber: null, invoiceSentAt: null, createdAt: new Date('2026-09-06T10:00:00Z'), product: 'subscription', plan: 'PRO', billingCycle: 'monthly', baseAmount: 28.88, vatAmount: 6.07, totalAmount: 34.95, currency: 'EUR', taxRatePercent: 21, taxMode: 'NL_VAT', customerType: 'individual', customerCountry: 'NL', user: { id: 'u1', email: 'recipient@example.test', firstName: 'Test', lastName: 'User', billingProfile: null }, ...overrides })
let service: typeof import('./invoice-service')
beforeEach(async () => {
  vi.resetAllMocks(); vi.resetModules(); vi.stubEnv('RESEND_API_KEY', 're_fake_unit_test_only')
  vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {})
  mock.db.checkoutQuote.findUnique.mockResolvedValue(quote()); mock.db.checkoutQuote.findFirst.mockResolvedValue(quote())
  mock.pdf.mockResolvedValue(Buffer.from('fake-pdf')); mock.number.mockReturnValue('VN-20260906-test'); mock.build.mockReturnValue({ product: 'subscription', plan: 'PRO', billingCycle: 'monthly', totalAmount: 34.95 }); mock.send.mockResolvedValue({ data: { id: 'email1' } })
  service = await import('./invoice-service')
})
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks() })
it('reports a missing payment quote without sending', async () => { mock.db.checkoutQuote.findFirst.mockResolvedValue(null); expect(await service.sendInvoiceForPayment('tr_missing')).toEqual({ success: false, invoiceNumber: null, error: 'No checkout quote found' }); expect(mock.send).not.toHaveBeenCalled() })
it('skips previously sent payment invoices on webhook retries', async () => { mock.db.checkoutQuote.findFirst.mockResolvedValue(quote({ invoiceSentAt: new Date(), invoiceNumber: 'VN-existing' })); expect(await service.sendInvoiceForPayment('tr_test')).toEqual({ success: true, invoiceNumber: 'VN-existing', skipped: true }); expect(mock.pdf).not.toHaveBeenCalled(); expect(mock.send).not.toHaveBeenCalled() })
it('checks idempotency again after fetching complete quote data', async () => { mock.db.checkoutQuote.findUnique.mockResolvedValue(quote({ invoiceSentAt: new Date(), invoiceNumber: 'VN-existing' })); expect(await service.sendInvoiceForPayment('tr_test')).toMatchObject({ success: true, skipped: true }); expect(mock.send).not.toHaveBeenCalled() })
it('reports missing direct quotes', async () => { mock.db.checkoutQuote.findUnique.mockResolvedValue(null); expect(await service.generateAndSendInvoice('missing')).toMatchObject({ success: false, error: 'Quote not found' }) })
it('generates a PDF with quote totals and sends exactly to its customer', async () => {
  expect(await service.sendInvoiceForPayment('tr_test')).toEqual({ success: true, invoiceNumber: 'VN-20260906-test', emailId: 'email1' })
  expect(mock.number).toHaveBeenCalledWith('2026-09-06', 'tr_test')
  expect(mock.build).toHaveBeenCalledWith(expect.objectContaining({ baseAmount: 28.88, vatAmount: 6.07, totalAmount: 34.95 }), { email: 'recipient@example.test', firstName: 'Test', lastName: 'User' }, null)
  expect(mock.send).toHaveBeenCalledWith(expect.objectContaining({ to: ['recipient@example.test'], subject: 'Your VexNexa Invoice — VN-20260906-test', attachments: [{ filename: 'invoice-VN-20260906-test.pdf', content: Buffer.from('fake-pdf') }] }))
  expect(mock.db.checkoutQuote.update).toHaveBeenCalledWith({ where: { id: 'q1' }, data: { invoiceNumber: 'VN-20260906-test', invoiceSentAt: expect.any(Date) } })
})
it('resends by explicit force while keeping the existing invoice number', async () => {
  const record = quote({ invoiceNumber: 'VN-original', invoiceSentAt: new Date(), createdAt: '2026-09-06T10:00:00Z' }); mock.db.checkoutQuote.findFirst.mockResolvedValue(record); mock.db.checkoutQuote.findUnique.mockResolvedValue(record)
  expect(await service.sendInvoiceForPayment('tr_test', { force: true })).toMatchObject({ success: true, invoiceNumber: 'VN-original' }); expect(mock.number).not.toHaveBeenCalled(); expect(mock.send).toHaveBeenCalledOnce()
})
it.each([
  [{ product: 'assurance', plan: null, billingCycle: 'yearly', totalAmount: 101.99 }, 'VexNexa Assurance (annual)'],
  [{ product: 'other', plan: null, billingCycle: 'monthly', totalAmount: 10 }, 'VexNexa (monthly)'],
])('labels invoice product and cycle consistently', async (data, text) => { mock.build.mockReturnValue(data); await service.generateAndSendInvoice('q1'); expect(mock.send.mock.calls[0][0].text).toContain(text) })
it('does not mark a quote sent after a thrown email delivery failure', async () => { mock.send.mockRejectedValue(new Error('mail unavailable')); expect(await service.generateAndSendInvoice('q1')).toMatchObject({ success: false, error: 'mail unavailable' }); expect(mock.db.checkoutQuote.update).not.toHaveBeenCalled() })
it('keeps an invoice retryable when email is not configured', async () => {
  vi.stubEnv('RESEND_API_KEY', ''); vi.resetModules(); service = await import('./invoice-service')
  expect(await service.generateAndSendInvoice('q1')).toMatchObject({ success: false, error: expect.stringContaining('RESEND_API_KEY is not configured') })
  expect(mock.send).not.toHaveBeenCalled(); expect(mock.db.checkoutQuote.update).not.toHaveBeenCalled()
})
it.each([{ data: null, error: { message: 'Sender domain not verified' } }, { data: null, error: null }, { data: {}, error: null }])('keeps an invoice retryable when provider returns no message ID', async result => {
  mock.send.mockResolvedValue(result)
  expect(await service.generateAndSendInvoice('q1')).toMatchObject({ success: false, error: 'error' in result && result.error ? result.error.message : 'Invoice email provider did not return a message ID' })
  expect(mock.db.checkoutQuote.update).not.toHaveBeenCalled()
  mock.send.mockResolvedValue({ data: { id: 'retried-email' } })
  expect(await service.generateAndSendInvoice('q1')).toMatchObject({ success: true, emailId: 'retried-email' })
  expect(mock.db.checkoutQuote.update).toHaveBeenCalledOnce()
})
it('does not send when PDF rendering fails', async () => { mock.pdf.mockRejectedValue('renderer failed'); expect(await service.generateAndSendInvoice('q1')).toMatchObject({ success: false, error: 'Unknown error' }); expect(mock.send).not.toHaveBeenCalled(); expect(mock.db.checkoutQuote.update).not.toHaveBeenCalled() })
it.each([new Error('database unavailable'), 'database unavailable'])('converts payment lookup failures into a controlled result', async error => { mock.db.checkoutQuote.findFirst.mockRejectedValue(error); expect(await service.sendInvoiceForPayment('tr_test')).toMatchObject({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }) })
it('queries the latest quote only for the requested customer', async () => { expect(await service.getLatestInvoiceQuoteForUser('u1')).toMatchObject({ id: 'q1' }); expect(mock.db.checkoutQuote.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userId: 'u1' }, orderBy: { createdAt: 'desc' } })); mock.db.checkoutQuote.findFirst.mockResolvedValue(null); expect(await service.getLatestInvoiceQuoteForUser('missing')).toBeNull() })
