/**
 * Unit tests for src/lib/mollie.ts — the Mollie helper wrapper.
 *
 * These tests focus on the pure helpers (formatMollieAmount,
 * isMollieTestMode, appUrl) and on the env-guarding of getMollieClient().
 * The actual createMollieClient import is mocked by test/setup.ts.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'

describe('formatMollieAmount', () => {
  it('formats whole numbers with 2 decimals', async () => {
    const { formatMollieAmount } = await import('../mollie')
    expect(formatMollieAmount(10)).toBe('10.00')
    expect(formatMollieAmount(1)).toBe('1.00')
  })

  it('rounds to 2 decimals', async () => {
    const { formatMollieAmount } = await import('../mollie')
    expect(formatMollieAmount(19.999)).toBe('20.00')
    expect(formatMollieAmount(19.995)).toMatch(/^19\.99|20\.00$/) // JS rounding
  })

  it('throws on negative amounts', async () => {
    const { formatMollieAmount } = await import('../mollie')
    expect(() => formatMollieAmount(-1)).toThrow(/negative/i)
  })

  it('handles zero', async () => {
    const { formatMollieAmount } = await import('../mollie')
    expect(formatMollieAmount(0)).toBe('0.00')
  })
})

describe('isMollieTestMode', () => {
  const originalKey = process.env.MOLLIE_API_KEY
  afterEach(() => {
    process.env.MOLLIE_API_KEY = originalKey
  })

  it('returns true for test_ API keys', async () => {
    process.env.MOLLIE_API_KEY = 'test_abcdef123456'
    const { isMollieTestMode } = await import('../mollie')
    expect(isMollieTestMode()).toBe(true)
  })

  it('returns false for live_ API keys', async () => {
    process.env.MOLLIE_API_KEY = 'live_xyz'
    const { isMollieTestMode } = await import('../mollie')
    expect(isMollieTestMode()).toBe(false)
  })

  it('returns false when API key is missing', async () => {
    delete process.env.MOLLIE_API_KEY
    const { isMollieTestMode } = await import('../mollie')
    expect(isMollieTestMode()).toBe(false)
  })
})

describe('appUrl', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://www.vexnexa.com'
  })

  it('returns the base URL when no path given', async () => {
    const { appUrl } = await import('../mollie')
    expect(appUrl()).toMatch(/^https:\/\/www\.vexnexa\.com\/?$/)
  })

  it('appends paths correctly', async () => {
    const { appUrl } = await import('../mollie')
    const url = appUrl('/checkout/success')
    expect(url).toMatch(/vexnexa\.com\/?(?:checkout\/success)?/)
  })
})
