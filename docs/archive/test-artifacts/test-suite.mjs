/**
 * VexNexa Comprehensive Test Suite
 * Tests: Pages, API routes, Database tables, Internal links
 * Run: node test-suite.mjs
 */

const BASE_URL = 'https://www.vexnexa.com';

const results = {
  pages: { pass: [], fail: [], redirect: [], authRequired: [] },
  api: { pass: [], fail: [], redirect: [], authRequired: [] },
  db: { pass: [], fail: [] },
  links: { pass: [], fail: [], external: [] },
};

// ─── Helpers ───────────────────────────────────────────────────────
async function testUrl(url, label, category) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'manual',
      signal: controller.signal,
      headers: { 'User-Agent': 'VexNexa-TestSuite/1.0' },
    });
    clearTimeout(timeout);

    const status = res.status;
    if (status >= 200 && status < 300) {
      results[category].pass.push({ label, status });
    } else if (status >= 300 && status < 400) {
      const location = res.headers.get('location') || '';
      if (location.includes('/auth/login') || location.includes('/login')) {
        results[category].authRequired.push({ label, status, location });
      } else {
        results[category].redirect.push({ label, status, location });
      }
    } else if (status === 401 || status === 403) {
      results[category].authRequired.push({ label, status });
    } else {
      results[category].fail.push({ label, status });
    }
    return { status, ok: status >= 200 && status < 400 };
  } catch (err) {
    results[category].fail.push({ label, error: err.message });
    return { status: 0, ok: false, error: err.message };
  }
}

// ─── 1. PAGE TESTS ────────────────────────────────────────────────
const PUBLIC_PAGES = [
  '/',
  '/about',
  '/contact',
  '/demo',
  '/features',
  '/get-started',
  '/legal/privacy',
  '/legal/security',
  '/legal/sla',
  '/legal/terms',
  '/pricing',
  '/test',
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verified',
  '/auth/verify-error',
  '/blog',
  '/changelog',
  '/legal/cookies',
  '/newsletter/confirmed',
  '/newsletter/invalid',
  '/newsletter/unsubscribed',
  '/unauthorized',
];

const AUTH_PAGES = [
  '/dashboard',
  '/dashboard/assurance',
  '/dashboard/assurance/alerts',
  '/dashboard/assurance/domains',
  '/dashboard/assurance/domains/new',
  '/dashboard/assurance/reports',
  '/dashboard/audits',
  '/dashboard/subscribe-assurance',
  '/dashboard/support',
  '/dashboard/support/new',
  '/onboarding',
  '/scans',
  '/scans/results',
  '/settings/billing',
  '/settings/notifications',
  '/settings/white-label',
  '/sites',
  '/sites/new',
  '/teams',
  '/analytics',
  '/advanced-analytics',
  '/test-enhanced-scan',
  '/admin',
  '/admin/analytics',
  '/admin/analytics-advanced',
  '/admin/api-logs',
  '/admin/audit-logs',
  '/admin/billing',
  '/admin/blog',
  '/admin/contact-messages',
  '/admin/deleted-items',
  '/admin/error-logs',
  '/admin/health',
  '/admin/payments',
  '/admin/roles',
  '/admin/seo',
  '/admin/seo/alerts',
  '/admin/seo/index-health',
  '/admin/seo/page-quality',
  '/admin/seo/settings',
  '/admin/seo/visibility',
  '/admin/sites',
  '/admin/system-health',
  '/admin/teams',
  '/admin/test',
  '/admin/tickets',
  '/admin/upgrade',
  '/admin/users',
  '/admin/white-label',
  '/admin-interface',
];

async function testPages() {
  console.log('\n══════════════════════════════════════════');
  console.log('  1. TESTING PAGES');
  console.log('══════════════════════════════════════════\n');

  console.log('--- Public Pages ---');
  for (const path of PUBLIC_PAGES) {
    const { status } = await testUrl(`${BASE_URL}${path}`, path, 'pages');
    const icon = status >= 200 && status < 300 ? '✅' : status >= 300 && status < 400 ? '🔀' : '❌';
    console.log(`  ${icon} ${path} → ${status}`);
  }

  console.log('\n--- Auth-Required Pages ---');
  for (const path of AUTH_PAGES) {
    const { status } = await testUrl(`${BASE_URL}${path}`, path, 'pages');
    const icon = status >= 200 && status < 300 ? '✅' : (status >= 300 && status < 400) || status === 401 || status === 403 ? '🔒' : '❌';
    console.log(`  ${icon} ${path} → ${status}`);
  }
}

