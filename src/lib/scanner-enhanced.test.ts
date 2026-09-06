// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const boundary = vi.hoisted(() => ({ launch: vi.fn(), executablePath: vi.fn(), headless: vi.fn(), extractImages: vi.fn(), analyzeImages: vi.fn() }))
vi.mock('puppeteer', () => ({ default: { launch: boundary.launch } }))
vi.mock('@sparticuz/chromium', () => ({ default: { args: ['--fixture'], executablePath: boundary.executablePath } }))
vi.mock('./scanner-headless', () => ({ runRobustAccessibilityScan: boundary.headless }))
vi.mock('./ai-image-analysis', () => ({ extractImageDataFromPage: boundary.extractImages, analyzeMultipleImages: boundary.analyzeImages }))
vi.mock('./axe-source', () => ({ axeSource: 'window.axe = {run: () => Promise.resolve(window.__fixtureAxeResults)};' }))

let scannerModule: typeof import('./scanner-enhanced')
let browser: { newPage: ReturnType<typeof vi.fn>; close: ReturnType<typeof vi.fn> }
let page: Record<string, any>
let cdp: Record<string, any>
let fixture: { violations: any[]; passes?: any[]; testEngine?: { name: string; version: string } }

beforeEach(async () => {
  vi.resetModules()
  vi.resetAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.useFakeTimers()
  vi.stubEnv('NODE_ENV', 'test')
  vi.stubEnv('ALLOW_MOCK_A11Y', 'false')
  vi.stubEnv('ENABLE_AI_IMAGE_ANALYSIS', '')
  vi.stubEnv('GOOGLE_GEMINI_API_KEY', '')
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network in scanner unit test') }))
  vi.stubGlobal('CSS', { escape: (value: string) => value.replace(/[^a-z0-9_-]/gi, '') })
  vi.stubGlobal('performance', {
    timing: { loadEventEnd: 2000, navigationStart: 1000 },
    getEntriesByType: vi.fn((type: string) => type === 'largest-contentful-paint' ? [{ startTime: 1200 }] : type === 'resource' ? [{ transferSize: 1024 }] : type === 'navigation' ? [{ transferSize: 1024, duration: 1500 }] : []),
  })
  document.documentElement.lang = 'en'
  document.documentElement.dir = 'ltr'
  document.head.innerHTML = '<meta name="viewport" content="width=device-width">'
  document.body.innerHTML = '<header></header><a href="#main">Skip to content</a><main id="main"><h1>Report fixture</h1><h2>Details</h2><p style="font-size:16px;line-height:24px;color:rgb(0,0,0)">A clear explanation with enough readable content.</p></main>'
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    return { width: Number(this.dataset.width ?? 100), height: Number(this.dataset.height ?? 48), top: 0, left: 0, right: 100, bottom: 48, x: 0, y: 0, toJSON: () => ({}) }
  })
  fixture = { violations: [], passes: [{ id: 'document-title' }], testEngine: { name: 'axe-core', version: 'fixture-version' } }
  ;(window as any).__fixtureAxeResults = fixture
  cdp = { send: vi.fn().mockResolvedValue(undefined), on: vi.fn() }
  page = {
    setUserAgent: vi.fn().mockResolvedValue(undefined), setViewport: vi.fn().mockResolvedValue(undefined),
    target: vi.fn(() => ({ createCDPSession: vi.fn().mockResolvedValue(cdp) })),
    evaluateOnNewDocument: vi.fn(async (fn) => fn()),
    evaluate: vi.fn(async (fn, ...args) => fn(...args)),
    goto: vi.fn().mockResolvedValue(undefined), title: vi.fn().mockResolvedValue('Fixture page'),
    keyboard: { press: vi.fn(async () => document.querySelector<HTMLAnchorElement>('a')?.focus()) },
    $: vi.fn().mockResolvedValue(null),
  }
  browser = { newPage: vi.fn().mockResolvedValue(page), close: vi.fn().mockResolvedValue(undefined) }
  boundary.launch.mockResolvedValue(browser)
  boundary.executablePath.mockResolvedValue('/fixture/chromium')
  boundary.headless.mockResolvedValue({ score: 60, issues: 0, violations: [], impactCritical: 0, impactSerious: 0, impactModerate: 0, impactMinor: 0 })
  boundary.extractImages.mockResolvedValue([])
  boundary.analyzeImages.mockResolvedValue([])
  scannerModule = await import('./scanner-enhanced')
})
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

