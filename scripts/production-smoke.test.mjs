import assert from 'node:assert/strict';
import test from 'node:test';
import { INDEXABLE_MARKETING_LOCALES, localizedUrl } from '../src/lib/marketing-seo.ts';
import { assertLegacyRedirect, assertMarketingSitemap, assertPage, runSmoke } from './production-smoke.mjs';

const baseUrl = 'https://vexnexa.com';
function sitemap() {
  return `<urlset>${['/', '/audits'].flatMap((path) => {
    const links = [...INDEXABLE_MARKETING_LOCALES, 'x-default'].map((locale) =>
      `<xhtml:link rel="alternate" hreflang="${locale}" href="${localizedUrl(locale === 'x-default' ? 'en' : locale, path)}"/>`
    ).join('');
    return INDEXABLE_MARKETING_LOCALES.map((locale) => `<url><loc>${localizedUrl(locale, path)}</loc>${links}</url>`);
  }).join('')}</urlset>`;
}

test('large HTML with an early matching marker passes without pipe/SIGPIPE false negatives', () => {
  assert.doesNotThrow(() => assertPage({ status: 200, body: 'Backed by evidence' + 'x'.repeat(2_000_000) }, 'Backed by evidence'));
});

test('large HTML without the required content still fails', () => {
  assert.throws(() => assertPage({ status: 200, body: 'x'.repeat(2_000_000) }, 'Backed by evidence'), /marker.*not found/);
});

test('unexpected page redirects and HTTP errors are not silently followed', () => {
  for (const status of [301, 307, 308, 404, 500]) {
    assert.throws(() => assertPage({ status, body: 'Backed by evidence' }, 'Backed by evidence'), /expected 200/);
  }
});

test('legacy path requires exactly the permanent redirect to the new same-origin page', () => {
  for (const location of ['/founding-agencies', `${baseUrl}/founding-agencies`]) {
    assert.doesNotThrow(() => assertLegacyRedirect({ status: 308, location }, baseUrl));
  }
  for (const response of [
    { status: 200, location: '/founding-agencies' },
    { status: 307, location: '/founding-agencies' },
    { status: 308, location: null },
    { status: 308, location: '/pricing' },
    { status: 308, location: 'https://example.com/founding-agencies' },
    { status: 308, location: '/founding-agencies?wrong=1' },
  ]) assert.throws(() => assertLegacyRedirect(response, baseUrl));
});

test('sitemap checker follows the actual shared indexable-locale policy', () => {
  assert.doesNotThrow(() => assertMarketingSitemap(sitemap()));
});

test('every supported hreflang and x-default is required on every marketing entry', () => {
  for (const locale of [...INDEXABLE_MARKETING_LOCALES, 'x-default']) {
    const broken = sitemap().replace(new RegExp(`<xhtml:link[^>]*hreflang="${locale}"[^>]*>`), '');
    assert.throws(() => assertMarketingSitemap(broken), /missing or duplicate hreflang/);
  }
});

test('unknown hreflang and incorrect locale target fail', () => {
  assert.throws(() => assertMarketingSitemap(sitemap().replace('hreflang="en"', 'hreflang="it"')), /unknown hreflang/);
  assert.throws(() => assertMarketingSitemap(sitemap().replace('hreflang="nl" href="https://vexnexa.com/nl"',
    'hreflang="nl" href="https://vexnexa.com/de"')), /incorrect 'nl' alternate/);
});

test('missing locale URL entries, duplicate URLs, and unknown locale roots fail', () => {
  assert.throws(() => assertMarketingSitemap(sitemap().replace(/<url><loc>https:\/\/vexnexa.com\/nl<\/loc>.*?<\/url>/, '')),
    /missing 'nl' URL/);
  assert.throws(() => assertMarketingSitemap(sitemap().replace('</urlset>', '<url><loc>https://vexnexa.com/</loc></url></urlset>')),
    /duplicate sitemap URL/);
  assert.throws(() => assertMarketingSitemap(sitemap().replace('</urlset>', '<url><loc>https://vexnexa.com/it</loc></url></urlset>')),
    /unknown marketing locale URL/);
});

function fixtureFetch(overrides = {}) {
  const calls = [];
  const bodies = {
    '/': 'Backed by evidence' + 'x'.repeat(2_000_000),
    '/pricing': 'Agency',
    '/founding-agencies': 'Founding Agency Program',
    '/robots.txt': 'Sitemap: https://vexnexa.com/sitemap.xml',
    '/sitemap.xml': '<sitemapindex></sitemapindex>',
    '/sitemap_pages.xml': sitemap(),
    '/api/health': '{"ok":true}',
  };
  return {
    calls,
    fetchImpl: async (url, options) => {
      const path = new URL(url).pathname;
      calls.push({ path, ...options });
      if (overrides[path]) return overrides[path]();
      if (path === '/pilot-partner-program') return new Response('', { status: 308, headers: { location: '/founding-agencies' } });
      if (path === '/api/free-scan/lead') return new Response('{"ok":false}', { status: 400 });
      return new Response(bodies[path] || '<html>Public page</html>');
    },
  };
}

test('complete smoke run verifies redirect target and only submits a deliberately invalid lead', async () => {
  const { fetchImpl, calls } = fixtureFetch();
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: () => {} }), 0);
  assert.ok(calls.some(({ path }) => path === '/founding-agencies'));
  assert.ok(calls.every(({ redirect }) => redirect === 'manual'));
  const writes = calls.filter(({ method }) => method === 'POST');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, '/api/free-scan/lead');
  assert.deepEqual(JSON.parse(writes[0].body), { email: 'not-an-email' });
});

test('redirect to a broken destination cannot pass the complete smoke run', async () => {
  const { fetchImpl } = fixtureFetch({ '/founding-agencies': () => new Response('Broken', { status: 500 }) });
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: () => {} }), 1);
});

test('request failures are reported and later checks still run', async () => {
  const { fetchImpl, calls } = fixtureFetch({ '/pricing': () => { throw new Error('Network error'); } });
  const logs = [];
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: (message) => logs.push(message) }), 1);
  assert.ok(logs.some((message) => message === 'FAIL /pricing - Network error'));
  assert.ok(calls.some(({ path }) => path === '/api/free-scan/lead'));
});

test('a valid health HTTP response with ok false is still a failure', async () => {
  const { fetchImpl } = fixtureFetch({ '/api/health': () => new Response('{"ok":false}') });
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: () => {} }), 1);
});
