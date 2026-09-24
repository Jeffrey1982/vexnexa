import assert from 'node:assert/strict';
import test from 'node:test';
import { STUDIO_LOCALES, STUDIO_PATHS, assertRedirect, assertStudioSitemap, assertPage, runSmoke } from './production-smoke.mjs';

const baseUrl = 'https://vexnexa.com';
const languageTag = locale => locale === 'pt' ? 'pt-PT' : locale;
function sitemap() {
  return `<urlset>${STUDIO_PATHS.flatMap(path => {
    const links = [...STUDIO_LOCALES, 'x-default'].map(locale =>
      `<xhtml:link rel="alternate" hreflang="${locale === 'x-default' ? locale : languageTag(locale)}" href="${baseUrl}/${locale === 'x-default' ? 'en' : locale}${path}"/>`
    ).join('');
    return STUDIO_LOCALES.map(locale => `<url><loc>${baseUrl}/${locale}${path}</loc>${links}</url>`);
  }).join('')}</urlset>`;
}

test('large HTML is checked without truncation or false pipe errors', () => {
  assert.doesNotThrow(() => assertPage({ status: 200, body: 'VexNexa' + 'x'.repeat(2_000_000) }, 'VexNexa'));
  assert.throws(() => assertPage({ status: 200, body: 'x'.repeat(2_000_000) }, 'VexNexa'), /marker.*not found/);
});
test('unexpected page statuses fail', () => {
  for (const status of [301, 307, 308, 404, 500])
    assert.throws(() => assertPage({ status, body: 'VexNexa' }, 'VexNexa'), /expected 200/);
});
test('redirect requires exact same-origin path and expected status', () => {
  assert.doesNotThrow(() => assertRedirect({ status: 308, location: '/nl/support' }, baseUrl, '/nl/support'));
  assert.doesNotThrow(() => assertRedirect({ status: 307, location: '/nl' }, baseUrl, '/nl', false));
  for (const response of [
    { status: 200, location: '/nl/support' },
    { status: 307, location: '/nl/support' },
    { status: 308, location: null },
    { status: 308, location: '/pricing' },
    { status: 308, location: 'https://example.com/nl/support' },
    { status: 308, location: '/nl/support?wrong=1' },
  ]) assert.throws(() => assertRedirect(response, baseUrl, '/nl/support'));
});
test('all 42 localized studio pages have complete reciprocal alternates', () => {
  assert.doesNotThrow(() => assertStudioSitemap(sitemap()));
});
test('every language and x-default is required per entry', () => {
  for (const locale of [...STUDIO_LOCALES.map(languageTag), 'x-default']) {
    const broken = sitemap().replace(new RegExp(`<xhtml:link[^>]*hreflang="${locale}"[^>]*>`), '');
    assert.throws(() => assertStudioSitemap(broken), /missing or duplicate hreflang/);
  }
});
test('unknown languages, wrong alternate targets and retired pages fail', () => {
  assert.throws(() => assertStudioSitemap(sitemap().replace('hreflang="en"', 'hreflang="it"')), /expected one/);
  assert.throws(() => assertStudioSitemap(sitemap().replace('hreflang="nl" href="https://vexnexa.com/nl"',
    'hreflang="nl" href="https://vexnexa.com/de"')), /incorrect 'nl'/);
  assert.throws(() => assertStudioSitemap(sitemap().replace('/games/ipiwow</loc>', '/pricing</loc>')), /unexpected studio URL/);
});
test('missing entries, duplicate URLs, and off-origin canonical URLs fail', () => {
  assert.throws(() => assertStudioSitemap(sitemap().replace(/<url>.*?<\/url>/, '')), /42 studio/);
  assert.throws(() => assertStudioSitemap(sitemap().replace('<loc>https://vexnexa.com/en</loc>', '<loc>https://vexnexa.com/nl</loc>')), /duplicate sitemap URL/);
  assert.throws(() => assertStudioSitemap(sitemap().replace('<loc>https://vexnexa.com/nl</loc>', '<loc>https://evil.example/nl</loc>')), /unexpected studio URL/);
});

function fixtureFetch(overrides = {}) {
  const calls = [];
  return {
    calls,
    fetchImpl: async (url, options) => {
      const path = new URL(url).pathname;
      calls.push({ path, ...options });
      if (overrides[path]) return overrides[path]();
      if (path === '/') return new Response('', { status: 307, headers: { location: '/nl' } });
      if (['/pricing', '/auth/login', '/dashboard'].includes(path))
        return new Response('', { status: 308, headers: { location: '/nl/support' } });
      if (path === '/api/contact') return Response.json({ error: 'invalid_input' }, { status: 400 });
      if (path === '/api/mollie/webhook') return Response.json({ error: 'service_retired' }, { status: 410 });
      if (path === '/api/health') return Response.json({ ok: true, service: 'vexnexa-game-studio' });
      if (path === '/sitemap.xml') return new Response(sitemap());
      if (path === '/robots.txt') return new Response('Sitemap: https://vexnexa.com/sitemap.xml');
      const locale = path.split('/')[1];
      return new Response(`<html lang="${languageTag(locale)}"><title>VexNexa</title><h1>IpiWow</h1></html>`);
    },
  };
}
test('smoke uses GETs except one deliberately invalid contact request, never real mail or billing', async () => {
  const { fetchImpl, calls } = fixtureFetch();
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: () => {} }), 0);
  assert.equal(calls.length, 21);
  assert.ok(calls.every(({ redirect }) => redirect === 'manual'));
  const writes = calls.filter(({ method }) => method && method !== 'GET');
  assert.equal(writes.length, 1);
  assert.equal(writes[0].path, '/api/contact');
  assert.equal(writes[0].headers.Origin, baseUrl);
  assert.deepEqual(JSON.parse(writes[0].body), { email: 'not-an-email' });
});
test('network failures are counted and subsequent checks continue', async () => {
  const { fetchImpl, calls } = fixtureFetch({ '/nl': () => { throw new Error('Network error'); } });
  const logs = [];
  assert.equal(await runSmoke({ baseUrl, fetchImpl, log: message => logs.push(message) }), 1);
  assert.ok(logs.includes('FAIL /nl - Network error'));
  assert.ok(calls.some(({ path }) => path === '/api/contact'));
});
test('wrong service, missing language, active old API and accepted invalid mail are failures', async () => {
  for (const override of [
    { '/api/health': () => Response.json({ ok: true, service: 'old-saas' }) },
    { '/tl': () => new Response('<html lang="en">VexNexa IpiWow</html>') },
    { '/api/mollie/webhook': () => Response.json({ ok: true }) },
    { '/api/contact': () => Response.json({ success: true }) },
  ]) {
    const { fetchImpl } = fixtureFetch(override);
    assert.equal(await runSmoke({ baseUrl, fetchImpl, log: () => {} }), 1);
  }
});
test('credential-bearing and non-HTTP base URLs fail before making requests', async () => {
  for (const baseUrl of ['file:///tmp/foo', 'https://user:secret@vexnexa.com']) {
    await assert.rejects(() => runSmoke({ baseUrl, fetchImpl: () => { throw new Error('must not fetch'); } }),
      /without credentials/);
  }
});
