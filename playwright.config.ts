import { defineConfig, devices } from '@playwright/test'

// This suite owns a local production server. It cannot target a live deployment.
// Contact submissions are intercepted in the browser before any email call.
const port = Number(process.env.E2E_LOCAL_PORT ?? '3010')
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('E2E_LOCAL_PORT must be an integer between 1024 and 65535.')
}
const baseURL = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './studio/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 2,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never', outputFolder: 'playwright-report/html' }], ['json', { outputFile: 'playwright-report/results.json' }]]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report/html' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    serviceWorkers: 'block',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port ${port}`,
    url: `${baseURL}/nl`,
    reuseExistingServer: false,
    timeout: 60_000,
    stdout: 'ignore',
    stderr: 'pipe',
    env: {
      // Prevent real emails even if ignored local env files exist.
      RESEND_API_KEY: '',
      RESEND_ADMIN_FROM_EMAIL: '',
      RESEND_FROM_EMAIL: '',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
})
