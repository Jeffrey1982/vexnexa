import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ send: vi.fn(), fetch: vi.fn() }));
vi.mock('resend', () => ({ Resend: class { emails = { send: mocks.send }; } }));
let email: typeof import('../email');

const recipient = 'recipient@example.com';
const result = { data: { id: 'mock-message' }, error: null };
const lead = { email: recipient, url: 'https://example.com/page', phase: 'done' as const, locale: 'en' as const, clientIp: '192.0.2.1',
  result: { score: 72, totalIssues: 10, impactCritical: 1, impactSerious: 2, impactModerate: 3, impactMinor: 4 } };
const digest = () => ({ periodStart: new Date('2026-09-01'), periodEnd: new Date('2026-09-08'), newUsers: 2, newUsersDelta: '+1',
  scansCompleted: 12, scansCompletedDelta: '+2', scansFailed: 0, freeScanLeads: 3, freeScanLeadsDelta: '+1', recentFreeScanLeads: [],
  partnerApps: 1, partnerAppsDelta: '0', contactMessages: 4, contactMessagesDelta: '+2', recentApplications: [], recentUsers: [], gsc: null });
type EmailCall = (module: typeof email) => Promise<unknown>;
const deliveries: Array<[string, EmailCall, string]> = [
  ['contact', (m) => m.sendContactNotification({ name: 'Person', email: recipient, message: 'A question' }), 'info@vexnexa.com'],
  ['agency application', (m) => m.sendPilotPartnerApplicationEmail({ fullName: 'Person', companyName: 'Agency', email: recipient,
    website: 'https://example.com', clientSites: '10', services: ['seo'], motivation: 'Accessible websites' }), 'info@vexnexa.com'],
  ['agency confirmation', (m) => m.sendPilotPartnerConfirmationEmail({ email: recipient, companyName: 'Agency' }), recipient],
  ['scanner health', (m) => m.sendScanHealthAlertEmail({ url: 'https://example.com', error: 'Timeout', durationMs: 1200 }), 'support@example.com'],
  ['free scan', (m) => m.sendFreeScanLeadEmails(lead), recipient],
  ['nurture', (m) => m.sendLeadNurtureEmail({ to: recipient, subject: 'Evidence', body: 'View https://example.com/report',
    unsubscribeUrl: 'https://example.com/unsubscribe', idempotencyKey: 'delivery-1' }), recipient],
  ['blog draft', (m) => m.sendBlogDraftNotification({ mode: 'drafted', topicEn: 'Accessibility', editUrl: 'https://example.com/admin' }), 'support@example.com'],
  ['digest', (m) => m.sendWeeklyDigestEmail(digest()), 'support@example.com'],
  ['team invite', (m) => m.sendTeamInvitation({ inviterName: 'Colleague', teamName: 'Agency', inviteEmail: recipient, inviteToken: 'opaque-token', role: 'member' }), recipient],
  ['password reset', (m) => m.sendPasswordResetEmail({ email: recipient, resetUrl: 'https://example.com/reset' }), recipient],
  ['welcome', (m) => m.sendWelcomeEmail({ email: recipient, firstName: 'Person' }), recipient],
  ['verification', (m) => m.sendEmailVerification({ email: recipient, confirmUrl: 'https://example.com/confirm' }), recipient],
  ['newsletter confirmation', (m) => m.sendNewsletterConfirmation({ email: recipient }), recipient],
  ['test', (m) => m.sendTestEmail(), 'info@vexnexa.com'],
  ['admin', (m) => m.sendAdminEmail({ to: recipient, subject: 'Service update', message: 'A\nmessage' }), recipient],
  ['new user', (m) => m.sendNewUserNotification({ email: recipient, marketingEmails: false, productUpdates: false }), 'info@vexnexa.com'],
  ['assurance welcome', (m) => m.sendAssuranceWelcome({ email: recipient, tier: 'STARTER', language: 'en' }), recipient],
  ['assurance report', (m) => m.sendAssuranceReport({ recipients: [recipient], domain: 'example.com', score: 72, threshold: 70, language: 'en' }), recipient],
  ['assurance alert', (m) => m.sendAssuranceAlert({ recipients: [recipient], domain: 'example.com', currentScore: 50, previousScore: 80,
    threshold: 70, alertType: 'REGRESSION', language: 'en' }), recipient],
];

