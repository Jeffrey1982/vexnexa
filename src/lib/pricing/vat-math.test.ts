import { expect, it } from 'vitest'
import { getClientVatRate, getPriceInclVat, getVatAmount, grossToNet, netToGross, vatFromGross, formatMoney } from './vat-math'
it.each([['nl', 0.21], ['DE', 0.19], ['FI', 0.255], ['US', 0], ['UNKNOWN', 0.21]])('selects configured display VAT for %s', (country, expected) => expect(getClientVatRate(country as string)).toBe(expected))
it('keeps integer-cent conversions consistent across net/gross breakdowns', () => { expect(getPriceInclVat(19.99, 'NL')).toBe(24.19); expect(getVatAmount(19.99, 'NL')).toBe(4.2); expect(netToGross(19.99)).toBe(24.19); expect(grossToNet(24.19)).toBe(19.99); expect(vatFromGross(24.19)).toBe(4.2); expect(netToGross(19.99, 0)).toBe(19.99); expect(grossToNet(19.99, 0)).toBe(19.99); expect(vatFromGross(19.99, 0)).toBe(0) })
it('rejects negative tax rates', () => { expect(() => grossToNet(20, -0.1)).toThrow('cannot be negative'); expect(() => netToGross(20, -0.1)).toThrow('cannot be negative') })
it('formats defaults and explicit currencies/locales to two decimals', () => { expect(formatMoney(12.5)).toContain('12,50'); expect(formatMoney(12.5, 'USD', 'en-US')).toBe('$12.50') })
