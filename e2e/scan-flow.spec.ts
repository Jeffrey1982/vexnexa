/**
 * Core scan flow E2E.
 *
 * Covers login → dashboard → sites → stored scan results → report preview.
 * Local development uses a completed fixture scan, never a real website scan.
 * Missing fixture data is a failure, not a reason to silently skip coverage.
 */

import type { Page } from '@playwright/test'
import { test, expect, TEST_ENV } from './fixtures'

async function getCompletedScan(page: Page): Promise<{ id: string; score: number; site: { url: string } }> {
  const response = await page.request.get('/api/scans?limit=20')
  expect(response.status(), 'Authenticated scans API must succeed').toBe(200)
  const body = await response.json()
  expect(body.ok).toBe(true)
  expect(Array.isArray(body.scans)).toBe(true)
  const scan = body.scans.find((item: { status: string }) => item.status === 'COMPLETED')
  expect(scan, 'The E2E account must contain a completed fixture scan').toBeTruthy()
  expect(typeof scan.id).toBe('string')
  expect(typeof scan.score).toBe('number')
  if (TEST_ENV === 'local') {
    expect(scan.site.url).toBe('https://example.com/')
    expect(scan.score).toBe(92)
    expect(scan.issues).toBe(1)
  }
  return scan
}

test('dashboard shows the sites overview to an authed user', async ({ authedPage }) => {
  await authedPage.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  await expect(authedPage).toHaveURL(/\/dashboard/)
  await expect(
    authedPage.getByRole('heading', { level: 1 }).first(),
  ).toBeVisible({ timeout: 10_000 })
  const scan = await getCompletedScan(authedPage)
  await expect(authedPage.locator(`main a[href="/scans/${scan.id}"]:visible`).first()).toBeVisible()
})

test('user can navigate to the sites list', async ({ authedPage }) => {
  await authedPage.goto('/dashboard', { waitUntil: 'domcontentloaded' })
  const sitesLink = authedPage.locator('a[href="/sites"]:visible').first()
  await expect(sitesLink).toBeVisible()
  await sitesLink.click()
  await expect(authedPage).toHaveURL(/\/sites(?:\?|$)/)
  await expect(authedPage.getByRole('heading', { name: 'Sites', exact: true })).toBeVisible()
  const scan = await getCompletedScan(authedPage)
  await expect(authedPage.getByText(scan.site.url, { exact: true })).toBeVisible()
})

test('scan results render the stored findings and score', async ({ authedPage }) => {
  const scan = await getCompletedScan(authedPage)
  const response = await authedPage.goto(`/scans/${scan.id}`, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(authedPage.getByText('Scan Details', { exact: true })).toBeVisible()
  await expect(authedPage.getByText('Total Issues', { exact: true }).first()).toBeVisible()
  if (TEST_ENV === 'local') {
    await expect(authedPage.getByLabel('Accessibility score: 92 out of 100').first()).toBeVisible()
    await expect(authedPage.getByText('Images must have alternate text', { exact: true }).first()).toBeVisible()
  }
})

test('stored scan has a populated HTML report preview', async ({ authedPage }) => {
  const scan = await getCompletedScan(authedPage)
  const response = await authedPage.goto(`/scans/${scan.id}/report-v2`, { waitUntil: 'domcontentloaded' })
  expect(response?.status()).toBe(200)
  await expect(authedPage.getByRole('heading', { name: 'Premium Compliance Report', exact: true })).toBeVisible()
  const report = authedPage.frameLocator('iframe[title="Accessibility Compliance Report"]')
  // The domain also appears in the hidden running print header. Assert the
  // actual cover metadata, which is visible in both report styles.
  const coverDomain = report.locator('.cover-page .cover-domain-block .cover-domain-value')
  await expect(coverDomain).toHaveText(new URL(scan.site.url).hostname)
  await expect(coverDomain).toBeVisible()
  if (TEST_ENV === 'local') {
    await expect(report.getByText('Images Missing Alternative Text', { exact: true }).first()).toBeVisible()
  }
})
