import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from './route'
const mocks = vi.hoisted(() => ({ auth: vi.fn(), site: vi.fn(), scan: { findMany: vi.fn(), count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn() } }))
vi.mock('@/lib/auth', () => ({ requireAuth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: { site: { findFirst: mocks.site }, scan: mocks.scan } }))
const req = (query = '') => new Request(`http://localhost/api/analytics${query}`)
const allMetrics = 'overview,trends,issues,performance,compliance,risk,benchmarks'
const date = new Date('2026-09-06T12:00:00Z')
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(date)
  vi.spyOn(console, 'error').mockImplementation(() => {})
  mocks.auth.mockResolvedValue({ id: 'owner' }); mocks.site.mockResolvedValue({ id: 'site1' })
  mocks.scan.findMany.mockResolvedValue([]); mocks.scan.count.mockResolvedValue(0)
  mocks.scan.aggregate.mockResolvedValue({ _avg: {}, _sum: {} }); mocks.scan.groupBy.mockResolvedValue([])
})
afterEach(() => vi.useRealTimers())
const candidates = () => mocks.scan.findMany.mockResolvedValueOnce([{ id: 'real', raw: null }])

describe('analytics authorization and evidence selection', () => {
  it('requires authentication before querying scan data', async () => {
    mocks.auth.mockRejectedValue(new Error('Authentication required'))
    expect((await GET(req())).status).toBe(401)
    expect(mocks.scan.findMany).not.toHaveBeenCalled()
  })
  it.each([new Error('storage failed'), null])('returns an explicit failure on infrastructure errors %#', async failure => {
    mocks.auth.mockRejectedValue(failure)
    expect((await GET(req())).status).toBe(500)
  })
  it('hides unowned sites before loading scans', async () => {
    mocks.site.mockResolvedValue(null)
    expect((await GET(req('?siteId=other'))).status).toBe(404)
    expect(mocks.site).toHaveBeenCalledWith({ where: { id: 'other', userId: 'owner' } })
    expect(mocks.scan.findMany).not.toHaveBeenCalled()
  })
  it.each([['7d', 7], ['30d', 30], ['90d', 90], ['invalid', 30], ['', 30]] as const)('bounds %s history to the authenticated owner', async (range, days) => {
    await GET(req(range ? `?timeRange=${range}` : ''))
    expect(mocks.scan.findMany.mock.calls[0][0].where).toEqual({ status: 'COMPLETED', site: { userId: 'owner' }, createdAt: { gte: new Date(date.getTime() - days * 86_400_000), lte: date } })
  })
  it('handles yearly range and an explicitly owned site', async () => {
    await GET(req('?siteId=site1&timeRange=1y'))
    expect(mocks.scan.findMany.mock.calls[0][0].where).toEqual({ status: 'COMPLETED', siteId: 'site1', createdAt: { gte: new Date('2025-09-06T12:00:00Z'), lte: date } })
  })
  it('excludes every marked demo engine before all aggregates, including benchmarks', async () => {
    mocks.scan.findMany.mockResolvedValueOnce([{ id: 'real', raw: {} }, { id: 'legacy', raw: null }, { id: 'demo', raw: { __demo: true } }, { id: 'mock', raw: { mock: true } }, { id: 'fallback', raw: { engineName: 'fallback-mock' } }])
    const body = await (await GET(req(`?metrics=${allMetrics}`))).json()
    expect(body.filteredCount).toBe(2)
    expect(body.hasData).toBe(true)
    for (const [options] of [...mocks.scan.findMany.mock.calls.slice(1), ...mocks.scan.count.mock.calls, ...mocks.scan.aggregate.mock.calls, ...mocks.scan.groupBy.mock.calls]) {
      expect(options.where).toMatchObject({ id: { in: ['real', 'legacy'] }, site: { userId: 'owner' }, status: 'COMPLETED' })
    }
  })
  it('returns empty metric-specific data without performing aggregate queries', async () => {
    const body = await (await GET(req(`?metrics=${allMetrics}`))).json()
    expect(body.hasData).toBe(false)
    expect(body.analytics.overview.totalScans).toBe(0)
    expect(body.analytics.trends.trends).toEqual([])
    expect(body.analytics.issues.totalUniqueRules).toBe(0)
    expect(body.analytics.performance.correlation).toBeNull()
    expect(body.analytics.compliance.riskDistribution).toEqual({})
    expect(body.analytics.risk.highRiskScans).toBe(0)
    expect(body.analytics.benchmarks.userStats.avgScore).toBe(0)
    expect(mocks.scan.aggregate).not.toHaveBeenCalled()
  })
  it('does not calculate unrequested metrics', async () => {
    candidates()
    expect((await (await GET(req('?metrics=unknown'))).json()).analytics).toEqual({})
    expect(mocks.scan.aggregate).not.toHaveBeenCalled()
  })
})

