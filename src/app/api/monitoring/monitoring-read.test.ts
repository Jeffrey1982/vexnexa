import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ auth: vi.fn(), sites: vi.fn(), scans: vi.fn() }));
vi.mock('@/lib/auth', () => ({ requireAuth: mocks.auth }));
vi.mock('@/lib/prisma', () => ({ prisma: { site: { findMany: mocks.sites }, scan: { findMany: mocks.scans } } }));
import { GET as dashboard } from './dashboard/route';
import { GET as trends } from './trends/route';
import { GET as compliance } from './compliance/route';
import { GET as regressions } from './regressions/route';
import { GET as history } from './alerts/history/route';

const userScope = { OR: [{ userId: 'user-a' }, { teams: { some: { members: { some: { userId: 'user-a' } } } } }] };
const req = (query = '') => new NextRequest(`https://app.example.com/api/monitoring${query}`);
const snapshot = (overrides: Record<string, unknown> = {}) => ({ id: 'latest', siteId: 'site-a', score: 80, issues: 5,
  wcagAACompliance: 80, wcagAAACompliance: 70, performanceScore: 80, createdAt: new Date('2026-09-10T12:00:00.000Z'),
  impactCritical: 1, site: { id: 'site-a', url: 'https://example.com' }, ...overrides });
const site = (scans: unknown[], overrides = {}) => ({ id: 'site-a', url: 'https://example.com', scans, ...overrides });

beforeEach(() => {
  mocks.auth.mockReset().mockResolvedValue({ id: 'user-a' });
  mocks.sites.mockReset().mockResolvedValue([]);
  mocks.scans.mockReset().mockResolvedValue([]);
  vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-10T12:00:00.000Z'));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('monitoring read authentication and query boundaries', () => {
  it.each([dashboard, trends, compliance, regressions, history])('denies unauthenticated monitoring access before database queries', async (read) => {
    mocks.auth.mockRejectedValue(new Error('Authentication required'));
    expect((await read(req())).status).toBe(401);
    expect(mocks.sites).not.toHaveBeenCalled(); expect(mocks.scans).not.toHaveBeenCalled();
  });
  it.each([dashboard, trends, compliance, regressions, history])('hides internal auth failures from monitoring clients', async (read) => {
    mocks.auth.mockRejectedValue(new Error('private credentials detail'));
    const response = await read(req());
    expect(response.status).toBe(500); expect(await response.text()).not.toContain('private credentials detail');
  });
  it.each([dashboard, compliance, regressions])('scopes sites to owned sites or active team membership', async (read) => {
    expect((await read(req())).status).toBe(200);
    expect(mocks.sites.mock.calls[0][0].where).toEqual(userScope);
  });
  it.each([dashboard, trends, compliance, regressions])('returns an error rather than fabricated monitoring data when storage fails', async (read) => {
    mocks.sites.mockRejectedValue(new Error('storage unavailable')); mocks.scans.mockRejectedValue(new Error('storage unavailable'));
    const response = await read(req()); expect(response.status).toBe(500);
  });
  it('returns no alert history when no persistent history is available', async () => {
    expect(await (await history(req())).json()).toEqual({ history: [] });
  });
});

