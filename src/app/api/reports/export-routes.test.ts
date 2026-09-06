import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { transformScanToReport } from '@/lib/report/transform'
import { resolveReportLabels } from '@/lib/report/labels'
import { GET as htmlReport } from './[scanId]/html/route'
import { GET as pdfReport } from './[scanId]/pdf/route'
import { GET as debugReport } from './[scanId]/debug/route'
import { GET as combinedReport } from './combined/route'

const m = vi.hoisted(() => ({
  getUser: vi.fn(), requireAuth: vi.fn(), findScan: vi.fn(), findSite: vi.fn(), entitlement: vi.fn(),
  stored: vi.fn(), render: vi.fn(), transform: vi.fn(), image: vi.fn(), labels: vi.fn(), combined: vi.fn(),
}))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: async () => ({ auth: { getUser: m.getUser } }) }))
vi.mock('@/lib/auth', () => ({ requireAuth: m.requireAuth }))
vi.mock('@/lib/prisma', () => ({ prisma: { scan: { findUnique: m.findScan }, site: { findFirst: m.findSite }, whiteLabel: { findUnique: (args: { where: { userId: string } }) => m.stored(args.where.userId) } } }))
vi.mock('@/lib/billing/entitlements', () => ({ assertWithinLimits: m.entitlement }))
vi.mock('@/lib/combined-report-generator', () => ({ generateCombinedReport: m.combined }))
vi.mock('@/lib/report', async () => ({
  ...(await import('@/lib/report/resolve-white-label')),
  getStoredWhiteLabel: m.stored, renderReportHTML: m.render, transformScanToReport: m.transform,
  fetchImageAsDataUrl: m.image, resolveReportLabels: m.labels,
}))
const scan = () => ({ id: 'scan-fixture', score: 82, issues: 2, impactCritical: 0, impactSerious: 1,
  impactModerate: 1, impactMinor: 0, wcagAACompliance: 78, wcagAAACompliance: 65,
  createdAt: new Date('2026-01-02T00:00:00Z'), raw: { violations: [] }, resultJson: null,
  site: { url: 'https://fixture.test', userId: 'owner' }, page: { url: 'https://fixture.test/about', title: 'About' },
})
const request = (query = '', headers: Record<string, string> = {}) => new NextRequest(`https://fixture.test/api/reports/scan-fixture/pdf${query}`, { headers })
const context = () => ({ params: Promise.resolve({ scanId: 'scan-fixture' }) })
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('No external network permitted in export tests') }))
  m.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  m.requireAuth.mockResolvedValue({ id: 'owner' })
  m.findScan.mockResolvedValue(scan())
  m.findSite.mockResolvedValue({ id: 'site-fixture', userId: 'owner' })
  m.stored.mockResolvedValue(null)
  m.render.mockReturnValue('<html>Fixture report</html>')
  m.transform.mockImplementation(transformScanToReport)
  m.labels.mockImplementation(resolveReportLabels)
  m.combined.mockResolvedValue({ scanCount: 2, findings: ['fixture finding'] })
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe.each([['html', htmlReport], ['pdf', pdfReport], ['debug', debugReport]] as const)('%s report authorization and failure boundaries', (name, route) => {
  it.each([false, true])('rejects unauthenticated or rejected sessions before DB access (auth error=%s)', async withError => {
    m.getUser.mockResolvedValue({ data: { user: withError ? { id: 'owner' } : null }, error: withError ? { message: 'Expired session' } : null })
    const response = await route(request(), context())
    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ error: 'Unauthorized' })
    expect(m.findScan).not.toHaveBeenCalled()
    expect(m.render).not.toHaveBeenCalled()
  })
  it('returns missing scan without rendering or fetching branding', async () => {
    m.findScan.mockResolvedValue(null)
    const response = await route(request(), context())
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'Scan not found' })
    expect(m.stored).not.toHaveBeenCalled()
    expect(m.render).not.toHaveBeenCalled()
  })
  it('prevents another tenant exporting a scan even with a valid scan ID', async () => {
    m.findScan.mockResolvedValue({ ...scan(), site: { url: 'https://private.test', userId: 'other-owner' } })
    const response = await route(request(), context())
    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({ error: 'Forbidden' })
    expect(m.transform).not.toHaveBeenCalled()
    expect(m.entitlement).not.toHaveBeenCalled()
  })
  it.each([new Error('Database unavailable'), 'unexpected failure'])('handles database failure without returning a partial report: %s', async error => {
    m.findScan.mockRejectedValue(error)
    const response = await route(request(), context())
    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body.error).toBe(error instanceof Error ? error.message : name === 'debug' ? error : 'Unknown error')
    expect(m.render).not.toHaveBeenCalled()
  })
  it('propagates rendering failure as an error response', async () => {
    m.render.mockImplementation(() => { throw new Error('Rendering failed') })
    const response = await route(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ error: 'Rendering failed' })
  })
  it.each([null, { url: 'https://fixture.test/page', title: null }, { url: 'https://fixture.test/page', title: 'Page title' }])('normalizes optional scan page context %j', async page => {
    m.findScan.mockResolvedValue({ ...scan(), page })
    const response = await route(request(), context())
    expect(response.status).toBe(200)
    const transformedInput = m.transform.mock.calls[0][0]
    expect(transformedInput).toMatchObject({ score: 82, wcagAACompliance: 78, wcagAAACompliance: 65, createdAt: '2026-01-02T00:00:00.000Z' })
    expect(transformedInput.page).toEqual(page ? { url: page.url, title: page.title ?? undefined } : null)
    expect(m.findScan).toHaveBeenCalledWith({ where: { id: 'scan-fixture' }, include: { site: true, page: true } })
  })
})

