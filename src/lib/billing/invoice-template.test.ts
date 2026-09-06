import { expect, it } from 'vitest'
import { buildInvoiceDataFromQuote, generateInvoiceHtml, generateInvoicePlainText, type InvoiceData } from './invoice-template'
const invoice = (overrides: Partial<InvoiceData> = {}): InvoiceData => ({ invoiceDate: '2026-09-06', paymentId: 'tr_123456', customerName: 'Test User', customerEmail: 'user@example.test', customerType: 'individual', customerCountry: 'NL', product: 'subscription', plan: 'PRO', billingCycle: 'monthly', description: 'VexNexa Pro Plan (Monthly)', baseAmount: 28.88, vatAmount: 6.07, totalAmount: 34.95, currency: 'EUR', taxRatePercent: 21, taxMode: 'vat_standard', ...overrides })
it('renders matching invoice totals and deterministic references in HTML and text', () => {
  const html = generateInvoiceHtml(invoice()); const text = generateInvoicePlainText(invoice({ invoiceNumber: 'VN-stable' }))
  expect(html).toContain('VNX-20260906-123456'); expect(html).toContain('€28.88'); expect(html).toContain('€6.07'); expect(html).toContain('€34.95'); expect(text).toContain('Invoice: VN-stable'); expect(text).toContain('Payment reference: tr_123456'); expect(text).toContain('VAT (21%)')
})
it('escapes customer names, company identifiers, description and tax notes', () => {
  const html = generateInvoiceHtml(invoice({ companyName: '<img src=x onerror="bad">', customerName: 'A & B', vatId: '<VAT>', registrationNumber: '<KVK>', description: '<script>bad</script>', taxNotes: '<b>note</b>' }))
  expect(html).not.toContain('<script>bad'); expect(html).not.toContain('<img src=x'); expect(html).toContain('&lt;img src=x onerror=&quot;bad&quot;&gt;'); expect(html).toContain('A &amp; B'); expect(html).toContain('&lt;VAT&gt;'); expect(html).toContain('&lt;KVK&gt;'); expect(html).toContain('&lt;b&gt;note&lt;/b&gt;')
})
it('includes a reverse-charge note and validated business identifiers', () => {
  const data = invoice({ taxMode: 'reverse_charge', vatAmount: 0, taxRatePercent: 0, companyName: 'Example GmbH', vatId: 'DE123', vatIdValid: true, registrationNumber: 'REG1', addressLine1: 'Street 1', addressPostal: '10115', addressCity: 'Berlin', addressRegion: 'Berlin', taxNotes: 'Accounting note' })
  const html = generateInvoiceHtml(data); const text = generateInvoicePlainText(data)
  expect(html).toContain('Reverse Charge:'); expect(html).toContain('Street 1<br>10115 Berlin'); expect(html).toContain('DE123 ✓'); expect(text).toContain('DE123 (validated)'); expect(text).toContain('KvK: REG1'); expect(text).toContain('VAT reverse charge applies')
})
it('renders outside-EU tax and optional merchant identity without irrelevant notes', () => {
  const data = invoice({ invoiceNumber: 'CUSTOM', paymentId: undefined, taxMode: 'no_tax', vatAmount: 0, merchantName: 'Test Merchant', merchantAddress: 'Test Address', merchantVatId: '', merchantKvk: '', vatId: 'US123', vatIdValid: false })
  const html = generateInvoiceHtml(data); const text = generateInvoicePlainText(data)
  expect(html).toContain('Test Merchant'); expect(html).toContain('VAT (0%) – Outside EU'); expect(html).not.toContain('Payment reference:'); expect(html).not.toContain('Reverse Charge:'); expect(text).not.toContain('(validated)'); expect(text).toContain('VAT (0%) – Outside EU')
})
const quote = () => ({ product: 'subscription', plan: 'PRO', billingCycle: 'yearly', baseAmount: 28.88, vatAmount: 6.07, totalAmount: 34.95, currency: 'EUR', taxRatePercent: 21, taxMode: 'vat_standard', taxNotes: null, customerType: 'individual', customerCountry: 'NL', companyName: null, vatId: null, vatIdValid: false, molliePaymentId: 'tr_1', createdAt: new Date('2026-09-06T10:00:00Z') })
it('builds invoice data from number fields and profile registration information', () => {
  const data = buildInvoiceDataFromQuote(quote(), { email: 'user@example.test', firstName: 'Test', lastName: 'User' }, { registrationNumber: 'REG1', kvkNumber: 'OTHER', addressLine1: 'Street 1', addressCity: 'Amsterdam', addressPostal: '1234AB', addressRegion: 'NH' })
  expect(data).toMatchObject({ customerName: 'Test User', description: 'VexNexa PRO Plan (Annual)', invoiceDate: '2026-09-06', registrationNumber: 'REG1', totalAmount: 34.95, addressCity: 'Amsterdam' })
})
it('converts Prisma Decimal values and handles missing customer/profile fields', () => {
  const data = buildInvoiceDataFromQuote({ ...quote(), plan: null, billingCycle: null, createdAt: '2026-09-06T10:00:00Z', molliePaymentId: null, totalAmount: { toNumber: () => 34.95 }, taxRatePercent: { toNumber: () => 21 } }, { email: 'user@example.test' }, { kvkNumber: '12345678' })
  expect(data).toMatchObject({ description: 'VexNexa Subscription Plan (Monthly)', customerName: 'user@example.test', registrationNumber: '12345678', totalAmount: 34.95, taxRatePercent: 21 }); expect(data.paymentId).toBeUndefined()
})
it.each([['assurance', 'VexNexa Assurance (Annual)'], ['addon', 'VexNexa addon']])('labels product %s correctly', (product, description) => { expect(buildInvoiceDataFromQuote({ ...quote(), product }, { email: 'user@example.test' }).description).toBe(description) })
