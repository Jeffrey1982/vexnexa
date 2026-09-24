import { test, expect, type Page } from '@playwright/test'
import { content, locales, type Locale } from '../lib/content'

const publicPaths = ['', '/games/ipiwow', '/studio', '/contact', '/privacy', '/support']
const languageTag = (locale: Locale) => locale === 'pt' ? 'pt-PT' : locale

test.beforeEach(async ({ page }) => {
  // All tests are local. External tracking, databases and payment providers must
  // never be necessary for rendering this static studio or using its form.
  await page.route(/https?:\/\/[^/]*(?:supabase|mollie|google-analytics|googletagmanager)\./, route => route.abort('blockedbyclient'))
})

for (const locale of locales) {
  const copy = content[locale]
  test(`${locale}: all six pages render in the selected language with canonical alternates`, async ({ page }) => {
    const forbidden: string[] = []
    page.on('request', request => {
      if (/supabase\.|mollie\.|google-analytics\.|googletagmanager\./.test(request.url())) forbidden.push(request.url())
    })
    for (const path of publicPaths) {
      const response = await page.goto(`/${locale}${path}`)
      expect(response?.status()).toBe(200)
      await expect(page.locator('html')).toHaveAttribute('lang', languageTag(locale))
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('combobox', { name: copy.common.language })).toHaveValue(locale)
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://vexnexa.com/${locale}${path}`)
      for (const alternate of locales) {
        await expect(page.locator(`link[rel="alternate"][hreflang="${languageTag(alternate)}"]`))
          .toHaveAttribute('href', `https://vexnexa.com/${alternate}${path}`)
      }
      await expect(page.locator('link[rel="alternate"][hreflang="x-default"]'))
        .toHaveAttribute('href', `https://vexnexa.com/en${path}`)
    }
    expect(forbidden).toEqual([])
  })

  test(`${locale}: localized mobile navigation and layout work at 320px`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 })
    await page.goto(`/${locale}`)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(copy.home.heroTitle[0])
    await expect(page.getByRole('heading', { level: 1 })).toContainText(copy.home.heroTitle[1])
    const menu = page.getByRole('button', { name: copy.common.menu, exact: true })
    await expect(menu).toBeVisible()
    await menu.click()
    await expect(page.getByRole('button', { name: copy.common.closeMenu, exact: true })).toHaveAttribute('aria-expanded', 'true')
    await page.locator('header nav').getByRole('link', { name: copy.nav.contact, exact: true }).click()
    await expect(page).toHaveURL(new RegExp(`/${locale}/contact$`))
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(copy.contact.title)
    await expect(page.getByRole('button', { name: copy.common.menu, exact: true })).toHaveAttribute('aria-expanded', 'false')
    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)
    expect(horizontalOverflow).toBe(false)
  })

  test(`${locale}: contact confirmation appears only after mocked provider acceptance`, async ({ page }) => {
    const submissions: Record<string, unknown>[] = []
    await page.route('**/api/contact', async route => {
      submissions.push(route.request().postDataJSON())
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
    })
    await page.goto(`/${locale}/contact`)
    await fillContact(page)
    await page.getByRole('button', { name: copy.contact.submit, exact: true }).click()
    await expect(page.getByRole('status')).toContainText(copy.contact.successTitle)
    expect(submissions).toHaveLength(1)
    expect(submissions[0]).toMatchObject({ name: 'Studio test', email: 'studio-test@example.invalid', locale, privacyAccepted: true, website: '' })
    expect(submissions[0].requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/i)
  })
}

async function fillContact(page: Page) {
  await page.locator('#contact-name').fill('Studio test')
  await page.locator('#contact-email').fill('studio-test@example.invalid')
  await page.locator('#contact-message').fill('This is a local intercepted browser test. No email must be sent.')
  await page.locator('input[name="privacyAccepted"]').check()
}

test('language switching keeps the IpiWow detail page and updates document metadata', async ({ page }) => {
  await page.goto('/nl/games/ipiwow')
  let current: Locale = 'nl'
  for (const locale of ['en', 'de', 'fr', 'es', 'pt', 'tl', 'nl'] as const) {
    await page.getByRole('combobox', { name: content[current].common.language }).selectOption(locale)
    await expect(page).toHaveURL(new RegExp(`/${locale}/games/ipiwow$`))
    await expect(page.locator('html')).toHaveAttribute('lang', languageTag(locale))
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://vexnexa.com/${locale}/games/ipiwow`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(content[locale].ipiwow.tagline)
    current = locale
  }
})

