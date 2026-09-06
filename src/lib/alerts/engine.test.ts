import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn() }));
vi.mock('@/lib/prisma', () => ({ prisma: { $queryRaw: mocks.query, $executeRaw: mocks.execute } }));
import { runAlerts } from './engine';
const date = '2026-09-10';
const rule = (type: string, thresholds = { min_drop: 10, min_pct_drop: 0.2, min_impressions: 100, ctr_ratio: 0.5 }) =>
  ({ type, thresholds, lookback_days: 7, severity: 'high' });

beforeEach(() => {
  mocks.query.mockReset().mockResolvedValue([]);
  mocks.execute.mockReset().mockResolvedValue(1);
  vi.stubEnv('GSC_SITE_URL', 'sc-domain:example.com');
  vi.stubEnv('GA4_PROPERTY_ID', '12345');
  for (const level of ['log', 'error'] as const) vi.spyOn(console, level).mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });
function configure(type: string, current: unknown[], previous: unknown[], duplicate = false) {
  mocks.query.mockResolvedValueOnce([rule(type)]).mockResolvedValueOnce(current).mockResolvedValueOnce(previous)
    .mockResolvedValueOnce(duplicate ? [{ id: 'existing-alert' }] : []);
}
const inserted = () => ({ severity: mocks.execute.mock.calls[0][1], type: mocks.execute.mock.calls[0][2],
  entityType: mocks.execute.mock.calls[0][3], entityKey: mocks.execute.mock.calls[0][4], details: JSON.parse(mocks.execute.mock.calls[0][6]) });

