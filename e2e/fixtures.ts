/**
 * Shared Playwright fixtures for Vexnexa E2E.
 *
 * Provides an `authedPage` fixture that tests can destructure to start
 * already signed in. Against local dev the fixture uses a dev-login route
 * (bypassing Supabase email verification); against staging it performs a
 * real login with E2E_USER_* credentials.
 */

import { test as base, expect, type Page, type TestInfo } from '@playwright/test'

export type Env = 'local' | 'staging'

export const TEST_ENV: Env = (process.env.TEST_ENV ?? 'local') as Env

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/password/i).fill(password)
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

async function loginViaDevRoute(page: Page, testInfo: TestInfo) {
  // Expects a dev-only route that drops a session cookie for a seeded user.
  // See src/app/api/dev/login/route.ts (only enabled when NODE_ENV !== 'production').
  const response = await page.request.post('/api/dev/login', {
    data: { email: 'e2e@vexnexa.test' },
  })
  if (!response.ok()) {
    const body = await response.json().catch(() => null)
    if (response.status() === 403 && body?.code === 'REMOTE_DB_DEV_LOGIN_DISABLED') {
      testInfo.skip(
        true,
        'local authenticated E2E skipped because DATABASE_URL/DIRECT_URL points at Supabase; use a local test DB or ALLOW_REMOTE_DEV_LOGIN=true deliberately',
      )
    }
    throw new Error(
      `Dev login failed: ${response.status()}. ` +
        `Make sure the dev server is running with NODE_ENV=development and ` +
        `the seed script has created the e2e@vexnexa.test user.`,
    )
  }
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use, testInfo) => {
    if (TEST_ENV === 'staging') {
      const email = process.env.E2E_USER_EMAIL
      const password = process.env.E2E_USER_PASSWORD
      if (!email || !password) {
        throw new Error(
          'Staging E2E requires E2E_USER_EMAIL and E2E_USER_PASSWORD env vars.',
        )
      }
      await loginViaUi(page, email, password)
    } else {
      await loginViaDevRoute(page, testInfo)
    }
    await use(page)
  },
})

export { expect }
