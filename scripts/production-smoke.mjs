import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  DEFAULT_MARKETING_LOCALE,
  INDEXABLE_MARKETING_LOCALES,
  MARKETING_LOCALES,
  isMarketingPath,
  localizedUrl,
} from '../src/lib/marketing-seo.ts';

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertPage(response, marker = '') {
  requireCondition(response.status === 200, `HTTP ${response.status} (expected 200)`);
  // Read the whole response and match in-process: no early-closing grep pipe
  // that can produce a false failure on large Next.js HTML under pipefail.
  requireCondition(!marker || response.body.includes(marker), `HTTP 200 but marker '${marker}' not found`);
}

export function assertLegacyRedirect(response, baseUrl) {
  requireCondition(response.status === 308, `HTTP ${response.status} (expected permanent redirect 308)`);
  requireCondition(!!response.location, 'missing redirect Location');
  const target = new URL(response.location, baseUrl).href;
  requireCondition(target === new URL('/founding-agencies', baseUrl).href,
    'redirect must point exactly to /founding-agencies on the same origin');
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

export function assertMarketingSitemap(xml) {
  requireCondition(/<urlset\b/.test(xml), 'missing sitemap urlset');
  const entries = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/g)];
  requireCondition(entries.length > 0, 'no sitemap URL entries');
  const locations = new Set();
  const marketingPaths = new Set();
  const expectedLanguages = [...INDEXABLE_MARKETING_LOCALES, 'x-default'];

  for (const [, entry] of entries) {
    const loc = entry.match(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc\s*>/)?.[1];
    requireCondition(!!loc, 'sitemap entry missing loc');
    requireCondition(!locations.has(loc), `duplicate sitemap URL: ${loc}`);
    locations.add(loc);
    const url = new URL(loc);
    const segments = url.pathname.split('/').filter(Boolean);
    const prefix = segments[0];
    const hasLocale = MARKETING_LOCALES.includes(prefix);
    const path = hasLocale ? `/${segments.slice(1).join('/')}` : url.pathname;
    const unknownLocale = prefix && /^[a-z]{2}(?:-[a-z]{2})?$/i.test(prefix) &&
      !hasLocale && isMarketingPath(`/${segments.slice(1).join('/')}`);
    requireCondition(!unknownLocale, `unknown marketing locale URL: ${loc}`);

    const links = [...entry.matchAll(/<xhtml:link\b[^>]*>/g)].map(([tag]) => ({
      language: attribute(tag, 'hreflang'),
      href: attribute(tag, 'href'),
      rel: attribute(tag, 'rel'),
    }));
    for (const link of links) {
      requireCondition(expectedLanguages.includes(link.language), `unknown hreflang '${link.language}' at ${loc}`);
    }
    if (!isMarketingPath(path)) continue;

    const locale = hasLocale ? prefix : DEFAULT_MARKETING_LOCALE;
    requireCondition(INDEXABLE_MARKETING_LOCALES.includes(locale), `non-indexable locale URL: ${loc}`);
    requireCondition(loc === localizedUrl(locale, path), `non-canonical marketing URL: ${loc}`);
    requireCondition(links.length === expectedLanguages.length, `missing or duplicate hreflang alternates at ${loc}`);
    marketingPaths.add(path);
    for (const language of expectedLanguages) {
      const matches = links.filter((link) => link.language === language);
      requireCondition(matches.length === 1, `expected one '${language}' alternate at ${loc}`);
      const expectedHref = localizedUrl(language === 'x-default' ? DEFAULT_MARKETING_LOCALE : language, path);
      requireCondition(matches[0].rel === 'alternate' && matches[0].href === expectedHref,
        `incorrect '${language}' alternate at ${loc}`);
    }
  }

  requireCondition(marketingPaths.has('/') && marketingPaths.has('/audits'), 'missing homepage or audits sitemap entries');
  for (const path of marketingPaths) {
    for (const locale of INDEXABLE_MARKETING_LOCALES) {
      requireCondition(locations.has(localizedUrl(locale, path)), `missing '${locale}' URL entry for ${path}`);
    }
  }
}

export async function runSmoke({ baseUrl, fetchImpl = fetch, log = console.log, timeoutMs = 15000 }) {
  const base = new URL(baseUrl);
  requireCondition(['http:', 'https:'].includes(base.protocol) && !base.username && !base.password,
    'BASE_URL must be an HTTP(S) URL without credentials');
  let failures = 0;
  const request = async (path, options = {}) => {
    const response = await fetchImpl(new URL(path, base), {
      ...options,
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });
    return { status: response.status, location: response.headers.get('location'), body: await response.text() };
  };
  const check = async (label, callback) => {
    try {
      await callback();
      log(`OK ${label}`);
    } catch (error) {
      failures += 1;
      log(`FAIL ${label} - ${error instanceof Error ? error.message : 'request failed'}`);
    }
  };

  for (const [path, marker] of [
    ['/', 'Backed by evidence'],
    ['/pricing', 'Agency'],
    ['/free-scan', ''],
    ['/audits', ''],
    ['/partner-apply', ''],
    ['/founding-agencies', 'Founding'],
    ['/robots.txt', 'sitemap'],
    ['/sitemap.xml', 'sitemapindex'],
  ]) {
    await check(path, async () => assertPage(await request(path), marker));
  }
  await check('/pilot-partner-program -> /founding-agencies', async () => {
    assertLegacyRedirect(await request('/pilot-partner-program'), base);
  });
  await check('/api/health', async () => {
    const response = await request('/api/health');
    assertPage(response);
    requireCondition(JSON.parse(response.body).ok === true, 'health response must have ok: true');
  });
  await check(`/sitemap_pages.xml (${INDEXABLE_MARKETING_LOCALES.join('/')} hreflang policy)`, async () => {
    const response = await request('/sitemap_pages.xml');
    assertPage(response, '/audits');
    assertMarketingSitemap(response.body);
  });
  await check('/api/free-scan/lead (validation active)', async () => {
    // Intentionally invalid and incomplete: rejected before persistence/email.
    // Never put a real address or valid lead payload in this smoke check.
    const response = await request('/api/free-scan/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    requireCondition(response.status === 400, `HTTP ${response.status} (expected 400)`);
  });
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSmoke({ baseUrl: process.env.BASE_URL || 'https://vexnexa.com' })
    .then((failures) => { process.exitCode = failures > 0 ? 1 : 0; })
    .catch((error) => { console.error(`FAIL smoke setup - ${error.message}`); process.exitCode = 1; });
}