describe('alert rule execution', () => {
  it('does no database work when both metrics integrations are absent', async () => {
    vi.stubEnv('GSC_SITE_URL', ''); vi.stubEnv('GA4_PROPERTY_ID', '');
    await runAlerts(date);
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it.each(['GSC_SITE_URL', 'GA4_PROPERTY_ID'])('can run with only %s configured', async (configured) => {
    vi.stubEnv(configured === 'GSC_SITE_URL' ? 'GA4_PROPERTY_ID' : 'GSC_SITE_URL', '');
    await runAlerts(date);
    expect(mocks.query).toHaveBeenCalledOnce();
  });
  it.each([new Error('table unavailable'), 'table unavailable'])('logs unavailable rule storage without throwing', async (error) => {
    mocks.query.mockRejectedValue(error);
    await expect(runAlerts(date)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('ignores unknown rule types without creating fabricated alerts', async () => {
    mocks.query.mockResolvedValueOnce([rule('UNKNOWN')]);
    await runAlerts(date);
    expect(mocks.query).toHaveBeenCalledOnce();
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('isolates individual rule failures and keeps processing later rules', async () => {
    mocks.query.mockResolvedValueOnce([rule('SCORE_DROP_7D'), rule('SCORE_DROP_7D')]).mockRejectedValueOnce(new Error('first lookup failed'))
      .mockResolvedValueOnce([{ total_score: 60 }]).mockResolvedValueOnce([{ avg_score: 80 }]);
    await runAlerts(date);
    expect(console.error).toHaveBeenCalled();
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(inserted().details).toEqual({ current: 60, previous: 80, drop: 20 });
  });
  it('creates a score-drop alert at the configured boundary using stored evidence', async () => {
    configure('SCORE_DROP_7D', [{ total_score: 70 }], [{ avg_score: 80 }]);
    await runAlerts(date);
    expect(inserted()).toEqual({ severity: 'high', type: 'SCORE_DROP_7D', entityType: 'score', entityKey: 'total', details: { current: 70, previous: 80, drop: 10 } });
    expect(mocks.query.mock.calls[1]).toContain(date);
    expect(mocks.query.mock.calls[2]).toContain(7);
  });
  it.each([[75, 80], [80, null], [null, null]])('does not alert for insufficient or non-declining score evidence (%s, %s)', async (current, previous) => {
    configure('SCORE_DROP_7D', current === null ? [] : [{ total_score: current }], previous === null ? [] : [{ avg_score: previous }]);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('does not create duplicate active alerts within the rolling window', async () => {
    configure('SCORE_DROP_7D', [{ total_score: 50 }], [{ avg_score: 80 }], true);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect((mocks.query.mock.calls[3][0] as string[]).join('?')).toContain("status = 'active'");
    expect((mocks.query.mock.calls[3][0] as string[]).join('?')).toContain("INTERVAL '24 hours'");
  });
  it('evaluates every pillar independently and stores the actual relative decrease', async () => {
    configure('PILLAR_DROP', [{ p1_index_crawl_health: 50, p2_search_visibility: 70, p3_engagement_intent: 90,
      p4_content_performance: 0, p5_technical_experience: 80 }], [{ avg_p1: 100, avg_p2: 100, avg_p3: 100, avg_p4: 0, avg_p5: 100 }]);
    await runAlerts(date);
    expect(mocks.execute).toHaveBeenCalledTimes(3);
    expect(mocks.execute.mock.calls.map((call) => call[4])).toEqual(['P1', 'P2', 'P5']);
    expect(inserted().details).toEqual({ pillar: 'P1', current: 50, previous: 100, pctDrop: 50 });
  });
  it.each(['current', 'previous'])('requires %s pillar metrics before evaluating decreases', async (missing) => {
    configure('PILLAR_DROP', missing === 'current' ? [] : [{ p1_index_crawl_health: 50 }], missing === 'previous' ? [] : [{ avg_p1: 100 }]);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('checks search impression drop against the configured site, not an unrelated property', async () => {
    configure('VISIBILITY_IMPRESSIONS_DROP', [{ impressions: 50 }], [{ avg_impressions: 100 }]);
    await runAlerts(date);
    expect(inserted()).toMatchObject({ type: 'VISIBILITY_IMPRESSIONS_DROP', entityKey: 'sc-domain:example.com',
      details: { current: 50, previous: 100, pctDrop: 50 } });
    expect(mocks.query.mock.calls[1]).toContain('sc-domain:example.com');
    expect(mocks.query.mock.calls[2]).toContain('sc-domain:example.com');
  });
  it.each([[90, 100], [0, 0], [null, null], [100, null]])('does not alert for stable or missing impressions (%s, %s)', async (current, previous) => {
    configure('VISIBILITY_IMPRESSIONS_DROP', current === null ? [] : [{ impressions: current }], previous === null ? [] : [{ avg_impressions: previous }]);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it('flags only high-impression pages below the expected CTR ratio', async () => {
    configure('CTR_ANOMALY', [{ page: '/low', impressions: 1000, ctr: 0.01 }, { page: '/normal', impressions: 1000, ctr: 0.04 }], [{ avg_ctr: 0.04 }]);
    await runAlerts(date);
    expect(mocks.execute).toHaveBeenCalledOnce();
    expect(inserted().details).toEqual({ page: '/low', impressions: 1000, ctr: 0.01, expectedCTR: 0.04, ratio: 0.25 });
    expect(mocks.query.mock.calls[1]).toContain(100);
  });
  it.each([{ average: [] }, { average: [{ avg_ctr: 0 }] }, { average: [{ avg_ctr: -1 }] }])('does not manufacture CTR incidents without qualifying page evidence', async ({ average }) => {
    configure('CTR_ANOMALY', [{ page: '/normal', impressions: 1000, ctr: 0.05 }], average);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });
  it('computes conversion rate drop from real session/conversion totals and scopes the property', async () => {
    configure('FUNNEL_CONV_DROP', [{ total_conv: 5, total_sessions: 100 }], [{ avg_conv_rate: 0.1 }]);
    await runAlerts(date);
    expect(inserted().details).toEqual({ currentRate: 0.05, previousRate: 0.1, pctDrop: 50 });
    expect(mocks.query.mock.calls[1]).toContain('12345');
    expect(mocks.query.mock.calls[2]).toContain('12345');
  });
  it.each([[10, 100, 0.1], [0, 0, 0], [null, null, null], [10, 100, null]])('does not flag stable or absent conversion evidence (%s/%s)', async (conversions, sessions, previous) => {
    configure('FUNNEL_CONV_DROP', conversions === null ? [] : [{ total_conv: conversions, total_sessions: sessions }], previous === null ? [] : [{ avg_conv_rate: previous }]);
    await runAlerts(date);
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