test('form retains the message and idempotency key after delivery failure, then safely retries', async ({ page }) => {
  const requests: Record<string, unknown>[] = []
  await page.route('**/api/contact', async route => {
    requests.push(route.request().postDataJSON())
    await route.fulfill({
      status: requests.length === 1 ? 502 : 200,
      contentType: 'application/json',
      body: JSON.stringify(requests.length === 1 ? { success: false, error: 'delivery_failed' } : { success: true }),
    })
  })
  await page.goto('/en/contact')
  await fillContact(page)
  await page.getByRole('button', { name: content.en.contact.submit, exact: true }).click()
  await expect(page.getByTestId('contact-form').getByRole('alert')).toContainText(content.en.contact.errors.send)
  await expect(page.locator('#contact-message')).not.toHaveValue('')
  await expect(page.getByRole('status')).toHaveCount(0)
  await page.getByRole('button', { name: content.en.contact.submit, exact: true }).click()
  await expect(page.getByRole('status')).toContainText(content.en.contact.successTitle)
  expect(requests).toHaveLength(2)
  expect(requests[0].requestId).toBe(requests[1].requestId)
})

test('invalid form data never makes a network submission', async ({ page }) => {
  let submissions = 0
  await page.route('**/api/contact', async route => { submissions += 1; await route.abort() })
  await page.goto('/en/contact')
  await page.getByRole('button', { name: content.en.contact.submit, exact: true }).click()
  await expect(page.getByTestId('contact-form')).toBeVisible()
  expect(submissions).toBe(0)
  await expect(page.getByRole('status')).toHaveCount(0)
})

test('IpiWow App Store destination is exact and no SaaS checkout is advertised', async ({ page }) => {
  await page.goto('/en/games/ipiwow')
  const storeLinks = page.locator('a[href*="apps.apple.com"]')
  expect(await storeLinks.count()).toBeGreaterThan(0)
  for (const link of await storeLinks.all()) {
    await expect(link).toHaveAttribute('href', 'https://apps.apple.com/app/ipiwow/id6810626778')
  }
  await expect(page.locator('a[href*="/checkout"], a[href*="/pricing"], a[href*="/auth/"]')).toHaveCount(0)
})

test('old SaaS pages redirect to support and old APIs are retired without side effects', async ({ request }) => {
  for (const path of ['/pricing', '/auth/login', '/dashboard']) {
    const response = await request.get(path, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(response.headers().location, response.url()).pathname).toBe('/nl/support')
  }
  for (const path of ['/api/mollie/webhook', '/api/cron/lead-nurture', '/api/scan', '/api/free-scan']) {
    const response = await request.get(path)
    expect(response.status()).toBe(410)
    expect((await response.json()).error).toBe('service_retired')
  }
  const missing = await request.get('/en/not-a-real-studio-page')
  expect(missing.status()).toBe(404)
  const health = await request.get('/api/health')
  expect(health.status()).toBe(200)
  expect(await health.json()).toMatchObject({ ok: true, service: 'vexnexa-game-studio' })
})

test('production smoke contract passes against the local build without sending email', async ({ baseURL }) => {
  const { runSmoke } = await import('../../scripts/production-smoke.mjs')
  const messages: string[] = []
  const failures = await runSmoke({ baseUrl: baseURL!, log: (message: string) => { messages.push(message) } })
  expect(messages.filter(message => message.startsWith('FAIL'))).toEqual([])
  expect(failures).toBe(0)
  expect(messages).toHaveLength(21)
})

for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 1000 }]) {
  test(`visual review capture: Dutch homepage at ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport)
    await page.goto('/nl')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(content.nl.home.heroTitle[0])
    await page.evaluate(() => document.fonts.ready)
    const screenshot = await page.screenshot({ path: `playwright-report/studio-nl-${viewport.width}.png`, fullPage: true, animations: 'disabled' })
    await testInfo.attach(`studio-nl-${viewport.width}`, { body: screenshot, contentType: 'image/png' })
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false)
  })
}
