import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { analyzeSEOMetrics, calculateComplianceRisk, calculatePerformanceCorrelation, calculatePriorityMatrix, getPerformanceMetrics, getPortfolioAnalytics } from '../performance-analytics'
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), sites: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: { site: { findMany: mocks.sites } } }))
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal('fetch', mocks.fetch); vi.stubEnv('PAGESPEED_API_KEY', undefined); vi.spyOn(console, 'warn').mockImplementation(() => {}) })
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('measured performance data', () => {
  it('does not invent measurements or make requests without configuration', async () => {
    expect(await getPerformanceMetrics('https://example.com')).toBeNull()
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
  it.each([undefined, {}, { lighthouseResult: {} }, { lighthouseResult: { categories: {} } }, { lighthouseResult: { categories: { performance: { score: null } }, audits: {} } }, { lighthouseResult: { categories: { performance: { score: 2 } }, audits: {} } }, { lighthouseResult: { categories: { performance: { score: 0.9 } } } }])('does not treat incomplete provider data as a score %#', async body => {
    vi.stubEnv('PAGESPEED_API_KEY', 'test-key')
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => body })
    expect(await getPerformanceMetrics('https://example.com')).toBeNull()
  })
  it.each(['status', 'network', 'json'])('returns unavailable instead of synthetic data on %s failure', async kind => {
    vi.stubEnv('PAGESPEED_API_KEY', 'test-key')
    if (kind === 'network') mocks.fetch.mockRejectedValue(new Error('offline'))
    else mocks.fetch.mockResolvedValue({ ok: kind !== 'status', json: async () => { throw new Error('invalid json') } })
    expect(await getPerformanceMetrics('https://example.com')).toBeNull()
  })
  it('retains measured zeros, rounds the score and bounds the request lifetime', async () => {
    vi.stubEnv('PAGESPEED_API_KEY', 'test-key')
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: { categories: { performance: { score: 0.915 } }, audits: {
      'first-contentful-paint': { numericValue: 1200 }, 'largest-contentful-paint': { numericValue: 2400 },
      'cumulative-layout-shift': { numericValue: 0 }, 'first-input-delay': { numericValue: 0 }, 'max-potential-fid': { numericValue: 90 }, 'total-blocking-time': { numericValue: 200 },
    } } }) })
    expect(await getPerformanceMetrics('https://example.com/?q=a&b=c')).toEqual({ performanceScore: 92, firstContentfulPaint: 1200, largestContentfulPaint: 2400, cumulativeLayoutShift: 0, firstInputDelay: 0, totalBlockingTime: 200 })
    const [url, options] = mocks.fetch.mock.calls[0]
    expect(new URL(url).searchParams.get('url')).toBe('https://example.com/?q=a&b=c')
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })
  it.each([{}, { numericValue: '1200' }, { numericValue: -1 }, { numericValue: Infinity }])('keeps invalid individual metrics absent %#', async metric => {
    vi.stubEnv('PAGESPEED_API_KEY', 'test-key')
    mocks.fetch.mockResolvedValue({ ok: true, json: async () => ({ lighthouseResult: { categories: { performance: { score: 0 } }, audits: { 'first-contentful-paint': metric, 'max-potential-fid': { numericValue: 50 } } } }) })
    expect(await getPerformanceMetrics('https://example.com')).toEqual({ performanceScore: 0, firstContentfulPaint: null, largestContentfulPaint: null, cumulativeLayoutShift: null, firstInputDelay: 50, totalBlockingTime: null })
  })
})

