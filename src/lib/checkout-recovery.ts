import { localizeMarketingHref } from './marketing-links'

export type CheckoutIntent = { plan: 'PRO' | 'BUSINESS'; billingCycle: 'monthly' | 'yearly' }

/** Auth continuation is always a same-origin path, never an executable/external URL. */
export function safeAuthRedirect(value: unknown, fallback = '/dashboard'): string {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(value)) return fallback
  try {
    const url = new URL(value, 'https://redirect.invalid')
    const decodedPath = decodeURIComponent(url.pathname)
    if (url.origin !== 'https://redirect.invalid' || decodedPath.startsWith('//') || /[\\\u0000-\u001f\u007f]/.test(decodedPath)) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}

export function parseCheckoutIntent(params: Pick<URLSearchParams, 'get'>): CheckoutIntent | null {
  const plan = params.get('checkoutPlan')
  const billingCycle = params.get('billingCycle')
  return (plan === 'PRO' || plan === 'BUSINESS') && (billingCycle === 'monthly' || billingCycle === 'yearly')
    ? { plan, billingCycle }
    : null
}

/** Restores selection only. Visiting this URL must never create a payment. */
export function checkoutReturnPath(intent: CheckoutIntent, locale = 'en'): string {
  const params = new URLSearchParams({ checkoutPlan: intent.plan, billingCycle: intent.billingCycle })
  return localizeMarketingHref(`/pricing?${params}#${intent.plan === 'BUSINESS' ? 'agency' : 'plans'}`, locale)
}

export function authContinuationPath(path: '/auth/login' | '/auth/register' | '/auth/verified' | '/onboarding', redirect: string): string {
  return `${path}?${new URLSearchParams({ redirect: safeAuthRedirect(redirect) })}`
}
