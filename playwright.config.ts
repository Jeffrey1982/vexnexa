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
 *   STAGING_URL        Base URL for staging, e.g. https://staging.vexnexa.com
 *   E2E_USER_EMAIL     Test account email (staging only)
 *   E2E_USER_PASSWORD  Test account password (staging only)
 */

import { defineConfig, devices } from '@playwright/test'

const TEST_ENV = (process.env.TEST_ENV ?? 'local') as 'local' | 'staging'

const LOCAL_URL = 'http://localhost:3000'
const STAGING_URL = process.env.STAGING_URL ?? 'https://staging.vexnexa.com'

const baseURL = TEST_ENV === 'staging' ? STAGING_URL : LOCAL_URL

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 1,
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
          command: 'npm run dev',
          url: LOCAL_URL,
          reuseExistingServer: !process.env.CI,
          timeout: 180_000,
          stdout: 'ignore',
          stderr: 'pipe',
        }
      : undefined,
})