describe.each([['html', htmlReport], ['pdf', pdfReport]] as const)('%s branding and export entitlement', (_name, route) => {
  it('requires export entitlement before branding, rendering, or image IO', async () => {
    m.entitlement.mockRejectedValue(new Error('Upgrade required'))
    const response = await route(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'Upgrade required' })
    expect(m.entitlement).toHaveBeenCalledWith({ userId: 'owner', action: 'export_pdf' })
    expect(m.stored).not.toHaveBeenCalled()
    expect(m.image).not.toHaveBeenCalled()
  })
  it('merges stored tenant branding with explicit query overrides and disables caching', async () => {
    m.stored.mockResolvedValue({ companyName: 'Stored partner', primaryColor: '#112233', footerText: 'Private fixture', faviconUrl: 'data:image/png;base64,AA==' })
    const response = await route(request('?company=Query%20partner&color=abcdef&reportStyle=corporate'), context())
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toBe('<html>Fixture report</html>')
    expect(m.stored).toHaveBeenCalledWith('owner')
    expect(m.render.mock.calls[0][0]).toMatchObject({ companyName: 'Query partner', reportStyle: 'corporate', whiteLabelConfig: { primaryColor: '#abcdef', footerText: 'Private fixture' } })
  })
})

describe('print/PDF route data selection', () => {
  it.each([
    ['?language=nl&locale=fr', { cookie: 'NEXT_LOCALE=de', 'accept-language': 'es' }, 'nl'],
    ['?locale=fr', { cookie: 'NEXT_LOCALE=de' }, 'fr'],
    ['', { cookie: 'NEXT_LOCALE=de' }, 'de'],
    ['', { 'accept-language': 'pt-PT,es;q=0.8' }, null],
    ['', {}, null],
  ] as const)('uses explicit locale precedence for %s / %j', async (query, headers, explicit) => {
    await pdfReport(request(query, headers), context())
    expect(m.labels).toHaveBeenCalledWith('accept-language' in headers ? headers['accept-language'] : null, explicit)
  })
  it.each(['data:image/png;base64,AA==', null])('uses embedded logo only when the safe image helper succeeds (%s)', async embedded => {
    m.stored.mockResolvedValue({ logoUrl: 'https://vexnexa.com/fixture-logo.png' })
    m.image.mockResolvedValue(embedded)
    await pdfReport(request(), context())
    expect(m.image).toHaveBeenCalledWith('https://vexnexa.com/fixture-logo.png')
    expect(m.render.mock.calls[0][0].whiteLabelConfig.logoUrl).toBe(embedded ?? 'https://vexnexa.com/fixture-logo.png')
  })
  it.each([null, 'legacy'])('treats non-object raw/result payload %s as empty evidence', async value => {
    m.findScan.mockResolvedValue({ ...scan(), raw: value, resultJson: value })
    const response = await pdfReport(request(), context())
    expect(response.status).toBe(200)
    expect(m.transform.mock.calls[0][0].raw).toEqual({})
  })
  it('prefers result JSON metrics while retaining legacy raw violations and deep-scan evidence', async () => {
    const violations = [{ id: 'label', nodes: [] }]
    const deepScan = { pages: [{ url: 'https://fixture.test/a' }], scannedPages: 1 }
    m.findScan.mockResolvedValue({ ...scan(), raw: { violations, domNodeCount: 20, vni: { score: 2100, internal: { deepScan } } }, resultJson: { violations: null, domNodeCount: 50 } })
    await pdfReport(request(), context())
    expect(m.transform.mock.calls[0][0].raw).toMatchObject({ violations, domNodeCount: 50, deepScan })
  })
  it('keeps newer result violations and direct deep-scan data when present', async () => {
    const violations = [{ id: 'contrast', nodes: [] }]
    const deepScan = { scannedPages: 3 }
    m.findScan.mockResolvedValue({ ...scan(), raw: { violations: [{ id: 'old' }], deepScan: { scannedPages: 1 } }, resultJson: { violations, deepScan } })
    await pdfReport(request(), context())
    expect(m.transform.mock.calls[0][0].raw).toMatchObject({ violations, deepScan })
  })
  it.each([false, true])('removes VNI details on request, with deep scan=%s', async includeDeepScan => {
    const deepScan = { worstPage: { url: 'https://fixture.test/slow', vniScore: 1000 }, pages: [{ url: 'https://fixture.test/a', vniScore: 2000 }, null] }
    m.findScan.mockResolvedValue({ ...scan(), raw: { vni: { score: 2100, tier: 'Authority' }, ...(includeDeepScan ? { deepScan } : {}) } })
    await pdfReport(request('?includeVNI=false'), context())
    const raw = m.transform.mock.calls[0][0].raw
    expect(raw).not.toHaveProperty('vni')
    if (includeDeepScan) {
      expect(raw.deepScan.worstPage).toEqual({ url: 'https://fixture.test/slow' })
      expect(raw.deepScan.pages).toEqual([{ url: 'https://fixture.test/a' }, {}])
    }
    expect(m.render.mock.calls[0][0].vni).toBeUndefined()
  })
})

