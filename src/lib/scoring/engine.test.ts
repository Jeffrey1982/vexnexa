import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateAndStoreScore, calculateP1, calculateP2, calculateP3, calculateP4, calculateP5, clamp01, normLinear, normLog, pctChange } from './engine'
import { generateActions } from './actions'

const db = vi.hoisted(() => ({ $queryRaw: vi.fn(), $executeRaw: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: db }))
beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('GSC_SITE_URL', 'https://fixture.test')
  vi.stubEnv('GA4_PROPERTY_ID', 'fixture-property')
  vi.stubEnv('PAGESPEED_API_KEY', 'fixture-key')
  db.$executeRaw.mockResolvedValue(1)
})
afterEach(() => vi.unstubAllEnvs())
const date = '2026-09-07'

describe('score normalization', () => {
  it.each([[-1, 0], [0, 0], [0.5, 0.5], [1, 1], [2, 1]])('clamps %s to %s', (input, expected) => expect(clamp01(input)).toBe(expected))
  it('handles invalid ranges, logarithmic saturation, and zero baselines', () => {
    expect(normLinear(5, 10, 10)).toBe(0)
    expect(normLinear(5, 20, 10)).toBe(0)
    expect(normLinear(15, 10, 20)).toBe(0.5)
    expect(normLog(0, 10)).toBe(0)
    expect(normLog(-1, 10)).toBe(0)
    expect(normLog(10, 10)).toBe(1)
    expect(normLog(100, 10, 5)).toBe(1)
    expect(pctChange(5, 0)).toBe(1)
    expect(pctChange(0, 0)).toBe(0)
    expect(pctChange(90, 100)).toBe(-0.1)
  })
})

describe('score pillars with isolated query responses', () => {
  it('does not query analytics when integrations are absent', async () => {
    vi.stubEnv('GSC_SITE_URL', '')
    vi.stubEnv('GA4_PROPERTY_ID', '')
    vi.stubEnv('PAGESPEED_API_KEY', '')
    for (const calculate of [calculateP1, calculateP2, calculateP3, calculateP4]) expect((await calculate(date)).score).toBe(0)
    expect(await calculateP5(date)).toEqual({ score: 50, maxScore: 100, components: { coreWebVitals: 25, mobileUsability: 25 } })
    expect(db.$queryRaw).not.toHaveBeenCalled()
  })
  it('requires GA4 in addition to GSC for engagement and content', async () => {
    vi.stubEnv('GA4_PROPERTY_ID', '')
    expect((await calculateP3(date)).score).toBe(0)
    expect((await calculateP4(date)).score).toBe(0)
    expect(db.$queryRaw).not.toHaveBeenCalled()
  })
  it.each([[120, 100, 250], [100, 100, 200], [80, 100, 150], [0, 100, 0]])('scores impression trend %s/%s', async (current, previous, expected) => {
    db.$queryRaw.mockResolvedValueOnce([{ impressions: current }]).mockResolvedValueOnce([{ avg_impressions: previous }])
    expect((await calculateP1(date)).score).toBe(expected)
    expect(db.$queryRaw.mock.calls[0]).toContain(date)
    expect(db.$queryRaw.mock.calls[0]).toContain('https://fixture.test')
  })
  it('handles empty P1/P2 aggregates without NaN', async () => {
    db.$queryRaw.mockResolvedValue([])
    expect((await calculateP1(date)).score).toBe(50)
    expect((await calculateP2(date)).score).toBe(50)
  })
  it('awards full search visibility for growth, top queries and strong positions', async () => {
    db.$queryRaw.mockResolvedValueOnce([{ clicks: '120', position: '5' }]).mockResolvedValueOnce([{ avg_clicks: '100' }]).mockResolvedValueOnce([{ count: BigInt(10) }])
    expect(await calculateP2(date)).toEqual({ score: 250, maxScore: 250, components: { clicksTrend: 100, topQueriesPerformance: 100, avgPosition: 50 } })
  })
  it.each([[0.08, 0.7, 40, 100, 200], [0, 0, 0, 0, 0], [0.05, 0.5, 25, 100, 100]])('scores engagement without dividing by zero', async (ctr, rate, returning, users, score) => {
    db.$queryRaw.mockResolvedValueOnce([{ ctr }]).mockResolvedValueOnce([{ avg_engagement_rate: rate, total_returning: returning, total_users: users }])
    expect((await calculateP3(date)).score).toBe(score)
  })
  it('handles missing engagement data', async () => {
    db.$queryRaw.mockResolvedValue([])
    expect((await calculateP3(date)).score).toBe(0)
  })
  it('scores growth, depth and conversion independently', async () => {
    db.$queryRaw.mockResolvedValueOnce([{ page_count: 11 }]).mockResolvedValueOnce([{ avg_page_count: 10 }]).mockResolvedValueOnce([{ avg_time: 120 }]).mockResolvedValueOnce([{ total_conv: 5, total_sessions: 100 }])
    expect(await calculateP4(date)).toEqual({ score: 200, maxScore: 200, components: { topPagesGrowth: 80, contentDepth: 80, conversionQuality: 40 } })
  })
  it('does not infer conversions or content depth from absent aggregates', async () => {
    db.$queryRaw.mockResolvedValue([])
    expect(await calculateP4(date)).toEqual({ score: 40, maxScore: 200, components: { topPagesGrowth: 40, contentDepth: 0, conversionQuality: 0 } })
  })
  it.each([[95, 1000, 0.05, 100], [40, 5000, 0.5, 0], [70, 3000, 0.175, 50]])('bounds technical experience from measured metrics', async (perf, lcp, cls, score) => {
    db.$queryRaw.mockResolvedValueOnce([{ avg_perf: perf, avg_lcp: lcp, avg_cls: cls }])
    expect((await calculateP5(date)).score).toBe(score)
  })
  it('supplies deterministic technical defaults for missing rows', async () => {
    db.$queryRaw.mockResolvedValue([])
    expect(await calculateP5(date)).toEqual({ score: 63, maxScore: 100, components: { coreWebVitals: 63, mobileUsability: 0 } })
  })
  it('stores an auditable breakdown using a parameterized upsert', async () => {
    vi.stubEnv('GSC_SITE_URL', '')
    vi.stubEnv('GA4_PROPERTY_ID', '')
    vi.stubEnv('PAGESPEED_API_KEY', '')
    const result = await calculateAndStoreScore(date)
    expect(result.totalScore).toBe(50)
    expect(db.$executeRaw).toHaveBeenCalledOnce()
    const [sql, ...values] = db.$executeRaw.mock.calls[0]
    expect(sql.join('')).toContain('ON CONFLICT (date)')
    expect(values).toContain(date)
    expect(values).toContain(JSON.stringify(result.breakdown))
  })
  it('propagates storage failures instead of pretending a score was persisted', async () => {
    vi.stubEnv('GSC_SITE_URL', '')
    vi.stubEnv('GA4_PROPERTY_ID', '')
    vi.stubEnv('PAGESPEED_API_KEY', '')
    db.$executeRaw.mockRejectedValue(new Error('database unavailable'))
    await expect(calculateAndStoreScore(date)).rejects.toThrow('database unavailable')
  })
})