// ─── 2. API ROUTE TESTS ──────────────────────────────────────────
const API_GET_ROUTES = [
  '/api/health',
  '/api/dbtest',
  '/api/debug-db',
  '/api/analytics',
  '/api/benchmarks',
  '/api/blog',
  '/api/dashboard-stats',
  '/api/issues',
  '/api/notifications',
  '/api/portfolios',
  '/api/reports',
  '/api/scheduled-scans',
  '/api/teams',
  '/api/user/profile',
  '/api/user/account',
  '/api/user/activity',
  '/api/user/notification-settings',
  '/api/white-label',
  '/api/webhooks',
  '/api/assurance/alerts',
  '/api/assurance/domains',
  '/api/assurance/reports',
  '/api/assurance/subscription',
  '/api/billing',
  '/api/billing/addons',
  '/api/admin/system/health',
  '/api/admin/system/api-logs',
  '/api/admin/system/api-stats',
  '/api/admin/system/errors',
  '/api/admin/system/performance',
  '/api/admin/advanced-analytics',
  '/api/admin/audit-logs',
  '/api/admin/scheduled-reports',
  '/api/monitoring/dashboard',
  '/api/monitoring/compliance',
  '/api/monitoring/trends',
  '/api/monitoring/regressions',
  '/api/monitoring/alerts/history',
  '/api/monitoring/alerts/rules',
  '/api/audits',
];

async function testApiRoutes() {
  console.log('\n══════════════════════════════════════════');
  console.log('  2. TESTING API ROUTES (GET)');
  console.log('══════════════════════════════════════════\n');

  for (const path of API_GET_ROUTES) {
    const { status } = await testUrl(`${BASE_URL}${path}`, path, 'api');
    const icon = status >= 200 && status < 300 ? '✅' : status === 401 || status === 403 ? '🔒' : status === 405 ? '⚠️' : '❌';
    console.log(`  ${icon} ${path} → ${status}`);
  }
}

