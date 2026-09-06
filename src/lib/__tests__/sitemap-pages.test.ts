import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import { GET } from '@/app/sitemap_pages.xml/route'
import {
  INDEXABLE_MARKETING_LOCALES,
  SITE_URL,
  buildAlternates,
  isMarketingPath,
  localizedUrl,
  type MarketingLocale,
} from '@/lib/marketing-seo'

describe('public pages sitemap', () => {
  let dom: JSDOM
  let response: Response
  let entries: Element[]

  beforeAll(async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', SITE_URL)
    vi.stubEnv('NEXT_PUBLIC_APP_URL', SITE_URL)
    response = await GET()
    dom = new JSDOM(await response.text(), { contentType: 'application/xml' })
    entries = Array.from(dom.window.document.getElementsByTagName('url'))
  })

  afterAll(() => {
    dom?.window.close()
    vi.unstubAllEnvs()
  })

  it('returns valid sitemap XML with unique canonical locations', () => {
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/xml')
    expect(dom.window.document.documentElement.localName).toBe('urlset')
    expect(entries.length).toBeGreaterThan(0)
    const locations = entries.map(entry => entry.getElementsByTagName('loc')[0].textContent)
    expect(new Set(locations).size).toBe(locations.length)
    for (const location of locations) {
      expect(new URL(location!).origin).toBe(SITE_URL)
    }
  })

  it.each(INDEXABLE_MARKETING_LOCALES)('includes the approved %s homepage and key pages', locale => {
    const locations = entries.map(entry => entry.getElementsByTagName('loc')[0].textContent)
    for (const path of ['/', '/pricing', '/audits', '/sample-report', '/founding-agencies']) {
      expect(locations).toContain(localizedUrl(locale, path))
    }
  })

  it('uses the same reciprocal hreflang policy as page metadata for every marketing entry', () => {
    for (const entry of entries) {
      const location = entry.getElementsByTagName('loc')[0].textContent!
      const segments = new URL(location).pathname.split('/').filter(Boolean)
      const hasLocale = (INDEXABLE_MARKETING_LOCALES as readonly string[]).includes(segments[0])
      const locale = (hasLocale ? segments.shift() : 'en') as MarketingLocale
      const path = '/' + segments.join('/')
      const links = Array.from(entry.getElementsByTagNameNS('http://www.w3.org/1999/xhtml', 'link'))
      if (!isMarketingPath(path)) {
        expect(links).toHaveLength(0)
        continue
      }
      const expected = buildAlternates(path, locale)
      expect(location).toBe(expected.canonical)
      expect(links).toHaveLength(INDEXABLE_MARKETING_LOCALES.length + 1)
      const alternates = Object.fromEntries(links.map(link => {
        expect(link.getAttribute('rel')).toBe('alternate')
        return [link.getAttribute('hreflang'), link.getAttribute('href')]
      }))
      expect(alternates).toEqual(expected.languages)
    }
  })

  it('excludes retired redirect sources and private application pages', () => {
    const paths = entries.map(entry => new URL(entry.getElementsByTagName('loc')[0].textContent!).pathname)
    for (const path of paths) {
      expect(path).not.toMatch(/(?:^|\/)(?:pilot-partner-program|demo|dashboard|auth|admin|settings)(?:\/|$)/)
      expect(path).not.toMatch(/^\/en(?:\/|$)/)
    }
  })
})
