/**
 * Public-site smoke tests — verifies that unauthenticated marketing pages
 * render without server errors or obvious layout regressions.
 *
 * These should pass against both local dev and production/staging with no
 * seed data, since they hit only public routes.
 */

import { test, expect } from '@playwright/test'

const PUBLIC_ROUTES = [
  { path: '/', title: /vexnexa/i },
  { path: '/features', title: /feature|vexnexa/i },
  { path: '/pricing', title: /pricing|prijzen|vexnexa/i },
  { path: '/contact', title: /contact|vexnexa/i },
  { path: '/sample-report', title: /sample report|rapport|vexnexa/i },
  { path: '/updates', title: /status|updates|vexnexa/i },
  { path: '/methodology', title: /methodology|vexnexa/i },
  { path: '/compliance', title: /compliance|trust|vexnexa/i },
  { path: '/legal/security', title: /security|privacy|vexnexa/i },
  { path: '/auth/login', title: /log ?in|sign ?in|vexnexa/i },
  { path: '/auth/register', title: /sign ?up|register|vexnexa/i },
]

for (const { path, title } of PUBLIC_ROUTES) {
  test(`public route ${path} renders with 200`, async ({ page }) => {
    const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
    expect(response, `No response for ${path}`).not.toBeNull()
    expect(response!.status(), `Bad status for ${path}`).toBeLessThan(400)
    await expect(page).toHaveTitle(title)
  })
}

test('home page has a working CTA that points at signup or pricing', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const cta = page
    .getByRole('link', { name: /get started|start|try|sign ?up|pricing/i })
    .first()
  await expect(cta).toBeVisible()
  const href = await cta.getAttribute('href')
  expect(href).toMatch(/\/(auth\/register|signup|pricing|register|start)/)
})

test('pricing page shows at least 3 plans', async ({ page }) => {
  await page.goto('/pricing', { waitUntil: 'domcontentloaded' })
  // Don't hard-code plan names — the site is multilingual. Just count them.
  const planCards = page.locator('[data-plan], [data-testid="plan-card"], article')
  const count = await planCards.count()
  expect(count).toBeGreaterThanOrEqual(3)
})

test('language switcher changes page content', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const heading = page.getByRole('heading', { level: 1 })
  const englishHeading = await heading.innerText()
  const languageTrigger = page.getByRole('button', { name: 'Language', exact: true })
  await expect(languageTrigger).toBeEnabled()
  await languageTrigger.click()
  // Radix makes the trigger's background inaccessible while its modal menu is
  // open. The visible option is the meaningful post-click readiness check.
  const dutchOption = page.getByRole('menuitem', { name: /Nederlands/ })
  await expect(dutchOption).toBeVisible()
  await dutchOption.click()
  await expect(page).toHaveURL(/\/nl(?:\?|$)/)
  await expect(heading).toContainText('Toegankelijkheid')
  await expect(heading).not.toHaveText(englishHeading)
})

for (const locale of ['nl', 'de']) {
  test(`home page in ${locale} fits a 320px mobile viewport`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 760 })
    await page.goto(`/${locale}`, { waitUntil: 'domcontentloaded' })
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const overflow = await page.evaluate(() => (
      document.documentElement.scrollWidth - document.documentElement.clientWidth
    ))
    expect(overflow).toBeLessThanOrEqual(1)
    await expect(page.getByRole('textbox', { name: 'Website-URL', exact: true })).toBeVisible()
  })
}

