import { describe, it, expect } from 'vitest'
import {
  BASE_PRICES,
  ANNUAL_PRICES,
  getDiscountPercentage,
  calculatePrice,
  getPlanPricing,
  formatEuro,
  AUDIT_PRICES,
  AUDIT_BUNDLE_PRICES,
  EXTRA_SERVICES_PRICES,
} from '../pricing'

describe('pricing', () => {
  describe('calculatePrice (excl. VAT)', () => {
    it('returns monthly base price for monthly cycle', () => {
      expect(calculatePrice('STARTER', 'monthly')).toBe(19.00)
      expect(calculatePrice('PRO', 'monthly')).toBe(44.00)
      expect(calculatePrice('BUSINESS', 'monthly')).toBe(129.00)
      expect(calculatePrice('ENTERPRISE', 'monthly')).toBe(349.00)
    })

    it('returns annual price for yearly cycle', () => {
      expect(calculatePrice('STARTER', 'yearly')).toBe(193.80)
      expect(calculatePrice('PRO', 'yearly')).toBe(448.80)
      expect(calculatePrice('BUSINESS', 'yearly')).toBe(1315.80)
      expect(calculatePrice('ENTERPRISE', 'yearly')).toBe(3559.80)
    })
  })

  describe('getDiscountPercentage', () => {
    it('returns 0 for monthly cycle', () => {
      expect(getDiscountPercentage('STARTER', 'monthly')).toBe(0)
      expect(getDiscountPercentage('PRO', 'monthly')).toBe(0)
    })

    it('returns ~15% for yearly plans', () => {
      const starterDiscount = getDiscountPercentage('STARTER', 'yearly')
      expect(starterDiscount).toBe(15)

      const proDiscount = getDiscountPercentage('PRO', 'yearly')
      expect(proDiscount).toBe(15)
    })

    it('calculates correct discount for Starter', () => {
      const fullPrice = BASE_PRICES.STARTER * 12
      const expected = Math.round(((fullPrice - ANNUAL_PRICES.STARTER) / fullPrice) * 100)
      expect(getDiscountPercentage('STARTER', 'yearly')).toBe(expected)
    })
  })

  describe('getPlanPricing', () => {
    it('returns complete pricing object for Starter', () => {
      const pricing = getPlanPricing('STARTER')
      expect(pricing.monthly).toBe(19.00)
      expect(pricing.yearly.total).toBe(193.80)
      expect(pricing.yearly.perMonth).toBeCloseTo(16.15, 2)
      expect(pricing.yearly.discount).toBe(15)
    })

    it('returns Enterprise yearly pricing', () => {
      const pricing = getPlanPricing('ENTERPRISE')
      expect(pricing.monthly).toBe(349.00)
      expect(pricing.yearly.total).toBe(3559.80)
      expect(pricing.yearly.perMonth).toBeCloseTo(296.65, 2)
    })
  })

  describe('new product definitions', () => {
    it('has audit prices', () => {
      expect(AUDIT_PRICES.QUICK.price).toBe(249.00)
      expect(AUDIT_PRICES.FULL.price).toBe(549.00)
      expect(AUDIT_PRICES.ENTERPRISE.price).toBe(1199.00)
    })

    it('has audit bundle prices', () => {
      expect(AUDIT_BUNDLE_PRICES.STARTER.price).toBe(49.00)
      expect(AUDIT_BUNDLE_PRICES.PRO.price).toBe(119.00)
      expect(AUDIT_BUNDLE_PRICES.BUSINESS.price).toBe(279.00)
      expect(AUDIT_BUNDLE_PRICES.ENTERPRISE.price).toBe(599.00)
    })

    it('has extra services prices', () => {
      expect(EXTRA_SERVICES_PRICES.A11Y_STATEMENT.price).toBe(79.00)
      expect(EXTRA_SERVICES_PRICES.VPAT.price).toBe(149.00)
      expect(EXTRA_SERVICES_PRICES.REMEDIATION_DOC.price).toBe(99.00)
      expect(EXTRA_SERVICES_PRICES.DEV_TRAINING.price).toBe(199.00)
    })
  })

  describe('formatEuro', () => {
    it('formats whole numbers without decimals', () => {
      const result = formatEuro(249)
      expect(result).toContain('249')
      expect(result).toContain('€')
    })

    it('formats decimal amounts', () => {
      const result = formatEuro(14.99)
      expect(result).toContain('14,99') // nl-NL locale uses comma
    })

    it('formats zero', () => {
      const result = formatEuro(0)
      expect(result).toContain('0')
    })
  })
})
