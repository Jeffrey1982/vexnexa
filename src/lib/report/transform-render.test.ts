import { describe, expect, it } from 'vitest'
import { transformScanToReport } from './transform'
import { renderReportHTML } from './render-html'
import { resolveReportLabels } from './labels'
import type { ReportData, ReportStyle } from './types'

type Scan = Parameters<typeof transformScanToReport>[0]
const scan = (overrides: Partial<Scan> = {}): Scan => ({
  id: 'report-fixture', score: 100, issues: 0, impactCritical: 0,
  impactSerious: 0, impactModerate: 0, impactMinor: 0,
  createdAt: '2026-01-15T12:00:00.000Z', site: { url: 'https://fixture.test' }, ...overrides,
})
const report = (overrides: Partial<Scan> = {}, locale = 'en', style: ReportStyle = 'premium') =>
  transformScanToReport(scan(overrides), undefined, undefined, undefined, style, resolveReportLabels(null, locale))
const violation = (id = 'custom-check', count = 1) => ({
  id, impact: 'serious', help: 'Fixture finding', description: 'Fixture explanation', tags: ['wcag143'],
  nodes: Array.from({ length: count }, (_, i) => ({ target: [`#element-${i}`], html: `<button>${i}</button>` })),
})
const escaped = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

describe('report transform: canonical scores and localized decision boundaries', () => {
  it.each([
    [-20, 0, 'F'], [49, 49, 'F'], [50, 50, 'D'], [70, 70, 'C'],
    [80, 80, 'B'], [90, 90, 'A'], [120, 100, 'A'], [79.6, 80, 'B'],
  ])('clamps and rounds canonical score %s to %s / %s', (input, value, grade) => {
    const data = report({ score: Number(input) })
    expect(data.healthScore).toMatchObject({ value, grade })
    expect(data.score).toBe(value)
    expect(renderReportHTML(data)).toContain(`grade ${grade}`)
  })

  it.each([[0, 100, 'A'], [3, 86, 'B'], [6, 74, 'C'], [10, 61, 'D'], [30, 22, 'F']])(
    'uses measured severity penalty when canonical score is absent (%s minor)', (minor, value, grade) => {
      const data = report({ score: null, impactMinor: Number(minor) })
      expect(data.healthScore).toMatchObject({ value, grade, normalizedPenalty: minor })
    },
  )

  for (const locale of ['en', 'nl', 'fr', 'de', 'es', 'pt']) {
    it.each([[95, 'Low'], [80, 'Moderate'], [60, 'High'], [20, 'Critical']])(
      `${locale}: translates %s-point risk and renders the matching report`, (score, risk) => {
        const data = report({ score: Number(score) }, locale)
        expect(data.riskLevel).toBe(risk)
        expect(data.riskSummary).toBe(data.legalRisk)
        expect(data.riskSummary.length).toBeGreaterThan(30)
        if (locale !== 'en') expect(data.riskSummary).not.toBe(report({ score: Number(score) }).riskSummary)
        const html = renderReportHTML(data)
        expect(html).toContain(`lang="${locale}"`)
        expect(html).toContain(escaped(data.riskSummary))
      },
    )
    it(`${locale}: localizes singular/plural remediation hours and total days`, () => {
      const one = report({ impactCritical: 1, raw: { violations: [violation('custom-check', 20)] } }, locale)
      const many = report({ impactCritical: 10, raw: { violations: [violation('custom-check', 100)] } }, locale)
      const suffix = { en: 'hour', nl: 'uur', fr: 'heure', de: 'Stunde', es: 'hora', pt: 'hora' }[locale]!
      expect(one.priorityIssues[0].estimatedFixTime).toContain(`~1 ${suffix}`)
      expect(many.priorityIssues[0].estimatedFixTime).toMatch(/^~4 /)
      expect(one.estimatedFixTime).toMatch(/^2 /)
      expect(many.estimatedFixTime).toMatch(/^~3 /)
    })
  }

  it.each([[0, 95, 'Low'], [1, 95, 'Moderate'], [2, 95, 'High'], [1, 69, 'High']])(
    'critical count %s prevents a misleading risk rating at score %s', (critical, score, risk) => {
      const data = report({ score: Number(score), impactCritical: Number(critical) })
      expect(data.riskLevel).toBe(risk)
      expect(data.eaaReady).toBe(critical === 0 && Number(score) >= 80)
    },
  )
  it.each([[100, 'pass'], [95, 'pass'], [94, 'partial'], [70, 'partial'], [69, 'fail'], [0, 'fail']])(
    'uses persisted WCAG coverage %s instead of assuming complete conformance', (coverage, status) => {
      const data = report({ wcagAACompliance: Number(coverage), wcagAAACompliance: Number(coverage) })
      expect(data.wcagAAStatus).toBe(status)
      expect(data.wcagAAAStatus).toBe(status)
      expect(data.compliancePercentage).toBe(coverage)
      expect(renderReportHTML(data)).toContain(`${coverage}%`)
    },
  )
})

