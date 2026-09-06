import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn(), ping: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: mocks.query, $executeRaw: mocks.execute } }));
vi.mock('@/lib/indexnow', () => ({ pingIndexNow: mocks.ping }));
import { buildPublicSummary, extractTopViolations, getIndexablePublicDomains, getLatestPublicReport,
  getPublicReportByScanId, getPublicReportHistory, isPublicReportIndexable, isScanEligibleForPublicReport,
  publishScanReport, shouldAllowIndexing, type PublishableScan } from '../public-reports';

function scan(overrides: Partial<PublishableScan> = {}): PublishableScan {
  return { id: 'scan-a', status: 'done', score: 70, issues: 3, impactCritical: 1, impactSerious: 1, impactModerate: 1, impactMinor: 0,
    wcagAACompliance: 80, wcagAAACompliance: 75, performanceScore: 90, seoScore: 95, site: { url: 'https://www.example.com' },
    page: { url: 'https://www.example.com/page' }, createdAt: new Date('2026-09-10T12:00:00.000Z'),
    raw: { violations: [1, 2, 3].map((id) => ({ id: `rule-${id}`, impact: 'serious', help: 'Fix accessible name', description: 'Missing name',
      helpUrl: 'https://example.com/rule', tags: ['wcag2a', 'best-practice', 'private-tag'], nodes: [{ html: '<secret>private</secret>' }] })) }, ...overrides };
}
const report = { id: 'report-a', site_id: 'site-a', normalized_domain: 'example.com', score: 70 };
const sql = (mock: typeof mocks.query, index = 0) => (mock.mock.calls[index][0] as string[]).join('?');
beforeEach(() => {
  Object.values(mocks).forEach((mock) => mock.mockReset());
  mocks.execute.mockResolvedValue(1);
  mocks.ping.mockResolvedValue(undefined);
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

describe('public report quality and safe summaries', () => {
  it.each(['done', 'COMPLETED'])('accepts a completed scan with status %s', (status) => {
    expect(isScanEligibleForPublicReport(scan({ status }))).toBe(true);
  });
  it.each([{ status: 'failed' }, { status: 'running' }, { score: null }, { score: undefined }, { score: -1 }, { score: 101 }, { issues: null }, { issues: undefined }])(
    'rejects incomplete or out-of-range scan evidence %j', (overrides) => {
      expect(isScanEligibleForPublicReport(scan(overrides))).toBe(false);
      expect(shouldAllowIndexing(scan(overrides))).toBe(false);
    });
  it.each([0, 100])('retains valid boundary score %s', (score) => expect(isScanEligibleForPublicReport(scan({ score }))).toBe(true));
  it('requires issue count, enough unique findings and non-minor impact before indexing', () => {
    expect(shouldAllowIndexing(scan())).toBe(true);
    expect(shouldAllowIndexing(scan({ issues: 2 }))).toBe(false);
    expect(shouldAllowIndexing(scan({ raw: { violations: [] } }))).toBe(false);
    expect(shouldAllowIndexing(scan({ raw: null }))).toBe(false);
    expect(shouldAllowIndexing(scan({ impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 3 }))).toBe(false);
  });
  it.each([3, BigInt(3), '3'])('normalizes database count representation %s without bypassing index quality', (count) => {
    expect(isPublicReportIndexable({ allow_indexing: true, issues_total: count, impact_critical: '1', impact_serious: BigInt(0),
      impact_moderate: undefined, top_violations: [{}, {}, {}] })).toBe(true);
  });
  it.each([undefined, {}, { allow_indexing: false }, { allow_indexing: true, issues_total: 'invalid', top_violations: [{}, {}, {}] },
    { allow_indexing: true, issues_total: 3, impact_critical: 1, top_violations: {} }])('does not index missing or thin public data %j', (input) => {
    expect(isPublicReportIndexable(input)).toBe(false);
  });
  it('projects findings to an explicit public-safe field set without raw DOM or arbitrary tags', () => {
    const result = extractTopViolations(scan().raw, 2);
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'rule-1', impact: 'serious', help: 'Fix accessible name', description: 'Missing name',
      helpUrl: 'https://example.com/rule', tags: ['wcag2a', 'best-practice'], nodeCount: 1 });
    expect(JSON.stringify(result)).not.toContain('<secret>');
    expect(extractTopViolations({ violations: [{ id: 'minimal' }] })).toEqual([{ id: 'minimal', impact: 'minor', help: '', description: '', helpUrl: '', tags: [], nodeCount: 0 }]);
  });
  it.each([null, {}, { violations: 'wrong type' }])('handles absent or malformed violation lists', (raw) => {
    expect(extractTopViolations(raw)).toEqual([]);
  });
  it('publishes only aggregate scan information in the summary', () => {
    expect(buildPublicSummary(scan())).toEqual({ score: 70, totalIssues: 3, impactBreakdown: { critical: 1, serious: 1, moderate: 1, minor: 0 },
      wcagCompliance: { aa: 80, aaa: 75 }, performance: 90, seo: 95, scannedAt: '2026-09-10T12:00:00.000Z' });
  });
});

