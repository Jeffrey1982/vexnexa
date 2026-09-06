/**
 * Authentication flow E2E — covers the shapes of signup, login error
 * handling, and the auth gate on /dashboard.
 *
 * These tests never create accounts or send email. The auth-provider rejection
 * is a browser-only fixture; the protected-page gate still uses the real server.
 */

import { test, expect } from '@playwright/test'

test('unauthenticated users are redirected from /dashboard to /auth/login', async ({ page }) => {
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(page).toHaveURL(/\/(auth\/)?login/)
})

test('login page shows validation error on empty submit', async ({ page }) => {
  await page.goto('/auth/login', { waitUntil: 'domcontentloaded' })
  // The login page also renders 'Sign in with Google' — target the submit button specifically.
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()
  // Either native browser validation or a visible error message is acceptable.
  const errorVisible = await page
    .getByText(/required|verplicht|invalid|ongeldig/i)
    .first()
    .isVisible()
    .catch(() => false)
  const emailInvalid = await page
    .getByLabel(/email/i)
    .evaluate((el: HTMLInputElement) => !el.validity.valid)
    .catch(() => false)
  expect(errorVisible || emailInvalid).toBe(true)
})

test.describe('authentication rejection UI', () => {
  // The CI auth URL is intentionally a dummy loopback service. Bypass CSP only
  // in this isolated browser test so the intercepted response reaches the UI.
  // No application policy is changed and no real provider receives credentials.
  test.use({ bypassCSP: true })

  test('login with rejected credentials shows a user-visible error', async ({ page }) => {
    let intercepted = false
    await page.route('**/auth/v1/token?**', async (route) => {
      intercepted = true
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
      })
    })
    await page.goto('/auth/login', { waitUntil: 'load' })
    // SSR fields are visible before React is interactive. Confirm a real
    // interaction first, otherwise hydration can erase values entered early.
    await expect(async () => {
      await page.getByRole('button', { name: 'Show password', exact: true }).click()
      await expect(page.getByRole('button', { name: 'Hide password', exact: true })).toBeVisible({ timeout: 1_000 })
    }).toPass({ timeout: 15_000 })
    await page.getByLabel(/email/i).fill('nobody@vexnexa.test')
    await page.getByLabel('Password', { exact: true }).fill('wrong-password-123')
    await page.getByRole('button', { name: 'Sign In', exact: true }).click()

    await expect(page.locator('#login-error')).toBeVisible()
    await expect(page.locator('#login-error')).not.toBeEmpty()
    await expect(page.getByRole('button', { name: 'Sign In', exact: true })).toBeEnabled()
    await expect(page).toHaveURL(/\/(auth\/)?login/)
    expect(intercepted, 'The invalid credentials must be handled by the test fixture').toBe(true)
  })
})

test('signup page exposes email and password fields without creating an account', async ({ page }) => {
  await page.goto('/auth/register', { waitUntil: 'domcontentloaded' })
  await expect(page.getByLabel(/email/i)).toBeVisible()
  // Register page has both 'Password' and 'Confirm Password' — assert the first.
  await expect(page.getByLabel(/password/i).first()).toBeVisible()
})