describe('dashboard scan-derived metrics', () => {
  it('returns seven empty date buckets and no invented alerts for an empty account', async () => {
    const data = await (await dashboard(req())).json();
    expect(data).toMatchObject({ totalSites: 0, sitesAtRisk: 0, avgScoreChange: 0, alertsToday: 0, recentAlerts: [] });
    expect(data.regressionsTrend).toHaveLength(7);
    expect(data.regressionsTrend.every((day: any) => day.regressions === 0 && day.improvements === 0)).toBe(true);
    expect(mocks.scans.mock.calls[0][0].where.site).toEqual(userScope);
  });
  it.each([[10, 'low'], [15, 'medium'], [20, 'high'], [30, 'critical']] as const)('maps a recorded %s-point decrease to the configured alert severity', async (drop, severity) => {
    mocks.sites.mockResolvedValue([site([snapshot({ score: 90 - drop }), snapshot({ id: 'previous', score: 90 })])]);
    const data = await (await dashboard(req())).json();
    expect(data.avgScoreChange).toBe(-drop); expect(data.sitesAtRisk).toBe(1);
    expect(data.recentAlerts).toEqual([expect.objectContaining({ type: 'score_drop', severity, scoreChange: -drop, scanId: 'latest' })]);
  });
  it.each([[5, 'low'], [10, 'medium'], [20, 'high'], [50, 'critical']] as const)('maps %s newly recorded issues to alert severity', async (count, severity) => {
    mocks.sites.mockResolvedValue([site([snapshot({ issues: count + 1 }), snapshot({ id: 'previous', issues: 1 })])]);
    const data = await (await dashboard(req())).json();
    expect(data.recentAlerts).toEqual([expect.objectContaining({ type: 'new_issues', severity, issueCount: count })]);
  });
  it.each([[30, 'critical'], [50, 'high'], [60, 'medium']] as const)('retains the observed WCAG score %s in threshold alerts', async (score, severity) => {
    mocks.sites.mockResolvedValue([site([snapshot({ wcagAACompliance: score }), snapshot({ id: 'previous' })])]);
    const data = await (await dashboard(req())).json();
    expect(data.recentAlerts[0]).toMatchObject({ type: 'compliance_risk', severity, message: expect.stringContaining(score.toFixed(1)) });
  });
  it('reports measured low performance and skips sites with insufficient or missing scan evidence', async () => {
    mocks.sites.mockResolvedValue([site([snapshot({ performanceScore: 40 }), snapshot({ id: 'previous' })]),
      site([], { id: 'empty' }), site([snapshot()], { id: 'single' }),
      site([snapshot({ score: null, issues: null, wcagAACompliance: null, performanceScore: null }), snapshot({ id: 'previous', score: null, issues: null })], { id: 'missing' })]);
    const data = await (await dashboard(req())).json();
    expect(data.totalSites).toBe(4); expect(data.recentAlerts).toHaveLength(1);
    expect(data.recentAlerts[0].type).toBe('performance_impact');
  });
  it('counts historical regressions and improvements within each site/date, not across different sites', async () => {
    mocks.scans.mockResolvedValue([
      snapshot({ id: 'a1', score: 80, issues: 10, createdAt: new Date('2026-09-08') }),
      snapshot({ id: 'a2', score: 60, issues: 20, createdAt: new Date('2026-09-09') }),
      snapshot({ id: 'a3', score: 90, issues: 5, createdAt: new Date('2026-09-10') }),
      snapshot({ id: 'b1', siteId: 'site-b', score: 20, issues: 50, createdAt: new Date('2026-09-10') }),
      snapshot({ id: 'missing', score: null, issues: null, createdAt: new Date('2026-09-10T11:00:00Z') }),
    ]);
    const data = await (await dashboard(req())).json();
    expect(data.regressionsTrend.find((day: any) => day.date === '2026-09-09')).toMatchObject({ regressions: 2, improvements: 0 });
    expect(data.regressionsTrend.find((day: any) => day.date === '2026-09-10')).toMatchObject({ regressions: 0, improvements: 2 });
  });
  it('orders same-severity recent alerts by timestamp and bounds the returned list', async () => {
    mocks.sites.mockResolvedValue(Array.from({ length: 12 }, (_, index) => site([
      snapshot({ id: `scan-${index}`, score: 50, createdAt: new Date(`2026-09-${String(index < 6 ? 9 : 10).padStart(2, '0')}T12:00:00Z`) }), snapshot({ score: 80 }),
    ], { id: `site-${index}` })));
    const data = await (await dashboard(req())).json();
    expect(data.recentAlerts).toHaveLength(10);
    expect(data.alertsToday).toBe(6);
    expect(data.recentAlerts[0].timestamp).toBe('2026-09-10T12:00:00.000Z');
  });
});