describe('public report publication boundaries', () => {
  it.each([{ status: 'failed' }, { site: { url: '' }, page: null }, { site: { url: 'http://localhost' }, page: null }])(
    'does not write a report without eligible evidence and a valid domain', async (overrides) => {
      expect(await publishScanReport(scan(overrides))).toBeNull();
      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.ping).not.toHaveBeenCalled();
    });
  it('creates the public site, parameterizes evidence and points the site to the published report', async () => {
    mocks.query.mockResolvedValueOnce([]).mockResolvedValueOnce([{ id: 'site-a' }]).mockResolvedValueOnce([report]);
    expect(await publishScanReport(scan())).toEqual(report);
    expect(sql(mocks.query, 0)).toContain('WHERE normalized_domain = ?');
    expect(mocks.query.mock.calls[0].slice(1)).toEqual(['example.com']);
    expect(sql(mocks.query, 1)).toContain('INSERT INTO public_scan_sites');
    expect(sql(mocks.query, 2)).toContain('INSERT INTO public_scan_reports');
    expect(mocks.query.mock.calls[2]).toContain('https://www.example.com/page');
    expect(sql(mocks.execute)).toContain('latest_public_report_id = ?');
    expect(mocks.execute.mock.calls[0].slice(1)).toEqual(['report-a', 'site-a']);
    expect(mocks.ping).toHaveBeenCalledWith([expect.stringContaining('example.com')]);
  });
  it.each([4, null])('updates an existing site count %j and supports page URL fallback', async (total_scans) => {
    mocks.query.mockResolvedValueOnce([{ id: 'site-a', total_scans }]).mockResolvedValueOnce([report]);
    expect(await publishScanReport(scan({ site: { url: '' } }))).toEqual(report);
    expect(mocks.execute.mock.calls[0].slice(1)).toEqual([(total_scans || 0) + 1, 'site-a']);
    expect(mocks.query).toHaveBeenCalledTimes(2);
  });
  it('keeps thin reports unindexed and does not notify discovery services', async () => {
    mocks.query.mockResolvedValueOnce([{ id: 'site-a', total_scans: 0 }]).mockResolvedValueOnce([report]);
    expect(await publishScanReport(scan({ issues: 0, raw: {}, page: null }))).toEqual(report);
    expect(mocks.query.mock.calls[1]).toContain(false);
    expect(mocks.query.mock.calls[1]).toContain('https://www.example.com');
    expect(mocks.ping).not.toHaveBeenCalled();
  });
  it('does not roll back a completed report merely because discovery notification fails', async () => {
    mocks.query.mockResolvedValueOnce([{ id: 'site-a', total_scans: 0 }]).mockResolvedValueOnce([report]);
    mocks.ping.mockRejectedValue(new Error('discovery unavailable'));
    expect(await publishScanReport(scan())).toEqual(report);
    expect(console.warn).toHaveBeenCalled();
  });
  it.each([new Error('database unavailable'), 'database unavailable'])('returns null and logs publication database failures', async (error) => {
    mocks.query.mockRejectedValue(error);
    expect(await publishScanReport(scan())).toBeNull();
    expect(mocks.ping).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});

describe('public report read filters and failure handling', () => {
  it('requires both report visibility and site-level publication for the latest report', async () => {
    mocks.query.mockResolvedValue([report]);
    expect(await getLatestPublicReport('example.com')).toEqual(report);
    expect(sql(mocks.query)).toContain('r.is_public = true');
    expect(sql(mocks.query)).toContain('s.public_page_enabled = true');
    expect(sql(mocks.query)).toContain('ORDER BY r.published_at DESC');
    expect(mocks.query.mock.calls[0].slice(1)).toEqual(['example.com']);
  });
  it('requires the requested domain and scan id plus public visibility', async () => {
    mocks.query.mockResolvedValue([report]);
    expect(await getPublicReportByScanId('example.com', 'scan-a')).toEqual(report);
    expect(mocks.query.mock.calls[0].slice(1)).toEqual(['example.com', 'scan-a']);
    expect(sql(mocks.query)).toContain('r.is_public = true');
    expect(sql(mocks.query)).toContain('s.public_page_enabled = true');
  });
  it('returns bounded public history using parameterized domain and limit', async () => {
    mocks.query.mockResolvedValue([report]);
    expect(await getPublicReportHistory('example.com', 5)).toEqual([report]);
    expect(mocks.query.mock.calls[0].slice(1)).toEqual(['example.com', 5]);
    expect(sql(mocks.query)).toContain('AND is_public = true');
    await getPublicReportHistory('example.com');
    expect(mocks.query.mock.calls[1].slice(1)).toEqual(['example.com', 10]);
  });
  it('sitemap domain lookup retains public visibility and content-quality requirements', async () => {
    mocks.query.mockResolvedValue([{ normalized_domain: 'example.com', updated_at: '2026-09-10' }]);
    expect(await getIndexablePublicDomains()).toHaveLength(1);
    for (const marker of ['s.public_page_enabled = true', 'r.is_public = true', 'r.allow_indexing = true', 'jsonb_array_length(r.top_violations)', 'LIMIT 5000']) {
      expect(sql(mocks.query)).toContain(marker);
    }
    expect(mocks.query.mock.calls[0].slice(1)).toEqual([3, 3]);
  });
  it.each([
    [() => getLatestPublicReport('example.com'), null], [() => getPublicReportByScanId('example.com', 'scan-a'), null],
    [() => getPublicReportHistory('example.com'), []], [() => getIndexablePublicDomains(), []],
  ] as const)('returns the safe empty result on missing data or a database failure', async (read, empty) => {
    mocks.query.mockResolvedValue([]);
    expect(await read()).toEqual(empty);
    mocks.query.mockRejectedValue(new Error('read unavailable'));
    expect(await read()).toEqual(empty);
  });
});
