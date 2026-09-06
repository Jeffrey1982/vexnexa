import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const mocks = vi.hoisted(() => ({ getUser: vi.fn() }))
vi.mock('@supabase/ssr', () => ({ createServerClient: () => ({ auth: { getUser: mocks.getUser } }) }))
vi.mock('@/lib/rate-limit', () => ({ apiLimiter: vi.fn(), authLimiter: vi.fn() }))

import { proxy } from './proxy'

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://auth.example.test')
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'fixture')
  mocks.getUser.mockReset().mockResolvedValue({ data: { user: null }, error: null })
})
afterEach(() => vi.unstubAllEnvs())

it.each(['/checkout/return?paymentId=tr_fixture', '/checkout/return/?id=tr_fixture'])('allows the real payment return %s without caching or exposing it to search engines', async path => {
  const response = await proxy(new NextRequest(`https://app.example.test${path}`))
  expect(response.status).toBe(200)
  expect(response.headers.get('x-middleware-next')).toBe('1')
  expect(response.headers.get('cache-control')).toBe('private, no-store')
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  expect(response.headers.get('x-frame-options')).toBe('DENY')
  expect(mocks.getUser).toHaveBeenCalledOnce()
})

it.each(['/checkout', '/checkout/', '/checkout/legacy-token', '/checkout/return/legacy', '/checkout/returning', '/checkout/success', '/nl/checkout', '/nl/checkout/legacy-token', '/products/old-item', '/collections/old-items', '/cart'])('keeps retired Shopify URL %s gone', async path => {
  const response = await proxy(new NextRequest(`https://app.example.test${path}`))
  expect(response.status).toBe(410)
  expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow')
  expect(mocks.getUser).not.toHaveBeenCalled()
})
