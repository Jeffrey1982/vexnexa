import { describe, expect, it } from 'vitest';
import robots from '../../app/robots';
import sitemap from '../../app/sitemap';
import { getSeo, locales, pageNames } from './content';
import { pageMetadata, pagePaths } from './metadata';
import { SITE_URL } from './site';

const routes = pageNames.flatMap(page => locales.map(locale => ({ page, locale })));
const hrefLangs = ['nl', 'en', 'de', 'fr', 'es', 'pt-PT', 'tl', 'x-default'];

describe('static studio metadata', () => {
  it('uses the canonical HTTPS site and exactly the six current routes', () => {
    expect(SITE_URL).toBe('https://vexnexa.com');
    expect(pagePaths).toEqual({
      home: '', ipiwow: '/games/ipiwow', studio: '/studio', contact: '/contact',
      privacy: '/privacy', support: '/support',
    });
  });

  it.each(routes)('creates localized metadata for $locale / $page', ({ locale, page }) => {
    const metadata = pageMetadata(locale, page);
    const seo = getSeo(locale, page);
    const canonical = `${SITE_URL}/${locale}${pagePaths[page]}`;
    expect(metadata.title).toBe(seo.title);
    expect(metadata.description).toBe(seo.description);
    expect(metadata.metadataBase).toEqual(new URL(SITE_URL));
    expect(metadata.alternates?.canonical).toBe(canonical);
    expect(metadata.openGraph).toMatchObject({
      title: seo.title, description: seo.description, type: 'website',
      url: canonical, siteName: 'VexNexa',
      images: [{ url: '/studio/ipiwow-mascot.png', width: 1280, height: 1280, alt: 'IpiWow' }],
    });
    expect(metadata.twitter).toMatchObject({
      card: 'summary', title: seo.title, description: seo.description,
      images: ['/studio/ipiwow-mascot.png'],
    });
    const languages = metadata.alternates?.languages;
    expect(Object.keys(languages ?? {})).toEqual(hrefLangs);
    expect(languages?.['x-default']).toBe(`${SITE_URL}/en${pagePaths[page]}`);
    expect(languages?.['pt-PT']).toBe(`${SITE_URL}/pt${pagePaths[page]}`);
    expect(languages).not.toHaveProperty('pt');
    for (const targetLocale of locales) {
      const key = targetLocale === 'pt' ? 'pt-PT' : targetLocale;
      expect(languages?.[key]).toBe(`${SITE_URL}/${targetLocale}${pagePaths[page]}`);
    }
  });

  it('keeps every canonical URL unique, same-origin and free of query strings', () => {
    const canonicals = routes.map(({ locale, page }) => pageMetadata(locale, page).alternates?.canonical);
    expect(new Set(canonicals).size).toBe(42);
    for (const canonical of canonicals) {
      expect(typeof canonical).toBe('string');
      const parsed = new URL(canonical as string);
      expect(parsed.origin).toBe(SITE_URL);
      expect(parsed.search).toBe('');
      expect(parsed.hash).toBe('');
      expect(parsed.username).toBe('');
      expect(parsed.password).toBe('');
    }
  });
});

describe('public robots policy', () => {
  it('allows public pages, disallows APIs, and points to the canonical sitemap', () => {
    expect(robots()).toEqual({
      rules: { userAgent: '*', allow: '/', disallow: '/api/' },
      sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL,
    });
  });
});

describe('localized sitemap', () => {
  it('lists exactly 42 unique canonical studio URLs and no former SaaS routes', () => {
    const entries = sitemap();
    expect(entries).toHaveLength(42);
    const expectedUrls = routes.map(({ locale, page }) => `${SITE_URL}/${locale}${pagePaths[page]}`);
    expect(entries.map(entry => entry.url)).toEqual(expectedUrls);
    expect(new Set(entries.map(entry => entry.url)).size).toBe(42);
    for (const entry of entries) {
      expect(new URL(entry.url).origin).toBe(SITE_URL);
      expect(entry.url).not.toMatch(/\/(api|pricing|checkout|dashboard|auth|audits|free-scan)(\/|$)/);
      expect(entry).not.toHaveProperty('lastModified');
    }
  });

  it('uses complete reciprocal alternates, pt-PT and English x-default for each page', () => {
    const entries = sitemap();
    for (const { locale, page } of routes) {
      const entry = entries.find(item => item.url === `${SITE_URL}/${locale}${pagePaths[page]}`);
      const languages = entry?.alternates?.languages;
      expect(Object.keys(languages ?? {})).toEqual(hrefLangs);
      expect(languages).toEqual(pageMetadata(locale, page).alternates?.languages);
      expect(languages?.['x-default']).toBe(`${SITE_URL}/en${pagePaths[page]}`);
      expect(languages?.['pt-PT']).toBe(`${SITE_URL}/pt${pagePaths[page]}`);
      for (const targetLocale of locales) {
        const alternate = entries.find(item => item.url === `${SITE_URL}/${targetLocale}${pagePaths[page]}`);
        expect(alternate).toBeDefined();
        expect(alternate?.alternates?.languages).toEqual(languages);
      }
    }
  });

  it('is stable across calls without invented modification dates or runtime data', () => {
    expect(sitemap()).toEqual(sitemap());
    expect(robots()).toEqual(robots());
  });
});
