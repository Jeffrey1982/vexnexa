// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ dialog: vi.fn(), fetch: vi.fn() }))
vi.mock('next-intl', () => ({ useLocale: () => 'nl', useTranslations: (ns: string) => Object.assign((key: string) => `${ns}.${key}`, { raw: () => true }) }))
vi.mock('next/link', () => ({ default: ({ href, children }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href}>{children}</a> }))
vi.mock('@/components/checkout/CheckoutDialog', () => ({ CheckoutDialog: (props: unknown) => { mock.dialog(props); return null } }))
vi.mock('@/components/pricing/DirectCheckoutButton', () => ({ DirectCheckoutButton: () => null }))
vi.mock('@/components/marketing/AgencyOfferBanner', () => ({ AgencyOfferBanner: () => null }))
vi.mock('@/components/marketing/AgencyCTAStrip', () => ({ AgencyCTAStrip: () => null }))
vi.mock('@/components/marketing/ComparisonTable', () => ({ ComparisonTable: () => null }))
vi.mock('@/lib/analytics-events', () => ({ trackEvent: vi.fn() }))
import PricingPage from './page'
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks(); vi.stubGlobal('fetch', mock.fetch)
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove(); window.history.replaceState({}, '', '/'); vi.unstubAllGlobals() })
it.each(['PRO', 'BUSINESS'])('reopens the selected %s yearly review dialog without initiating a payment', async plan => {
  window.history.replaceState({}, '', `/nl/pricing?checkoutPlan=${plan}&billingCycle=yearly#agency`)
  await act(async () => root.render(<PricingPage />))
  expect(mock.dialog).toHaveBeenLastCalledWith(expect.objectContaining({ open: true, planKey: plan, billingCycle: 'yearly' }))
  expect(window.location.search).toBe('')
  expect(mock.fetch).not.toHaveBeenCalled()
})
it.each(['checkoutPlan=FREE&billingCycle=yearly', 'checkoutPlan=BUSINESS&billingCycle=weekly', 'checkoutPlan=https://evil.test&billingCycle=monthly', ''])('does not open checkout for invalid or absent intent %s', async query => {
  window.history.replaceState({}, '', `/pricing?${query}`)
  await act(async () => root.render(<PricingPage />))
  expect(mock.dialog).toHaveBeenLastCalledWith(expect.objectContaining({ open: false, planKey: null }))
  expect(mock.fetch).not.toHaveBeenCalled()
})
