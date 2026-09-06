// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ router: { push: vi.fn() }, fetch: vi.fn(), params: new URLSearchParams({ paymentId: 'tr_test' }) }))
vi.mock('next/navigation', () => ({ useRouter: () => mock.router, useSearchParams: () => mock.params }))
vi.mock('next-intl', () => ({ useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}` }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }))
import CheckoutReturnClient from './CheckoutReturnClient'
let root: Root
let container: HTMLDivElement
const pending = { status: 'paid', plan: 'BUSINESS', user: { plan: 'PRO', subscriptionStatus: 'active' }, fulfillmentStatus: 'pending' }
const response = (body = pending) => ({ ok: true, status: 200, json: async () => body })
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  vi.useFakeTimers(); vi.clearAllMocks()
  mock.params = new URLSearchParams({ paymentId: 'tr_test' })
  mock.fetch.mockResolvedValue(response())
  vi.stubGlobal('fetch', mock.fetch)
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.useRealTimers(); vi.unstubAllGlobals() })
async function render() { await act(async () => root.render(<CheckoutReturnClient />)) }
const advance = async (ms: number) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms) }) }
it('does not treat an existing different paid plan as activation of the purchase', async () => {
  await render()
  expect(container.textContent).toContain('checkoutRecovery.pendingTitle')
  expect(container.textContent).not.toContain('checkout.return.success.title')
  await advance(32_000)
  expect(mock.router.push).not.toHaveBeenCalled()
  expect(container.textContent).toContain('checkoutRecovery.checkAgain')
})
it('retries status only, then redirects when exact fulfillment is confirmed', async () => {
  await render(); await advance(30_000)
  mock.fetch.mockResolvedValue(response({ ...pending, user: { plan: 'BUSINESS', subscriptionStatus: 'active' }, fulfillmentStatus: 'fulfilled' }))
  await act(async () => container.querySelector('button')!.click())
  expect(container.textContent).toContain('checkout.return.success.title')
  await advance(1500)
  expect(mock.router.push).toHaveBeenCalledWith('/dashboard?checkout=success')
  expect(mock.fetch.mock.calls.every((call: unknown[]) => String(call[0]).startsWith('/api/mollie/payment-status?'))).toBe(true)
})
it('never infers one-off fulfillment from the payment status alone', async () => {
  mock.fetch.mockResolvedValue(response({ ...pending, isOneOffCheckout: true } as typeof pending))
  await render(); await advance(32_000)
  expect(mock.router.push).not.toHaveBeenCalled()
  expect(container.textContent).toContain('checkoutRecovery.pendingTitle')
})
it('preserves the payment reference through a login continuation', async () => {
  mock.fetch.mockResolvedValue({ ok: false, status: 401 })
  await render()
  const target = new URL(mock.router.push.mock.calls[0][0], 'https://app.test')
  expect(target.pathname).toBe('/auth/login')
  expect(target.searchParams.get('redirect')).toBe('/checkout/return?paymentId=tr_test')
})
it('offers a safe retry after network errors', async () => {
  mock.fetch.mockRejectedValue(new Error('offline'))
  await render()
  expect(container.textContent).toContain('checkoutRecovery.checkAgain')
  expect(mock.router.push).not.toHaveBeenCalled()
})
it('cleans up polling and redirects on unmount', async () => {
  await render()
  const count = mock.fetch.mock.calls.length
  act(() => root.unmount())
  root = createRoot(container)
  await advance(60_000)
  expect(mock.fetch).toHaveBeenCalledTimes(count)
  expect(mock.router.push).not.toHaveBeenCalled()
})
it('rejects malformed payment references without fetching', async () => {
  mock.params = new URLSearchParams({ paymentId: '//evil.test' })
  await render()
  expect(mock.fetch).not.toHaveBeenCalled()
  expect(container.textContent).toContain('checkout.return.error.title')
})
it.each(['canceled', 'expired', 'failed'])('shows terminal %s payment outcomes without claiming success', async status => {
  mock.fetch.mockResolvedValue(response({ ...pending, status }))
  await render()
  expect(container.textContent).toContain(`checkout.return.${status}.title`)
  expect(container.textContent).not.toContain('checkout.return.success.title')
})
