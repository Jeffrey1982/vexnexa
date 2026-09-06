import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { Packer } from 'docx'
import JSZip from 'jszip'
import { transformScanToReport } from '@/lib/report/transform'
import { resolveReportLabels } from '@/lib/report/labels'
import { buildDocx, GET } from './[scanId]/docx/route'
import type { ReportData } from '@/lib/report/types'

const m = vi.hoisted(() => ({ getUser: vi.fn(), scan: vi.fn(), stored: vi.fn(), image: vi.fn(), entitlement: vi.fn() }))
vi.mock('@/lib/supabase/server-new', () => ({ createClient: async () => ({ auth: { getUser: m.getUser } }) }))
vi.mock('@/lib/prisma', () => ({ prisma: { scan: { findUnique: m.scan } } }))
vi.mock('@/lib/billing/entitlements', () => ({ assertWithinLimits: m.entitlement }))
vi.mock('@/lib/report', async () => ({
  ...(await import('@/lib/report/transform')), ...(await import('@/lib/report/resolve-white-label')),
  ...(await import('@/lib/report/labels')), ...(await import('@/lib/report/image-dimensions')),
  getStoredWhiteLabel: m.stored, fetchImageAsBuffer: m.image,
}))
const scan = () => ({ id: 'fixture-scan', score: 85, issues: 0, impactCritical: 0, impactSerious: 0,
  impactModerate: 0, impactMinor: 0, createdAt: new Date('2026-01-02T00:00:00Z'), raw: { violations: [] },
  site: { url: 'https://fixture.test/sub?q=1', userId: 'owner' }, page: null,
})
const data = (score = 85, locale = 'en') => transformScanToReport({ ...scan(), score }, undefined, undefined, undefined, undefined, resolveReportLabels(null, locale))
const request = (query = '', headers: Record<string, string> = {}) => new NextRequest(`https://fixture.test/api/reports/fixture-scan/docx${query}`, { headers })
const context = () => ({ params: Promise.resolve({ scanId: 'fixture-scan' }) })
const xmlEscape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
async function xmlFor(report: ReportData, logo?: Buffer) {
  const zip = await JSZip.loadAsync(await Packer.toBuffer(buildDocx(report, logo)))
  return { zip, xml: await zip.file('word/document.xml')!.async('string') }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('DOCX test cannot access network') }))
  m.getUser.mockResolvedValue({ data: { user: { id: 'owner' } }, error: null })
  m.scan.mockResolvedValue(scan())
  m.stored.mockResolvedValue(null)
  m.image.mockResolvedValue(null)
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