test.describe('closed founding intake and paid Agency offer', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    expect(baseURL, 'Public closure checks require the configured test origin').toBeTruthy()
    const allowedOrigin = new URL(baseURL!).origin
    // These checks only read marketing pages. Do not contact external services,
    // submit an application, create a checkout, or send analytics events.
    await page.route('**/*', async (route) => {
      const request = route.request()
      if (
        new URL(request.url()).origin !== allowedOrigin ||
        !['GET', 'HEAD'].includes(request.method())
      ) {
        await route.abort('blockedbyclient')
        return
      }
      await route.continue()
    })
  })

  for (const path of ['/nl/founding-agencies', '/nl/partner-apply']) {
    test(`${path} closes applications, preserves existing agreements and links to paid Agency on mobile`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: 320, height: 760 })
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      const closed = page.getByRole('region', { name: 'Nieuwe founding-aanmeldingen zijn gesloten', exact: true })
      await expect(closed.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(closed).toContainText('De gratis-jaaractie is niet meer beschikbaar voor nieuwe aanmeldingen.')
      await expect(closed.getByRole('heading', { name: 'Al aangemeld of deelnemer?', exact: true })).toBeVisible()
      await expect(closed).toContainText('De sluiting voor nieuwe aanmeldingen verandert niets aan bestaande afspraken of eerder ingediende aanvragen.')
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page.getByRole('main').locator('form')).toHaveCount(0)

      const existingAgreementLink = closed.getByRole('link', { name: 'Vraag over je bestaande afspraak', exact: true })
      await expect(existingAgreementLink).toHaveAttribute('href', '/nl/contact?from=existing-founding-agency')
      const agencyLink = closed.getByRole('link', { name: 'Bekijk Agency', exact: true })
      await expect(agencyLink).toBeVisible()
      await expect(agencyLink).toHaveAttribute('href', '/nl/pricing#agency')

      const overflow = await page.evaluate(() => (
        document.documentElement.scrollWidth - document.documentElement.clientWidth
      ))
      expect(overflow, 'Closed application pages must fit a 320px viewport').toBeLessThanOrEqual(1)
      await testInfo.attach(`closed-${path.split('/').pop()}-mobile`, {
        body: await page.screenshot({ fullPage: true, animations: 'disabled' }),
        contentType: 'image/png',
      })

      await agencyLink.click()
      await expect(page).toHaveURL(/\/nl\/pricing#agency$/)
      await expect(page.locator('#agency')).toHaveAttribute('data-plan', 'BUSINESS')
      await expect(page.locator('#agency').getByText('Agency', { exact: true })).toBeVisible()
    })
  }

  for (const path of ['/nl', '/nl/pricing']) {
    test(`${path} presents the paid Agency banner and a working Agency anchor`, async ({ page }, testInfo) => {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)

      const offer = page.getByRole('region', { name: 'Jouw bevindingen. Jullie rapport.', exact: true })
      await expect(offer.getByRole('heading', { level: 2 })).toBeVisible()
      await expect(offer).toContainText(/Agency:\s*€\s*99,95 per maand, inclusief btw/)
      await expect(offer).toContainText('Betaald maandabonnement met automatische verlenging.')
      await expect(offer).not.toContainText(/12 maanden gratis|gratis jaar|founding-korting/i)

      const agencyLink = offer.getByRole('link', { name: 'Bekijk Agency', exact: true })
      await expect(agencyLink).toHaveAttribute('href', '/nl/pricing#agency')
      await expect(offer.getByRole('link', { name: 'Bekijk voorbeeldrapport', exact: true }))
        .toHaveAttribute('href', '/nl/sample-report')
      await testInfo.attach(`paid-agency-banner-${path === '/nl' ? 'home' : 'pricing'}`, {
        body: await offer.screenshot({ animations: 'disabled' }),
        contentType: 'image/png',
      })
      await agencyLink.click()
      await expect(page).toHaveURL(/\/nl\/pricing#agency$/)
      await expect(page.locator('#agency')).toHaveAttribute('data-plan', 'BUSINESS')
      await expect(page.locator('#agency').getByText('Agency', { exact: true })).toBeVisible()
    })
  }

  test('checkout login and registration preserve the selected Agency plan without automatic payment', async ({ page }, testInfo) => {
    let checkoutRequests = 0
    await page.route('**/api/billing/profile', route => route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }))
    await page.route('**/api/billing/create-payment', async route => {
      checkoutRequests += 1
      expect(route.request().postDataJSON()).toMatchObject({ plan: 'BUSINESS', billingCycle: 'yearly' })
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: 'Authentication required' }) })
    })
    const selection = '/nl/pricing?checkoutPlan=BUSINESS&billingCycle=yearly#agency'
    await page.goto(selection, { waitUntil: 'domcontentloaded' })
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(dialog).toContainText('VexNexa Agency')
    await expect(dialog).toContainText('Annual')
    expect(checkoutRequests).toBe(0)
    await dialog.getByRole('button', { name: /^Continue to payment/ }).click()
    await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(selection)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await testInfo.attach('checkout-login-continuation', { body: await page.screenshot({ fullPage: true, animations: 'disabled' }), contentType: 'image/png' })
    await page.getByRole('button', { name: 'Create Free Account', exact: true }).click()
    await expect(page).toHaveURL(/\/auth\/register\?redirect=/)
    expect(new URL(page.url()).searchParams.get('redirect')).toBe(selection)
    await expect(page.getByLabel(/email/i)).toBeVisible()
    expect(checkoutRequests).toBe(1)
  })

  test('paid but unfulfilled checkout stays pending and retries only the status lookup', async ({ page }, testInfo) => {
    let statusRequests = 0
    await page.route('**/api/mollie/payment-status?*', async route => {
      statusRequests += 1
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        paymentId: 'tr_fixture', status: 'paid', plan: 'BUSINESS', billingInterval: 'monthly',
        user: { plan: 'PRO', subscriptionStatus: 'active' }, fulfillmentStatus: 'pending',
      }) })
    })
    const response = await page.goto('/checkout/return?paymentId=tr_fixture', { waitUntil: 'domcontentloaded' })
    expect(response?.status(), 'The active Mollie return must not be treated as a retired Shopify checkout').toBe(200)
    const pending = page.getByRole('status').filter({ hasText: 'Payment received, activation pending' })
    await expect(pending).toBeVisible()
    await expect(pending).toContainText('Do not pay again.')
    await page.clock.install()
    await page.clock.fastForward(31_000)
    const retry = pending.getByRole('button', { name: 'Check status again', exact: true })
    await expect(retry).toBeEnabled()
    await expect(page).toHaveURL(/\/checkout\/return\?paymentId=tr_fixture$/)
    await testInfo.attach('paid-activation-pending', { body: await pending.screenshot({ animations: 'disabled' }), contentType: 'image/png' })
    const beforeRetry = statusRequests
    await retry.click()
    await expect.poll(() => statusRequests).toBeGreaterThan(beforeRetry)
    await expect(pending).toBeVisible()
    await expect(page).not.toHaveURL(/checkout=success/)
  })
})
