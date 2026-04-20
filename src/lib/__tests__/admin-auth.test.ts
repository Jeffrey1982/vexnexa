/**
 * Unit tests for src/lib/adminAuth.ts — header-based admin gate used
 * by the internal admin API routes.
 *
 * adminAuth reads ADMIN_DASH_SECRET at import time, so we use
 * vi.resetModules() + dynamic import() to exercise different env states.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { NextRequest } from 'next/server'

function req(secret?: string | null): NextRequest {
  return {
    headers: {
      get: (name: string) =>
        name === 'x-admin-secret' ? secret ?? null : null,
    },
  } as unknown as NextRequest
}

describe('assertAdmin', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('passes when the secret matches', async () => {
    process.env.ADMIN_DASH_SECRET = 'super-secret-123'
    const { assertAdmin } = await import('../adminAuth')
    expect(() => assertAdmin(req('super-secret-123'))).not.toThrow()
  })

  it('throws when the secret is missing from the request', async () => {
    process.env.ADMIN_DASH_SECRET = 'super-secret-123'
    const { assertAdmin } = await import('../adminAuth')
    expect(() => assertAdmin(req(null))).toThrow(/unauthorized/i)
  })

  it('throws on a wrong secret', async () => {
    process.env.ADMIN_DASH_SECRET = 'super-secret-123'
    const { assertAdmin } = await import('../adminAuth')
    expect(() => assertAdmin(req('wrong'))).toThrow(/unauthorized/i)
  })

  it('throws a configuration error when ADMIN_DASH_SECRET is unset', async () => {
    delete process.env.ADMIN_DASH_SECRET
    const { assertAdmin } = await import('../adminAuth')
    expect(() => assertAdmin(req('anything'))).toThrow(
      /ADMIN_DASH_SECRET.*not configured/i,
    )
  })
})
