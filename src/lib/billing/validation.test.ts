import { describe, expect, it } from 'vitest'
import { normalizeVatId, validateVatFormat, normalizeKvkNumber, validateKvkFormat, validateCompanyName } from './validation'
import { determineTax, calculateAmountBreakdown, validateVatIdFormat, normalizeVatId as normalizeTaxVat } from './tax'
import { getCountryByCode, getCountryName, isEuCountry, isNlCountry } from './countries'

describe('billing input validation', () => {
  it('normalizes common VAT punctuation', () => { expect(normalizeVatId(' nl 123.456-789/b01 ')).toBe('NL123456789B01'); expect(normalizeTaxVat(' nl 123.456-789b01 ')).toBe('NL123456789B01') })
  it.each(['NL123456789B01', 'DE123456789', 'BE0123456789', 'FRXX123456789', 'ATU12345678', 'IT12345678901', 'PL1234567890'])('accepts valid VAT format %s', vat => expect(validateVatFormat(vat)).toEqual({ valid: true, normalized: vat }))
  it.each([['', 'required'], ['NL', 'short'], ['123456', 'country code'], ['NL123', 'Expected format'], ['PL123', 'Invalid VAT number']])('explains invalid VAT %s', (vat, error) => expect(validateVatFormat(vat)).toMatchObject({ valid: false, error: expect.stringContaining(error) }))
  it('defers unknown country formats to server-side verification', () => { expect(validateVatFormat('ZZ12345').valid).toBe(true); expect(validateVatIdFormat('ZZ', 'ZZ12345')).toBe(false); expect(validateVatIdFormat('nl', 'nl123.456.789-b01')).toBe(true); expect(validateVatIdFormat('NL', 'NL1')).toBe(false) })
  it('normalizes formatted KVK identifiers', () => { expect(normalizeKvkNumber('12 34-56.78')).toBe('12345678'); expect(validateKvkFormat('12 34-56.78')).toEqual({ valid: true, normalized: '12345678' }) })
  it.each(['', '123', '123456789', '00000000', '11111111'])('rejects invalid KVK %s', kvk => expect(validateKvkFormat(kvk)).toMatchObject({ valid: false, error: expect.any(String) }))
  it.each(['', ' ', 'a', 'a'.repeat(201)])('rejects invalid company names', name => expect(validateCompanyName(name).valid).toBe(false))
  it('accepts trimmed bounded company names', () => { expect(validateCompanyName(' Acme BV ')).toEqual({ valid: true }); expect(validateCompanyName('A'.repeat(200))).toEqual({ valid: true }) })
})

describe('tax rule selection and rounding', () => {
  it.each([
    ['nl', 'business', true, 0.21, 'NL_VAT'], ['NL', 'individual', false, 0.21, 'NL_VAT'],
    ['DE', 'business', true, 0, 'EU_REVERSE_CHARGE'], ['DE', 'business', false, 0.21, 'NL_VAT'],
    ['DE', 'individual', true, 0.21, 'NL_VAT'], ['US', 'business', true, 0, 'NON_EU_NO_VAT'],
  ] as const)('selects configured regime for %s %s VAT=%s', (countryCode, billingType, vatValid, vatRate, regime) => {
    expect(determineTax({ countryCode, billingType, vatValid })).toMatchObject({ vatRate, regime, invoiceNote: expect.any(String) })
  })
  it('rounds net-based VAT once at cents and preserves zero-rate totals', () => {
    expect(calculateAmountBreakdown(19.99, { vatRate: 0.21, regime: 'NL_VAT', invoiceNote: '' })).toEqual({ net: 19.99, vat: 4.2, gross: 24.19 })
    expect(calculateAmountBreakdown(19.99, { vatRate: 0, regime: 'EU_REVERSE_CHARGE', invoiceNote: '' })).toEqual({ net: 19.99, vat: 0, gross: 19.99 })
  })
  it('looks up country labels case-insensitively and falls back for unknown codes', () => {
    expect(isEuCountry('de')).toBe(true); expect(isEuCountry('US')).toBe(false); expect(isNlCountry('nl')).toBe(true)
    expect(getCountryByCode('nl')).toMatchObject({ code: 'NL' }); expect(getCountryName('NL')).toBeTruthy(); expect(getCountryByCode('ZZ')).toBeUndefined(); expect(getCountryName('ZZ')).toBe('ZZ')
  })
})
