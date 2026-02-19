import { describe, it, expect } from 'vitest'
import {
  BASE_PRICES,
  ANNUAL_PRICES,
  getDiscountPercentage,
  calculatePrice,
  getPlanPricing,
  formatEuro,
} from '../pricing'

describe('pricing', () => {
  describe('calculatePrice', () => {
    it('returns monthly base price for monthly cycle', () => {
      expect(calculatePrice('STARTER', 'monthly')).toBe(24.99)
      expect(calculatePrice('PRO', 'monthly')).toBe(59.99)
      expect(calculatePrice('BUSINESS', 'monthly')).toBe(129.00)
      expect(calculatePrice('ENTERPRISE', 'monthly')).toBe(299.00)
    })

    it('returns annual price for yearly cycle', () => {
      expect(calculatePrice('STARTER', 'yearly')).toBe(249.00)
      expect(calculatePrice('PRO', 'yearly')).toBe(599.00)
      expect(calculatePrice('BUSINESS', 'yearly')).toBe(1299.00)
      expect(calculatePrice('ENTERPRISE', 'yearly')).toBe(0) // custom
    })
  })

  describe('getDiscountPercentage', () => {
    it('returns 0 for monthly cycle', () => {
      expect(getDiscountPercentage('STARTER', 'monthly')).toBe(0)
      expect(getDiscountPercentage('PRO', 'monthly')).toBe(0)
    })

    it('returns 0 for enterprise yearly (custom billing)', () => {
      expect(getDiscountPercentage('ENTERPRISE', 'yearly')).toBe(0)
    })

    it('returns positive discount for yearly plans', () => {
      const starterDiscount = getDiscountPercentage('STARTER', 'yearly')
      expect(starterDiscount).toBeGreaterThan(0)
      expect(starterDiscount).toBeLessThan(100)

      const proDiscount = getDiscountPercentage('PRO', 'yearly')
      expect(proDiscount).toBeGreaterThan(0)
      expect(proDiscount).toBeLessThan(100)
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
      expect(pricing.monthly).toBe(24.99)
      expect(pricing.yearly.total).toBe(249.00)
      expect(pricing.yearly.perMonth).toBeCloseTo(249 / 12, 2)
      expect(pricing.yearly.discount).toBeGreaterThan(0)
    })

    it('returns 0 perMonth for Enterprise yearly (custom)', () => {
      const pricing = getPlanPricing('ENTERPRISE')
      expect(pricing.monthly).toBe(299.00)
      expect(pricing.yearly.total).toBe(0)
      expect(pricing.yearly.perMonth).toBe(0)
    })
  })

  describe('formatEuro', () => {
    it('formats whole numbers without decimals', () => {
      const result = formatEuro(249)
      expect(result).toContain('249')
      expect(result).toContain('€')
    })

    it('formats decimal amounts', () => {
      const result = formatEuro(24.99)
      expect(result).toContain('24,99') // nl-NL locale uses comma
    })

    it('formats zero', () => {
      const result = formatEuro(0)
      expect(result).toContain('0')
    })
  })
})