describe('scoring recommended actions', () => {
  async function healthyBreakdown() {
    vi.stubEnv('GSC_SITE_URL', '')
    vi.stubEnv('GA4_PROPERTY_ID', '')
    vi.stubEnv('PAGESPEED_API_KEY', '')
    const { breakdown } = await calculateAndStoreScore(date)
    for (const pillar of Object.values(breakdown)) for (const key of Object.keys(pillar.components)) (pillar.components as Record<string, number>)[key] = 50
    breakdown.p1IndexCrawlHealth.components.indexCoverage = 100
    breakdown.p2SearchVisibility.components.avgPosition = 35
    db.$executeRaw.mockClear()
    return breakdown
  }
  it('does not write action records when all thresholds are met', async () => {
    expect(await generateActions(date, await healthyBreakdown())).toEqual([])
    expect(db.$executeRaw).not.toHaveBeenCalled()
  })
  it('persists specific recommendations with their supporting component scores', async () => {
    const breakdown = await healthyBreakdown()
    breakdown.p1IndexCrawlHealth.components = { impressionsTrend: 10, indexCoverage: 20, crawlErrors: 0 }
    breakdown.p2SearchVisibility.components.clicksTrend = 10
    breakdown.p3EngagementIntent.components = { ctrQuality: 10, engagementRate: 10, returningUsers: 0 }
    breakdown.p4ContentPerformance.components = { topPagesGrowth: 10, contentDepth: 0, conversionQuality: 10 }
    breakdown.p5TechnicalExperience.components.coreWebVitals = 10
    const actions = await generateActions(date, breakdown)
    expect(actions.map(action => action.key)).toEqual(['low_impressions_trend', 'low_index_coverage', 'clicks_declining', 'low_ctr', 'low_engagement', 'stagnant_content', 'low_conversions', 'poor_core_web_vitals'])
    expect(actions.find(action => action.key === 'low_index_coverage')).toMatchObject({ severity: 'critical', impactPoints: 80, metadata: { score: 20 } })
    expect(db.$executeRaw).toHaveBeenCalledTimes(actions.length)
    for (const call of db.$executeRaw.mock.calls) expect(call[0].join('')).toContain('ON CONFLICT (date, pillar, key)')
  })
  it.each([[5, false], [30, false], [31, true], [50, true]])('recommends ranking work only beyond page three (position %s)', async (position, expected) => {
    const breakdown = await healthyBreakdown()
    db.$queryRaw.mockResolvedValueOnce([{ clicks: 100, position }]).mockResolvedValueOnce([{ avg_clicks: 100 }]).mockResolvedValueOnce([{ count: 10 }])
    vi.stubEnv('GSC_SITE_URL', 'https://fixture.test')
    breakdown.p2SearchVisibility = await calculateP2(date)
    const actions = await generateActions(date, breakdown)
    expect(actions.some(action => action.key === 'poor_avg_position')).toBe(expected)
    if (expected) expect(actions.find(action => action.key === 'poor_avg_position')?.metadata.score).toBeLessThan(25)
  })
})