async function settle<T>(promise: Promise<T>, elapsed = 2_000): Promise<T> {
  let complete = false
  const settled = promise.then(value => { complete = true; return { value } }, error => { complete = true; return { error } })
  // Module loading is real async work; wait until initialization has either
  // settled or installed the scan timer before advancing the virtual clock.
  await vi.waitFor(() => {
    if (!complete && vi.getTimerCount() < 2) throw new Error('waiting for mocked browser initialization')
  }, { timeout: 5_000, interval: 50 })
  if (!complete) await vi.advanceTimersByTimeAsync(elapsed)
  const result = await settled
  if ('error' in result) throw result.error
  return result.value
}

describe('enhanced scanner with a fake browser and in-memory DOM', () => {
  it('returns measured engine metadata, clears resources and does not invoke AI by default', async () => {
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }))
    expect(result).toMatchObject({ score: 100, issues: 0, engineName: 'axe-core', axeVersion: 'fixture-version', title: 'Fixture page', __demo: false, mock: false, totalPageWeightBytes: 2048, largestContentfulPaintMs: 1200 })
    expect(result.qualityWarnings).toEqual([])
    expect(result.keyboardNavigation.skipLinks).toBe(true)
    expect(result.screenReaderCompatibility.headingStructure).toBe(true)
    expect(boundary.analyzeImages).not.toHaveBeenCalled()
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it('reuses an initialized browser and tolerates cleanup failure', async () => {
    const scanner = new scannerModule.EnhancedAccessibilityScanner()
    expect(scanner.getCurrentPage()).toBeNull()
    await scanner.initialize(); await scanner.initialize()
    expect(boundary.launch).toHaveBeenCalledOnce()
    expect(scanner.getCurrentPage()).toBe(page)
    browser.close.mockRejectedValueOnce(new Error('already disconnected'))
    await scanner.close(); await scanner.close()
    expect(scanner.getCurrentPage()).toBeNull()
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it('records all severity classes and attaches bounded selector evidence', async () => {
    fixture.violations = ['critical', 'serious', 'moderate', 'minor'].map((impact, index) => ({ id: `rule-${index}`, impact, help: 'Fixture issue', description: 'Stored evidence', nodes: [{ target: [`#node-${index}`], html: '<button>Fixture</button>', failureSummary: 'Missing label' }, { target: ['#other'], screenshotDataUrl: 'preserved' }] }))
    const handle = { screenshot: vi.fn().mockResolvedValue('Zml4dHVyZQ=='), dispose: vi.fn().mockResolvedValue(undefined) }
    page.$.mockResolvedValue(handle)
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(result).toMatchObject({ issues: 4, impactCritical: 1, impactSerious: 1, impactModerate: 1, impactMinor: 1 })
    expect(result.violations[0]).toMatchObject({ evidence: { selector: '#node-0', htmlSnippet: '<button>Fixture</button>', failureSummary: 'Missing label', screenshotDataUrl: 'data:image/jpeg;base64,Zml4dHVyZQ==' } })
    expect((result.violations[0].nodes[1] as any).screenshotDataUrl).toBe('preserved')
    expect(handle.dispose).toHaveBeenCalledTimes(4)
  })
  it('caps report evidence at twelve screenshots', async () => {
    fixture.violations = Array.from({ length: 14 }, (_, index) => ({ id: `rule-${index}`, nodes: [{ target: [`#node-${index}`] }] }))
    const screenshot = vi.fn().mockResolvedValue('Zg==')
    page.$.mockResolvedValue({ screenshot })
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(screenshot).toHaveBeenCalledTimes(12)
    expect((result.violations[12] as any).evidence.screenshotDataUrl).toBeUndefined()
  })
  it('skips oversized, absent and failed element screenshots while retaining findings', async () => {
    fixture.violations = [{ id: 'no-nodes' }, { id: 'not-array', nodes: {} }, { id: 'oversized', nodes: [{ target: ['#big'] }] }, { id: 'detached', nodes: [{ target: ['#missing'] }] }, { id: 'empty-target', nodes: [{ target: [''] }] }]
    page.$.mockResolvedValueOnce({ screenshot: vi.fn().mockResolvedValue('x'.repeat(350_000)), dispose: vi.fn() }).mockRejectedValueOnce(new Error('detached'))
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(result.issues).toBe(5)
    expect(result.violations.every(item => !(item as any).evidence.screenshotDataUrl)).toBe(true)
  })
  it('reports meaningful keyboard, heading, mobile, form and language defects', async () => {
    document.documentElement.lang = ''; document.documentElement.dir = 'invalid'
    document.head.innerHTML = ''
    document.body.innerHTML = '<h1>Heading</h1><h3>Skipped level</h3><form><input></form>' + Array.from({ length: 12 }, () => '<button data-width="10" data-height="10">Run</button>').join('')
    page.keyboard.press.mockResolvedValue(undefined)
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }))
    expect(result.keyboardNavigation.issues.map(issue => issue.type)).toEqual(['skip-link', 'keyboard-only'])
    expect(result.screenReaderCompatibility.issues.map(issue => issue.type)).toEqual(['landmark', 'heading-structure'])
    expect(result.mobileAccessibility.issues.map(issue => issue.type)).toEqual(['touch-target', 'viewport'])
    expect(result.cognitiveAccessibility.errorHandling).toBe(false)
    // The DOM normalizes an invalid dir value to the empty (auto) value.
    expect(result.languageSupport).toMatchObject({ score: 75, languageDetected: null, directionality: true })
  })
  it('accepts explicit error semantics and labelled required/hinted forms', async () => {
    document.documentElement.removeAttribute('lang'); document.documentElement.dir = 'rtl'
    document.body.innerHTML += '<section lang="nl"><img alt="A fixture"><img alt=""></section><form><span role="alert">Validation error</span><input></form><form><label>Label<input required></label><label for="name">Name</label><input id="name" autocomplete="name"></form><form></form><form style="display:none"><input></form><a style="display:none">Hidden link</a><button data-width="44" data-height="20">Text target</button>'
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }))
    expect(result.cognitiveAccessibility.errorHandling).toBe(true)
    expect(result.screenReaderCompatibility.altTexts).toBe(1)
    expect(result.languageSupport).toMatchObject({ languageDetected: 'nl', directionality: true })
  })
  it('adds measured heavy-page warnings and falls back after initial navigation timeout', async () => {
    page.goto.mockRejectedValueOnce(new Error('navigation timeout')).mockResolvedValue(undefined)
    cdp.on.mockImplementation((_event: string, callback: (event: unknown) => void) => { callback({ encodedDataLength: 3 * 1024 * 1024 }); callback({}) })
    vi.mocked(performance.getEntriesByType).mockImplementation(type => type === 'largest-contentful-paint' ? [{ startTime: 3000 }] as PerformanceEntry[] : [])
    ;(performance as any).timing = { loadEventEnd: 7000, navigationStart: 1000 }
    document.body.innerHTML += '<div></div>'.repeat(1500)
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }))
    expect(page.goto).toHaveBeenNthCalledWith(2, 'https://fixture.test', { waitUntil: 'networkidle2', timeout: 15000 })
    expect(result.qualityWarnings.map(warning => warning.id)).toEqual(['heavy-mobile', 'slow-lcp', 'high-dom-complexity'])
    expect(result.performanceImpact).toMatchObject({ score: 70, assistiveTechFriendly: false })
  })
  it('treats malformed axe results as an error and closes the browser', async () => {
    ;(window as any).__fixtureAxeResults = {}
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))).rejects.toMatchObject({ code: 'AXE_INVALID_RESULT' })
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it('does not mask a non-timeout navigation failure', async () => {
    page.goto.mockRejectedValue(new Error('DNS unavailable'))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))).rejects.toThrow('DNS unavailable')
    expect(boundary.headless).not.toHaveBeenCalled()
  })
  it('uses default engine metadata and keeps optional AI failures non-blocking', async () => {
    delete fixture.testEngine; delete fixture.passes
    vi.stubEnv('ENABLE_AI_IMAGE_ANALYSIS', 'true'); vi.stubEnv('GOOGLE_GEMINI_API_KEY', 'fixture-key')
    boundary.extractImages.mockRejectedValueOnce(new Error('image extraction failed'))
    page.title.mockRejectedValueOnce(new Error('title unavailable'))
    page.target.mockReturnValue({ createCDPSession: vi.fn().mockRejectedValue(new Error('CDP unavailable')) })
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(result).toMatchObject({ engineName: 'axe-core', axeVersion: null, aiContentChecks: [] })
    expect(result.title).toBeUndefined()
  })
  it('limits AI input and preserves only provider-returned analysis evidence', async () => {
    vi.stubEnv('ENABLE_AI_IMAGE_ANALYSIS', 'true'); vi.stubEnv('GOOGLE_GEMINI_API_KEY', 'fixture-key')
    const images = [{ src: 'fixture.png', alt: 'Fixture' }]
    const checks = [{ src: 'fixture.png', currentAlt: 'Fixture', isAccurate: true, score: 90, suggestedAlt: 'Fixture' }]
    boundary.extractImages.mockResolvedValue(images); boundary.analyzeImages.mockResolvedValue(checks)
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(boundary.extractImages).toHaveBeenCalledWith(page, 20)
    expect(boundary.analyzeImages).toHaveBeenCalledWith(images, 3, 15000)
    expect(result.aiContentChecks).toEqual(checks)
  })
  it('aborts an outer timeout and closes the browser without returning findings', async () => {
    page.goto.mockReturnValue(new Promise(() => {}))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 100), 1000)).rejects.toThrow('Accessibility scan exceeded 0s timeout')
    expect(browser.close).toHaveBeenCalled()
  })
  it('rejects missing browsers in development unless mocks are explicitly enabled', async () => {
    boundary.launch.mockRejectedValue(new Error('missing browser'))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))).rejects.toMatchObject({ code: 'SCANNER_NO_BROWSER' })
    expect(boundary.headless).not.toHaveBeenCalled()
  })
  it('never opts into mock findings in production, even when the mock flag is set', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.stubEnv('ALLOW_MOCK_A11Y', 'true'); vi.resetModules()
    scannerModule = await import('./scanner-enhanced')
    boundary.launch.mockRejectedValue(new Error('missing browser'))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))).rejects.toThrow('missing browser')
    expect(boundary.executablePath).toHaveBeenCalledOnce()
    expect(boundary.headless).not.toHaveBeenCalled()
  })
  it('marks explicitly allowed development fallback as demo/mock data', async () => {
    vi.stubEnv('ALLOW_MOCK_A11Y', 'true'); vi.resetModules()
    scannerModule = await import('./scanner-enhanced')
    boundary.launch.mockRejectedValue(new Error('missing browser'))
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))
    expect(result).toMatchObject({ mock: true, __demo: true, engineName: 'fallback-mock' })
    expect(boundary.headless).toHaveBeenCalledWith('https://fixture.test')
  })
  it('retries a destroyed execution context before collecting findings', async () => {
    let attempts = 0
    page.evaluate.mockImplementation(async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => {
      if (typeof args[0] === 'string' && attempts++ < 2) throw new Error('Execution context was destroyed during navigation')
      return fn(...args)
    })
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'), 6000)
    expect(result.mock).toBe(false)
    expect(attempts).toBe(3)
  })
  it('fails after repeated execution-context destruction instead of looping forever', async () => {
    page.evaluate.mockImplementation(async (fn: (...args: unknown[]) => unknown, ...args: unknown[]) => {
      if (typeof args[0] === 'string') throw new Error('navigation destroyed context')
      return fn(...args)
    })
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'), 7000)).rejects.toThrow('redirect loop')
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it('reports the bounded quick-scan timeout separately from the outer deadline', async () => {
    page.goto.mockReturnValue(new Promise(() => {}))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 120_000), 60_000)).rejects.toThrow('Site is too heavy for a quick scan')
  })
  it.each([
    [{ duration: 2200 }, 2200],
    [{ loadEventEnd: 2100 }, 2100],
    [{ domContentLoadedEventEnd: 2000 }, 2000],
    [{ responseEnd: 1900 }, 1900],
    [{}, 1500],
  ])('uses navigation timing when LCP is unavailable (%j)', async (navigation, expected) => {
    vi.mocked(performance.getEntriesByType).mockImplementation(type => type === 'navigation' ? [navigation] as unknown as PerformanceEntry[] : [])
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }), 14000)
    expect(result.largestContentfulPaintMs).toBe(expected)
    expect(result.totalPageWeightBytes).toBe(0)
  })
  it('uses safe metric defaults when collection rejects and preserves the CDP byte count', async () => {
    cdp.send.mockRejectedValueOnce(new Error('network tracking unavailable'))
    cdp.on.mockImplementation((_event: string, callback: (event: unknown) => void) => callback({ encodedDataLength: 4096 }))
    page.evaluate.mockRejectedValueOnce(new Error('metric collection rejected'))
    const result = await settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test', 45_000, { includeVNI: false }))
    expect(result).toMatchObject({ largestContentfulPaintMs: 1500, totalPageWeightBytes: 4096, domNodeCount: 0 })
  })
  it('fails a production executable lookup without requesting a fallback scan', async () => {
    vi.stubEnv('NODE_ENV', 'production'); vi.resetModules()
    scannerModule = await import('./scanner-enhanced')
    boundary.executablePath.mockRejectedValue(new Error('executable unavailable'))
    await expect(settle(scannerModule.runEnhancedAccessibilityScan('https://fixture.test'))).rejects.toThrow('executable unavailable')
    expect(boundary.launch).not.toHaveBeenCalled()
    expect(boundary.headless).not.toHaveBeenCalled()
  })
})