describe('DOCX renderer creates valid in-memory Word packages', () => {
  it.each([[95, 'A', '16A34A'], [85, 'B', '16A34A'], [75, 'C', 'D97706'], [55, 'D', 'DC2626'], [25, 'F', 'DC2626']])(
    'keeps canonical score %s / grade %s and severity color %s in cover and summary', async (score, grade, color) => {
      const { xml, zip } = await xmlFor(data(Number(score)))
      expect(xml.includes(`${score}/100`)).toBe(true)
      expect(xml.includes(`Grade ${grade}`)).toBe(true)
      expect(xml.includes(`w:color w:val="${color}"`)).toBe(true)
      expect(zip.file('word/styles.xml')).not.toBeNull()
      expect(zip.file('word/footer1.xml')).not.toBeNull()
      expect(xml.includes('TOC')).toBe(true)
    },
  )
  it.each(['en', 'nl', 'fr', 'de', 'es', 'pt'])('serializes actual localized labels and legal context for %s', async locale => {
    const report = data(95, locale)
    report.wcagAAStatus = 'pass'; report.wcagAAAStatus = 'partial'
    const { xml } = await xmlFor(report)
    for (const text of [report.labels.reportTitle, report.labels.auditFindings, report.labels.eaaReadiness, report.labels.noIssuesDetected]) {
      expect(xml.includes(xmlEscape(text)), text).toBe(true)
    }
    expect(xml.includes('WCAG 2.2 Level AA')).toBe(true)
  })
  it.each(['pass', 'partial', 'fail'] as const)('serializes both WCAG assessment status branches: %s', async status => {
    const report = data(60)
    report.wcagAAStatus = status; report.wcagAAAStatus = status
    const { xml } = await xmlFor(report)
    const label = status === 'pass' ? report.labels.statusCompliant : status === 'partial' ? report.labels.statusPartial : report.labels.statusNonCompliant
    expect(xml.includes(label)).toBe(true)
  })
  it('embeds a provided logo and custom identity without fetching any image', async () => {
    const report = data()
    report.companyName = 'Partner <Private>'
    report.reportBranding = { companyName: 'Footer partner' }
    report.whiteLabelConfig.footerText = 'Internal & confidential'
    report.whiteLabelConfig.primaryColor = '#123456'
    const logo = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==', 'base64')
    const { xml, zip } = await xmlFor(report, logo)
    expect(xml.includes('Partner &lt;Private&gt;')).toBe(true)
    expect(xml.includes('Internal &amp; confidential')).toBe(true)
    expect(xml.includes('123456')).toBe(true)
    expect(Object.keys(zip.files).some(name => name.startsWith('word/media/') && name.endsWith('.png'))).toBe(true)
    expect((await zip.file('word/footer1.xml')!.async('string')).includes('Footer partner')).toBe(true)
    expect(m.image).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })
  it('includes each finding severity, full bounded evidence, and priority table', async () => {
    const report = transformScanToReport({ ...scan(), issues: 4, impactCritical: 1, impactSerious: 1, impactModerate: 1, impactMinor: 1, raw: { violations:
      (['critical', 'serious', 'moderate', 'minor'] as const).map((impact, i) => ({ id: `fixture-rule-${i}`, impact, help: `Finding ${i}`, nodes: Array.from({ length: i === 0 ? 51 : 1 }, (_, index) => ({ target: [`#evidence-${i}-${index}`], html: `<button data-fixture="${index}">Fixture</button>` })) })),
    } })
    report.priorityIssues[1].affectedElementDetails = [{ selector: '#empty-html', html: '' }]
    report.priorityIssues[2].affectedElementDetails = []
    report.priorityIssues[3].affectedElementDetails = undefined as unknown as []
    const { xml } = await xmlFor(report)
    for (let i = 0; i < 4; i++) expect(xml.includes(`fixture-rule-${i}`)).toBe(true)
    expect(xml.includes('#evidence-0-50')).toBe(true)
    expect(xml.includes('Affected Elements (1/2)')).toBe(true)
    expect(xml.includes('Affected Elements (2/2)')).toBe(true)
    expect(xml.includes('&lt;button')).toBe(true)
    expect(xml.includes(report.labels.topPriorityFixes)).toBe(true)
    expect(xml.includes('\u200B')).toBe(true)
    expect(xml.includes('w:tblHeader')).toBe(true)
  })
  it.each(['Single page', 'Multi-page', 'Custom crawl depth'])('preserves and localizes scan depth %s', async depth => {
    const report = data(85, 'nl')
    report.scanConfig.crawlDepth = depth
    const { xml } = await xmlFor(report)
    expect(xml.includes(xmlEscape(depth === 'Single page' ? report.labels.singlePage : depth === 'Multi-page' ? report.labels.multiPage : depth))).toBe(true)
  })
  it('omits optional legacy sections, with a stored partner footer fallback', async () => {
    const report = data()
    report.scanConfig = undefined as unknown as ReportData['scanConfig']
    report.topPriorityFixes = undefined as unknown as []
    report.wcagMatrix = []
    report.whiteLabelConfig.primaryColor = ''
    report.whiteLabelConfig.companyNameOverride = 'Stored partner'
    const { xml, zip } = await xmlFor(report)
    expect(xml.includes(report.labels.scanConfiguration)).toBe(false)
    expect(xml.includes(report.labels.wcagComplianceMatrix)).toBe(false)
    expect((await zip.file('word/footer1.xml')!.async('string')).includes('Stored partner')).toBe(true)
  })
  it('prioritizes failing WCAG rows and caps passing/not-tested samples', async () => {
    const report = data()
    report.wcagMatrix = [
      ...Array.from({ length: 12 }, (_, i) => ({ criterion: `Pass-fixture-${i}`, level: 'AA' as const, status: 'Pass' as const, relatedFindings: 0 })),
      { criterion: 'Failed-fixture', level: 'A', status: 'Fail', relatedFindings: 3 },
      { criterion: 'Manual-fixture', level: 'AA', status: 'Needs Manual Review', relatedFindings: 0 },
      ...Array.from({ length: 7 }, (_, i) => ({ criterion: `Untested-fixture-${i}`, level: 'AAA' as const, status: 'Not Tested' as const, relatedFindings: 0 })),
    ]
    const { xml } = await xmlFor(report)
    expect(xml.indexOf('Failed-fixture')).toBeLessThan(xml.indexOf('Pass-fixture-0'))
    expect(xml.includes('Pass-fixture-9')).toBe(true)
    expect(xml.includes('Pass-fixture-10')).toBe(false)
    expect(xml.includes('Untested-fixture-4')).toBe(true)
    expect(xml.includes('Untested-fixture-5')).toBe(false)
  })
})

