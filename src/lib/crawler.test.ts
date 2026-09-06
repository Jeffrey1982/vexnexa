import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createDepthOneScanQueue, discoverInternalLinksFromPage, getCrawlStatus, runCrawl, startCrawl } from './crawler'

const mocks = vi.hoisted(() => ({
  db: { site: { findUnique: vi.fn() }, crawl: { create: vi.fn(), update: vi.fn(), findUnique: vi.fn() }, crawlUrl: { create: vi.fn(), update: vi.fn(), updateMany: vi.fn(), findFirst: vi.fn(), count: vi.fn() }, page: { upsert: vi.fn(), update: vi.fn() }, scan: { findFirst: vi.fn(), create: vi.fn() } },
  scan: vi.fn(), robots: vi.fn(), fetch: vi.fn(), compliance: vi.fn(), performance: vi.fn(), seo: vi.fn(), risk: vi.fn(),
}))
vi.mock('./prisma', () => ({ prisma: mocks.db }))
vi.mock('./scanner-enhanced', () => ({ runEnhancedAccessibilityScan: mocks.scan }))
vi.mock('./robots', () => ({ isAllowedByRobots: mocks.robots }))
vi.mock('./analytics', () => ({ calculateWCAGCompliance: mocks.compliance }))
vi.mock('./performance-analytics', () => ({ getPerformanceMetrics: mocks.performance, analyzeSEOMetrics: mocks.seo, calculateComplianceRisk: mocks.risk }))
vi.mock('node-fetch', () => ({ default: mocks.fetch }))
vi.mock('bottleneck', () => ({ default: class { schedule(fn: () => unknown) { return fn() } } }))

const root = 'https://fixture.test'
const crawl = () => ({ id: 'crawl-1', siteId: 'site-1', site: { url: root }, maxPages: 10, maxDepth: 1, status: 'running', startedAt: new Date('2026-09-07T12:00:00Z') })
beforeEach(() => {
  vi.resetAllMocks()
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-09-07T12:10:00Z'))
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected real network boundary') }))
  mocks.db.site.findUnique.mockResolvedValue({ id: 'site-1', url: root })
  mocks.db.crawl.create.mockResolvedValue({ id: 'crawl-1' })
  mocks.db.crawl.findUnique.mockResolvedValue(crawl())
  mocks.db.crawlUrl.findFirst.mockResolvedValue(null)
  mocks.db.crawlUrl.count.mockResolvedValue(0)
  mocks.db.page.upsert.mockResolvedValue({ id: 'page-1' })
  mocks.db.scan.create.mockResolvedValue({ id: 'scan-1' })
  mocks.db.scan.findFirst.mockResolvedValue(null)
  mocks.robots.mockResolvedValue(true)
  mocks.scan.mockResolvedValue({ score: 88.4, violations: [], domNodeCount: 100, totalPageWeightBytes: 1024 })
  mocks.compliance.mockReturnValue(90)
  mocks.performance.mockResolvedValue({ largestContentfulPaint: 2000 })
  mocks.seo.mockReturnValue({ seoScore: 90 })
  mocks.risk.mockReturnValue({ adaRiskLevel: 'Low' })
  mocks.fetch.mockResolvedValue(new Response('', { status: 404 }))
})
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals() })

describe('depth-one URL queue', () => {
  it('keeps only unique same-origin pages, strips fragments, and caps work', () => {
    expect(createDepthOneScanQueue(`${root}/`, ['', '#title', 'mailto:a@fixture.test', 'https://other.test', 'http://[', '/', '/one#first', '/one#second', '/IMAGE.PNG?q=1', '/two', '/three'], 2)).toEqual([`${root}/one`, `${root}/two`])
  })
  it.each(['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.mp4', '.mp3', '.mov', '.avi'])('does not queue file downloads ending %s', (extension) => {
    expect(createDepthOneScanQueue(root, [`/download${extension}`])).toEqual([])
  })
  it('does not follow a page when DOM link extraction fails', async () => {
    const page = { evaluate: vi.fn().mockRejectedValue(new Error('detached')) }
    await expect(discoverInternalLinksFromPage(page, root)).rejects.toThrow('detached')
  })
  it('normalizes collected links through the same depth-one boundary', async () => {
    const page = { evaluate: vi.fn().mockResolvedValue(['/one', '/one#dup', '/two']) }
    expect(await discoverInternalLinksFromPage(page, root, 1)).toEqual([`${root}/one`])
  })
})