describe('legacy heuristic calculations (not compliance certification)', () => {
  it('handles empty and missing-rule inputs without crashes', () => {
    expect(analyzeSEOMetrics([{}])).toEqual(analyzeSEOMetrics([]))
    expect(calculateComplianceRisk(90, []).complianceGaps).toEqual([])
  })
  it('reduces heuristic coverage for relevant accessibility findings', () => {
    const issues = [{ id: 'image-alt' }, { id: 'alt' }, { id: 'heading-order' }, { id: 'heading-one' }, { id: 'link-name' }]
    const value = analyzeSEOMetrics(issues)
    expect(value.altTextCoverage).toBe(80)
    expect(value.linkAccessibility).toBeCloseTo(100 * 14 / 15)
    expect(value.headingStructure.hasProperHierarchy).toBe(false)
    expect(value.seoScore).toBe(72)
    const saturated = analyzeSEOMetrics(Array.from({ length: 20 }, () => ({ id: 'image-alt-link-heading' })))
    expect(saturated.altTextCoverage).toBe(0)
    expect(saturated.linkAccessibility).toBe(0)
    expect(saturated.headingStructure.h2).toBe(0)
    expect(saturated.metaDescription).toBeNull()
  })
  it.each([[39, 0, 0, 'CRITICAL'], [90, 6, 0, 'CRITICAL'], [59, 0, 0, 'HIGH'], [90, 3, 0, 'HIGH'], [90, 0, 11, 'HIGH'], [74, 0, 0, 'MEDIUM'], [90, 0, 6, 'MEDIUM'], [90, 0, 0, 'LOW']] as const)('applies existing risk-score thresholds %#', (score, critical, serious, expected) => {
    const violations = [...Array.from({ length: critical }, () => ({ impact: 'critical' })), ...Array.from({ length: serious }, () => ({ impact: 'serious' }))]
    const risk = calculateComplianceRisk(score, violations)
    expect(risk.adaRiskLevel).toBe(expected)
    expect(risk.legalRiskScore).toBeGreaterThanOrEqual(0)
    expect(risk.legalRiskScore).toBeLessThanOrEqual(100)
  })
  it('categorizes rule identifiers and clamps heuristic percentages at zero', () => {
    const ids = ['color-contrast', 'image-alt', 'video-captions', 'keyboard', 'focus-order', 'link-name', 'label', 'heading', 'language', 'html', 'valid', 'aria']
    const result = calculateComplianceRisk(80, [...ids.map(id => ({ id })), ...Array(60).fill({})])
    expect(result.complianceGaps.map(gap => gap.issues)).toEqual([ids.slice(0, 3), ids.slice(3, 6), ids.slice(6, 9), ids.slice(9)])
    expect(result.wcag21Compliance).toBe(0)
    expect(result.wcag22Compliance).toBe(0)
  })
})

describe('portfolio performance summaries', () => {
  it.each([[], Array(4).fill({ score: 20, performanceScore: 30 }), [{ score: 20 }, {}, {}, {}, {}], Array(5).fill({ score: 30, performanceScore: 30 })].map(values => ({ values })))('returns no correlation for insufficient/constant data %#', ({ values }) => {
    expect(calculatePerformanceCorrelation(values)).toBeNull()
  })
  it.each([1, -1])('calculates correlation direction %s from measured pairs', direction => {
    const values = [10, 20, 30, 40, 50].map(score => ({ score, performanceScore: direction > 0 ? score : 100 - score }))
    expect(calculatePerformanceCorrelation(values)).toBe(direction)
  })
  it.each([[], [{ scans: [] }]].map(sites => ({ sites })))('returns no portfolio summary without completed scans %#', async ({ sites }) => {
    mocks.sites.mockResolvedValue(sites)
    expect(await getPortfolioAnalytics('owner')).toBeNull()
    expect(mocks.sites.mock.calls[0][0]).toMatchObject({ where: { userId: 'owner' }, include: { scans: { where: { status: 'COMPLETED' }, take: 1 } } })
  })
  it('computes risk buckets and ranking from latest stored scans only', async () => {
    mocks.sites.mockResolvedValue([null, 25, 50, 75, 100].map((risk, i) => ({ id: `s${i}`, url: `https://example.com/${i}`, scans: [{ score: i ? i * 20 : null, issues: i || null, legalRiskScore: risk, performanceScore: i * 20, adaRiskLevel: 'LOW' }] })))
    const result = await getPortfolioAnalytics('owner')
    expect(result).toMatchObject({ totalSites: 5, avgScore: 40, totalIssues: 10, riskDistribution: { low: 1, medium: 1, high: 1, critical: 2 }, performanceCorrelation: 1 })
    expect(result?.topPerformingSites.map(site => site.score)).toEqual([80, 60, 40, 20, null])
    expect(result?.worstPerformingSites.map(site => site.score)).toEqual([null, 20, 40, 60, 80])
  })
  it('filters unscanned sites and sorts actionable priority consistently', () => {
    const sites = [{ id: 'empty', scans: [] }, { id: 'high', url: 'https://example.com/high', scans: [{ impactCritical: 5, impactSerious: 0, impactModerate: 0, legalRiskScore: 80, issues: 1, performanceScore: 80, score: 50, adaRiskLevel: 'HIGH' }] }, { id: 'low', url: 'https://example.com/low', scans: [{ impactCritical: 0, impactSerious: 1, impactModerate: 1, legalRiskScore: null, issues: null, performanceScore: null, score: 80, adaRiskLevel: 'LOW' }] }]
    expect(calculatePriorityMatrix(sites)).toEqual([{ siteId: 'high', url: sites[1].url, impact: 10, effort: 2, priority: 5, score: 50, riskLevel: 'HIGH' }, { siteId: 'low', url: sites[2].url, impact: 3, effort: 2, priority: 1.5, score: 80, riskLevel: 'LOW' }])
  })
})
