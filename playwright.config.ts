/**
 * Playwright config for Vexnexa E2E tests.
 *
 * Usage:
 *   npm run test:e2e          # default project (local)
 *   npm run test:e2e:local    # against http://localhost:3000
 *   npm run test:e2e:staging  # against STAGING_URL (env var required)
 *   npm run test:e2e:ui       # open Playwright UI mode
 *
 * Env vars:
 *   TEST_ENV           'local' (default) | 'staging'
 *   E2E_LOCAL_PORT     Local port (default 3000; use 3001 alongside a preview)
 *   E2E_DATABASE_IS_SAFE  'true' to allow fixtures in vexnexa_ci_scratch
 *   STAGING_URL        Base URL for staging, e.g. https://staging.vexnexa.com
 *   E2E_USER_EMAIL     Test account email (staging only)
 *   E2E_USER_PASSWORD  Test account password (staging only)
 */

import { defineConfig, devices } from '@playwright/test'

const TEST_ENV = process.env.TEST_ENV ?? 'local'
if (TEST_ENV !== 'local' && TEST_ENV !== 'staging') {
  throw new Error('TEST_ENV must be local or staging.')
}

const localPort = Number(process.env.E2E_LOCAL_PORT ?? '3000')
if (!Number.isInteger(localPort) || localPort < 1024 || localPort > 65535) {
  throw new Error('E2E_LOCAL_PORT must be an integer between 1024 and 65535.')
}
const LOCAL_URL = `http://localhost:${localPort}`
const STAGING_URL = process.env.STAGING_URL
if (TEST_ENV === 'staging') {
  if (!STAGING_URL) throw new Error('STAGING_URL must explicitly identify a test deployment.')
  const staging = new URL(STAGING_URL)
  if (staging.protocol !== 'https:' || ['vexnexa.com', 'www.vexnexa.com'].includes(staging.hostname)) {
    throw new Error('Staging E2E requires an HTTPS test deployment, not the production site.')
  }
}

const baseURL = TEST_ENV === 'staging' ? STAGING_URL : LOCAL_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Dev fixtures share a seeded user. Serial runs also avoid cold-compilation
  // contention on the CI runner; missing data must fail, not become a retry race.
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 10_000 },

  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // A previously installed worker must not hide a failed network response.
    serviceWorkers: 'block',
    // Inject test env for helpers
    extraHTTPHeaders: { 'x-test-env': TEST_ENV },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Optional: enable additional browsers by uncommenting:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],

  // Only start a local dev server when testing against localhost.
  webServer:
    TEST_ENV === 'local'
      ? {
          command: `npm run dev -- --hostname 127.0.0.1 --port ${localPort}`,
          url: LOCAL_URL,
          // Fixture runs must own their server/environment. Never send dev-login
          // writes to a preview that may have been started with a real database.
          reuseExistingServer: !process.env.CI && process.env.E2E_DATABASE_IS_SAFE !== 'true',
          timeout: 180_000,
          stdout: 'ignore',
          stderr: 'pipe',
        }
      : undefined,
})
