// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { calculateVniScore, collectVniColorMetrics, collectVniDesignMetrics } from './vni-engine'
import type { ImageAnalysisResult } from '../ai-image-analysis'

function input(): Parameters<typeof calculateVniScore>[0] {
  return {
    axeScore: 100, violations: [], aiContentChecks: [image(100)],
    totalPageWeightBytes: 1024, largestContentfulPaintMs: 1000,
    colorMetrics: { contrast: { sampled: 10, failingNormal: 0, failingProtanopia: 0, failingDeuteranopia: 0, failingTritanopia: 0, averageContrast: 21 }, colorOnlySignals: { total: 10, risky: 0 } },
    designMetrics: { tapTargets: { total: 10, failing: 0, minWidth: 44, minHeight: 44 }, fontReadability: { sampled: 10, failing: 0, averageFontSize: 16, averageLineHeightRatio: 1.5 }, layoutStability: { cls: 0 } },
  }
}
function image(score: number, overrides: Partial<ImageAnalysisResult> = {}): ImageAnalysisResult {
  return { src: 'fixture.png', currentAlt: 'Fixture', isAccurate: true, score, suggestedAlt: 'Fixture', ...overrides }
}

describe('VNI score evidence and penalties', () => {
  it.each([[100, 100, false, false, 2500, 'Apex'], [0, 100, false, false, 2000, 'Authority'], [0, 0, false, false, 1500, 'Elite'], [0, 0, true, false, 1000, 'Standard'], [0, 0, true, true, 500, 'Insolvent']])('assigns the expected tier from five bounded pillars', (axe, ai, poorDesign, poorContrast, score, tier) => {
    const value = input()
    value.axeScore = axe
    value.aiContentChecks = [image(ai)]
    if (poorDesign) value.designMetrics.tapTargets.failing = 10
    if (poorContrast) value.colorMetrics.contrast.failingNormal = 10
    const result = calculateVniScore(value)
    expect(result.score).toBe(score)
    expect(result.tier).toBe(tier)
    expect(Object.values(result.pillars).every(pillar => pillar >= 0 && pillar <= 500)).toBe(true)
  })
  it('counts missing node arrays as one and weights critical/serious findings', () => {
    const value = input()
    value.violations = [{ impact: 'critical' }, { impact: 'critical', nodes: [] }, { impact: 'serious', nodes: [{}, {}] }, { impact: 'serious' }, { impact: 'minor' }, {}]
    const result = calculateVniScore(value)
    expect(result.internal.penalties.wcagCriticalPenalty).toBe(Number((0.72 ** 2 * 0.9 ** 3).toFixed(3)))
    expect(result.internal.penalties.globalCriticalPenalty).toBe(Number((0.88 ** 2).toFixed(3)))
    expect(result.score).toBeLessThan(calculateVniScore(input()).score)
  })
  it('excludes failed AI evaluations and penalizes inaccurate descriptions', () => {
    const value = input()
    value.aiContentChecks = [image(100), image(0, { error: 'provider unavailable' }), image(50, { isAccurate: false })]
    expect(calculateVniScore(value).pillars.aiContentIntegrity).toBe(293)
    value.aiContentChecks = []
    expect(calculateVniScore(value).pillars.aiContentIntegrity).toBe(450)
  })
  it.each([[1200, 1], [2500, 0.5], [5000, 0.148], [30000, 0.08]])('applies the LCP curve at %sms', (lcp, expected) => {
    const value = input(); value.largestContentfulPaintMs = lcp
    expect(calculateVniScore(value).internal.penalties.lcpPenalty).toBe(expected)
  })
  it.each([[1, 1], [2.5, 0.625], [5, 0.166], [30, 0.08]])('applies the payload curve at %sMB', (mb, expected) => {
    const value = input(); value.totalPageWeightBytes = mb * 1024 * 1024
    expect(calculateVniScore(value).internal.penalties.payloadPenalty).toBe(expected)
  })
  it.each([[5001, 1, 0.86], [5000, 6, 0.86], [5000, 5, 1]])('applies the global penalty only beyond the speed/weight boundaries', (lcp, mb, expected) => {
    const value = input(); value.largestContentfulPaintMs = lcp; value.totalPageWeightBytes = mb * 1024 * 1024
    expect(calculateVniScore(value).internal.penalties.globalSpeedPenalty).toBe(expected)
  })
  it.each([[0.1, 500], [0.25, 360], [10, 90]])('penalizes layout shift at CLS %s', (cls, score) => {
    const value = input(); value.designMetrics.layoutStability.cls = cls
    expect(calculateVniScore(value).pillars.designQualityUx).toBe(score)
  })
  it('uses worst color-vision failure rate and handles unsampled metrics safely', () => {
    const value = input()
    value.colorMetrics.contrast.failingTritanopia = 10
    expect(calculateVniScore(value).pillars.colorBlindnessContrast).toBe(0)
    value.colorMetrics.contrast = { ...value.colorMetrics.contrast, sampled: 0, failingTritanopia: 0 }
    value.colorMetrics.colorOnlySignals = { total: 0, risky: 2 }
    value.designMetrics.tapTargets = { total: 0, failing: 0, minWidth: 0, minHeight: 0 }
    value.designMetrics.fontReadability.sampled = 0
    expect(calculateVniScore(value).pillars.colorBlindnessContrast).toBe(0)
    expect(Number.isFinite(calculateVniScore(value).score)).toBe(true)
  })
})

