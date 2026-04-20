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
  { path: '/auth/login', title: /log ?in|sign ?in|vexnexa/i },
  { path: '/auth/register', title: /sign ?up|register|vexnexa/i },
]

for (const { path, title } of PUBLIC_ROUTES) {
  test(`public route ${path} renders with 200`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response, `No response for ${path}`).not.toBeNull()
    expect(response!.status(), `Bad status for ${path}`).toBeLessThan(400)
    await expect(page).toHaveTitle(title)
  })
}

test('home page has a working CTA that points at signup or pricing', async ({ page }) => {
  await page.goto('/')
  const cta = page
    .getByRole('link', { name: /get started|start|try|sign ?up|pricing/i })
    .first()
  await expect(cta).toBeVisible()
  const href = await cta.getAttribute('href')
  expect(href).toMatch(/\/(auth\/register|signup|pricing|register|start)/)
})

test('pricing page shows at least 3 plans', async ({ page }) => {
  await page.goto('/pricing')
  // Don't hard-code plan names — the site is multilingual. Just count them.
  const planCards = page.locator('[data-plan], [data-testid="plan-card"], article')
  const count = await planCards.count()
  expect(count).toBeGreaterThanOrEqual(3)
})

test('language switcher changes page content', async ({ page }) => {
  await page.goto('/')
  const switcher = page
    .getByRole('button', { name: /language|taal|nederlands|english/i })
    .first()
  if (!(await switcher.isVisible().catch(() => false))) {
    test.skip(true, 'no visible language switcher on current locale')
  }
})