describe('historical trend evidence', () => {
  it.each([['7d', 7], ['30d', 30], ['90d', 90]] as const)('applies the requested %s window within user/team authorization', async (range, days) => {
    const data = await (await trends(req(`?timeRange=${range}&siteId=site-a`))).json();
    const where = mocks.scans.mock.calls[0][0].where;
    expect(where.site).toEqual({ ...userScope, id: 'site-a' });
    expect(where.createdAt.gte).toEqual(new Date(Date.now() - days * 86_400_000));
    expect(data.trends).toEqual([]); expect(data.predictions.confidence).toBe(0);
  });
  it('does not add an all-sites identifier to the authorization filter', async () => {
    await trends(req('?siteId=all'));
    expect(mocks.scans.mock.calls[0][0].where.site).toEqual(userScope);
  });
  it.each([[50, 80, 'improving'], [80, 50, 'declining'], [80, 82, 'stable']] as const)('calculates the direction from recorded first/last scores %s→%s', async (first, last, direction) => {
    mocks.scans.mockResolvedValue([snapshot({ score: first, createdAt: new Date('2026-09-01') }), snapshot({ score: last })]);
    const data = await (await trends(req())).json();
    expect(data.insights.overallTrend).toBe(direction);
    expect(data.insights.avgScoreChange).toBe(last - first);
    expect(data.trends.map((point: any) => point.score)).toEqual([first, last]);
    expect(data.insights.bestPerformingSite).toBe('https://example.com');
  });
  it('preserves zero scores in recorded trend points rather than fabricating a replacement', async () => {
    mocks.scans.mockResolvedValue([snapshot({ score: 0, issues: 0, wcagAACompliance: null, performanceScore: null }), snapshot({ score: 0 })]);
    const data = await (await trends(req())).json();
    expect(data.trends[0]).toMatchObject({ score: 0, issues: 0 });
    expect(data.insights.trendPercentage).toBe(0);
  });
  it('reports actual multi-site extrema and computes finite output for longer histories', async () => {
    mocks.scans.mockResolvedValue(Array.from({ length: 14 }, (_, index) => snapshot({ id: `scan-${index}`, score: index === 12 ? 50 : 75 + index,
      wcagAACompliance: index === 1 ? 60 : 80, siteId: index % 2 ? 'site-b' : 'site-a', site: { url: index % 2 ? 'https://b.example.com' : 'https://example.com' },
      createdAt: new Date(Date.UTC(2026, 8, index + 1)) })));
    const data = await (await trends(req())).json();
    expect(data.trends).toHaveLength(14);
    expect(data.insights.bestPerformingSite).toBe('https://b.example.com');
    expect(data.insights.worstPerformingSite).toBe('https://example.com');
    expect(Number.isFinite(data.predictions.nextWeekScore)).toBe(true);
    // Prediction/cause prose is not asserted as established evidence.
  });
});

describe('compliance score presentation', () => {
  it('does not synthesize measured compliance for sites with no completed scans', async () => {
    mocks.sites.mockResolvedValue([site([])]);
    const data = await (await compliance(req())).json();
    expect(data.sites).toEqual([]); expect(data.overview).toMatchObject({ totalSites: 0, avgWcagAA: 0, avgWcagAAA: 0 });
  });
  it.each([30, 50, 60, 80])('retains the actual latest score %s and chronological scan history', async (score) => {
    mocks.sites.mockResolvedValue([site([snapshot({ wcagAACompliance: score, wcagAAACompliance: score - 10, performanceScore: 40 }),
      snapshot({ id: 'previous', wcagAACompliance: 70, wcagAAACompliance: 60, createdAt: new Date('2026-09-01') })])]);
    const data = await (await compliance(req())).json();
    expect(data.sites[0].wcagAA.score).toBe(score);
    expect(data.sites[0].wcagAAA.score).toBe(score - 10);
    expect(data.sites[0].timeline.map((point: any) => point.wcagAA)).toEqual([70, score]);
    // Heuristic legal-risk/deadline claims are deliberately not treated as facts.
  });
  it.each([60, 80])('retains critical issue evidence at score %s', async (score) => {
    mocks.sites.mockResolvedValue([site([snapshot({ wcagAACompliance: score, impactCritical: 12 })])]);
    const data = await (await compliance(req())).json();
    expect(data.sites[0].wcagAA.criticalIssues).toBe(12);
  });
  it('supports stable/missing previous scores and calculates aggregates only over measured sites', async () => {
    mocks.sites.mockResolvedValue([site([snapshot({ wcagAACompliance: 80, wcagAAACompliance: 70 }), snapshot({ wcagAACompliance: 78, wcagAAACompliance: 68 })]),
      site([snapshot({ wcagAACompliance: null, wcagAAACompliance: null, impactCritical: null }), snapshot({ wcagAACompliance: 0, wcagAAACompliance: 0 })], { id: 'missing' })]);
    const data = await (await compliance(req())).json();
    expect(data.overview.avgWcagAA).toBe(40); expect(data.overview.avgWcagAAA).toBe(35);
    expect(data.sites.find((entry: any) => entry.siteId === 'site-a').wcagAA.trend).toBe('stable');
  });
});

