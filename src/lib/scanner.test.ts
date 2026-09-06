import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { runAccessibilityScan, scanUrl } from './scanner'

const mocks = vi.hoisted(() => ({ launch: vi.fn(), analyze: vi.fn(), headless: vi.fn(), readFile: vi.fn() }))
vi.mock('playwright', () => ({ chromium: { launch: mocks.launch } }))
vi.mock('@axe-core/playwright', () => ({ AxeBuilder: class { analyze() { return mocks.analyze() } } }))
vi.mock('./scanner-headless', () => ({ runRobustAccessibilityScan: mocks.headless }))
vi.mock('fs', () => ({ readFileSync: mocks.readFile }))

let page: Record<string, any>
let browser: Record<string, any>
beforeEach(() => {
  vi.resetAllMocks()
  for (const key of ['VERCEL', 'AWS_LAMBDA_FUNCTION_NAME', 'NETLIFY', 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD', 'USE_AXE_UMD']) vi.stubEnv(key, '')
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network in scanner unit test') }))
  page = { goto: vi.fn().mockResolvedValue(undefined), addScriptTag: vi.fn().mockResolvedValue(undefined), evaluate: vi.fn().mockResolvedValue({ violations: [] }), title: vi.fn().mockResolvedValue('Fixture'), setDefaultNavigationTimeout: vi.fn(), setDefaultTimeout: vi.fn() }
  browser = { newContext: vi.fn().mockResolvedValue({ newPage: vi.fn().mockResolvedValue(page) }), close: vi.fn().mockResolvedValue(undefined) }
  mocks.launch.mockResolvedValue(browser)
  mocks.analyze.mockResolvedValue({ violations: [], passes: [{ id: 'valid' }] })
  mocks.headless.mockResolvedValue({ score: 75, issues: 1, violations: [{ id: 'fixture-only' }] })
  mocks.readFile.mockReturnValue('fixture axe source')
})
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); vi.unstubAllGlobals() })

describe('legacy scanner boundary contract (browser and fallback fully mocked)', () => {
  it('counts measured rule severities and calculates the weighted score', async () => {
    const violations = ['critical', 'serious', 'moderate', 'minor'].map(impact => ({ impact, id: impact, nodes: [] }))
    page.evaluate.mockResolvedValue({ violations })
    expect(await scanUrl('https://fixture.test')).toMatchObject({ score: 82, issues: 4, impactCritical: 1, impactSerious: 1, impactModerate: 1, impactMinor: 1, title: 'Fixture' })
    expect(browser.close).toHaveBeenCalledOnce()
    expect(page.goto).toHaveBeenCalledWith('https://fixture.test', { waitUntil: 'domcontentloaded', timeout: 30000 })
  })
  it('caps the legacy penalty and tolerates unavailable titles', async () => {
    page.evaluate.mockResolvedValue({ violations: Array.from({ length: 20 }, () => ({ impact: 'critical', nodes: [] })) })
    page.title.mockRejectedValue(new Error('detached'))
    const result = await scanUrl('https://fixture.test')
    expect(result.score).toBe(10)
    expect(result.title).toBeUndefined()
  })
  it('falls back to local content injection when path injection fails', async () => {
    page.addScriptTag.mockRejectedValueOnce(new Error('path injection failed'))
    page.evaluate.mockResolvedValue({})
    expect((await scanUrl('https://fixture.test')).issues).toBe(0)
    expect(page.addScriptTag).toHaveBeenLastCalledWith({ content: 'fixture axe source' })
  })
  it('closes the browser after a navigation error', async () => {
    page.goto.mockRejectedValue(new Error('navigation failed'))
    await expect(scanUrl('https://fixture.test')).rejects.toThrow('navigation failed')
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it('returns measured axe results when the regular browser path succeeds', async () => {
    const result = await runAccessibilityScan('https://fixture.test')
    expect(result.score).toBe(100)
    expect(result.axe).toEqual({ violations: [], passes: [{ id: 'valid' }] })
    expect(mocks.headless).not.toHaveBeenCalled()
    expect(browser.close).toHaveBeenCalledOnce()
  })
  it.each(['VERCEL', 'AWS_LAMBDA_FUNCTION_NAME', 'NETLIFY', 'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD'])('routes %s environments to the isolated fallback adapter', async key => {
    vi.stubEnv(key, '1')
    const result = await runAccessibilityScan('https://fixture.test')
    expect(mocks.launch).not.toHaveBeenCalled()
    expect(result).toMatchObject({ score: 75, axe: { serverless: true }, summary: { violations: 1, passes: 0, total: 1, serverless: true } })
  })
  it('retains a limitation marker when the serverless adapter fails', async () => {
    vi.stubEnv('VERCEL', '1'); mocks.headless.mockRejectedValue(new Error('adapter unavailable'))
    const result = await runAccessibilityScan('https://fixture.test')
    expect(result.axe).toMatchObject({ fallback: true, error: 'adapter unavailable', violations: [expect.objectContaining({ id: 'scan-limitation' })] })
  })
  it.each(['exports is not defined', 'forced UMD'])('uses UMD compatibility injection for %s', async message => {
    if (message === 'forced UMD') vi.stubEnv('USE_AXE_UMD', '1')
    mocks.analyze.mockRejectedValue(new Error(message))
    page.evaluate.mockResolvedValue({ violations: [], passes: [] })
    const result = await runAccessibilityScan('https://fixture.test')
    expect(result.axe).toEqual({ violations: [], passes: [] })
    expect(page.addScriptTag).toHaveBeenCalledWith({ content: 'fixture axe source' })
  })
  it('requests CDN injection only when the local axe script cannot be read', async () => {
    mocks.analyze.mockRejectedValue(new Error('exports is not defined'))
    mocks.readFile.mockImplementation(() => { throw new Error('file missing') })
    await runAccessibilityScan('https://fixture.test')
    expect(page.addScriptTag).toHaveBeenCalledWith({ url: 'https://cdnjs.cloudflare.com/ajax/libs/axe-core/4.7.2/axe.min.js' })
  })
  it('preserves the original browser error on a successful fallback', async () => {
    mocks.analyze.mockRejectedValue(new Error('axe unavailable'))
    expect(await runAccessibilityScan('https://fixture.test')).toMatchObject({ score: 75, axe: { fallback: true, originalError: 'axe unavailable' } })
  })
  it('retains both failures when neither adapter can scan', async () => {
    mocks.launch.mockRejectedValue(new Error('browser missing')); mocks.headless.mockRejectedValue(new Error('adapter missing'))
    const result = await runAccessibilityScan('https://fixture.test')
    expect(result).toMatchObject({ score: 0, axe: { violations: [], error: 'browser missing', fallbackError: 'adapter missing' } })
    expect(browser.close).not.toHaveBeenCalled()
  })
  it('does not replace successful results with a browser cleanup error', async () => {
    browser.close.mockRejectedValue(new Error('already closed'))
    expect((await runAccessibilityScan('https://fixture.test')).score).toBe(100)
  })
})