describe('crawl initialization', () => {
  it('refuses missing sites before creating queue records', async () => {
    mocks.db.site.findUnique.mockResolvedValue(null)
    await expect(startCrawl('missing')).rejects.toThrow('Site not found')
    expect(mocks.db.crawl.create).not.toHaveBeenCalled()
  })
  it('starts from the root only when sitemap discovery is disabled', async () => {
    expect(await startCrawl('site-1', 5, 2, false)).toBe('crawl-1')
    expect(mocks.fetch).not.toHaveBeenCalled()
    expect(mocks.db.crawl.create).toHaveBeenCalledWith({ data: { siteId: 'site-1', maxPages: 5, maxDepth: 2, status: 'queued' } })
    expect(mocks.db.crawlUrl.create).toHaveBeenCalledOnce()
    expect(mocks.db.crawl.update).toHaveBeenLastCalledWith({ where: { id: 'crawl-1' }, data: { pagesQueued: 1, status: 'running' } })
  })
  it('deduplicates sitemap URLs and enforces the configured page budget', async () => {
    const xml = `<urlset><loc>${root}/one</loc><loc>${root}/one</loc><loc>https://other.test/no</loc><loc>${root}/two</loc><loc>${root}/three</loc></urlset>`
    mocks.fetch.mockImplementation((url) => Promise.resolve(new Response(String(url).endsWith('robots.txt') ? '' : xml)))
    await startCrawl('site-1', 3)
    expect(mocks.db.crawlUrl.create).toHaveBeenCalledTimes(3)
    expect(mocks.db.crawlUrl.create.mock.calls.map(([arg]) => arg.data.url)).toEqual([root, `${root}/one`, `${root}/two`])
  })
  it('continues after inaccessible sitemap locations and duplicate inserts', async () => {
    mocks.fetch.mockRejectedValueOnce(new Error('not accessible')).mockResolvedValueOnce(new Response(`<sitemapindex><sitemap><loc>${root}/child.xml</loc></sitemap></sitemapindex>`)).mockResolvedValueOnce(new Response(`Sitemap: ${root}/extra.xml`)).mockResolvedValueOnce(new Response(`<urlset><loc>${root}/extra</loc></urlset>`))
    mocks.db.crawlUrl.create.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('duplicate')).mockResolvedValueOnce({})
    await startCrawl('site-1')
    expect(mocks.db.crawl.update).toHaveBeenLastCalledWith({ where: { id: 'crawl-1' }, data: { pagesQueued: 2, status: 'running' } })
  })
  it('still queues the root when all discovery requests fail', async () => {
    mocks.fetch.mockRejectedValue(new Error('offline'))
    await startCrawl('site-1')
    expect(mocks.db.crawlUrl.create).toHaveBeenCalledOnce()
  })
})