describe('report normalization: evidence, multi-page scans and optional fields', () => {
  it.each([null, 'unstructured legacy value', 123, false])('handles raw payload %s and nullable counts', raw => {
    const data = report({ raw, issues: null, impactCritical: null, impactSerious: null, impactModerate: null, impactMinor: null })
    expect(data.issueBreakdown).toEqual({ total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 })
    expect(data.priorityIssues).toEqual([])
    expect(data.pagesScanned).toBe(1)
  })
  it.each(['vni', 'deepScan', 'internal', 'resultJson'])('normalizes %s deep-scan envelopes', location => {
    const deepScan = { scannedPages: 7, worstPage: { url: 'https://fixture.test/worst' }, pages: [
      { pageUrl: 'https://fixture.test/page', result: { title: 'Nested page', score: 72, largestContentfulPaintMs: 1800, totalPageWeightBytes: 256, domNodeCount: 20, violations: [violation()] } },
      { url: 'https://fixture.test/direct', title: 'Direct', score: 80, issues: 0, lcp: 1000, pageWeightBytes: 128, domNodeCount: 10, aiAnalyzed: true, violations: [] },
      null, { result: { url: 'https://fixture.test/result-only' } },
    ] }
    const raw = location === 'vni' ? { vni: { score: 2100, internal: { deepScan } } }
      : location === 'deepScan' ? { deepScan } : location === 'internal' ? { internal: { deepScan } }
        : { resultJson: { vni: { internal: { deepScan } } } }
    const data = report({ raw })
    expect(data.pagesScanned).toBe(7)
    expect(data.scannedPages).toHaveLength(3)
    expect(data.scannedPages[0]).toMatchObject({ title: 'Nested page', score: 72, issues: 1, lcp: 1800, pageWeightBytes: 256, domNodeCount: 20, aiAnalyzed: false })
    expect(data.scannedPages[1]).toMatchObject({ title: 'Direct', score: 80, issues: 0, aiAnalyzed: true })
    expect(data.priorityIssues[0].affectedElementDetails[0].pageUrl).toBe('https://fixture.test/page')
  })
  it.each(['pages', 'scannedPages'])('accepts legacy %s lists and rejects entries without URLs', key => {
    const data = report({ raw: { [key]: [{ url: 'https://fixture.test/one', issues: 1 }, {}, { pageUrl: 'https://fixture.test/two', issues: 2 }] } })
    expect(data.pagesScanned).toBe(2)
    expect(data.scannedPages).toHaveLength(2)
    const html = renderReportHTML(data)
    expect(html).toContain('1 issue</span>')
    expect(html).toContain('2 issues</span>')
  })
  it('uses discovered internal links only when actual page records are unavailable', () => {
    expect(report({ raw: { discoveredInternalLinks: ['https://fixture.test/a', 'https://fixture.test/b'] } }).pagesScanned).toBe(3)
  })
  it('normalizes page-specific fallback evidence and safely bounds details and snippets', () => {
    const data = report({ raw: { violations: [
      { id: 'legacy-evidence', evidence: { htmlSnippet: 'a'.repeat(1100), failureSummary: 'Failure', screenshotDataUrl: 'data:image/png;base64,AA==' } },
      { ...violation('bounded', 5002), pageUrl: 'https://fixture.test/specific' },
      { id: 'missing', nodes: [{}] },
    ] } })
    const legacy = data.priorityIssues.find(item => item.id === 'legacy-evidence')!
    expect(legacy).toMatchObject({ severity: 'minor', affectedElements: 1 })
    expect(legacy.affectedElementDetails[0]).toMatchObject({ selector: 'unknown', pageUrl: 'https://fixture.test', html: 'a'.repeat(1000), failureSummary: 'Failure' })
    const bounded = data.priorityIssues.find(item => item.id === 'bounded')!
    expect(bounded.affectedElements).toBe(5002)
    expect(bounded.affectedElementDetails).toHaveLength(5000)
    expect(bounded.affectedElementDetails[0].pageUrl).toBe('https://fixture.test/specific')
    expect(data.priorityIssues.find(item => item.id === 'missing')!.affectedElementDetails[0]).toMatchObject({ selector: 'unknown', html: '' })
  })
  it('prefers node evidence and page context, while preserving rule evidence as fallback', () => {
    const data = report({ page: { url: 'https://fixture.test/about', title: 'About' }, createdAt: new Date('2026-01-01T00:00:00Z'), raw: { violations: [
      { id: 'custom', help: 'Specific title', nodes: [{ target: ['main', 'button'], html: '<button>', failureSummary: 'Node evidence' }], evidence: { failureSummary: 'Rule evidence', screenshotDataUrl: 'data:image/png;base64,AA==' } },
      { id: 'no-nodes', evidence: { selector: '#legacy' } },
    ] } })
    expect(data.priorityIssues[0].affectedElementDetails[0]).toMatchObject({ selector: 'main > button', failureSummary: 'Node evidence', screenshotDataUrl: 'data:image/png;base64,AA==', pageUrl: 'https://fixture.test/about' })
    expect(data.priorityIssues[1].affectedElementDetails[0]).toMatchObject({ selector: '#legacy', html: '' })
    expect(data.scanTimestamp).toBe('2026-01-01T00:00:00.000Z')
  })
  it('retains an invalid legacy domain as printable evidence instead of throwing', () => {
    expect(report({ site: { url: 'legacy-domain' } }).domain).toBe('legacy-domain')
  })
  it.each([[700, 1], [701, 2], [1301, 3], [1901, 4], [2301, 5]])('maps VNI %s to %s stars', (score, stars) => {
    const data = report({ raw: { vni: { score, tier: 'Elite' } } })
    expect(data.vni).toMatchObject({ score, stars })
    for (const style of ['premium', 'corporate'] as const) expect(renderReportHTML({ ...data, reportStyle: style })).toContain('★★★★★'.slice(0, stars))
  })
  it.each([
    [{ totalPageWeightBytes: 3_000_000 }, 0, true],
    [{ domNodeCount: 50, performanceMetrics: { largestContentfulPaint: 2600 } }, 2600, true],
    [{ domNodeCount: 50, lcp: 2400 }, 2400, false],
    [{ largestContentfulPaintMs: 800 }, 800, false],
    [{ domNodeCount: 0 }, 0, false],
  ])('keeps measured quality inputs with explicit paradox conditions: %j', (metrics, lcp, paradox) => {
    const data = report({ raw: { ...metrics, vni: { score: 2100, tier: 'Authority' } } })
    expect(data.qualityMetrics).toMatchObject({ largestContentfulPaintMs: lcp, performanceParadox: paradox })
    expect(renderReportHTML(data)).toContain('quality-grid')
  })
  it('normalizes AI aliases, respects explicit false, and caps customer-visible samples', () => {
    const items = [
      { imageUrl: 'https://fixture.test/image', altText: 'Alt', aiDescription: 'Description', matchesAltText: false, isAccurate: true, confidence: 0.4, recommendation: 'Fix' },
      { src: 'https://fixture.test/alias', alt: 'Alias alt', description: 'Alias description', isAccurate: true, confidence: 'invalid', suggestion: 'Suggestion' },
      { analysis: 'Analysis' }, { summary: 'Summary' }, {},
      ...Array.from({ length: 12 }, () => ({ summary: 'Capped sample' })),
    ]
    const data = report({ raw: { aiContentChecks: items } })
    expect(data.aiVisionAudit).toHaveLength(12)
    expect(data.aiVisionAudit[0]).toMatchObject({ matchesAltText: false, confidence: 0.4 })
    expect(data.aiVisionAudit[1]).toMatchObject({ imageUrl: 'https://fixture.test/alias', altText: 'Alias alt', aiDescription: 'Alias description', matchesAltText: true, confidence: undefined, recommendation: 'Suggestion' })
    expect(data.aiVisionAudit[2].aiDescription).toBe('Analysis')
    expect(data.aiVisionAudit[3].aiDescription).toBe('Summary')
    expect(data.aiVisionAudit[4]).toMatchObject({ aiDescription: '', altText: '' })
  })
})