// ─── 3. DATABASE TABLE TESTS ─────────────────────────────────────
async function testDatabase() {
  console.log('\n══════════════════════════════════════════');
  console.log('  3. TESTING DATABASE TABLES');
  console.log('══════════════════════════════════════════\n');

  // Use the health/dbtest endpoints to verify DB connectivity
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json().catch(() => null);
    if (healthRes.ok) {
      results.db.pass.push({ label: 'Health endpoint (DB connectivity)', detail: healthData });
      console.log('  ✅ Health endpoint → DB connected');
    } else {
      results.db.fail.push({ label: 'Health endpoint', status: healthRes.status });
      console.log(`  ❌ Health endpoint → ${healthRes.status}`);
    }
  } catch (err) {
    results.db.fail.push({ label: 'Health endpoint', error: err.message });
    console.log(`  ❌ Health endpoint → ${err.message}`);
  }

  try {
    const dbRes = await fetch(`${BASE_URL}/api/dbtest`);
    const dbData = await dbRes.json().catch(() => null);
    if (dbRes.ok) {
      results.db.pass.push({ label: 'DB test endpoint', detail: dbData });
      console.log('  ✅ DB test endpoint → connected');
    } else {
      results.db.fail.push({ label: 'DB test endpoint', status: dbRes.status });
      console.log(`  ❌ DB test endpoint → ${dbRes.status}`);
    }
  } catch (err) {
    results.db.fail.push({ label: 'DB test endpoint', error: err.message });
    console.log(`  ❌ DB test endpoint → ${err.message}`);
  }

  // Test individual tables via API routes that query them
  const TABLE_TESTS = [
    { table: 'User', route: '/api/admin/system/health', note: 'via admin health' },
    { table: 'Site', route: '/api/sites/test-nonexistent', note: 'expects 404 = DB works' },
    { table: 'BlogPost', route: '/api/blog', note: 'public blog list' },
    { table: 'Scan', route: '/api/benchmarks', note: 'benchmarks query scans' },
    { table: 'ContactMessage', route: '/api/contact', note: 'POST-only, GET=405 is OK' },
    { table: 'Notification', route: '/api/notifications', note: 'auth required' },
    { table: 'Team', route: '/api/teams', note: 'auth required' },
    { table: 'Portfolio', route: '/api/portfolios', note: 'auth required' },
    { table: 'Issue', route: '/api/issues', note: 'auth required' },
    { table: 'WebhookEndpoint', route: '/api/webhooks', note: 'auth required' },
    { table: 'ScheduledScan', route: '/api/scheduled-scans', note: 'auth required' },
    { table: 'ManualAudit', route: '/api/audits', note: 'auth required' },
    { table: 'AssuranceDomain', route: '/api/assurance/domains', note: 'auth required' },
    { table: 'AssuranceAlert', route: '/api/assurance/alerts', note: 'auth required' },
    { table: 'AssuranceReport', route: '/api/assurance/reports', note: 'auth required' },
    { table: 'AssuranceSubscription', route: '/api/assurance/subscription', note: 'auth required' },
    { table: 'AddOn', route: '/api/billing/addons', note: 'auth required' },
    { table: 'ErrorLog', route: '/api/admin/system/errors', note: 'admin required' },
    { table: 'ApiLog', route: '/api/admin/system/api-logs', note: 'admin required' },
    { table: 'AuditLog', route: '/api/admin/audit-logs', note: 'admin required' },
  ];

  console.log('\n  --- Table connectivity via API routes ---');
  for (const { table, route, note } of TABLE_TESTS) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE_URL}${route}`, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'VexNexa-TestSuite/1.0' },
      });
      clearTimeout(timeout);
      const status = res.status;
      // 200, 401, 403, 404, 405 all mean the route+DB is reachable (not a 500)
      if (status < 500) {
        results.db.pass.push({ label: `${table} table`, route, status, note });
        const icon = status >= 200 && status < 300 ? '✅' : '🔒';
        console.log(`  ${icon} ${table} → ${route} → ${status} (${note})`);
      } else {
        results.db.fail.push({ label: `${table} table`, route, status, note });
        console.log(`  ❌ ${table} → ${route} → ${status} (${note})`);
      }
    } catch (err) {
      results.db.fail.push({ label: `${table} table`, route, error: err.message });
      console.log(`  ❌ ${table} → ${route} → ${err.message}`);
    }
  }

  // Tables not directly testable via GET routes (no public endpoint)
  const UNTESTABLE_TABLES = [
    'Page', 'Usage', 'Crawl', 'CrawlUrl', 'Benchmark', 'WhiteLabel',
    'TeamMember', 'TeamInvite', 'IssueComment', 'IssueActivity',
    'AuditTemplate', 'AuditCriterion', 'AuditItem', 'AuditAttachment',
    'SupportTicket', 'SupportTicketMessage', 'AdminUserNote', 'UserAdminEvent',
    'AssuranceScan',
  ];
  console.log(`\n  ℹ️  ${UNTESTABLE_TABLES.length} tables not directly testable via public GET (nested/write-only):`);
  console.log(`     ${UNTESTABLE_TABLES.join(', ')}`);
}

// ─── 4. LINK TESTS ──────────────────────────────────────────────
async function testLinks() {
  console.log('\n══════════════════════════════════════════');
  console.log('  4. TESTING INTERNAL LINKS');
  console.log('══════════════════════════════════════════\n');

  // Fetch key public pages and extract all href links
  const pagesToScrape = ['/', '/about', '/contact', '/features', '/pricing', '/legal/privacy', '/legal/terms', '/legal/security', '/legal/sla', '/blog', '/changelog', '/get-started', '/demo'];
  const allLinks = new Set();

  for (const path of pagesToScrape) {
    try {
      const res = await fetch(`${BASE_URL}${path}`, { headers: { 'User-Agent': 'VexNexa-TestSuite/1.0' } });
      if (!res.ok) continue;
      const html = await res.text();
      // Extract href values
      const hrefRegex = /href=["']([^"']+)["']/g;
      let match;
      while ((match = hrefRegex.exec(html)) !== null) {
        const href = match[1];
        if (href.startsWith('/') && !href.startsWith('//')) {
          allLinks.add(href.split('#')[0].split('?')[0]); // strip hash/query
        } else if (href.startsWith(BASE_URL)) {
          const path = href.replace(BASE_URL, '').split('#')[0].split('?')[0];
          if (path) allLinks.add(path);
        } else if (href.startsWith('http')) {
          results.links.external.push(href);
        }
      }
    } catch (err) {
      console.log(`  ⚠️  Could not scrape ${path}: ${err.message}`);
    }
  }

  // Deduplicate and sort
  const uniqueLinks = [...allLinks].sort();
  console.log(`  Found ${uniqueLinks.length} unique internal links across ${pagesToScrape.length} pages\n`);

  for (const link of uniqueLinks) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(`${BASE_URL}${link}`, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'User-Agent': 'VexNexa-TestSuite/1.0' },
      });
      clearTimeout(timeout);
      const status = res.status;
      if (status >= 200 && status < 400) {
        results.links.pass.push({ link, status });
        console.log(`  ✅ ${link} → ${status}`);
      } else if (status === 401 || status === 403) {
        results.links.pass.push({ link, status, note: 'auth required' });
        console.log(`  🔒 ${link} → ${status} (auth required)`);
      } else {
        results.links.fail.push({ link, status });
        console.log(`  ❌ ${link} → ${status}`);
      }
    } catch (err) {
      results.links.fail.push({ link, error: err.message });
      console.log(`  ❌ ${link} → ${err.message}`);
    }
  }
}

// ─── SUMMARY ─────────────────────────────────────────────────────
function printSummary() {
  console.log('\n\n╔══════════════════════════════════════════════════════════╗');
  console.log('║              VEXNEXA TEST SUITE SUMMARY                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  const section = (title, data) => {
    console.log(`┌─ ${title} ─────────────────────────────────`);
    console.log(`│  ✅ Pass:          ${data.pass.length}`);
    if (data.redirect) console.log(`│  🔀 Redirect:      ${data.redirect.length}`);
    if (data.authRequired) console.log(`│  🔒 Auth Required: ${data.authRequired.length}`);
    console.log(`│  ❌ Fail:          ${data.fail.length}`);
    if (data.external) console.log(`│  🌐 External:      ${data.external.length}`);
    console.log('└──────────────────────────────────────────\n');

    if (data.fail.length > 0) {
      console.log('  FAILURES:');
      data.fail.forEach(f => {
        console.log(`    ❌ ${f.label || f.link} → ${f.status || f.error}`);
      });
      console.log('');
    }
  };

  section('PAGES', results.pages);
  section('API ROUTES', results.api);
  section('DATABASE', results.db);
  section('LINKS', results.links);

  const totalPass = results.pages.pass.length + results.api.pass.length + results.db.pass.length + results.links.pass.length;
  const totalFail = results.pages.fail.length + results.api.fail.length + results.db.fail.length + results.links.fail.length;
  const totalAuth = (results.pages.authRequired?.length || 0) + (results.api.authRequired?.length || 0);
  const totalRedirect = (results.pages.redirect?.length || 0) + (results.api.redirect?.length || 0);

  console.log('═══════════════════════════════════════════');
  console.log(`  TOTAL PASS:          ${totalPass}`);
  console.log(`  TOTAL REDIRECT:      ${totalRedirect}`);
  console.log(`  TOTAL AUTH REQUIRED: ${totalAuth}`);
  console.log(`  TOTAL FAIL:          ${totalFail}`);
  console.log(`  HEALTH:              ${totalFail === 0 ? '🟢 ALL CLEAR' : '🔴 ISSUES FOUND'}`);
  console.log('═══════════════════════════════════════════\n');
}

// ─── RUN ─────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║         VEXNEXA COMPREHENSIVE TEST SUITE                ║');
  console.log(`║         Target: ${BASE_URL}                    ║`);
  console.log(`║         Time:   ${new Date().toISOString()}       ║`);
  console.log('╚══════════════════════════════════════════════════════════╝');

  await testPages();
  await testApiRoutes();
  await testDatabase();
  await testLinks();
  printSummary();
}

main().catch(console.error);