describe('regression detection evidence', () => {
  it('skips a site when fewer than two completed scans exist', async () => {
    mocks.sites.mockResolvedValue([site([])]); mocks.scans.mockResolvedValue([snapshot()]);
    const data = await (await regressions(req())).json();
    expect(data.regressions).toEqual([]);
    expect(mocks.scans.mock.calls[0][0].where).toMatchObject({ siteId: 'site-a', status: 'COMPLETED' });
  });
  it.each([[10, 'minor', 'low'], [15, 'moderate', 'medium'], [20, 'major', 'high'], [30, 'critical', 'urgent']] as const)(
    'keeps %s-point regression severity, priority and the exact pair of scan IDs', async (drop, severity, priority) => {
      mocks.sites.mockResolvedValue([site([])]); mocks.scans.mockResolvedValue([snapshot({ score: 90 - drop }), snapshot({ id: 'previous', score: 90 })]);
      const data = await (await regressions(req())).json();
      expect(data.regressions).toEqual([expect.objectContaining({ type: 'score_drop', scoreChange: -drop, previousScore: 90, currentScore: 90 - drop,
        scanId: 'latest', previousScanId: 'previous', severity, priority })]);
    });
  it.each([[5, 'minor'], [10, 'moderate'], [20, 'major'], [50, 'critical']] as const)('uses the actual new violation count %s', async (count, severity) => {
    mocks.sites.mockResolvedValue([site([])]); mocks.scans.mockResolvedValue([snapshot({ issues: count + 1 }), snapshot({ id: 'previous', issues: 1 })]);
    const data = await (await regressions(req())).json();
    expect(data.regressions).toEqual([expect.objectContaining({ type: 'new_violations', newViolations: count, severity })]);
  });
  it.each([[30, 'critical'], [50, 'major'], [60, 'moderate']] as const)('compares recorded WCAG threshold evidence %s', async (score, severity) => {
    mocks.sites.mockResolvedValue([site([])]); mocks.scans.mockResolvedValue([snapshot({ wcagAACompliance: score }), snapshot({ id: 'previous' })]);
    const data = await (await regressions(req())).json();
    expect(data.regressions).toEqual([expect.objectContaining({ type: 'compliance_breach', severity, scanId: 'latest' })]);
  });
  it('records a substantial measured performance change, not just a low absolute score', async () => {
    mocks.sites.mockResolvedValue([site([])]); mocks.scans.mockResolvedValue([snapshot({ performanceScore: 40 }), snapshot({ id: 'previous', performanceScore: 80 })]);
    expect((await (await regressions(req())).json()).regressions).toEqual([expect.objectContaining({ type: 'performance_impact', previousScanId: 'previous' })]);
  });
  it('does not create an event for unchanged or absent measurements', async () => {
    mocks.sites.mockResolvedValue([site([]), site([], { id: 'site-b' })]);
    mocks.scans.mockResolvedValueOnce([snapshot(), snapshot({ id: 'previous' })]).mockResolvedValueOnce([
      snapshot({ score: null, issues: null, wcagAACompliance: null, performanceScore: null }), snapshot({ score: null, issues: null, performanceScore: null })]);
    expect((await (await regressions(req())).json()).regressions).toEqual([]);
  });
});
