import { expect, it } from 'vitest'
import * as pricing from './pricing'
it.each([
  ['BASIC', 9.99, 55.99, 101.99, 1], ['PRO', 24.99, 137.99, 254.99, 5], ['PUBLIC_SECTOR', 49.99, 275.99, 509.99, 20],
] as const)('keeps %s checkout and displayed cycle amounts aligned', (tier, monthly, semiannual, annual, domains) => {
  expect(pricing.calculateAssurancePrice(tier, 'monthly')).toBe(monthly); expect(pricing.calculateAssurancePrice(tier, 'semiannual')).toBe(semiannual); expect(pricing.calculateAssurancePrice(tier, 'annual')).toBe(annual)
  expect(pricing.getAssurancePlanPricing(tier)).toMatchObject({ monthly, semiannual: { total: semiannual, perMonth: semiannual / 6 }, annual: { total: annual, perMonth: annual / 12 } })
  expect(pricing.getAssuranceDiscountPercentage(tier, 'monthly')).toBe(0); expect(pricing.getAssuranceDiscountPercentage(tier, 'annual')).toBe(15)
  expect(pricing.getAssurancePlanLimits(tier).domains).toBe(domains); expect(pricing.validateDomainCount(tier, domains)).toBe(true); expect(pricing.validateDomainCount(tier, domains + 1)).toBe(false)
  expect(pricing.validateScanFrequency(tier, 'WEEKLY')).toBe(true); expect(pricing.validateScanFrequency(tier, 'BIWEEKLY')).toBe(true)
  expect(pricing.getAssuranceTierName(tier)).toBe(tier === 'PUBLIC_SECTOR' ? 'Public Sector' : tier === 'PRO' ? 'Pro' : 'Basic')
  expect(pricing.getAssuranceCTAText(tier)).toBe(tier === 'PUBLIC_SECTOR' ? 'Contact Sales' : tier === 'PRO' ? 'Upgrade to Pro' : 'Get Started')
  expect(pricing.getAssuranceTierDescription(tier)).toMatch(tier === 'PUBLIC_SECTOR' ? /schools/ : tier === 'PRO' ? /agencies/ : /single websites/)
})
it.each([['BASIC', 90, true], ['BASIC', 89, false], ['PRO', 91, false], ['PUBLIC_SECTOR', 59, false], ['PUBLIC_SECTOR', 60, true], ['PUBLIC_SECTOR', 100, true], ['PUBLIC_SECTOR', 101, false]] as const)('validates threshold for %s at %i', (tier, threshold, expected) => expect(pricing.validateThreshold(tier, threshold)).toBe(expected))
it('formats all cycles with explicit total and equivalent monthly price', () => {
  expect(pricing.formatAssurancePriceDisplay('BASIC', 'monthly')).toEqual({ mainPrice: '€9.99', period: '/month' })
  expect(pricing.formatAssurancePriceDisplay('BASIC', 'semiannual')).toEqual({ mainPrice: '€55.99', period: '/6 months', subtext: '€9.33/month' })
  expect(pricing.formatAssurancePriceDisplay('BASIC', 'annual')).toEqual({ mainPrice: '€101.99', period: '/year', subtext: '€8.50/month' })
  expect(pricing.formatAssuranceEuro(9.99, 'nl-NL')).toContain('9,99')
})
it('only advertises applicable billing-cycle discounts', () => {
  expect(pricing.getAssuranceDiscountBadge('monthly')).toBeNull(); expect(pricing.getAssuranceDiscountBadge('semiannual')).toBe('Save up to 8%'); expect(pricing.getAssuranceDiscountBadge('annual')).toBe('Save up to 15%')
  expect(pricing.getAssuranceDiscountBadge('semiannual', 'BASIC')).toBe('Save 7%'); expect(pricing.getAssuranceDiscountBadge('annual', 'PRO')).toBe('Save 15%')
})
