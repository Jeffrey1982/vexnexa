import { describe, it, expect } from 'vitest'
import {
  PLAN_PRICES,
  PLAN_DISPLAY_NAMES,
  SELF_SERVE_PLANS,
  PUBLIC_PLANS,
  getMollieAmount,
  isSelfServePlan,
  getMollieInterval,
  toMollieAmountString,
  getDisplayPrice,
  formatEurPrice,
  getMonthlyEquivalent,
  getYearlySavings,
  getYearlyDiscountPercent,
  deriveVatBreakdown,
  buildPaymentMetadata,
} from '../billing/pricing-config'

describe('pricing-config', () => {
  describe('PLAN_PRICES', () => {
    it('has correct Pro prices', () => {
      expect(PLAN_PRICES.PRO.monthly).toBe(34.95)
      expect(PLAN_PRICES.PRO.yearly).toBe(349.50)
    })

    it('has correct Agency (BUSINESS) prices', () => {
      expect(PLAN_PRICES.BUSINESS.monthly).toBe(99.95)
      expect(PLAN_PRICES.BUSINESS.yearly).toBe(999.50)
    })

    it('has zero prices for FREE', () => {
      expect(PLAN_PRICES.FREE.monthly).toBe(0)
      expect(PLAN_PRICES.FREE.yearly).toBe(0)
    })

    it('has zero prices for ENTERPRISE (no self-serve)', () => {
      expect(PLAN_PRICES.ENTERPRISE.monthly).toBe(0)
      expect(PLAN_PRICES.ENTERPRISE.yearly).toBe(0)
    })

    it('has correct Starter prices (legacy)', () => {
      expect(PLAN_PRICES.STARTER.monthly).toBe(19.00)
      expect(PLAN_PRICES.STARTER.yearly).toBe(193.80)
    })
  })

  describe('PLAN_DISPLAY_NAMES', () => {
    it('maps BUSINESS to Agency', () => {
      expect(PLAN_DISPLAY_NAMES.BUSINESS).toBe('Agency')
    })

    it('maps all plans correctly', () => {
      expect(PLAN_DISPLAY_NAMES.FREE).toBe('Free')
      expect(PLAN_DISPLAY_NAMES.STARTER).toBe('Starter')
      expect(PLAN_DISPLAY_NAMES.PRO).toBe('Pro')
      expect(PLAN_DISPLAY_NAMES.ENTERPRISE).toBe('Enterprise')
    })
  })

  describe('getMollieAmount', () => {
    it('returns correct monthly amounts for paid plans', () => {
      expect(getMollieAmount('PRO', 'monthly')).toBe(34.95)
      expect(getMollieAmount('BUSINESS', 'monthly')).toBe(99.95)
      expect(getMollieAmount('STARTER', 'monthly')).toBe(19.00)
    })

    it('returns correct yearly amounts for paid plans', () => {
      expect(getMollieAmount('PRO', 'yearly')).toBe(349.50)
      expect(getMollieAmount('BUSINESS', 'yearly')).toBe(999.50)
      expect(getMollieAmount('STARTER', 'yearly')).toBe(193.80)
    })

    it('throws for FREE plan', () => {
      expect(() => getMollieAmount('FREE', 'monthly')).toThrow('FREE plan does not require payment')
    })

    it('throws for ENTERPRISE plan', () => {
      expect(() => getMollieAmount('ENTERPRISE', 'monthly')).toThrow('ENTERPRISE plan has no self-serve checkout')
    })
  })

  describe('isSelfServePlan', () => {
    it('returns true for PRO and BUSINESS', () => {
      expect(isSelfServePlan('PRO')).toBe(true)
      expect(isSelfServePlan('BUSINESS')).toBe(true)
    })

    it('returns false for FREE, STARTER, and ENTERPRISE', () => {
      expect(isSelfServePlan('FREE')).toBe(false)
      expect(isSelfServePlan('STARTER')).toBe(false)
      expect(isSelfServePlan('ENTERPRISE')).toBe(false)
    })
  })

  describe('getMollieInterval', () => {
    it('returns correct Mollie interval strings', () => {
      expect(getMollieInterval('monthly')).toBe('1 month')
      expect(getMollieInterval('yearly')).toBe('12 months')
    })
  })

  describe('toMollieAmountString', () => {
    it('formats amounts with two decimals', () => {
      expect(toMollieAmountString(34.95)).toBe('34.95')
      expect(toMollieAmountString(99.95)).toBe('99.95')
      expect(toMollieAmountString(349.5)).toBe('349.50')
      expect(toMollieAmountString(0)).toBe('0.00')
    })

    it('throws for negative amounts', () => {
      expect(() => toMollieAmountString(-1)).toThrow('Invalid negative amount')
    })
  })

  describe('deriveVatBreakdown', () => {
    it('correctly splits Pro monthly into net + VAT at 21%', () => {
      const breakdown = deriveVatBreakdown(34.95)
      expect(breakdown.gross).toBe(34.95)
      expect(breakdown.net + breakdown.vat).toBeCloseTo(34.95, 2)
      expect(breakdown.vat).toBeCloseTo(34.95 - 34.95 / 1.21, 1)
    })

    it('correctly splits Agency monthly into net + VAT at 21%', () => {
      const breakdown = deriveVatBreakdown(99.95)
      expect(breakdown.gross).toBe(99.95)
      expect(breakdown.net + breakdown.vat).toBeCloseTo(99.95, 2)
    })

    it('uses integer cent arithmetic to avoid rounding errors', () => {
      const breakdown = deriveVatBreakdown(34.95, 0.21)
      // net + vat must exactly equal gross (in cents)
      const netCents = Math.round(breakdown.net * 100)
      const vatCents = Math.round(breakdown.vat * 100)
      const grossCents = Math.round(breakdown.gross * 100)
      expect(netCents + vatCents).toBe(grossCents)
    })

    it('handles zero', () => {
      const breakdown = deriveVatBreakdown(0)
      expect(breakdown.net).toBe(0)
      expect(breakdown.vat).toBe(0)
      expect(breakdown.gross).toBe(0)
    })
  })

  describe('getMonthlyEquivalent', () => {
    it('returns yearly / 12 for paid plans', () => {
      expect(getMonthlyEquivalent('PRO')).toBeCloseTo(349.50 / 12, 2)
      expect(getMonthlyEquivalent('BUSINESS')).toBeCloseTo(999.50 / 12, 2)
    })

    it('returns 0 for FREE', () => {
      expect(getMonthlyEquivalent('FREE')).toBe(0)
    })
  })

  describe('getYearlyDiscountPercent', () => {
    it('returns positive discount for paid plans', () => {
      expect(getYearlyDiscountPercent('PRO')).toBeGreaterThan(0)
      expect(getYearlyDiscountPercent('BUSINESS')).toBeGreaterThan(0)
    })

    it('returns 0 for FREE', () => {
      expect(getYearlyDiscountPercent('FREE')).toBe(0)
    })
  })

  describe('getYearlySavings', () => {
    it('calculates savings correctly for Pro', () => {
      const expected = (34.95 * 12) - 349.50
      expect(getYearlySavings('PRO')).toBeCloseTo(expected, 2)
    })

    it('calculates savings correctly for Agency', () => {
      const expected = (99.95 * 12) - 999.50
      expect(getYearlySavings('BUSINESS')).toBeCloseTo(expected, 2)
    })
  })

  describe('buildPaymentMetadata', () => {
    it('includes all required fields', () => {
      const meta = buildPaymentMetadata({
        userId: 'user-123',
        planKey: 'PRO',
        billingInterval: 'monthly',
        customerType: 'company',
        companyName: 'Acme B.V.',
        vatNumber: 'NL123456789B01',
        chargedAmount: 34.95,
      })

      expect(meta.userId).toBe('user-123')
      expect(meta.planKey).toBe('PRO')
      expect(meta.billingInterval).toBe('monthly')
      expect(meta.customerType).toBe('company')
      expect(meta.companyName).toBe('Acme B.V.')
      expect(meta.vatNumber).toBe('NL123456789B01')
      expect(meta.chargedAmount).toBe('34.95')
      expect(meta.currency).toBe('EUR')
      expect(meta.type).toBe('upgrade')
    })

    it('defaults optional fields to empty strings', () => {
      const meta = buildPaymentMetadata({
        userId: 'user-456',
        planKey: 'BUSINESS',
        billingInterval: 'yearly',
        customerType: 'individual',
        chargedAmount: 999.50,
      })

      expect(meta.companyName).toBe('')
      expect(meta.vatNumber).toBe('')
      expect(meta.kvkNumber).toBe('')
      expect(meta.billingCountry).toBe('')
    })
  })

  describe('plan list constants', () => {
    it('SELF_SERVE_PLANS contains only PRO and BUSINESS', () => {
      expect(SELF_SERVE_PLANS).toEqual(['PRO', 'BUSINESS'])
    })

    it('PUBLIC_PLANS contains FREE, PRO, and BUSINESS', () => {
      expect(PUBLIC_PLANS).toEqual(['FREE', 'PRO', 'BUSINESS'])
    })
  })
})
