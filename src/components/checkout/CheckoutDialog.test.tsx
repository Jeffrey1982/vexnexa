// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ router: { push: vi.fn() }, fetch: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => mock.router }))
vi.mock('next-intl', () => ({ useLocale: () => 'nl', useTranslations: (namespace: string) => (key: string) => `${namespace}.${key}` }))
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div role="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: React.ReactNode }) => <h2>{children}</h2>,
}))
import { CheckoutDialog } from './CheckoutDialog'
let root: Root
let container: HTMLDivElement
let paymentResponse: () => Promise<Response>
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks()
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
  paymentResponse = async () => new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })
  mock.fetch.mockImplementation((url: string) => url === '/api/billing/profile'
    ? Promise.resolve(new Response(JSON.stringify({ profile: null }))) : paymentResponse())
  vi.stubGlobal('fetch', mock.fetch)
})
afterEach(() => { act(() => root.unmount()); container.remove(); vi.unstubAllGlobals() })
async function render() { await act(async () => root.render(<CheckoutDialog open onOpenChange={vi.fn()} planKey="BUSINESS" billingCycle="yearly" />)) }
const submit = () => [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Continue to payment'))!
it('does not create a payment merely by restoring the selected plan', async () => {
  await render()
  expect(container.textContent).toContain('VexNexa Agency')
  expect(container.textContent).toContain('Annual')
  expect(mock.fetch.mock.calls.every((call: unknown[]) => call[0] === '/api/billing/profile')).toBe(true)
})
it('sends an unauthenticated customer to login with a localized safe plan continuation', async () => {
  await render()
  await act(async () => submit().click())
  expect(mock.fetch).toHaveBeenCalledWith('/api/billing/create-payment', expect.objectContaining({ body: JSON.stringify({ plan: 'BUSINESS', billingCycle: 'yearly', purchaseAs: 'individual' }) }))
  const auth = new URL(mock.router.push.mock.calls[0][0], 'https://app.test')
  expect(auth.pathname).toBe('/auth/login')
  expect(auth.searchParams.get('redirect')).toBe('/nl/pricing?checkoutPlan=BUSINESS&billingCycle=yearly#agency')
  expect(submit().disabled).toBe(false)
})
it('prevents duplicate submissions while a payment request is in flight', async () => {
  let resolve!: (response: Response) => void
  paymentResponse = () => new Promise(value => { resolve = value })
  await render()
  await act(async () => { submit().click(); submit().click() })
  expect(mock.fetch.mock.calls.filter((call: unknown[]) => call[0] === '/api/billing/create-payment')).toHaveLength(1)
  await act(async () => resolve(new Response('{}', { status: 401 })))
})
it.each([new Response('{}', { status: 500 }), new Response('{}', { status: 200 })])('shows a recoverable error for invalid checkout response', async response => {
  paymentResponse = async () => response
  await render(); await act(async () => submit().click())
  expect(container.textContent).toContain('apiErrors.checkoutFailed')
  expect(mock.router.push).not.toHaveBeenCalled()
  expect(submit().disabled).toBe(false)
})
it('allows retry after a network failure without losing the selected plan', async () => {
  paymentResponse = async () => { throw new Error('offline') }
  await render(); await act(async () => submit().click())
  expect(container.textContent).toContain('apiErrors.network')
  expect(container.textContent).toContain('VexNexa Agency')
  paymentResponse = async () => new Response('{}', { status: 401 })
  await act(async () => submit().click())
  expect(mock.router.push).toHaveBeenCalledOnce()
})