describe('analytics aggregation', () => {
  it('returns overview aggregates and their measured severity distribution', async () => {
    candidates(); mocks.scan.count.mockResolvedValue(3)
    mocks.scan.aggregate.mockResolvedValueOnce({ _avg: { score: 89.5 } }).mockResolvedValueOnce({ _sum: { issues: 7 } }).mockResolvedValueOnce({ _sum: { impactCritical: 1, impactSerious: 2, impactModerate: 3, impactMinor: 1 } })
    mocks.scan.findMany.mockResolvedValueOnce([{ id: 'recent' }])
    const result = (await (await GET(req())).json()).analytics.overview
    expect(result).toEqual({ totalScans: 3, averageScore: 90, totalIssues: 7, recentScans: [{ id: 'recent' }], impactDistribution: { critical: 1, serious: 2, moderate: 3, minor: 1 } })
  })
  it.each([['30d', 'day'], ['90d', 'week']] as const)('groups %s trend samples by %s', async (range, groupBy) => {
    candidates()
    mocks.scan.findMany.mockResolvedValueOnce([{ createdAt: date, score: 80, issues: 3, wcagAACompliance: 90, performanceScore: 70 }, { createdAt: date, score: null, issues: null, wcagAACompliance: null, performanceScore: null }, { createdAt: new Date('2026-08-30T12:00:00Z'), score: 60, issues: 4, wcagAACompliance: null, performanceScore: null }])
    const result = (await (await GET(req(`?metrics=trends&timeRange=${range}`))).json()).analytics.trends
    expect(result.groupBy).toBe(groupBy)
    expect(result.trends).toEqual([{ date: '2026-09-06', averageScore: 40, totalIssues: 3, averageWcagCompliance: 90, averagePerformance: 70, scanCount: 2 }, { date: '2026-08-30', averageScore: 60, totalIssues: 4, averageWcagCompliance: null, averagePerformance: null, scanCount: 1 }])
  })
  it('merges rule occurrences and sorts the most frequent issues', async () => {
    candidates(); mocks.scan.findMany.mockResolvedValueOnce([{ violationsByRule: { 'image-alt': 2, 'link-name': 1 } }, { violationsByRule: { 'image-alt': 3 } }, { violationsByRule: null }])
    expect((await (await GET(req('?metrics=issues'))).json()).analytics.issues).toEqual({ topIssues: [{ rule: 'image-alt', count: 5 }, { rule: 'link-name', count: 1 }], totalUniqueRules: 2, issueFrequency: { 'image-alt': 5, 'link-name': 1 } })
  })
  it.each([true, false])('summarizes performance samples with optional timings %s', async timings => {
    candidates(); mocks.scan.findMany.mockResolvedValueOnce([20, 40, 60].map((score, i) => ({ score, performanceScore: 100 - score, firstContentfulPaint: timings && i ? 1000 : null, largestContentfulPaint: timings && i ? 2000 : null })))
    expect((await (await GET(req('?metrics=performance'))).json()).analytics.performance).toEqual({ correlation: -1, sampleSize: 3, averagePerformance: 60, performanceMetrics: { avgFCP: timings ? 1000 : null, avgLCP: timings ? 2000 : null } })
  })
  it('handles constant and missing score samples without NaN JSON', async () => {
    candidates(); mocks.scan.findMany.mockResolvedValueOnce([{ score: null, performanceScore: null }, { score: null, performanceScore: null }])
    const result = (await (await GET(req('?metrics=performance'))).json()).analytics.performance
    expect(result.correlation).toBe(0)
    expect(result.averagePerformance).toBe(0)
  })
  it('returns measured compliance aggregates and counted risk groups', async () => {
    candidates(); mocks.scan.aggregate.mockResolvedValue({ _avg: { wcagAACompliance: 89.5, wcagAAACompliance: 70.4, wcag21Compliance: 85, wcag22Compliance: 75 } })
    mocks.scan.groupBy.mockResolvedValue([{ adaRiskLevel: 'HIGH', _count: 2 }, { adaRiskLevel: null, _count: 1 }])
    expect((await (await GET(req('?metrics=compliance'))).json()).analytics.compliance).toEqual({ wcagCompliance: { aa: 90, aaa: 70, wcag21: 85, wcag22: 75 }, riskDistribution: { high: 2, unknown: 1 } })
  })
  it.each([[0, 'LOW'], [3, 'MEDIUM'], [6, 'HIGH']] as const)('summarizes risk for %s high-risk scans', async (count, level) => {
    candidates(); mocks.scan.count.mockResolvedValue(count)
    mocks.scan.aggregate.mockResolvedValue({ _sum: { impactCritical: 4 } })
    mocks.scan.findMany.mockResolvedValueOnce([...Array(10).fill({ score: 90 }), ...Array(10).fill({ score: null })])
    expect((await (await GET(req('?metrics=risk'))).json()).analytics.risk).toEqual({ highRiskScans: count, criticalIssues: 4, riskTrend: 90, riskLevel: level })
  })
  it('uses rounded user measurements for comparisons, not mock scan rows', async () => {
    candidates(); mocks.scan.aggregate.mockResolvedValue({ _avg: { score: 82.6, wcagAACompliance: 75.2, performanceScore: 70.8 } })
    expect((await (await GET(req('?metrics=benchmarks'))).json()).analytics.benchmarks.userStats).toEqual({ avgScore: 83, avgWcag: 75, avgPerformance: 71 })
    expect(mocks.scan.aggregate.mock.calls[0][0].where.id).toEqual({ in: ['real'] })
  })
})
