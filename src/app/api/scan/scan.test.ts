import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './route'
const mocks = vi.hoisted(() => ({
  after: vi.fn(), auth: vi.fn(), scanUrl: vi.fn(), close: vi.fn(), page: vi.fn(), discover: vi.fn(), syncUser: vi.fn(), publish: vi.fn(), issues: vi.fn(), normalize: vi.fn(), validate: vi.fn(), compliance: vi.fn(), seo: vi.fn(), risk: vi.fn(),
  limits: { addPageUsage: vi.fn(), addSiteUsage: vi.fn(), assertCanCreateSite: vi.fn(), assertWithinLimits: vi.fn(), consumeWeeklyFreeScan: vi.fn(), hasWeeklyFreeScanAvailable: vi.fn() },
  db: { user: { findUnique: vi.fn() }, site: { findUnique: vi.fn(), create: vi.fn() }, page: { findUnique: vi.fn(), create: vi.fn() }, scan: { create: vi.fn(), update: vi.fn(), findFirst: vi.fn() } },
}))
vi.mock('next/server', async importOriginal => ({ ...await importOriginal<typeof import('next/server')>(), after: mocks.after }))
vi.mock('@/lib/auth', () => ({ requireAuth: mocks.auth }))
vi.mock('@/lib/prisma', () => ({ prisma: mocks.db }))
vi.mock('@/lib/scanner-enhanced', () => ({ EnhancedAccessibilityScanner: class { scanUrl = mocks.scanUrl; close = mocks.close; getCurrentPage = mocks.page } }))
vi.mock('@/lib/crawler', () => ({ discoverInternalLinksFromPage: mocks.discover }))
vi.mock('@/lib/billing/entitlements', () => mocks.limits)
vi.mock('@/lib/user-sync', () => ({ ensureUserInDatabase: mocks.syncUser }))
vi.mock('@/lib/public-reports', () => ({ publishScanReport: mocks.publish }))
vi.mock('@/lib/issues/sync-scan-issues', () => ({ syncScanIssuesFromViolations: mocks.issues }))
vi.mock('@/lib/url', () => ({ normalizeUrl: mocks.normalize }))
vi.mock('@/lib/scan-url-validation', () => ({ validatePublicUrl: mocks.validate }))
vi.mock('@/lib/analytics', () => ({ calculateWCAGCompliance: mocks.compliance }))
vi.mock('@/lib/performance-analytics', () => ({ analyzeSEOMetrics: mocks.seo, calculateComplianceRisk: mocks.risk }))
const target = 'https://example.com/'
const req = (body: unknown = { url: target }, headers?: HeadersInit) => new Request('http://localhost/api/scan', { method: 'POST', headers, body: JSON.stringify(body) })
const result = (overrides: Record<string, unknown> = {}) => ({ title: 'Example', score: 88, violations: [], engineName: 'axe', impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0, totalPageWeightBytes: 1000, largestContentfulPaintMs: 1200, domNodeCount: 80, qualityWarnings: [], performanceImpact: { score: 80, loadTime: 1300 }, vni: { score: 2000, tier: 'Authority', pillars: { wcagCompliance: 400, aiContentIntegrity: 400, performanceSpeed: 400, colorBlindnessContrast: 400, designQualityUx: 400 }, internal: {} }, ...overrides })
beforeEach(() => {
  vi.resetAllMocks(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-06T12:00:00Z'))
  vi.stubEnv('SCAN_SERVICE_TOKEN', undefined); vi.stubEnv('SCAN_SERVICE_USER_ID', undefined)
  vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}); vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('No external IO permitted') }))
  mocks.auth.mockResolvedValue({ id: 'owner' }); mocks.db.user.findUnique.mockResolvedValue({ id: 'owner' })
  mocks.db.site.findUnique.mockResolvedValue({ id: 'site1', url: target }); mocks.db.site.create.mockResolvedValue({ id: 'site1' })
  mocks.db.page.findUnique.mockResolvedValue({ id: 'page1' }); mocks.db.page.create.mockResolvedValue({ id: 'page1' })
  mocks.db.scan.create.mockResolvedValue({ id: 'scan1', status: 'PENDING' }); mocks.db.scan.findFirst.mockResolvedValue(null)
  mocks.db.scan.update.mockImplementation(async ({ data }) => ({ id: 'scan1', ...data, site: { url: target, userId: 'owner' }, page: { url: target }, createdAt: new Date() }))
  mocks.normalize.mockImplementation(url => url); mocks.validate.mockReturnValue({ siteUrl: target, fullPageUrl: target })
  mocks.scanUrl.mockResolvedValue(result()); mocks.close.mockResolvedValue(undefined); mocks.page.mockReturnValue(null); mocks.discover.mockResolvedValue([])
  mocks.compliance.mockReturnValue(90); mocks.seo.mockReturnValue({}); mocks.risk.mockReturnValue({})
})
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })
async function background(advanceMs = 0) {
  const pending = mocks.after.mock.calls[0][0]()
  await vi.advanceTimersByTimeAsync(advanceMs)
  await pending
}
const completed = () => mocks.db.scan.update.mock.calls.find(([args]) => args.data.status === 'COMPLETED')?.[0].data
const failed = () => mocks.db.scan.update.mock.calls.find(([args]) => args.data.status === 'FAILED')?.[0].data

