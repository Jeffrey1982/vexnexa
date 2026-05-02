/**
 * Vitest global setup — runs before every test file.
 *
 * Responsibilities:
 *   1. Load test-only env vars so modules that read env at import time don't crash.
 *   2. Register global mocks for external services (Prisma, Supabase, Mollie,
 *      email) so unit tests never hit the network or the real database.
 *
 * Individual tests can override any of these with `vi.mock()` / `vi.doMock()`.
 */

import { afterEach, vi } from 'vitest'

// ── 1. Env ───────────────────────────────────────────────────────────────
process.env.NODE_ENV = 'test'
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/vexnexa_test'
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key'
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key'
process.env.MOLLIE_API_KEY ??= 'test_mollie_key'
process.env.MAILGUN_API_KEY ??= 'test-mailgun-key'
process.env.MAILGUN_DOMAIN ??= 'mg.test.vexnexa.com'
process.env.CRON_SECRET ??= 'test-cron-secret'
process.env.CRON_TOKEN ??= 'test-cron-secret'
process.env.NEXTAUTH_SECRET ??= 'test-nextauth-secret'
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000'

// ── 2. Global mocks ──────────────────────────────────────────────────────

// Prisma — return a chainable object so a.b.c.findMany() etc. doesn't throw.
vi.mock('@/lib/prisma', () => {
  const handler = {
    get(_target: unknown, prop: string) {
      // mock methods return resolved promises; models return proxies
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      return new Proxy(vi.fn().mockResolvedValue(null), handler)
    },
  }
  return { prisma: new Proxy({}, handler) }
})

// Supabase server/browser helpers.
vi.mock('@/lib/supabase', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  })),
}))

vi.mock('@/lib/supabaseAdmin', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        createUser: vi.fn(),
        deleteUser: vi.fn(),
        listUsers: vi.fn().mockResolvedValue({ data: { users: [] }, error: null }),
      },
    },
  },
}))

// Mollie.
vi.mock('@mollie/api-client', () => ({
  default: vi.fn(() => ({
    customers: { create: vi.fn(), get: vi.fn() },
    subscriptions: { create: vi.fn(), cancel: vi.fn(), get: vi.fn() },
    payments: { create: vi.fn(), get: vi.fn() },
  })),
  createMollieClient: vi.fn(() => ({
    customers: { create: vi.fn(), get: vi.fn() },
    subscriptions: { create: vi.fn(), cancel: vi.fn(), get: vi.fn() },
    payments: { create: vi.fn(), get: vi.fn() },
  })),
}))

// next/headers — provides the server-component cookie helper.
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    getAll: vi.fn(() => []),
  })),
  headers: vi.fn(() => new Map()),
}))

// ── 3. Reset per-test ────────────────────────────────────────────────────
afterEach(() => {
  vi.clearAllMocks()
})
