import { describe, expect, it } from 'vitest';
import { localizeMarketingHref, stripMarketingLocale } from './marketing-links';

describe('localizeMarketingHref', () => {
  it.each([
    ['/', 'nl', '/nl'],
    ['/pricing', 'nl', '/nl/pricing'],
    ['/pricing/', 'de', '/de/pricing/'],
    ['/free-scan?url=https%3A%2F%2Fexample.com#results', 'fr', '/fr/free-scan?url=https%3A%2F%2Fexample.com#results'],
    ['/?source=nav#intro', 'es', '/es?source=nav#intro'],
    ['/legal/privacy#data', 'pt', '/pt/legal/privacy#data'],
    ['/for-agencies', 'en', '/for-agencies'],
    ['/nl/pricing', 'nl', '/nl/pricing'],
    ['/de/pricing?plan=pro#annual', 'nl', '/de/pricing?plan=pro#annual'],
    ['/en/pricing', 'nl', '/en/pricing'],
    ['/auth/register', 'nl', '/auth/register'],
    ['/dashboard', 'nl', '/dashboard'],
    ['/blog/article', 'nl', '/blog/article'],
    ['/unknown', 'nl', '/unknown'],
    ['/api/free-scan', 'nl', '/api/free-scan'],
    ['#details', 'nl', '#details'],
    ['?billing=annual', 'nl', '?billing=annual'],
    ['pricing', 'nl', 'pricing'],
    ['https://vexnexa.com/pricing', 'nl', 'https://vexnexa.com/pricing'],
    ['https://example.com/pricing', 'nl', 'https://example.com/pricing'],
    ['//example.com/pricing', 'nl', '//example.com/pricing'],
    ['/\\example.com/pricing', 'nl', '/\\example.com/pricing'],
    ['mailto:info@vexnexa.com', 'nl', 'mailto:info@vexnexa.com'],
    ['/pricing', 'unsupported', '/pricing'],
  ])('maps %s in %s to %s', (href, locale, expected) => {
    expect(localizeMarketingHref(href, locale)).toBe(expected);
  });
});

describe('stripMarketingLocale', () => {
  it.each([
    ['/nl/pricing', '/pricing'], ['/de', '/'], ['/fr/', '/'],
    ['/pricing', '/pricing'], ['/newsletter', '/newsletter'],
    ['https://example.com/nl', 'https://example.com/nl'],
  ])('compares %s as %s', (path, expected) => {
    expect(stripMarketingLocale(path)).toBe(expected);
  });
});