describe('crawl execution with all IO mocked', () => {
  function queue(url = `${root}/`, depth = 1) {
    mocks.db.crawlUrl.findFirst.mockResolvedValueOnce({ id: 'url-1', url, depth }).mockResolvedValue(null)
  }
  it('refuses missing crawls', async () => {
    mocks.db.crawl.findUnique.mockResolvedValue(null)
    await expect(runCrawl('missing')).rejects.toThrow('Crawl not found')
  })
  it('skips remaining work at the page limit without scanning', async () => {
    queue(); mocks.db.crawlUrl.count.mockResolvedValue(10)
    await runCrawl('crawl-1')
    expect(mocks.scan).not.toHaveBeenCalled()
    expect(mocks.db.crawlUrl.updateMany).toHaveBeenCalledWith({ where: { crawlId: 'crawl-1', status: 'queued' }, data: { status: 'skipped', reason: 'Page limit reached' } })
  })
  it('honors robots exclusion without calling the scanner', async () => {
    queue(); mocks.robots.mockResolvedValue(false)
    await runCrawl('crawl-1')
    expect(mocks.scan).not.toHaveBeenCalled()
    expect(mocks.db.crawlUrl.update).toHaveBeenCalledWith({ where: { id: 'url-1' }, data: { status: 'skipped', reason: 'Blocked by robots.txt' } })
  })
  it('persists measured findings, trends and metadata and updates latest scan', async () => {
    queue(`${root}/products/new-offer`)
    const violations = [{ id: 'image-alt' }, { id: 'image-alt' }, { id: 'label' }]
    mocks.scan.mockResolvedValue({ score: 88.4, violations, impactCritical: 2, impactSerious: 1, impactModerate: 0, impactMinor: 0, largestContentfulPaintMs: 1234, totalPageWeightBytes: 2048, domNodeCount: 123, qualityWarnings: [], performanceImpact: { loadTime: 1500 } })
    mocks.db.scan.findFirst.mockResolvedValue({ id: 'previous-1', issues: 5, score: 70 })
    await runCrawl('crawl-1')
    expect(mocks.db.scan.create).toHaveBeenCalledWith({ data: expect.objectContaining({ score: 88, issues: 3, impactCritical: 2, impactSerious: 1, violationsByRule: { 'image-alt': 2, label: 1 }, issuesFixed: 2, newIssues: 0, scoreImprovement: 18, previousScanId: 'previous-1', largestContentfulPaint: 1234, pageLoadTime: 1500, elementsScanned: 123 }) })
    expect(mocks.db.page.upsert.mock.calls[0][0].create.title).toBe('Products > New Offer')
    expect(mocks.db.page.update).toHaveBeenCalledWith({ where: { id: 'page-1' }, data: { latestScanId: 'scan-1' } })
    expect(mocks.fetch).not.toHaveBeenCalled()
  })
  it('handles absent violations and nullable previous metrics', async () => {
    queue(); mocks.db.scan.findFirst.mockResolvedValue({ id: 'previous-1', issues: null, score: null })
    mocks.scan.mockResolvedValue({ score: 100 })
    await runCrawl('crawl-1')
    expect(mocks.db.scan.create.mock.calls[0][0].data).toMatchObject({ issues: 0, impactCritical: 0, issuesFixed: 0, newIssues: 0, scoreImprovement: 100, largestContentfulPaint: 2000 })
    expect(mocks.db.page.upsert.mock.calls[0][0].create.title).toBe('fixture.test')
  })
  it.each([undefined, 1420])('completes real accessibility findings without PageSpeed data, preserving scanner LCP %s', async measuredLcp => {
    queue()
    mocks.performance.mockResolvedValue(null)
    mocks.scan.mockResolvedValue({ score: 76, violations: [{ id: 'label' }], largestContentfulPaintMs: measuredLcp })
    await runCrawl('crawl-1')
    expect(mocks.db.scan.create).toHaveBeenCalledWith({ data: expect.objectContaining({
      status: 'COMPLETED', score: 76, issues: 1, violationsByRule: { label: 1 },
      performanceScore: null, firstContentfulPaint: null, largestContentfulPaint: measuredLcp ?? null,
      cumulativeLayoutShift: null, totalBlockingTime: null, firstInputDelay: null,
    }) })
    expect(mocks.db.page.update).toHaveBeenCalledWith({ where: { id: 'page-1' }, data: { latestScanId: 'scan-1' } })
  })
  it('queues unique internal links below max depth and tolerates duplicates', async () => {
    queue(`${root}/`, 0)
    mocks.fetch.mockResolvedValue(new Response('<a href="/one">One</a><a href="/one#again">Again</a><a href="https://other.test">Other</a><a href="http://[">Broken</a><a href="">Empty</a><a href="/two">Two</a>'))
    mocks.db.crawlUrl.create.mockRejectedValueOnce(new Error('duplicate')).mockResolvedValue({})
    await runCrawl('crawl-1')
    expect(mocks.db.crawlUrl.create.mock.calls.map(([arg]) => arg.data.url)).toEqual([`${root}/one`, `${root}/two`])
    expect(mocks.db.scan.create.mock.calls[0][0].data.scoreImprovement).toBeNull()
    expect(mocks.db.crawlUrl.create.mock.calls[0][0].data.depth).toBe(1)
  })
  it.each([false, true])('finishes stored scan when optional link fetch fails (throws=%s)', async (throws) => {
    queue(`${root}/`, 0)
    if (throws) mocks.fetch.mockRejectedValue(new Error('link fetch failed'))
    await runCrawl('crawl-1')
    expect(mocks.db.scan.create).toHaveBeenCalledOnce()
    expect(mocks.db.crawlUrl.create).not.toHaveBeenCalled()
  })
  it('records scanner failures without inventing scan records', async () => {
    queue(); mocks.scan.mockRejectedValue(new Error('browser unavailable'))
    await runCrawl('crawl-1')
    expect(mocks.db.scan.create).not.toHaveBeenCalled()
    expect(mocks.db.crawlUrl.update).toHaveBeenCalledWith({ where: { id: 'url-1' }, data: expect.objectContaining({ status: 'error', reason: 'Error: browser unavailable' }) })
  })
  it('marks a failed queue operation and rethrows it', async () => {
    mocks.db.crawlUrl.findFirst.mockRejectedValue(new Error('database unavailable'))
    await expect(runCrawl('crawl-1')).rejects.toThrow('database unavailable')
    expect(mocks.db.crawl.update).toHaveBeenCalledWith({ where: { id: 'crawl-1' }, data: expect.objectContaining({ status: 'error' }) })
  })
})

describe('crawl progress', () => {
  it('returns null when a crawl does not exist', async () => {
    mocks.db.crawl.findUnique.mockResolvedValue(null)
    expect(await getCrawlStatus('missing')).toBeNull()
  })
  it.each([['running', [], 0, null, false], ['done', ['done'], 100, null, true], ['error', ['error'], 0, null, true], ['running', ['queued'], 0, null, false], ['running', ['done'], 100, 'Less than 1 minute', false], ['running', ['done', 'queued', 'running', 'error', 'skipped'], 20, '10 minutes', false]])('derives counts and restart state for %s/%j', async (status, statuses, percentage, time, canRestart) => {
    mocks.db.crawl.findUnique.mockResolvedValue({ ...crawl(), status, crawlUrls: statuses.map(status => ({ status })) })
    const result = await getCrawlStatus('crawl-1')
    expect(result?.progress.progressPercentage).toBe(percentage)
    expect(result?.progress.estimatedTimeRemaining).toBe(time)
    expect(result?.canRestart).toBe(canRestart)
    expect(result?.isRunning).toBe(status === 'running')
  })
  it.each([[60000, '1 minute'], [7200000, '2h 0m']])('formats remaining time at %sms', async (elapsed, expected) => {
    mocks.db.crawl.findUnique.mockResolvedValue({ ...crawl(), startedAt: new Date(Date.now() - elapsed), crawlUrls: [{ status: 'done' }, { status: 'queued' }] })
    expect((await getCrawlStatus('crawl-1'))?.progress.estimatedTimeRemaining).toBe(expected)
  })
})
