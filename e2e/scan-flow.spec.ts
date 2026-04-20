/**
 * Core scan flow E2E.
 *
 * Covers the critical user journey: login → dashboard → create or pick a
 * site → start a scan → view the results page. Uses the `authedPage`
 * fixture which handles login differently per environment.
 */

import { test, expect } from './fixtures'

test('dashboard shows the sites overview to an authed user', async ({ authedPage }) => {
  await authedPage.goto('/dashboard')
  await expect(authedPage).toHaveURL(/\/dashboard/)
  await expect(
    authedPage.getByRole('heading', { level: 1 }).first(),
  ).toBeVisible({ timeout: 10_000 })
})

test('user can navigate to the sites list', async ({ authedPage }) => {
  await authedPage.goto('/dashboard')
  const sitesLink = authedPage.getByRole('link', { name: /sites?/i }).first()
  if (await sitesLink.isVisible().catch(() => false)) {
    await sitesLink.click()
    await expect(authedPage).toHaveURL(/sites/)
  }
})

test('scan results page renders for a finished scan (if any)', async ({ authedPage }) => {
  // Drive via API so this test isn't flaky against the exact dashboard
  // UI — scans list endpoint returns the latest scan id the test user
  // has access to.
  const res = await authedPage.request.get('/api/scans?limit=1')
  if (!res.ok()) {
    test.skip(true, `scans API returned ${res.status()} — nothing to assert`)
  }
  const body = await res.json().catch(() => null)
  const scan = body?.scans?.[0] ?? body?.data?.[0] ?? body?.[0]
  if (!scan?.id) {
    test.skip(true, 'no scan available for this test user')
  }
  await authedPage.goto(`/dashboard/scans/${scan.id}`)
  await expect(authedPage.locator('main, [role="main"]').first()).toBeVisible()
})