describe('HTML report content contracts', () => {
  for (const style of ['premium', 'corporate'] as const) {
    it.each(['en', 'nl', 'fr'])(`${style} %s: renders paginated findings and selected white-label identity`, locale => {
      const data = report({ issues: 5, impactCritical: 1, raw: { violations: Array.from({ length: 5 }, (_, i) => ({ ...violation(`rule-${i}`, i + 1), impact: (['critical', 'serious', 'moderate', 'minor'] as const)[i % 4] })) } }, locale, style)
      data.reportBranding = { companyName: 'Partner & Co', primaryColor: '#123456', logoUrl: 'data:image/png;base64,AA==' }
      data.whiteLabelConfig.footerText = 'Confidential <fixture>'
      data.ctaConfig = { ctaUrl: 'https://fixture.test/contact?a=1&b=2', ctaText: '', supportEmail: 'reports@fixture.test' }
      data.faviconUrl = 'https://fixture.test/icon.png'
      const html = renderReportHTML(data)
      expect(html).toContain(`data-style="${style}"`)
      expect(html).toContain('Partner &amp; Co')
      expect(html).toContain('Confidential &lt;fixture&gt;')
      expect(html).toContain('src="data:image/png;base64,AA=="')
      expect(html).toContain('--primary:#123456')
      expect(html).toContain('rel="icon"')
      expect(html).toContain('mailto:reports@fixture.test')
      expect(html).toContain('a=1&amp;b=2')
      expect(html).toContain(locale === 'nl' ? '(vervolg)' : locale === 'fr' ? '(suite)' : '(continued)')
      expect(html).toContain(locale === 'nl' ? 'Aan de slag' : locale === 'fr' ? 'Commencer' : 'Get Started')
      for (let i = 0; i < 5; i++) expect(html).toContain(`id="finding-rule-${i}"`)
    })
    it(`${style}: omits unavailable links and uses partner initials without a logo`, () => {
      const data = report({}, 'en', style)
      data.companyName = 'Acme'
      data.whiteLabelConfig.companyNameOverride = 'Acme'
      data.whiteLabelConfig.primaryColor = ''
      data.ctaConfig = { ctaUrl: '', ctaText: '', supportEmail: '' }
      const html = renderReportHTML(data)
      expect(html).toMatch(/brand-monogram[^>]*>A<\/div>/)
      expect(html).not.toContain('class="cta-button"')
      expect(html).not.toContain('class="cta-contact"')
      expect(html).toContain('No automated issues detected in this category.')
    })
  }
  it('escapes evidence and paginates long evidence without dropping the final element', () => {
    const data = report({ raw: { violations: [violation('long-evidence', 201)] } })
    data.priorityIssues[0].affectedElementDetails[0] = { selector: '<script>alert("x")</script>', html: '<img onerror="alert(1)">', failureSummary: 'Unescaped <unsafe>', screenshotDataUrl: 'data:image/png;base64,AA==' }
    const html = renderReportHTML(data)
    expect(html).toContain('id="toc"')
    expect(html).toContain('#element-200')
    expect(html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;')
    expect(html).not.toContain('<img onerror=')
    expect(html).toContain('data:image/png;base64,AA==')
  })
  it('renders all AI outcome formats without displaying missing values as undefined', () => {
    const data = report()
    data.aiVisionAudit = [
      { imageUrl: 'https://fixture.test/' + 'a'.repeat(90), aiDescription: 'Vision <description>', altText: 'Original alt', confidence: 0.72, matchesAltText: false },
      { imageUrl: 'https://fixture.test/i', recommendation: 'Suggested fix', confidence: 83 },
      { matchesAltText: false }, {},
    ]
    const html = renderReportHTML(data)
    expect(html).toContain('Vision &lt;description&gt;')
    expect(html).toContain('Suggested fix')
    for (const score of ['72%', '83%', '0%', '100%']) expect(html).toContain(score)
    expect(html).toContain('No alt text')
    expect(html).toContain('AI analysis completed.')
    expect(html).not.toContain('a'.repeat(90))
  })
  it.each([[0, 0, 0, '0 MB', '1.5s'], [512_000, 1000, 500, '500 KB', '1.0s'], [1_500_000, 1600, 1000, '1.4 MB', '1.6s'], [3_000_000, 3000, 1800, '2.9 MB', '3.0s']])(
    'renders measured quality severity with weight=%s LCP=%s nodes=%s', (bytes, lcp, nodes, weight, seconds) => {
      const data = report({ raw: { totalPageWeightBytes: Number(bytes), largestContentfulPaintMs: Number(lcp), domNodeCount: Number(nodes), vni: { score: 2400, tier: 'Apex', internal: { deepScan: { worstPage: { url: 'https://fixture.test/slow' } } } } } })
      const html = renderReportHTML(data)
      expect(html).toContain(String(weight))
      expect(html).toContain(String(seconds))
      expect(html).toContain('Lowest VNI page')
      expect(html).toContain('https://fixture.test/slow')
    },
  )
  it('handles optional legacy report sections and avoids implying untested criteria passed', () => {
    const data = report()
    data.wcagMatrix = []
    data.scanConfig = undefined as unknown as ReportData['scanConfig']
    data.pagesScanned = undefined as unknown as number
    data.themeConfig.darkColor = ''
    const html = renderReportHTML(data)
    expect(html).toContain('No automated issues detected in this category.')
    expect(html).not.toContain('class="scan-config-table"')
    expect(html).toContain('1 page')
  })
})