describe('DOCX export route authorization and response contract', () => {
  it.each([false, true])('blocks invalid authentication before accessing scan data (%s)', async withError => {
    m.getUser.mockResolvedValue({ data: { user: withError ? { id: 'owner' } : null }, error: withError ? new Error('Expired') : null })
    expect((await GET(request(), context())).status).toBe(401)
    expect(m.scan).not.toHaveBeenCalled()
  })
  it.each([null, { ...scan(), site: { url: 'https://private.test', userId: 'other' } }])('does not export missing or non-owned scans: %j', async record => {
    m.scan.mockResolvedValue(record)
    expect((await GET(request(), context())).status).toBe(record ? 403 : 404)
    expect(m.entitlement).not.toHaveBeenCalled()
    expect(m.image).not.toHaveBeenCalled()
  })
  it.each([Object.assign(new Error('Upgrade to export Word'), { code: 'UPGRADE_REQUIRED', feature: 'word' }), { code: 'UPGRADE_REQUIRED', feature: 'word' }])('returns actionable payment-required entitlement denial: %j', async error => {
    m.entitlement.mockRejectedValue(error)
    const response = await GET(request(), context())
    expect(response.status).toBe(402)
    expect(await response.json()).toEqual({ error: error instanceof Error ? error.message : 'Word export is not available for this plan.', code: 'UPGRADE_REQUIRED', feature: 'word' })
    expect(m.entitlement).toHaveBeenCalledWith({ userId: 'owner', action: 'export_word' })
    expect(m.stored).not.toHaveBeenCalled()
  })
  it.each([new Error('Database offline'), null])('returns a generic error for non-entitlement failures: %s', async error => {
    m.scan.mockRejectedValue(error)
    const response = await GET(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: error instanceof Error ? error.message : 'Unknown error' })
  })
  it.each([null, { url: 'https://fixture.test/page', title: null }, { url: 'https://fixture.test/page', title: 'Page' }])('produces a valid attachment with optional page context %j', async page => {
    m.scan.mockResolvedValue({ ...scan(), page })
    const response = await GET(request('?language=nl', { 'accept-language': 'fr' }), context())
    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(response.headers.get('content-disposition')).toMatch(/^inline; filename="accessibility-report-nl-fixture-test-sub-q-1-\d{4}-\d{2}-\d{2}\.docx"$/)
    const zip = await JSZip.loadAsync(await response.arrayBuffer())
    const xml = await zip.file('word/document.xml')!.async('string')
    expect(xml.includes(resolveReportLabels(null, 'nl').reportTitle)).toBe(true)
  })
  it('passes the selected safe logo through the mocked image boundary', async () => {
    m.stored.mockResolvedValue({ logoUrl: 'https://vexnexa.com/fixture.png' })
    const response = await GET(request(), context())
    expect(response.status).toBe(200)
    expect(m.image).toHaveBeenCalledWith('https://vexnexa.com/fixture.png')
    expect(fetch).not.toHaveBeenCalled()
  })
  it('does not send a partial Word response if packing fails', async () => {
    vi.spyOn(Packer, 'toBuffer').mockRejectedValue(new Error('ZIP pack failure'))
    const response = await GET(request(), context())
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error: 'ZIP pack failure' })
  })
})
