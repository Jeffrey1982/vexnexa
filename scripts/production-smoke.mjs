import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const STUDIO_LOCALES = ['nl', 'en', 'de', 'fr', 'es', 'pt', 'tl'];
export const STUDIO_PATHS = ['', '/games/ipiwow', '/studio', '/contact', '/privacy', '/support'];
const CANONICAL_ORIGIN = 'https://vexnexa.com';
const languageTag = locale => locale === 'pt' ? 'pt-PT' : locale;

function requireCondition(condition, message) {
  if (!condition) throw new Error(message);
}

export function assertPage(response, marker = '') {
  requireCondition(response.status === 200, `HTTP ${response.status} (expected 200)`);
  requireCondition(!marker || response.body.includes(marker), `HTTP 200 but marker '${marker}' not found`);
}

export function assertRedirect(response, baseUrl, path, permanent = true) {
  requireCondition(permanent ? response.status === 308 : [307, 308].includes(response.status),
    `HTTP ${response.status} (expected ${permanent ? '308' : '307/308'})`);
  requireCondition(!!response.location, 'missing redirect Location');
  requireCondition(new URL(response.location, baseUrl).href === new URL(path, baseUrl).href,
    `redirect must point exactly to ${path} on the same origin`);
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2];
}

export function assertStudioSitemap(xml) {
  requireCondition(/<urlset\b/.test(xml), 'missing sitemap urlset');
  const entries = [...xml.matchAll(/<url\b[^>]*>([\s\S]*?)<\/url\s*>/g)];
  requireCondition(entries.length === STUDIO_PATHS.length * STUDIO_LOCALES.length,
    'expected exactly 42 studio sitemap entries');
  const locations = new Set();
  const expectedLanguages = [...STUDIO_LOCALES.map(languageTag), 'x-default'];
  for (const [, entry] of entries) {
    const loc = entry.match(/<loc\b[^>]*>\s*([^<]+?)\s*<\/loc\s*>/)?.[1];
    requireCondition(!!loc, 'sitemap entry missing loc');
    requireCondition(!locations.has(loc), `duplicate sitemap URL: ${loc}`);
    locations.add(loc);
    const url = new URL(loc);
    const segments = url.pathname.split('/').filter(Boolean);
    const locale = segments.shift();
    const path = segments.length ? `/${segments.join('/')}` : '';
    requireCondition(url.origin === CANONICAL_ORIGIN && STUDIO_LOCALES.includes(locale) &&
      STUDIO_PATHS.includes(path) && url.href === `${CANONICAL_ORIGIN}/${locale}${path}`,
      `unexpected studio URL: ${loc}`);
    const links = [...entry.matchAll(/<xhtml:link\b[^>]*>/g)].map(([tag]) => ({
      language: attribute(tag, 'hreflang'), href: attribute(tag, 'href'), rel: attribute(tag, 'rel'),
    }));
    requireCondition(links.length === expectedLanguages.length, `missing or duplicate hreflang at ${loc}`);
    for (const language of expectedLanguages) {
      const matches = links.filter(link => link.language === language);
      requireCondition(matches.length === 1, `expected one '${language}' alternate at ${loc}`);
      const targetLocale = language === 'x-default' ? 'en' : language === 'pt-PT' ? 'pt' : language;
      requireCondition(matches[0].rel === 'alternate' &&
        matches[0].href === `${CANONICAL_ORIGIN}/${targetLocale}${path}`,
        `incorrect '${language}' alternate at ${loc}`);
    }
  }
  for (const path of STUDIO_PATHS) {
    for (const locale of STUDIO_LOCALES) {
      requireCondition(locations.has(`${CANONICAL_ORIGIN}/${locale}${path}`),
        `missing '${locale}' URL for ${path || '/'}`);
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
      ...options, redirect: 'manual', signal: AbortSignal.timeout(timeoutMs),
    });
    return { status: response.status, location: response.headers.get('location'), body: await response.text() };
  };
  const check = async (label, callback) => {
    try { await callback(); log(`OK ${label}`); }
    catch (error) {
      failures += 1;
      log(`FAIL ${label} - ${error instanceof Error ? error.message : 'request failed'}`);
    }
  };

  await check('/ -> /nl', async () => assertRedirect(await request('/'), base, '/nl', false));
  for (const locale of STUDIO_LOCALES) {
    await check(`/${locale}`, async () => {
      const response = await request(`/${locale}`);
      assertPage(response, 'VexNexa');
      requireCondition(response.body.includes(`lang="${languageTag(locale)}"`), 'incorrect document language');
      requireCondition(response.body.includes('IpiWow'), 'IpiWow is not featured');
    });
  }
  for (const path of STUDIO_PATHS.filter(Boolean)) {
    await check(`/nl${path}`, async () => assertPage(await request(`/nl${path}`), 'VexNexa'));
  }
  await check('/robots.txt', async () => assertPage(await request('/robots.txt'), 'Sitemap:'));
  await check('/sitemap.xml (seven languages)', async () => {
    const response = await request('/sitemap.xml');
    assertPage(response);
    assertStudioSitemap(response.body);
  });
  await check('/api/health', async () => {
    const response = await request('/api/health');
    assertPage(response);
    const data = JSON.parse(response.body);
    requireCondition(data.ok === true && data.service === 'vexnexa-game-studio', 'wrong studio health response');
  });
  for (const path of ['/pricing', '/auth/login', '/dashboard']) {
    await check(`${path} -> /nl/support`, async () => assertRedirect(await request(path), base, '/nl/support'));
  }
  await check('/api/mollie/webhook (retired)', async () => {
    const response = await request('/api/mollie/webhook');
    requireCondition(response.status === 410, `HTTP ${response.status} (expected 410)`);
    requireCondition(JSON.parse(response.body).error === 'service_retired', 'legacy billing API is not retired');
  });
  await check('/api/contact (invalid payload rejected)', async () => {
    // Invalid and incomplete by design: cannot reach Resend or persist a contact.
    const response = await request('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: base.origin, 'Sec-Fetch-Site': 'same-origin' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    requireCondition(response.status === 400, `HTTP ${response.status} (expected 400)`);
    requireCondition(JSON.parse(response.body).error === 'invalid_input', 'contact validation is not active');
  });
  return failures;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runSmoke({ baseUrl: process.env.BASE_URL || CANONICAL_ORIGIN })
    .then(failures => { process.exitCode = failures > 0 ? 1 : 0; })
    .catch(error => { console.error(`FAIL smoke setup - ${error.message}`); process.exitCode = 1; });
}