beforeEach(async () => {
  vi.resetModules();
  mocks.send.mockReset().mockResolvedValue(result);
  mocks.fetch.mockReset().mockRejectedValue(new Error('Network disabled in unit tests'));
  vi.stubGlobal('fetch', mocks.fetch);
  vi.stubEnv('RESEND_API_KEY', 're_unit_test_not_real');
  vi.stubEnv('RESEND_FROM_EMAIL', ' Sender <sender@example.com> ');
  vi.stubEnv('RESEND_ADMIN_FROM_EMAIL', ' Admin <admin@example.com> ');
  vi.stubEnv('BILLING_SUPPORT_EMAIL', ' support@example.com ');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://app.example.com');
  for (const level of ['log', 'warn', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => {});
  email = await import('../email');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('email service transport boundary', () => {
  it.each(deliveries)('%s renders multipart content for the intended recipient through the mocked provider only', async (_name, send, to) => {
    expect(await send(email)).toBeTruthy();
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.to).toContain(to);
    expect(mail.subject).toEqual(expect.any(String));
    expect(mail.html).toMatch(/<(p|h[12])(?:\s|>)/);
    expect(mail.text.trim().length).toBeGreaterThan(0);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
  it.each(deliveries)('%s cannot silently report a transport exception as successful delivery', async (_name, send) => {
    mocks.send.mockRejectedValue(new Error('provider unavailable'));
    await expect(send(email)).rejects.toThrow('provider unavailable');
  });
  it.each(deliveries)('%s cannot contact an email provider when the API key is absent', async (name, send) => {
    vi.stubEnv('RESEND_API_KEY', undefined);
    vi.resetModules();
    email = await import('../email');
    if (name === 'test' || name === 'nurture') await expect(send(email)).rejects.toThrow('RESEND_API_KEY not configured');
    else expect(await send(email)).toBeNull();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});

describe('contact and acquisition evidence', () => {
  it.each(['general', 'walkthrough', 'sample-pdf', 'white-label'] as const)('keeps contact intent %s and all user-supplied detail fields safe in HTML', async (intent) => {
    await email.sendContactNotification({ name: '<Person>', email: recipient, message: '<script>bad & "quoted"</script>', intent,
      companyName: '<Agency>', phoneNumber: '+31000000000', domainCount: '10', industry: 'Services', language: 'nl', reason: 'demo', source: '/pricing', referenceId: 'ref-1' });
    expect(mocks.send).toHaveBeenCalledTimes(2);
    const admin = mocks.send.mock.calls[0][0]; const visitor = mocks.send.mock.calls[1][0];
    expect(admin.replyTo).toBe(recipient);
    expect(visitor.to).toEqual([recipient]);
    for (const mail of [admin, visitor]) {
      expect(mail.html).not.toContain('<script>');
      expect(mail.html).toContain('&lt;script&gt;bad &amp; &quot;quoted&quot;');
      expect(mail.text).toContain('ref-1');
    }
    expect(admin.text).toContain('Domains/sites: 10');
    expect(admin.text).toContain('Preferred language: nl');
  });
  it('uses safe founding-agency subject formatting and escapes optional applicant fields', async () => {
    await email.sendPilotPartnerApplicationEmail({ fullName: '<Person>', companyName: ' Agency\r\nInjected ', email: recipient, phone: '<phone>',
      website: 'https://example.com', clientSites: '5', services: ['seo', 'custom_service'], motivation: '<script>bad</script>' });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.subject).not.toMatch(/[\r\n]/);
    expect(mail.html).toContain('&lt;phone&gt;');
    expect(mail.html).not.toContain('<script>');
    expect(mail.text).toContain('SEO, custom_service');
  });
  it.each(['en', 'nl'] as const)('renders actual free-scan evidence in %s and keeps marketing confirmation separate', async (locale) => {
    await email.sendFreeScanLeadEmails({ ...lead, locale, confirmMarketingUrl: 'https://example.com/confirm?token=opaque' });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.subject).toContain('72/100');
    expect(mail.text).toContain(locale === 'nl' ? '10 problemen gevonden' : '10 issues found');
    expect(mail.text).toContain(locale === 'nl' ? 'aparte opt-in' : 'separate opt-in');
    expect(mail.html).toContain('https://example.com/confirm?token=opaque');
    expect(mocks.send.mock.calls[1][0].to).toEqual(['support@example.com']);
  });
  it.each(['en', 'nl'] as const)('does not invent scan outcomes or opt-in when a %s scan failed', async (locale) => {
    await email.sendFreeScanLeadEmails({ ...lead, locale, phase: 'error', result: undefined });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.subject).not.toContain('/100');
    expect(mail.text).not.toContain('72');
    expect(mail.html).not.toContain('Confirm my opt-in');
    expect(mail.text).toContain(locale === 'nl' ? 'kon zojuist niet worden afgerond' : 'could not finish');
  });
  it('handles an unparseable scan URL as display text without injecting HTML', async () => {
    await email.sendFreeScanLeadEmails({ ...lead, url: '<invalid-url>', phase: 'rate_limited', result: undefined });
    expect(mocks.send.mock.calls[0][0].html).toContain('&lt;invalid-url&gt;');
    expect(mocks.send.mock.calls[0][0].html).not.toContain('<invalid-url>');
  });
  it('does not turn a delivered visitor message into failure when the non-blocking admin notification fails', async () => {
    mocks.send.mockResolvedValueOnce(result).mockRejectedValueOnce(new Error('admin notification failed'));
    expect(await email.sendFreeScanLeadEmails(lead)).toEqual(result);
    expect(console.error).toHaveBeenCalled();
  });
  it('passes provider rejection data back to the caller for delivery-state handling', async () => {
    const rejection = { data: null, error: { message: 'provider rejected' } };
    mocks.send.mockResolvedValue(rejection);
    expect(await email.sendFreeScanLeadEmails(lead)).toEqual(rejection);
  });
  it('nurture carries the one-click unsubscribe contract and stable provider idempotency key', async () => {
    await email.sendLeadNurtureEmail({ to: recipient, subject: 'Report', body: '<unsafe> & https://example.com/report',
      unsubscribeUrl: 'https://example.com/unsubscribe?token=opaque', idempotencyKey: 'delivery-a' });
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ from: 'Sender <sender@example.com>',
      headers: { 'List-Unsubscribe': '<https://example.com/unsubscribe?token=opaque>', 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      text: expect.stringContaining('Unsubscribe: https://example.com/unsubscribe?token=opaque') }), { idempotencyKey: 'delivery-a' });
    const html = mocks.send.mock.calls[0][0].html;
    expect(html).toContain('&lt;unsafe&gt; &amp;');
    expect(html).toContain('<a href="https://example.com/report"');
  });
});

describe('operational and assurance email variants', () => {
  it.each(['drafted', 'manual', 'exhausted', 'error'] as const)('renders the actual blog job state %s without publishing content', async (mode) => {
    await email.sendBlogDraftNotification({ mode, slug: 'article-slug', topicNl: 'Onderwerp', angle: 'Evidence', editUrl: 'https://example.com/admin', error: '<timeout>' });
    expect(mocks.send.mock.calls[0][0].to).toEqual(['support@example.com']);
    expect(mocks.send.mock.calls[0][0].html).not.toContain('<timeout>');
    if (mode === 'drafted') expect(mocks.send.mock.calls[0][0].html).toContain('Nothing is published automatically');
    if (mode === 'error') expect(mocks.send.mock.calls[0][0].html).toContain('&lt;timeout&gt;');
  });
  it.each([true, false])('digest renders stored evidence and explicitly handles missing metrics (positive delta=%s)', async (positive) => {
    await email.sendWeeklyDigestEmail({ ...digest(), scansFailed: 2, recentFreeScanLeads: [
      { domain: '<example.com>', score: 72, issues: 4, createdAt: '' }, { domain: 'unmeasured.com', score: null, issues: null, createdAt: '' } ],
      recentUsers: [{ email: recipient, plan: 'FREE' }], recentApplications: [{ companyName: '<Agency>', website: 'https://example.com', clientSites: '5', status: 'pending' }],
      gsc: { clicks: positive ? 10 : 1, clicksPrev: 5, impressions: positive ? 100 : 10, impressionsPrev: 50,
        topQueries: positive ? [{ query: '<accessibility>', clicks: 5 }] : [] } });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.text).toContain('score n/a, n/a issues');
    expect(mail.html).toContain('&lt;example.com&gt;');
    expect(mail.html).toContain('&lt;Agency&gt;');
    expect(mail.text).toContain('2 failed');
    expect(mail.text).toContain(positive ? '<accessibility> (5)' : 'Top queries: —');
  });
  it('uses explicit verification personalization and password-reset context only when supplied', async () => {
    await email.sendEmailVerification({ email: recipient, confirmUrl: 'https://example.com/confirm', firstName: 'Person' });
    expect(mocks.send.mock.calls[0][0].text).toContain('Welcome, Person!');
    await email.sendPasswordResetEmail({ email: recipient, resetUrl: 'https://example.com/reset', userAgent: 'Unit browser' });
    expect(mocks.send.mock.calls[1][0].text).toContain('Request made from: Unit browser');
  });
  it('includes opt-in flags and optional profile fields as supplied for the internal registration notice', async () => {
    await email.sendNewUserNotification({ email: recipient, firstName: 'Person', lastName: 'Name', company: 'Agency', jobTitle: 'Developer',
      phoneNumber: '0000000', website: 'https://example.com', country: 'NL', marketingEmails: true, productUpdates: true });
    expect(mocks.send.mock.calls[0][0].text).toContain('Marketing Emails: ✅ Opted In');
    expect(mocks.send.mock.calls[0][0].text).toContain('Company: Agency');
  });
  it('attaches the supplied report buffer and preserves an explicit report URL', async () => {
    const pdfBuffer = Buffer.from('unit-test-pdf');
    await email.sendAssuranceReport({ recipients: [recipient], domain: 'example.com', score: 50, threshold: 70, language: 'en',
      pdfBuffer, pdfUrl: 'https://example.com/report.pdf' });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.attachments).toEqual([{ filename: expect.stringMatching(/^accessibility-report-example.com-\d{4}-\d{2}-\d{2}\.pdf$/), content: pdfBuffer }]);
    expect(mail.text).toContain('https://example.com/report.pdf');
    expect(mail.text).toContain('Below Threshold');
  });
  it.each(['REGRESSION', 'SCORE_DROP', 'CRITICAL_ISSUES'] as const)('assurance alert %s uses the actual provided score', async (alertType) => {
    await email.sendAssuranceAlert({ recipients: [recipient], domain: 'example.com', currentScore: 50, previousScore: 80, threshold: 70, alertType, language: 'en' });
    expect(mocks.send.mock.calls[0][0].text).toContain('50/100');
    if (alertType === 'SCORE_DROP') expect(mocks.send.mock.calls[0][0].text).toContain('80/100');
  });
  it('uses configured default sender and app URLs when optional environment overrides are absent', async () => {
    for (const name of ['RESEND_FROM_EMAIL', 'RESEND_ADMIN_FROM_EMAIL', 'BILLING_SUPPORT_EMAIL', 'NEXT_PUBLIC_APP_URL']) vi.stubEnv(name, '');
    await email.sendScanHealthAlertEmail({ url: 'https://example.com', error: 'Timeout', durationMs: 1000 });
    expect(mocks.send.mock.calls[0][0]).toMatchObject({ from: 'VexNexa <updates@vexnexa.com>', to: ['info@vexnexa.com'] });
    await email.sendWelcomeEmail({ email: recipient, firstName: 'Person' });
    expect(mocks.send.mock.calls[1][0].text).toContain('https://vexnexa.com/dashboard');
  });
  it.each(deliveries.filter(([name]) => ['agency confirmation', 'free scan', 'nurture', 'blog draft', 'digest',
    'team invite', 'newsletter confirmation', 'assurance welcome', 'assurance report', 'assurance alert'].includes(name)))(
    '%s uses public fallback links and sender addresses when optional overrides are unset', async (_name, send) => {
      for (const name of ['RESEND_FROM_EMAIL', 'RESEND_ADMIN_FROM_EMAIL', 'BILLING_SUPPORT_EMAIL', 'NEXT_PUBLIC_APP_URL']) vi.stubEnv(name, '');
      await send(email);
      const mail = mocks.send.mock.calls[0][0];
      expect(mail.from).toMatch(/^VexNexa/);
      expect(mail.html).not.toContain('app.example.com');
      expect(mail.from).toBe(mail.from.trim());
    });
  it('does not present a done phase without result evidence as a completed scan', async () => {
    await email.sendFreeScanLeadEmails({ ...lead, phase: 'done', result: undefined });
    const mail = mocks.send.mock.calls[0][0];
    expect(mail.subject).not.toContain('/100');
    expect(mail.text).toContain('could not finish');
  });
  it('uses safe display fallbacks for a blank agency name and absent provider message metadata', async () => {
    mocks.send.mockResolvedValue({ data: null, error: null });
    await email.sendPilotPartnerApplicationEmail({ fullName: 'Person', companyName: '  ', email: recipient, website: 'https://example.com',
      clientSites: '1', services: [], motivation: 'Testing' });
    expect(mocks.send.mock.calls[0][0].subject).toContain('Unknown company');
    expect(await email.sendWelcomeEmail({ email: recipient, firstName: 'Person' })).toEqual({ data: null, error: null });
    expect(await email.sendNewsletterConfirmation({ email: recipient, source: 'footer' })).toEqual({ data: null, error: null });
  });
});
