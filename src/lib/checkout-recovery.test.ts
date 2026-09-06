import { describe, expect, it } from 'vitest'
import { authContinuationPath, checkoutReturnPath, parseCheckoutIntent, safeAuthRedirect } from './checkout-recovery'

describe('safe checkout continuation', () => {
  it.each([null, undefined, '', 'javascript:alert(1)', 'https://evil.test/pricing', '//evil.test', '/\\evil.test', '/%2f%2fevil.test', '/%5cevil.test', '/bad\npath', '/%00bad', '/%zz'])('rejects unsafe redirect %j', value => {
    expect(safeAuthRedirect(value)).toBe('/dashboard')
  })
  it.each(['/dashboard', '/nl/pricing?checkoutPlan=BUSINESS&billingCycle=yearly#agency', '/checkout/return?paymentId=tr_test'])('preserves local target %s', value => {
    expect(safeAuthRedirect(value)).toBe(value)
  })
  it.each(['FREE', 'ENTERPRISE', 'unknown', '', 'BUSINESS&redirect=https://evil.test'])('rejects non-self-serve plan %s', plan => {
    expect(parseCheckoutIntent(new URLSearchParams({ checkoutPlan: plan, billingCycle: 'monthly' }))).toBeNull()
  })
  it.each(['', 'weekly', 'MONTHLY'])('rejects invalid interval %s', billingCycle => {
    expect(parseCheckoutIntent(new URLSearchParams({ checkoutPlan: 'BUSINESS', billingCycle }))).toBeNull()
  })
  it.each(['PRO', 'BUSINESS'] as const)('roundtrips %s through login and signup without executable checkout instructions', plan => {
    const intent = { plan, billingCycle: 'yearly' as const }
    const target = checkoutReturnPath(intent, 'nl')
    expect(target).toBe(`/nl/pricing?checkoutPlan=${plan}&billingCycle=yearly#${plan === 'BUSINESS' ? 'agency' : 'plans'}`)
    for (const path of ['/auth/login', '/auth/register', '/auth/verified', '/onboarding'] as const) {
      const continued = new URL(authContinuationPath(path, target), 'https://app.test')
      expect(continued.pathname).toBe(path)
      expect(continued.searchParams.get('redirect')).toBe(target)
      expect(parseCheckoutIntent(new URL(target, 'https://app.test').searchParams)).toEqual(intent)
    }
  })
  it('does not let the auth-link helper forward external destinations', () => {
    expect(authContinuationPath('/auth/login', 'javascript:alert(1)')).toBe('/auth/login?redirect=%2Fdashboard')
  })
})