describe('VNI collection on an in-memory DOM (no browser or network)', () => {
  const page = { evaluate: vi.fn((fn: () => unknown) => Promise.resolve(fn())) }
  beforeEach(() => {
    document.body.innerHTML = ''
    page.evaluate.mockImplementation((fn) => Promise.resolve(fn()))
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      return { width: Number(this.dataset.width ?? 80), height: Number(this.dataset.height ?? 48), x: 0, y: 0, top: 0, left: 0, bottom: 48, right: 80, toJSON: () => ({}) }
    })
    vi.stubGlobal('performance', { getEntriesByType: vi.fn(() => []) })
  })
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })
  it('distinguishes adequate black/white contrast, failing gray text, and invalid samples', async () => {
    page.evaluate.mockResolvedValueOnce({ textElements: [{ color: 'rgb(0, 0, 0)', backgroundColor: 'rgb(255, 255, 255)' }, { color: 'rgba(230, 230, 230, 1)', backgroundColor: 'rgb(255, 255, 255)' }, { color: 'invalid', backgroundColor: 'rgb(0, 0, 0)' }, { color: 'rgb(0, 0, 0)', backgroundColor: 'invalid' }], colorOnlySignals: 1, colorOnlyTotal: 3 })
    const result = await collectVniColorMetrics(page)
    expect(result.contrast).toMatchObject({ sampled: 2, failingNormal: 1, failingProtanopia: 1, failingDeuteranopia: 1, failingTritanopia: 1 })
    expect(result.contrast.averageContrast).toBeGreaterThan(11)
    expect(result.colorOnlySignals).toEqual({ risky: 1, total: 3 })
  })
  it('samples visible text, inherits backgrounds and detects color-only alerts', async () => {
    document.body.innerHTML = '<div style="background-color:rgb(255,255,255)"><p style="color:rgb(0,0,0)">Readable content for a customer.</p></div><p style="visibility:hidden">Hidden content</p><p style="display:none">Invisible</p><p data-width="0">Zero width</p><p data-height="0">Zero height</p><p></p><span role="alert" style="color:rgb(200,0,0)">Error</span><span class="success" style="color:rgb(0,180,0)">Saved</span><span class="error">! Error</span><span class="error"><svg></svg> Error</span><span class="normal">Normal</span>'
    const result = await collectVniColorMetrics(page)
    expect(result.contrast.sampled).toBeGreaterThan(1)
    expect(result.colorOnlySignals).toEqual({ risky: 2, total: 5 })
  })
  it('caps text sampling at 250 elements', async () => {
    document.body.innerHTML = Array.from({ length: 260 }, () => '<p style="color:rgb(0,0,0)">Text content here</p>').join('')
    expect((await collectVniColorMetrics(page)).contrast.sampled).toBe(250)
  })
  it('collects undersized targets, font readability and non-input CLS', async () => {
    document.body.innerHTML = '<button data-width="30" style="font-size:14px;line-height:normal">A small button with a long label</button><a data-height="20" style="font-size:18px;line-height:27px">A sufficiently readable link label</a><button style="display:none">Invisible</button><p data-width="0">Invisible paragraph with long copy</p><p>Short</p><p style="font-size:0px">Zero font size with meaningful text</p>'
    vi.mocked(performance.getEntriesByType).mockReturnValue([{ value: 0.1234, hadRecentInput: false }, { value: 0.8, hadRecentInput: true }, { hadRecentInput: false }] as unknown as PerformanceEntry[])
    const result = await collectVniDesignMetrics(page)
    expect(result.tapTargets).toEqual({ total: 2, failing: 2, minWidth: 30, minHeight: 20 })
    expect(result.fontReadability.sampled).toBe(3)
    expect(result.fontReadability.failing).toBe(2)
    expect(result.layoutStability.cls).toBe(0.123)
  })
  it('caps readability sampling and handles an empty document', async () => {
    const empty = await collectVniDesignMetrics(page)
    expect(empty.tapTargets.total).toBe(0)
    expect(empty.fontReadability.averageFontSize).toBe(0)
    document.body.innerHTML = Array.from({ length: 205 }, () => '<p style="font-size:16px;line-height:24px">A sufficiently lengthy report description.</p>').join('')
    expect((await collectVniDesignMetrics(page)).fontReadability.sampled).toBe(200)
  })
  it('returns explicit empty measurements after a detached execution context', async () => {
    page.evaluate.mockRejectedValue(new Error('context destroyed'))
    expect((await collectVniColorMetrics(page)).contrast).toMatchObject({ sampled: 0, averageContrast: 0 })
    expect(await collectVniDesignMetrics(page)).toEqual({ tapTargets: { total: 0, failing: 0, minWidth: 0, minHeight: 0 }, fontReadability: { sampled: 0, failing: 0, averageFontSize: 0, averageLineHeightRatio: 0 }, layoutStability: { cls: 0 } })
  })
})
