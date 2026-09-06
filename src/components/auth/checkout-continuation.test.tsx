// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
const mock = vi.hoisted(() => ({ router: { push: vi.fn(), refresh: vi.fn() }, params: new URLSearchParams(), auth: { getUser: vi.fn(), signInWithOAuth: vi.fn(), signInWithPassword: vi.fn(), signUp: vi.fn(), resend: vi.fn() } }))
vi.mock('next/navigation', () => ({ useRouter: () => mock.router, useSearchParams: () => mock.params }))
vi.mock('next-intl', () => ({ useTranslations: (ns: string) => (key: string) => `${ns}.${key}` }))
vi.mock('next/link', () => ({ default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props}>{children}</a> }))
vi.mock('@/lib/supabase/client-new', () => ({ createClient: () => ({ auth: mock.auth }) }))
vi.mock('@/lib/urls', () => ({ getSiteUrl: () => 'https://app.test', buildAuthUrl: (path: string) => `https://app.test${path}` }))
import ModernLoginForm from './ModernLoginForm'
import ModernRegistrationForm from './ModernRegistrationForm'
const redirect = '/nl/pricing?checkoutPlan=BUSINESS&billingCycle=yearly#agency'
let root: Root
let container: HTMLDivElement
beforeEach(() => {
  ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
  vi.clearAllMocks()
  mock.params = new URLSearchParams({ redirect })
  mock.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
  mock.auth.signInWithOAuth.mockResolvedValue({ error: null })
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container)
})
afterEach(() => { act(() => root.unmount()); container.remove() })
it('preserves the checkout target when switching from login to registration', async () => {
  await act(async () => root.render(<ModernLoginForm />))
  const createAccount = [...container.querySelectorAll('button')].find(button => button.textContent?.includes('Create Free Account'))!
  await act(async () => createAccount.click())
  const target = new URL(mock.router.push.mock.calls[0][0], 'https://app.test')
  expect(target.pathname).toBe('/auth/register')
  expect(target.searchParams.get('redirect')).toBe(redirect)
  expect(mock.auth.signUp).not.toHaveBeenCalled()
})
it('preserves the checkout target on registration login links without creating an account', async () => {
  await act(async () => root.render(<ModernRegistrationForm />))
  const links = [...container.querySelectorAll<HTMLAnchorElement>('a')].filter(link => new URL(link.href).pathname === '/auth/login')
  expect(links.length).toBeGreaterThan(0)
  for (const link of links) expect(new URL(link.href).searchParams.get('redirect')).toBe(redirect)
  expect(mock.auth.signUp).not.toHaveBeenCalled()
})
it.each([ModernLoginForm, ModernRegistrationForm])('returns already authenticated customers to their selection', async Component => {
  mock.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  await act(async () => root.render(<Component />))
  expect(mock.router.push).toHaveBeenCalledWith(redirect)
})
it.each([ModernLoginForm, ModernRegistrationForm])('does not route authenticated customers to unsafe supplied URLs', async Component => {
  mock.params = new URLSearchParams({ redirect: 'javascript:alert(1)' })
  mock.auth.getUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
  await act(async () => root.render(<Component />))
  expect(mock.router.push).toHaveBeenCalledWith('/dashboard')
})
