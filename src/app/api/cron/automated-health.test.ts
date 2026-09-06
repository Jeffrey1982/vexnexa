import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as canary from './scan-health/route'
import * as nurture from './lead-nurture/route'
import { GET as health } from '../health/route'
import { GET as consent } from '../lead-intelligence/consent/confirm/route'
import * as unsubscribe from '../lead-intelligence/unsubscribe/route'

const mocks = vi.hoisted(() => ({ scan: vi.fn(), close: vi.fn(), alert: vi.fn(), batch: vi.fn(), storageHealth: vi.fn(), confirm: vi.fn(), unsubscribe: vi.fn() }))
vi.mock('@/lib/scanner-enhanced', () => ({ EnhancedAccessibilityScanner: class { scanUrl = mocks.scan; close = mocks.close } }))
vi.mock('@/lib/email', () => ({ sendScanHealthAlertEmail: mocks.alert }))
vi.mock('@/lib/lead-intelligence/nurture-service', () => ({ runLeadNurtureBatch: mocks.batch, unsubscribeLeadNurture: mocks.unsubscribe }))
vi.mock('@/lib/lead-intelligence/repository', () => ({ getLeadCaptureStorageHealth: mocks.storageHealth, confirmLeadConsentToken: mocks.confirm }))
const request = (method = 'GET', headers?: HeadersInit, query = '') => new NextRequest(`http://localhost/api/cron${query}`, { method, headers })
const auth = { authorization: 'Bearer isolated-cron-secret' }

beforeEach(() => {
  vi.resetAllMocks()
  vi.stubEnv('CRON_SECRET', 'isolated-cron-secret')
  vi.stubEnv('CRON_TOKEN', 'legacy-secret')
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  mocks.close.mockResolvedValue(undefined)
  mocks.scan.mockResolvedValue({ score: 91.7, violations: [{ id: 'image-alt' }] })
  mocks.batch.mockResolvedValue([])
})
afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs() })

describe('cron authorization', () => {
  it.each([['scan GET', canary.GET], ['scan POST', canary.POST], ['nurture GET', nurture.GET], ['nurture POST', nurture.POST]] as const)('blocks invalid authentication on %s', async (_, handler) => {
    const invalidHeaders: (HeadersInit | undefined)[] = [undefined, { authorization: 'Bearer incorrect' }, { 'x-cron-token': 'legacy-secret' }]
    for (const headers of invalidHeaders) {
      expect((await handler(request('GET', headers))).status).toBe(401)
    }
    expect(mocks.scan).not.toHaveBeenCalled()
    expect(mocks.batch).not.toHaveBeenCalled()
  })
  it('supports the legacy secret only when the primary secret is absent', async () => {
    vi.stubEnv('CRON_SECRET', undefined)
    expect((await canary.GET(request('GET', { 'x-cron-token': 'legacy-secret' }))).status).toBe(200)
  })
  it('fails closed without any configured secret', async () => {
    vi.stubEnv('CRON_SECRET', undefined)
    vi.stubEnv('CRON_TOKEN', undefined)
    expect((await canary.GET(request('GET', auth))).status).toBe(401)
    expect(mocks.scan).not.toHaveBeenCalled()
  })
})

describe('automated scanner canary', () => {
  it('returns real scan evidence and clears the deadline after success', async () => {
    vi.useFakeTimers()
    const response = await canary.GET(request('GET', auth))
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({ ok: true, score: 92, issues: 1 })
    expect(mocks.scan).toHaveBeenCalledWith(expect.any(String), { enableAiImageAnalysis: false, includeVNI: false })
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(mocks.alert).not.toHaveBeenCalled()
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each([
    undefined, { __demo: true, violations: [] }, { mock: true, violations: [] },
    { engineName: 'fallback-mock', violations: [] }, { violations: null },
  ])('alerts instead of accepting synthetic/missing scan evidence %#', async result => {
    mocks.scan.mockResolvedValue(result)
    const response = await canary.POST(request('POST', auth))
    expect(response.status).toBe(500)
    expect((await response.json()).ok).toBe(false)
    expect(mocks.alert).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('mock/demo'), durationMs: expect.any(Number) }))
    expect(mocks.close).toHaveBeenCalledOnce()
  })
  it('handles an absent score without inventing findings', async () => {
    mocks.scan.mockResolvedValue({ violations: [] })
    expect(await (await canary.GET(request('GET', auth))).json()).toMatchObject({ ok: true, score: 0, issues: 0 })
  })
  it.each([new Error('Chromium failed'), null])('alerts after scanner rejection %#', async error => {
    mocks.scan.mockRejectedValue(error)
    const response = await canary.GET(request('GET', auth))
    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe(error?.message || 'Scan crashed without a message.')
  })
  it('times out a stalled scan, closes it and attempts an alert', async () => {
    vi.useFakeTimers()
    mocks.scan.mockReturnValue(new Promise(() => {}))
    const pending = canary.GET(request('GET', auth))
    await vi.advanceTimersByTimeAsync(90_000)
    const response = await pending
    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe('Scan exceeded 90s')
    expect(mocks.close).toHaveBeenCalledOnce()
    expect(mocks.alert).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })
  it('does not hide a scan failure when cleanup and alert delivery also fail', async () => {
    mocks.scan.mockRejectedValue(new Error('scan failed'))
    mocks.close.mockRejectedValue(new Error('cleanup failed'))
    mocks.alert.mockRejectedValue(new Error('email unavailable'))
    const response = await canary.GET(request('GET', auth))
    expect(response.status).toBe(500)
    expect((await response.json()).error).toBe('scan failed')
  })
})

