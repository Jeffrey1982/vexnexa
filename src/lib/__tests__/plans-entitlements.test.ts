/**
 * Unit tests for src/lib/billing/plans.ts — entitlement table and plan
 * helpers. These tests guard the pricing matrix against accidental
 * regressions in subscription limits.
 */

import { describe, it, expect } from 'vitest'
import {
  ENTITLEMENTS,
  OVERFLOW_PRICING,
  PRICES,
  planKeyFromString,
  formatPrice,
} from '../billing/plans'
import { getEntitlements } from '../billing/entitlements'

describe('plan entitlement matrix', () => {
  it('defines all 5 plans', () => {
    const keys = Object.keys(ENTITLEMENTS).sort()
    expect(keys).toEqual(['BUSINESS', 'ENTERPRISE', 'FREE', 'PRO', 'STARTER'])
  })

  it('has monotonically non-decreasing page limits as plans scale up', () => {
    const order = ['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const
    for (let i = 1; i < order.length; i++) {
      expect(ENTITLEMENTS[order[i]].pagesPerMonth).toBeGreaterThanOrEqual(
        ENTITLEMENTS[order[i - 1]].pagesPerMonth,
      )
    }
  })

  it('enables PDF export on every plan', () => {
    for (const plan of Object.values(ENTITLEMENTS)) {
      expect(plan.pdf).toBe(true)
    }
  })

  it('restricts white-label to BUSINESS and ENTERPRISE only', () => {
    expect(ENTITLEMENTS.FREE.whiteLabel).toBeFalsy()
    expect(ENTITLEMENTS.STARTER.whiteLabel).toBeFalsy()
    expect(ENTITLEMENTS.PRO.whiteLabel).toBeFalsy()
    expect(ENTITLEMENTS.BUSINESS.whiteLabel).toBe(true)
    expect(ENTITLEMENTS.ENTERPRISE.whiteLabel).toBe(true)
  })

  it('grants SLA only on ENTERPRISE', () => {
    expect(ENTITLEMENTS.ENTERPRISE.sla).toBe(true)
    expect(ENTITLEMENTS.BUSINESS.sla).toBeFalsy()
    expect(ENTITLEMENTS.FREE.sla).toBeFalsy()
  })

  it('FREE plan has most restrictive limits', () => {
    expect(ENTITLEMENTS.FREE.sites).toBe(1)
    expect(ENTITLEMENTS.FREE.users).toBe(1)
    expect(ENTITLEMENTS.FREE.schedule).toBe(false)
    expect(ENTITLEMENTS.FREE.crawl).toBe(false)
  })
})

describe('getEntitlements', () => {
  it('returns the right object for each plan key', () => {
    expect(getEntitlements('FREE')).toBe(ENTITLEMENTS.FREE)
    expect(getEntitlements('PRO')).toBe(ENTITLEMENTS.PRO)
  })
})

describe('PRICES', () => {
  it('is in ascending price order FREE < STARTER < PRO < BUSINESS < ENTERPRISE', () => {
    const order = ['FREE', 'STARTER', 'PRO', 'BUSINESS', 'ENTERPRISE'] as const
    for (let i = 1; i < order.length; i++) {
      expect(Number(PRICES[order[i]].amount)).toBeGreaterThan(
        Number(PRICES[order[i - 1]].amount),
      )
    }
  })

  it('uses EUR currency for every plan', () => {
    for (const plan of Object.values(PRICES)) {
      expect(plan.currency).toBe('EUR')
    }
  })
})

describe('planKeyFromString', () => {
  it('returns the plan key when valid', () => {
    expect(planKeyFromString('PRO')).toBe('PRO')
    expect(planKeyFromString('BUSINESS')).toBe('BUSINESS')
  })

  it('falls back to FREE for unknown input', () => {
    expect(planKeyFromString('GOLDEN')).toBe('FREE')
    expect(planKeyFromString('')).toBe('FREE')
  })
})

describe('formatPrice', () => {
  it('formats monthly plan prices in EUR', () => {
    expect(formatPrice('PRO')).toContain('€')
    expect(formatPrice('PRO')).toContain('34.95')
  })
})

describe('OVERFLOW_PRICING', () => {
  it('charges for extra pages, sites, and users', () => {
    expect(OVERFLOW_PRICING.extraPage.amount).toBeGreaterThan(0)
    expect(OVERFLOW_PRICING.extraSite.amount).toBeGreaterThan(0)
    expect(OVERFLOW_PRICING.extraUser.amount).toBeGreaterThan(0)
  })
})
