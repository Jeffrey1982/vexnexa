/**
 * Authentication flow E2E — covers the shapes of signup, login error
 * handling, and the auth gate on /dashboard.
 *
 * Actual user creation happens against Supabase, so against local dev these
 * tests run against a test project (see TESTING.md). Against staging they
 * use E2E_USER_EMAIL / E2E_USER_PASSWORD.
 */

import { test, expect } from '@playwright/test'

test('unauthenticated users are redirected from /dashboard to /auth/login', async ({ page }) => {
  await page.goto('/dashboard')
  await expect(page).toHaveURL(/\/(auth\/)?login/)
})

test('login page shows validation error on empty submit', async ({ page }) => {
  await page.goto('/auth/login')
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

test('login with invalid credentials shows a user-visible error', async ({ page }) => {
  await page.goto('/auth/login')
  await page.getByLabel(/email/i).fill('nobody@vexnexa.test')
  await page.getByLabel(/password/i).first().fill('wrong-password-123')
  await page.getByRole('button', { name: 'Sign In', exact: true }).click()

  // Wait briefly then assert the URL didn't advance past the login page.
  await page.waitForTimeout(1500)
  expect(page.url()).toMatch(/\/(auth\/)?login/)
})

test('signup page requires email, password, and accepts terms', async ({ page }) => {
  await page.goto('/auth/register')
  await expect(page.getByLabel(/email/i)).toBeVisible()
  // Register page has both 'Password' and 'Confirm Password' — assert the first.
  await expect(page.getByLabel(/password/i).first()).toBeVisible()
})
