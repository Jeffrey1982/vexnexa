/**
 * Shared Playwright fixtures for Vexnexa E2E.
 *
 * Provides an `authedPage` fixture that tests can destructure to start
 * already signed in. Against local dev the fixture uses a dev-login route
 * (bypassing Supabase email verification); against staging it performs a
 * real login with E2E_USER_* credentials.
 */

import { test as base, expect, type Page } from '@playwright/test'

export type Env = 'local' | 'staging'

export const TEST_ENV: Env = (process.env.TEST_ENV ?? 'local') as Env

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel('Password', { exact: true }).fill(password)
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  await page.waitForURL(/\/dashboard/, { timeout: 15_000 })
}

function assertSafeLocalDatabase() {
  if (process.env.E2E_DATABASE_IS_SAFE !== 'true') {
    throw new Error('Authenticated local E2E requires E2E_DATABASE_IS_SAFE=true and a disposable vexnexa_ci_scratch database. Public smoke tests need no database.')
  }
  for (const key of ['DATABASE_URL', 'DIRECT_URL'] as const) {
    let url: URL
    try {
      url = new URL(process.env[key] ?? '')
    } catch {
      throw new Error(`${key} must explicitly point to the local E2E scratch database.`)
    }
    if (
      !['postgres:', 'postgresql:'].includes(url.protocol) ||
      !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
      url.pathname !== '/vexnexa_ci_scratch' ||
      url.hash ||
      [...url.searchParams].some(([name, value]) => name !== 'schema' || value !== 'public')
    ) {
      throw new Error(`${key} must use loopback and the disposable vexnexa_ci_scratch database; remote or existing application databases are not permitted.`)
    }
  }
  if (process.env.DATABASE_URL !== process.env.DIRECT_URL) {
    throw new Error('DATABASE_URL and DIRECT_URL must identify the same scratch database connection.')
  }
}

async function loginViaDevRoute(page: Page) {
  assertSafeLocalDatabase()
  // This dev-only route creates the fixture user, site and completed scan.
  // No website scanner or email provider is invoked. Production remains 404.
  const response = await page.request.post('/api/dev/login', {
    data: { email: 'e2e@vexnexa.test' },
  })
  if (!response.ok()) {
    throw new Error(
      `Dev login failed: ${response.status()}. ` +
        `Run a development server with the initialized local scratch database; ` +
        `do not enable a production auth bypass or opt into a remote database.`,
    )
  }
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/dashboard(?:\?|$)/)
}

export const test = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, runFixture) => {
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
      await loginViaDevRoute(page)
    }
    await runFixture(page)
  },
})

export { expect }