describe('passive acquisition boundaries', () => {
  it('does not start a nurture batch when email is unavailable', async () => {
    vi.stubEnv('RESEND_API_KEY', undefined)
    expect((await nurture.GET(request('GET', auth))).status).toBe(503)
    expect(mocks.batch).not.toHaveBeenCalled()
  })
  it.each([nurture.GET, nurture.POST])('bounds batch processing and reports persisted outcomes', async handler => {
    vi.stubEnv('RESEND_API_KEY', 'test-placeholder')
    mocks.batch.mockResolvedValue([{ id: 'l1', status: 'blocked' }])
    expect(await (await handler(request('POST', auth))).json()).toEqual({ ok: true, processed: 1, results: [{ id: 'l1', status: 'blocked' }] })
    expect(mocks.batch).toHaveBeenCalledWith({ limit: 25 })
  })
  it.each([{ configured: false, reachable: false }, { configured: true, reachable: false }, { configured: true, reachable: true }])('reports lead-capture health without hiding detail %#', async state => {
    mocks.storageHealth.mockResolvedValue(state)
    expect(await (await health()).json()).toEqual({ ok: true, time: expect.any(String), checks: { leadCapture: state } })
  })
  it('reports unreachable storage after a probe exception', async () => {
    mocks.storageHealth.mockRejectedValue(new Error('offline'))
    expect((await (await health()).json()).checks.leadCapture).toEqual({ configured: true, reachable: false })
  })
  it.each(['', '?token=short', `?token=${'x'.repeat(257)}`])('rejects malformed consent tokens before the repository %#', async query => {
    expect((await consent(request('GET', undefined, query))).headers.get('location')).toContain('/free-scan?consent=invalid')
    expect(mocks.confirm).not.toHaveBeenCalled()
  })
  it.each([true, false])('redirects consent confirmation outcome %s to the configured app', async confirmed => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://configured.example')
    mocks.confirm.mockResolvedValue({ confirmed })
    const token = 'x'.repeat(32)
    const response = await consent(request('GET', undefined, `?token=${token}`))
    expect(response.headers.get('location')).toBe(`https://configured.example/free-scan?consent=${confirmed ? 'confirmed' : 'invalid'}`)
    expect(mocks.confirm).toHaveBeenCalledWith(token)
  })
  it('redirects to an explicit error state after confirmation storage failure', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    mocks.confirm.mockRejectedValue(new Error('database down'))
    expect((await consent(request('GET', undefined, `?token=${'x'.repeat(32)}`))).headers.get('location')).toBe('http://localhost/free-scan?consent=error')
  })
  it.each([unsubscribe.GET, unsubscribe.POST])('rejects invalid unsubscribe input without data changes', async handler => {
    expect((await handler(request('GET', undefined, '?token=short'))).status).toBe(400)
    expect(mocks.unsubscribe).not.toHaveBeenCalled()
  })
  it.each([true, false])('redirects GET unsubscribe according to durable outcome %s', async removed => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '')
    mocks.unsubscribe.mockResolvedValue(removed)
    expect((await unsubscribe.GET(request('GET', undefined, `?token=${'x'.repeat(32)}`))).headers.get('location')).toBe(`http://localhost/?unsubscribe=${removed ? 'success' : 'invalid'}`)
  })
  it('accepts one-click unsubscribe tokens in a form body', async () => {
    mocks.unsubscribe.mockResolvedValue(true)
    const body = new URLSearchParams({ token: 'x'.repeat(32) })
    const response = await unsubscribe.POST(new NextRequest('http://localhost/api/unsubscribe', { method: 'POST', body }))
    expect(await response.json()).toEqual({ ok: true })
    expect(mocks.unsubscribe).toHaveBeenCalledWith('x'.repeat(32))
  })
})