describe('owner-only report diagnostics', () => {
  it('reports actual canonical-score agreement and completed rendering steps', async () => {
    const response = await debugReport(request(), context())
    const body = await response.json()
    expect(body).toMatchObject({ ok: true, htmlLength: '<html>Fixture report</html>'.length, scoreDebug: { 'DB score === report score': true, 'DB score === healthScore.value': true, 'reportData.healthScore.value': 82 } })
    expect(body.steps).toHaveLength(9)
    expect(body.steps.at(-1)).toContain('9-render-ok')
  })
  it('returns bounded error context at the failing transform stage', async () => {
    m.transform.mockImplementation(() => { throw new Error('Invalid report data') })
    const response = await debugReport(request(), context())
    const body = await response.json()
    expect(response.status).toBe(500)
    expect(body.steps.at(-1)).toBe('6-import-transform-ok')
    expect(body.error).toBe('Invalid report data')
    expect(m.render).not.toHaveBeenCalled()
  })
})

describe('combined report route', () => {
  it('requires a site selection without invoking report generation', async () => {
    const response = await combinedReport(request())
    expect(response.status).toBe(400)
    expect(m.findSite).not.toHaveBeenCalled()
    expect(m.combined).not.toHaveBeenCalled()
  })
  it('checks tenant ownership before reading combined results', async () => {
    m.findSite.mockResolvedValue(null)
    const response = await combinedReport(request('?siteId=site-fixture'))
    expect(response.status).toBe(404)
    expect(m.findSite).toHaveBeenCalledWith({ where: { id: 'site-fixture', userId: 'owner' } })
    expect(m.combined).not.toHaveBeenCalled()
  })
  it.each(['', '&scanId=scan-one&auditId=audit-one'])('passes selected component IDs only when provided: %s', async suffix => {
    const response = await combinedReport(request(`?siteId=site-fixture${suffix}`))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, report: { findings: ['fixture finding'] } })
    expect(m.combined).toHaveBeenCalledWith('site-fixture', suffix ? 'scan-one' : undefined, suffix ? 'audit-one' : undefined)
  })
  it('returns not-found when generation has no source records', async () => {
    m.combined.mockResolvedValue(null)
    const response = await combinedReport(request('?siteId=site-fixture'))
    expect(response.status).toBe(404)
    expect(await response.json()).toMatchObject({ error: 'Unable to generate report' })
  })
  it.each([new Error('Denied'), {}])('handles authentication failure without querying private data: %j', async error => {
    m.requireAuth.mockRejectedValue(error)
    const response = await combinedReport(request('?siteId=site-fixture'))
    expect(response.status).toBe(500)
    expect(await response.json()).toMatchObject({ error: error instanceof Error ? 'Denied' : 'Failed to generate report' })
    expect(m.findSite).not.toHaveBeenCalled()
  })
})