describe('scan request boundaries', () => {
  it('requires authentication and does not enqueue work for anonymous users', async () => {
    mocks.auth.mockRejectedValue(new Error('Authentication required'))
    expect((await POST(req())).status).toBe(401)
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it.each([{}, null, { url: 123 }, { url: '' }, { url: target, includeVNI: 'false' }])('validates external input before scanner/database writes %#', async body => {
    expect((await POST(req(body))).status).toBe(400)
    expect(mocks.db.scan.create).not.toHaveBeenCalled()
  })
  it('rejects malformed JSON', async () => {
    expect((await POST(new Request('http://localhost/api/scan', { method: 'POST', body: '{' }))).status).toBe(400)
  })
  it('rejects a URL that cannot normalize', async () => {
    mocks.normalize.mockReturnValue(null)
    expect((await POST(req())).status).toBe(400)
  })
  it.each([new Error('Private target blocked'), { statusCode: 422, message: 'Invalid port' }, null])('does not enqueue unsafe targets %#', async failure => {
    mocks.validate.mockImplementation(() => { throw failure })
    const response = await POST(req())
    expect(response.status).toBe((failure as { statusCode?: number } | null)?.statusCode || 400)
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it.each([['UPGRADE_REQUIRED', 402], ['LIMIT_REACHED', 429], ['FREE_LIMIT_REACHED', 429], ['SITE_LIMIT_REACHED', 402], ['UNEXPECTED', 500]] as const)('maps entitlement error %s to actionable status', async (code, status) => {
    mocks.limits.assertWithinLimits.mockRejectedValue(Object.assign(new Error('Limit reached'), { code, limit: 10, current: 10, feature: 'scan' }))
    mocks.limits.hasWeeklyFreeScanAvailable.mockResolvedValue(false)
    expect((await POST(req())).status).toBe(status)
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it('reports a missing synchronized profile', async () => {
    mocks.auth.mockRejectedValue(new Error('User not found'))
    expect((await (await POST(req())).json()).code).toBe('USER_NOT_INITIALIZED')
  })
  it('handles unexpected non-Error failures', async () => {
    mocks.auth.mockRejectedValue(null)
    expect((await (await POST(req())).json()).error).toBe('Scan failed')
  })
  it('syncs an authenticated Supabase profile and queues without scanning inline', async () => {
    const supabaseUser = { id: 'owner', email: 'test@example.com' }
    mocks.auth.mockResolvedValue({ id: 'owner', supabaseUser })
    const response = await POST(req())
    expect(response.status).toBe(202)
    expect(await response.json()).toMatchObject({ accepted: true, scanId: 'scan1', pollUrl: '/api/scans/scan1', status: 'PENDING' })
    expect(mocks.syncUser).toHaveBeenCalledWith(supabaseUser)
    expect(mocks.scanUrl).not.toHaveBeenCalled()
    expect(mocks.after).toHaveBeenCalledOnce()
  })
  it('creates missing owned site/page and charges site creation only once', async () => {
    mocks.db.site.findUnique.mockResolvedValue(null); mocks.db.page.findUnique.mockResolvedValue(null)
    await POST(req())
    expect(mocks.db.site.create).toHaveBeenCalledWith({ data: { userId: 'owner', url: target } })
    expect(mocks.db.page.create).toHaveBeenCalledWith({ data: { siteId: 'site1', url: target } })
    expect(mocks.limits.addSiteUsage).toHaveBeenCalledWith('owner')
  })
})

describe('service and weekly-free scans', () => {
  it('does not trust an incorrect service token', async () => {
    vi.stubEnv('SCAN_SERVICE_TOKEN', 'expected'); mocks.auth.mockRejectedValue(new Error('Authentication required'))
    expect((await POST(req(undefined, { 'x-service-token': 'wrong', 'x-scan-user-id': 'owner' }))).status).toBe(401)
  })
  it('requires a known service user', async () => {
    vi.stubEnv('SCAN_SERVICE_TOKEN', 'expected')
    expect((await POST(req(undefined, { 'x-service-token': 'expected' }))).status).toBe(400)
    mocks.db.user.findUnique.mockResolvedValue(null)
    expect((await POST(req(undefined, { 'x-service-token': 'expected', 'x-scan-user-id': 'missing' }))).status).toBe(400)
    expect(mocks.after).not.toHaveBeenCalled()
  })
  it.each(['header', 'environment'])('accepts validated service user via %s without consuming user allowance', async source => {
    vi.stubEnv('SCAN_SERVICE_TOKEN', 'expected'); if (source === 'environment') vi.stubEnv('SCAN_SERVICE_USER_ID', 'owner')
    mocks.db.site.findUnique.mockResolvedValue(null)
    const headers: Record<string, string> = { 'x-service-token': 'expected' }; if (source === 'header') headers['x-scan-user-id'] = 'owner'
    expect((await POST(req(undefined, headers))).status).toBe(202)
    await background()
    expect(completed()).toBeDefined()
    expect(mocks.auth).not.toHaveBeenCalled()
    expect(mocks.limits.addPageUsage).not.toHaveBeenCalled()
    expect(mocks.limits.addSiteUsage).not.toHaveBeenCalled()
  })
  it.each(['LIMIT_REACHED', 'FREE_LIMIT_REACHED'])('consumes eligible weekly allowance only after a completed scan (%s)', async code => {
    mocks.limits.assertWithinLimits.mockRejectedValue(Object.assign(new Error('quota'), { code })); mocks.limits.hasWeeklyFreeScanAvailable.mockResolvedValue(true)
    mocks.db.site.findUnique.mockResolvedValue(null)
    expect((await POST(req())).status).toBe(202)
    expect(mocks.limits.consumeWeeklyFreeScan).not.toHaveBeenCalled()
    await background()
    expect(mocks.limits.consumeWeeklyFreeScan).toHaveBeenCalledWith('owner')
    expect(mocks.limits.addPageUsage).not.toHaveBeenCalled()
    expect(mocks.limits.addSiteUsage).not.toHaveBeenCalled()
  })
})

describe('background scan integrity', () => {
  it('stores real evidence, strips optional intelligence recursively, and closes all deadlines', async () => {
    mocks.scanUrl.mockResolvedValue(result({ violations: [{ id: 'image-alt', nodes: [] }, { id: 'image-alt', helpUrl: 'https://example.com/help', tags: ['wcag2a'] }], extra: [{ vniScore: 500, aiContentChecks: ['private'], label: 'kept' }] }))
    await POST(req()); await background()
    const data = completed()
    expect(data).toMatchObject({ score: 88, issues: 2, newIssues: 2, issuesFixed: 0, scoreImprovement: null, violationsByRule: { 'image-alt': 2 } })
    expect(JSON.stringify(data.raw)).not.toContain('vni')
    expect(JSON.stringify(data.raw)).not.toContain('aiContentChecks')
    expect(data.raw.extra).toEqual([{ label: 'kept' }])
    expect(data.raw.scanOptions.includeVNI).toBe(false)
    expect(mocks.issues).toHaveBeenCalledWith(expect.objectContaining({ scanId: 'scan1', createdById: 'owner', fallbackPageUrl: target, violations: expect.arrayContaining([expect.objectContaining({ id: 'image-alt', helpUrl: expect.stringContaining('dequeuniversity') })]) }))
    expect(mocks.limits.addPageUsage).toHaveBeenCalledWith('owner', 1)
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each([undefined, { __demo: true, violations: [] }, { mock: true, violations: [] }, { engineName: 'fallback-mock', violations: [] }, { violations: null }])('rejects absent or synthetic findings before billing %#', async value => {
    mocks.scanUrl.mockResolvedValue(value)
    await POST(req()); await background()
    expect(failed().resultJson.code).toBe('SCANNER_NO_BROWSER')
    expect(completed()).toBeUndefined()
    expect(mocks.limits.addPageUsage).not.toHaveBeenCalled()
    expect(mocks.publish).not.toHaveBeenCalled()
  })
  it.each([null, new Error('Chromium crashed')])('persists scanner failure and closes browser %#', async failure => {
    mocks.scanUrl.mockRejectedValue(failure)
    await POST(req()); await background()
    expect(failed().resultJson.code).toBe('SCAN_FAILED')
    expect(mocks.close).toHaveBeenCalledOnce()
  })
  it('persists the safety timeout without charging usage', async () => {
    mocks.scanUrl.mockReturnValue(new Promise(() => {}))
    await POST(req()); await background(90_000)
    expect(failed().resultJson.error).toContain('90s safety limit')
    expect(mocks.limits.addPageUsage).not.toHaveBeenCalled()
    expect(mocks.close).toHaveBeenCalledOnce()
  })
  it.each([null, { id: 'previous', issues: 5, score: 75 }, { id: 'previous', issues: null, score: null }])('calculates deltas against the previous scan when present %#', async previous => {
    mocks.db.scan.findFirst.mockResolvedValue(previous)
    mocks.scanUrl.mockResolvedValue(result({ violations: [{ id: 'image-alt' }] }))
    await POST(req()); await background()
    expect(completed()).toMatchObject({ issuesFixed: previous ? Math.max(0, (previous.issues || 0) - 1) : 0, newIssues: previous ? Math.max(0, 1 - (previous.issues || 0)) : 1, scoreImprovement: previous ? 88 - (previous.score || 0) : null })
  })
  it('keeps completed evidence when issue sync and public publication fail', async () => {
    mocks.issues.mockRejectedValue(new Error('issues unavailable')); mocks.publish.mockRejectedValue('publication unavailable')
    await POST(req()); await background()
    expect(completed()).toBeDefined(); expect(failed()).toBeUndefined()
  })
  it('caps a depth-one scan at ten pages and AI analysis at three', async () => {
    mocks.page.mockReturnValue({}); mocks.discover.mockResolvedValue([target, `${target}one`, `${target}one`, ...Array.from({ length: 15 }, (_, i) => `${target}page${i}`)])
    await POST(req({ url: target, includeVNI: true })); await background(20_000)
    expect(mocks.scanUrl).toHaveBeenCalledTimes(10)
    expect(mocks.scanUrl.mock.calls.filter(([, options]) => options.enableAiImageAnalysis)).toHaveLength(3)
    expect(completed().raw.deepScan.scannedPages).toBe(10)
    expect(completed().raw.vni.internal.deepScan.aiAnalyzedPages).toBe(3)
    expect(completed().raw.scanOptions.includeVNI).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each([[2500, 'Apex'], [2000, 'Authority'], [1500, 'Elite'], [1000, 'Standard'], [500, 'Insolvent']] as const)('preserves aggregate VNI tier at score %s', async (score, tier) => {
    const value = result(); value.vni.score = score
    mocks.scanUrl.mockResolvedValue(value)
    await POST(req({ url: target, includeVNI: true })); await background()
    expect(completed().raw.vni).toMatchObject({ score, tier })
  })
  it('keeps completed pages if the next page reaches the safety deadline', async () => {
    mocks.page.mockReturnValue({}); mocks.discover.mockResolvedValue([`${target}two`])
    mocks.scanUrl.mockResolvedValueOnce(result()).mockRejectedValueOnce(new Error('Deep scan reached the 90s safety limit'))
    await POST(req()); await background(1500)
    expect(completed().raw.deepScan.scannedPages).toBe(1)
    expect(failed()).toBeUndefined()
  })
})
