import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { send, resendConstructor } = vi.hoisted(() => ({ send: vi.fn(), resendConstructor: vi.fn() }))
vi.mock('resend', () => ({
  Resend: class {
    emails = { send }
    constructor(key: string) { resendConstructor(key) }
  },
}))

const valid = {
  name: 'Alex Developer',
  email: 'alex@example.com',
  message: 'I would like to discuss a game collaboration.',
  locale: 'nl',
  privacyAccepted: true,
  website: '',
  requestId: 'f7f88fda-bb69-478a-a6d5-531a3727d1d0',
}

const request = (payload: unknown = valid, headers: Record<string, string> = {}) => new Request('https://vexnexa.com/api/contact', {
  method: 'POST',
  headers: { origin: 'https://vexnexa.com', 'content-type': 'application/json', ...headers },
  body: JSON.stringify(payload),
})

describe('POST /api/contact', () => {
  let POST: typeof import('./route').POST
  beforeEach(async () => {
    vi.resetModules()
    send.mockReset().mockResolvedValue({ data: { id: 'test-delivery-id' }, error: null })
    resendConstructor.mockReset()
    vi.stubEnv('RESEND_API_KEY', 're_test_key_not_real')
    vi.stubEnv('RESEND_FROM_EMAIL', 'VexNexa <hello@vexnexa.com>')
    vi.stubEnv('RESEND_ADMIN_FROM_EMAIL', '')
    vi.stubEnv('VERCEL', '')
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network access forbidden in unit tests')))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    POST = (await import('./route')).POST
  })
  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('sends one plain-text team notification, never a visitor autoresponder', async () => {
    const result = await POST(request())
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ success: true })
    expect(resendConstructor).toHaveBeenCalledWith('re_test_key_not_real')
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith({
      from: 'VexNexa <hello@vexnexa.com>',
      to: ['info@vexnexa.com'],
      replyTo: 'alex@example.com',
      subject: 'VexNexa Games — new contact message',
      text: expect.stringContaining(valid.message),
    }, { idempotencyKey: `vexnexa-studio-contact/${valid.requestId}` })
    expect(send.mock.calls[0][0]).not.toHaveProperty('html')
    expect(result.headers.get('cache-control')).toBe('no-store')
    expect(result.headers.get('x-content-type-options')).toBe('nosniff')
    expect(fetch).not.toHaveBeenCalled()
  })

  it('prefers the configured admin sender', async () => {
    vi.stubEnv('RESEND_ADMIN_FROM_EMAIL', 'VexNexa Admin <admin@vexnexa.com>')
    await POST(request())
    expect(send.mock.calls[0][0].from).toBe('VexNexa Admin <admin@vexnexa.com>')
  })
  it('normalizes contact fields before sending', async () => {
    await POST(request({ ...valid, email: ' alex@example.com ', name: ' Alex ', message: ` ${valid.message} ` }))
    expect(send.mock.calls[0][0]).toMatchObject({ replyTo: 'alex@example.com', text: expect.stringContaining('Name: Alex\n') })
  })
  it.each(['en', 'de', 'fr', 'es', 'pt', 'tl'])('includes supported visitor language %s', async locale => {
    expect((await POST(request({ ...valid, locale }))).status).toBe(200)
    expect(send.mock.calls[0][0].text).toContain(`Language: ${locale}`)
  })

  it('uses an identical provider payload and key after an uncertain network result', async () => {
    send.mockRejectedValueOnce(new Error('Timed out after provider acceptance'))
    expect((await POST(request())).status).toBe(502)
    expect((await POST(request())).status).toBe(200)
    expect(send.mock.calls[0]).toEqual(send.mock.calls[1])
  })
  it('never adds time-dependent values to repeated submissions', async () => {
    await POST(request())
    await POST(request())
    expect(send.mock.calls[0]).toEqual(send.mock.calls[1])
  })
  it('uses a distinct key for a genuinely new request ID', async () => {
    await POST(request())
    await POST(request({ ...valid, requestId: 'e6fb29dc-df55-44ac-a260-e6c5cbe4ee76' }))
    expect(send.mock.calls[0][1]).not.toEqual(send.mock.calls[1][1])
  })

  it.each(['', 'null', 'https://evil.example', 'https://vexnexa.com.evil.example'])('blocks invalid origin %s', async origin => {
    const result = await POST(request(valid, { origin }))
    expect(result.status).toBe(403)
    expect(await result.json()).toEqual({ success: false, error: 'invalid_origin' })
    expect(send).not.toHaveBeenCalled()
  })
  it('blocks cross-site fetches', async () => {
    expect((await POST(request(valid, { 'sec-fetch-site': 'cross-site' }))).status).toBe(403)
    expect(send).not.toHaveBeenCalled()
  })
  it('reaches validation through a real NextRequest with normalized loopback URL', async () => {
    const normalized = new NextRequest('http://127.0.0.1:3010/api/contact', {
      method: 'POST',
      headers: {
        origin: 'http://127.0.0.1:3010', host: '127.0.0.1:3010',
        'content-type': 'application/json', 'sec-fetch-site': 'same-origin',
      },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(normalized.url).toBe('http://localhost:3010/api/contact')
    const result = await POST(normalized)
    expect(result.status).toBe(400)
    expect((await result.json()).error).toBe('invalid_input')
    expect(send).not.toHaveBeenCalled()
  })
  it.each(['text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/jsonp'])('blocks unsupported content type %s', async contentType => {
    const result = await POST(request(valid, { 'content-type': contentType }))
    expect(result.status).toBe(415)
    expect(await result.json()).toEqual({ success: false, error: 'unsupported_media_type' })
    expect(send).not.toHaveBeenCalled()
  })
  it('accepts JSON with a charset parameter', async () => {
    expect((await POST(request(valid, { 'content-type': 'application/json; charset=utf-8' }))).status).toBe(200)
  })
  it('rejects oversized bodies with an untrusted smaller Content-Length', async () => {
    const result = await POST(request({ ...valid, message: 'a'.repeat(20000) }, { 'content-length': '1' }))
    expect(result.status).toBe(413)
    expect(await result.json()).toEqual({ success: false, error: 'payload_too_large' })
    expect(send).not.toHaveBeenCalled()
  })
  it('rejects malformed JSON without logging or echoing the raw body', async () => {
    const result = await POST(new Request('https://vexnexa.com/api/contact', {
      method: 'POST', headers: { origin: 'https://vexnexa.com', 'content-type': 'application/json' }, body: '{secret:alex@example.com',
    }))
    expect(result.status).toBe(400)
    expect(await result.json()).toEqual({ success: false, error: 'invalid_input' })
    expect(console.warn).not.toHaveBeenCalled()
  })
  it.each([
    { privacyAccepted: false }, { email: 'private-invalid-email' }, { name: 'A' },
    { message: 'short' }, { locale: 'it' }, { requestId: 'anything' }, { recipient: 'someone@example.com' },
  ])('rejects invalid fields %j without attempting delivery', async override => {
    const result = await POST(request({ ...valid, ...override }))
    expect(result.status).toBe(400)
    const body = await result.json()
    expect(body.success).toBe(false)
    expect(body.error).toBe('invalid_input')
    expect(body.fieldErrors).toBeDefined()
    expect(JSON.stringify(body)).not.toContain('private-invalid-email')
    expect(send).not.toHaveBeenCalled()
  })

  it.each(['https://bot.example', ' '])('silently drops honeypot value %j without invoking Resend', async website => {
    vi.stubEnv('RESEND_API_KEY', '')
    const result = await POST(request({ ...valid, website }))
    expect(result.status).toBe(200)
    expect(await result.json()).toEqual({ success: true })
    expect(send).not.toHaveBeenCalled()
    expect(resendConstructor).not.toHaveBeenCalled()
  })
  it.each([
    ['RESEND_API_KEY', ''], ['RESEND_API_KEY', 'not-a-resend-key'], ['RESEND_API_KEY', 're_'],
    ['RESEND_FROM_EMAIL', ''], ['RESEND_FROM_EMAIL', 're_accidentally_pasted_api_key'],
    ['RESEND_FROM_EMAIL', 'hello@vexnexa.com\nBcc: x@example.com'],
  ])('fails closed on misconfigured %s', async (key, value) => {
    vi.stubEnv(key, value)
    const result = await POST(request())
    expect(result.status).toBe(503)
    expect(await result.json()).toEqual({ success: false, error: 'unavailable' })
    expect(send).not.toHaveBeenCalled()
    expect(resendConstructor).not.toHaveBeenCalled()
  })
  it('does not silently fall back when the explicit admin sender is invalid', async () => {
    vi.stubEnv('RESEND_ADMIN_FROM_EMAIL', 'bad')
    expect((await POST(request())).status).toBe(503)
    expect(send).not.toHaveBeenCalled()
  })
  it.each([
    { data: null, error: { message: 'PRIVATE provider error alex@example.com', name: 'validation_error' } },
    { data: null, error: null },
    { data: {}, error: null },
    { data: { id: 'id' }, error: { message: 'failure' } },
  ])('reports failure unless the provider explicitly accepts the mail', async providerResponse => {
    send.mockResolvedValue(providerResponse)
    const result = await POST(request())
    expect(result.status).toBe(502)
    expect(await result.json()).toEqual({ success: false, error: 'delivery_failed' })
    expect(console.warn).toHaveBeenCalledWith('[studio-contact] delivery_rejected')
    expect(JSON.stringify(vi.mocked(console.warn).mock.calls)).not.toContain('alex@example.com')
  })
  it('does not expose thrown error contents or secrets', async () => {
    send.mockRejectedValue(new Error(`Resend secret re_test_key_not_real with ${valid.email}: ${valid.message}`))
    const result = await POST(request())
    expect(result.status).toBe(502)
    expect(await result.json()).toEqual({ success: false, error: 'delivery_failed' })
    expect(console.warn).toHaveBeenCalledExactlyOnceWith('[studio-contact] delivery_unavailable')
  })

  it('limits a local visitor to five attempts per window, including invalid submissions', async () => {
    for (let index = 0; index < 5; index += 1) expect((await POST(request({ ...valid, privacyAccepted: false }))).status).toBe(400)
    const result = await POST(request())
    expect(result.status).toBe(429)
    expect(await result.json()).toEqual({ success: false, error: 'rate_limited' })
    expect(Number(result.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(send).not.toHaveBeenCalled()
  })
  it('does not trust spoofed forwarding headers outside Vercel', async () => {
    for (let index = 1; index <= 5; index += 1) await POST(request(valid, { 'x-forwarded-for': `192.0.2.${index}` }))
    expect((await POST(request(valid, { 'x-forwarded-for': '192.0.2.6' }))).status).toBe(429)
    expect(send).toHaveBeenCalledTimes(5)
  })
  it('uses Vercel-provided visitor addresses for separate rate buckets', async () => {
    vi.stubEnv('VERCEL', '1')
    for (let index = 0; index < 5; index += 1) await POST(request(valid, { 'x-forwarded-for': '192.0.2.1' }))
    expect((await POST(request(valid, { 'x-forwarded-for': '192.0.2.1' }))).status).toBe(429)
    expect((await POST(request(valid, { 'x-forwarded-for': '192.0.2.2' }))).status).toBe(200)
  })
  it('prefers the Vercel forwarding header to client forwarding values', async () => {
    vi.stubEnv('VERCEL', '1')
    for (let index = 1; index <= 5; index += 1) await POST(request(valid, { 'x-vercel-forwarded-for': '192.0.2.1', 'x-forwarded-for': `192.0.2.${index}` }))
    expect((await POST(request(valid, { 'x-vercel-forwarded-for': '192.0.2.1', 'x-forwarded-for': '192.0.2.9' }))).status).toBe(429)
  })
  it('maps malformed forwarding values into the same bounded fallback bucket', async () => {
    vi.stubEnv('VERCEL', '1')
    for (let index = 0; index < 5; index += 1) await POST(request(valid, { 'x-forwarded-for': `fake-address-${index}` }))
    expect((await POST(request(valid, { 'x-forwarded-for': 'another-fake' }))).status).toBe(429)
  })
  it('caps a single warm instance even if many addresses are used', async () => {
    vi.stubEnv('VERCEL', '1')
    for (let index = 1; index <= 30; index += 1) expect((await POST(request(valid, { 'x-forwarded-for': `192.0.2.${index}` }))).status).toBe(200)
    const result = await POST(request(valid, { 'x-forwarded-for': '192.0.2.31' }))
    expect(result.status).toBe(429)
    expect(Number(result.headers.get('retry-after'))).toBeGreaterThan(0)
    expect(send).toHaveBeenCalledTimes(30)
  })
})
