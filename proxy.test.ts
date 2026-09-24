import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { config, proxy } from './proxy';
import { locales } from './studio/lib/content';

const request = (path: string, method = 'GET', origin = 'https://vexnexa.com') =>
  new NextRequest(new URL(path, origin), { method });

describe('retired SaaS API boundary', () => {
  const retiredApiPaths = [
    '/api/mollie/webhook', '/api/mollie/create-payment', '/api/mollie/payment-status',
    '/api/billing/cancel', '/api/cron/nurture', '/api/cron/scan', '/api/scan',
    '/api/free-scan/lead', '/api/export-pdf', '/api/admin/users', '/api/auth/callback',
    '/api/lead-intelligence/import', '/api/unknown', '/api/',
    '/api/contact/send', '/api/health/database', '/api/contact-fake',
  ];

  it.each(retiredApiPaths)('retires %s with a non-cacheable non-indexable 410', async path => {
    const response = proxy(request(path));
    expect(response.status).toBe(410);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.get('location')).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({
      error: 'service_retired', support: 'https://vexnexa.com/en/support',
    });
  });

  it.each(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'])('blocks old operations regardless of method %s', method => {
    expect(proxy(request('/api/mollie/create-payment?plan=BUSINESS', method)).status).toBe(410);
  });

  it.each(['/api/contact', '/api/health', '/api/contact?source=studio', '/api/health?check=public'])('passes the exact active endpoint %s to its own handler', path => {
    const response = proxy(request(path, path.startsWith('/api/contact') ? 'POST' : 'GET'));
    expect(response.status).toBe(200);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });
});

describe('former page retirement', () => {
  const formerRoutes = [
    'pricing', 'dashboard', 'admin', 'auth', 'checkout', 'settings', 'scans',
    'sites', 'teams', 'audits', 'free-scan', 'features', 'founding-agencies',
    'partner-apply', 'pilot-partner-program',
  ];

  it.each(formerRoutes)('redirects the legacy %s page and descendants to support', route => {
    for (const suffix of ['', '/', '/details']) {
      const response = proxy(request(`/${route}${suffix}`));
      expect(response.status).toBe(308);
      expect(response.headers.get('location')).toBe('https://vexnexa.com/nl/support');
    }
  });

  it.each(locales)('preserves the %s language when retiring any former page', locale => {
    for (const route of formerRoutes) {
      for (const suffix of ['', '/', '/details']) {
        const response = proxy(request(`/${locale}/${route}${suffix}`));
        expect(response.status, `${locale}/${route}${suffix}`).toBe(308);
        expect(response.headers.get('location')).toBe(`https://vexnexa.com/${locale}/support`);
      }
    }
  });

  it('does not propagate former checkout tokens or redirect destinations', () => {
    const response = proxy(request('/en/checkout/return?paymentId=tr_private&next=https://evil.example'));
    expect(response.headers.get('location')).toBe('https://vexnexa.com/en/support');
  });

  it('keeps page redirects on the current preview origin', () => {
    const response = proxy(request('/fr/dashboard', 'GET', 'https://studio-preview.vercel.app'));
    expect(response.headers.get('location')).toBe('https://studio-preview.vercel.app/fr/support');
  });

  it.each(['contact', 'privacy', 'support', 'studio'])('redirects the old unlocalized /%s page to Dutch', route => {
    const response = proxy(request(`/${route}?old=tracking`));
    expect(response.status).toBe(308);
    expect(response.headers.get('location')).toBe(`https://vexnexa.com/nl/${route}`);
  });

  it.each(locales)('allows all six current pages for %s without loops', locale => {
    for (const path of ['', '/games/ipiwow', '/studio', '/contact', '/privacy', '/support']) {
      const response = proxy(request(`/${locale}${path}`));
      expect(response.headers.get('x-middleware-next')).toBe('1');
      expect(response.headers.get('location')).toBeNull();
    }
  });

  it.each(['/', '/sitemap.xml', '/robots.txt', '/pricing-guide', '/en/dashboard-art', '/apiary', '/unknown'])('does not overmatch unrelated route %s', path => {
    expect(proxy(request(path)).headers.get('x-middleware-next')).toBe('1');
  });
});

describe('proxy route matcher', () => {
  const matcher = new RegExp(`^${config.matcher[0]}$`);

  it.each(['/api/contact', '/api/mollie/webhook', '/en/checkout', '/tl/pricing', '/nl/studio', '/sitemap.xml'])('covers application route %s', path => {
    expect(matcher.test(path)).toBe(true);
  });

  it.each(['/_next/static/chunks/app.js', '/_next/image', '/favicon.ico', '/studio/ipiwow-mascot.png'])('leaves static asset %s alone', path => {
    expect(matcher.test(path)).toBe(false);
  });
});
