/**
 * Unit tests for src/lib/rate-limit.ts — in-memory rate limiter used by
 * middleware.ts for auth and API routes. Tests the windowing, reset, and
 * counter behaviour without hitting any real HTTP layer.
 */

import { describe, it, expect } from 'vitest'
import { rateLimit } from '../rate-limit'
import type { NextRequest } from 'next/server'

function fakeReq(ip = '1.2.3.4'): NextRequest {
  return {
    headers: { get: (name: string) => (name === 'x-forwarded-for' ? ip : null) },
  } as unknown as NextRequest
}

describe('rateLimit', () => {
  it('allows the first request under the limit', () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 60_000 })
    const result = limiter(fakeReq('10.0.0.1'))
    expect(result.success).toBe(true)
    expect(result.remaining).toBe(2)
    expect(result.limit).toBe(3)
  })

  it('decrements remaining on each call', () => {
    const limiter = rateLimit({ maxRequests: 3, windowMs: 60_000 })
    const ip = '10.0.0.2'
    const r1 = limiter(fakeReq(ip))
    const r2 = limiter(fakeReq(ip))
    const r3 = limiter(fakeReq(ip))
    expect(r1.remaining).toBe(2)
    expect(r2.remaining).toBe(1)
    expect(r3.remaining).toBe(0)
    expect(r3.success).toBe(true)
  })

  it('blocks the (N+1)th request with success=false', () => {
    const limiter = rateLimit({ maxRequests: 2, windowMs: 60_000 })
    const ip = '10.0.0.3'
    limiter(fakeReq(ip))
    limiter(fakeReq(ip))
    const blocked = limiter(fakeReq(ip))
    expect(blocked.success).toBe(false)
    expect(blocked.remaining).toBe(0)
  })

  it('counts IPs independently', () => {
    const limiter = rateLimit({ maxRequests: 1, windowMs: 60_000 })
    const a = limiter(fakeReq('10.0.0.10'))
    const b = limiter(fakeReq('10.0.0.11'))
    expect(a.success).toBe(true)
    expect(b.success).toBe(true)
  })

  it('resets count after window expires', async () => {
    const limiter = rateLimit({ maxRequests: 1, windowMs: 50 })
    const ip = '10.0.0.20'
    const first = limiter(fakeReq(ip))
    expect(first.success).toBe(true)
    const blocked = limiter(fakeReq(ip))
    expect(blocked.success).toBe(false)

    await new Promise((r) => setTimeout(r, 80))
    const afterReset = limiter(fakeReq(ip))
    expect(afterReset.success).toBe(true)
    expect(afterReset.remaining).toBe(0)
  })

  it('uses a custom identifier when provided', () => {
    const limiter = rateLimit({
      maxRequests: 1,
      windowMs: 60_000,
      identifier: () => 'fixed-key',
    })
    const a = limiter(fakeReq('10.0.0.30'))
    const b = limiter(fakeReq('10.0.0.31'))
    expect(a.success).toBe(true)
    // Different IPs but same identifier key → same bucket
    expect(b.success).toBe(false)
  })

  it('returns a resetTime in the future', () => {
    const limiter = rateLimit({ maxRequests: 5, windowMs: 60_000 })
    const result = limiter(fakeReq('10.0.0.40'))
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })
})
