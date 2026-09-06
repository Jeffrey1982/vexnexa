import { beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
const mock = vi.hoisted(() => ({ exchange: vi.fn(), sync: vi.fn(), welcome: vi.fn(), notify: vi.fn() }))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: async () => ({ auth: { exchangeCodeForSession: mock.exchange } }) }))
vi.mock('@/lib/user-sync', () => ({ ensureUserInDatabase: mock.sync }))
vi.mock('@/lib/email', () => ({ sendWelcomeEmail: mock.welcome, sendNewUserNotification: mock.notify }))
import { GET } from './route'
const redirect = '/nl/pricing?checkoutPlan=BUSINESS&billingCycle=yearly#agency'
const user = (overrides = {}) => ({ id: 'u1', email: 'person@example.test', created_at: '2025-01-01T00:00:00Z', last_sign_in_at: '2026-01-01T00:00:00Z', email_confirmed_at: '2025-01-01T00:00:00Z', user_metadata: { first_name: 'Test', last_name: 'User' }, ...overrides })
beforeEach(() => { vi.clearAllMocks(); mock.exchange.mockResolvedValue({ data: { user: user() }, error: null }); mock.sync.mockResolvedValue({ id: 'u1' }) })
const request = (extra = {}) => new NextRequest(`https://app.test/auth/callback?${new URLSearchParams({ code: 'fixture', redirect, ...extra })}`)
const destination = async (req = request()) => new URL((await GET(req)).headers.get('location')!)
it('returns existing OAuth users to the selected plan without creating a payment', async () => {
  const target = await destination()
  expect(`${target.pathname}${target.search}${target.hash}`).toBe(redirect)
  expect(mock.welcome).not.toHaveBeenCalled()
})
it('carries the selected plan through email verification', async () => {
  const target = await destination(request({ flow: 'signup' }))
  expect(target.pathname).toBe('/auth/verified')
  expect(target.searchParams.get('redirect')).toBe(redirect)
})
it('carries a new OAuth customer through required onboarding', async () => {
  mock.exchange.mockResolvedValue({ data: { user: user({ last_sign_in_at: '2025-01-01T00:00:00Z', user_metadata: {} }) }, error: null })
  const target = await destination()
  expect(target.pathname).toBe('/onboarding')
  expect(target.searchParams.get('redirect')).toBe(redirect)
})
it('returns complete new profiles to the selection instead of dropping it for the welcome screen', async () => {
  mock.exchange.mockResolvedValue({ data: { user: user({ last_sign_in_at: '2025-01-01T00:00:00Z' }) }, error: null })
  const target = await destination()
  expect(`${target.pathname}${target.search}${target.hash}`).toBe(redirect)
})
it('keeps OAuth error recovery on the same selected plan', async () => {
  const target = await destination(request({ error: 'access_denied' }))
  expect(target.pathname).toBe('/auth/login')
  expect(target.searchParams.get('redirect')).toBe(redirect)
  expect(target.searchParams.get('error')).toBe('oauth_error')
})
it.each(['https://evil.test/checkout', '//evil.test', '/\\evil.test', 'javascript:alert(1)'])('rejects unsafe callback target %s', async unsafe => {
  const target = await destination(request({ redirect: unsafe }))
  expect(target.origin).toBe('https://app.test')
  expect(target.pathname).toBe('/dashboard')
})
it('leaves password recovery separate from checkout continuation', async () => {
  const target = await destination(request({ type: 'recovery' }))
  expect(target.pathname).toBe('/auth/reset-password')
})
