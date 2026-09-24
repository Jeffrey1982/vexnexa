import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import {
  CONTACT_BODY_LIMIT,
  CONTACT_LOCALES,
  ContactBodyError,
  buildContactText,
  contactSchema,
  createContactRateLimiter,
  isSameOrigin,
  isValidContactSender,
  readContactBody,
} from './contact'

const valid = {
  name: 'Alex Developer',
  email: 'alex@example.com',
  message: 'I would like to discuss a game collaboration.',
  locale: 'nl' as const,
  privacyAccepted: true as const,
  website: '',
  requestId: 'f7f88fda-bb69-478a-a6d5-531a3727d1d0',
}

describe('contactSchema', () => {
  it.each(CONTACT_LOCALES)('accepts supported locale %s', locale => {
    expect(contactSchema.parse({ ...valid, locale }).locale).toBe(locale)
  })

  it('trims actual contact fields and supplies an empty honeypot', () => {
    const { website: _website, ...withoutHoneypot } = valid
    expect(contactSchema.parse({
      ...withoutHoneypot, name: ' Alex ', email: ' alex@example.com ', message: ` ${valid.message} `,
    })).toMatchObject({ name: 'Alex', email: 'alex@example.com', message: valid.message, website: '' })
  })

  it.each([
    ['name', 'A'], ['name', ' '.repeat(20)], ['name', 'n'.repeat(101)],
    ['name', 'Alex\r\nBcc: person@example.com'], ['name', 'Alex\u0000'],
    ['email', 'bad-address'], ['email', 'Alex <alex@example.com>'],
    ['email', 'alex@example.com\r\nBcc: person@example.com'], ['email', 'x'.repeat(255)],
    ['message', 'short'], ['message', ' '.repeat(100)], ['message', 'm'.repeat(5001)],
    ['message', 'Message with\u0000null'], ['message', 'Message with\u001bescape'],
    ['locale', 'it'], ['locale', 'EN'], ['locale', ''],
    ['privacyAccepted', false], ['privacyAccepted', 'true'], ['privacyAccepted', 1],
    ['requestId', 'not-a-uuid'], ['requestId', ''], ['website', 'x'.repeat(201)],
  ])('rejects invalid %s value %j', (field, value) => {
    expect(contactSchema.safeParse({ ...valid, [field]: value }).success).toBe(false)
  })

  it.each(['name', 'email', 'message', 'locale', 'privacyAccepted', 'requestId'])('requires %s', field => {
    const value: Record<string, unknown> = { ...valid }
    delete value[field]
    expect(contactSchema.safeParse(value).success).toBe(false)
  })

  it.each([null, [], 'not an object', 17])('rejects non-object input %j', input => {
    expect(contactSchema.safeParse(input).success).toBe(false)
  })

  it('rejects unknown fields, including visitor-controlled recipients', () => {
    expect(contactSchema.safeParse({ ...valid, to: 'attacker@example.com' }).success).toBe(false)
  })

  it('allows multilingual plain text, tabs, line breaks, and game titles', () => {
    const message = 'Hallo! こんにちは 👋\nIpiWow\t— Grüße\r\nOlá!'
    expect(contactSchema.parse({ ...valid, name: 'José Müller', message }).message).toBe(message)
  })
})

describe('origin verification', () => {
  it('accepts the exact HTTPS request origin', () => {
    expect(isSameOrigin(new Request('https://vexnexa.com/api/contact', { headers: { origin: 'https://vexnexa.com' } }))).toBe(true)
  })
  it('accepts an exact Vercel preview origin without trusting arbitrary sibling origins', () => {
    expect(isSameOrigin(new Request('https://preview-123.vercel.app/api/contact', { headers: { origin: 'https://preview-123.vercel.app' } }))).toBe(true)
  })
  it.each(['localhost', '127.0.0.1', '[::1]'])('permits local HTTP development at %s', hostname => {
    const origin = `http://${hostname}:3000`
    expect(isSameOrigin(new Request(`${origin}/api/contact`, { headers: { origin } }))).toBe(true)
  })
  it.each([
    undefined, 'null', 'https://evil.example', 'https://vexnexa.com.evil.example',
    'https://vexnexa.com/path', 'https://vexnexa.com/', 'https://user@vexnexa.com',
    'http://vexnexa.com', 'not a URL', 'https://www.vexnexa.com',
  ])('rejects missing, malformed, or mismatched origin %s', origin => {
    const headers: Record<string, string> = origin === undefined ? {} : { origin }
    expect(isSameOrigin(new Request('https://vexnexa.com/api/contact', { headers }))).toBe(false)
  })
  it('rejects cross-site fetch metadata even when origin claims to match', () => {
    expect(isSameOrigin(new Request('https://vexnexa.com/api/contact', {
      headers: { origin: 'https://vexnexa.com', 'sec-fetch-site': 'cross-site' },
    }))).toBe(false)
  })
  it('rejects public plain HTTP origins', () => {
    expect(isSameOrigin(new Request('http://vexnexa.com/api/contact', { headers: { origin: 'http://vexnexa.com' } }))).toBe(false)
  })
  it.each(['127.0.0.1', '[::1]'])('accepts the real Host after NextRequest normalizes %s to localhost', host => {
    const request = new NextRequest(`http://${host}:3010/api/contact`, {
      headers: { origin: `http://${host}:3010`, host: `${host}:3010`, 'sec-fetch-site': 'same-origin' },
    })
    expect(request.url).toBe('http://localhost:3010/api/contact')
    expect(isSameOrigin(request)).toBe(true)
  })
  it.each([
    { origin: 'http://localhost:3010', host: '127.0.0.1:3010' },
    { origin: 'http://127.0.0.1:3011', host: '127.0.0.1:3011' },
    { origin: 'https://127.0.0.1:3010', host: '127.0.0.1:3010' },
    { origin: 'http://127.0.0.1:3010', host: 'evil.example:3010' },
    { origin: 'http://127.0.0.1:3010', host: 'user@127.0.0.1:3010' },
    { origin: 'http://127.0.0.1:3010', host: '127.0.0.1:3010/path' },
    { origin: 'http://127.0.0.1:3010', host: '127.0.0.1:3010?query=true' },
    { origin: 'http://127.0.0.1:3010', host: '127.0.0.1:3010#fragment' },
    { origin: 'http://127.0.0.1:3010', host: '[malformed' },
  ])('never treats distinct local origins or untrusted hosts as equivalent: %j', headers => {
    const request = new NextRequest('http://127.0.0.1:3010/api/contact', { headers })
    expect(isSameOrigin(request)).toBe(false)
  })
  it('does not trust a forwarded host to work around an origin mismatch', () => {
    const request = new Request('https://vexnexa.com/api/contact', {
      headers: { origin: 'https://evil.example', host: 'evil.example', 'x-forwarded-host': 'evil.example' },
    })
    expect(isSameOrigin(request)).toBe(false)
  })
})

describe('bounded JSON reading', () => {
  const bodyRequest = (body: string, headers: Record<string, string> = {}) => new Request('https://vexnexa.com/api/contact', { method: 'POST', headers, body })

  it('reads JSON without Content-Length', async () => {
    expect(await readContactBody(bodyRequest(JSON.stringify(valid)))).toEqual(valid)
  })
  it('reads correctly declared JSON', async () => {
    expect(await readContactBody(bodyRequest('{}', { 'content-length': '2' }))).toEqual({})
  })
  it('rejects an oversized declared length before consuming the stream', async () => {
    await expect(readContactBody(bodyRequest('{}', { 'content-length': String(CONTACT_BODY_LIMIT + 1) }))).rejects.toMatchObject({ code: 'payload_too_large' })
  })
  it.each(['-1', 'nope', '2.5', '1e9'])('rejects malformed Content-Length %s', length => {
    return expect(readContactBody(bodyRequest('{}', { 'content-length': length }))).rejects.toMatchObject({ code: 'invalid_input' })
  })
  it('rejects oversized streamed bytes despite a dishonest Content-Length', async () => {
    await expect(readContactBody(bodyRequest(' '.repeat(CONTACT_BODY_LIMIT + 1), { 'content-length': '1' }))).rejects.toMatchObject({ code: 'payload_too_large' })
  })
  it('counts UTF-8 bytes instead of JS characters', async () => {
    const body = JSON.stringify('界'.repeat(6000))
    expect(body.length).toBeLessThan(CONTACT_BODY_LIMIT)
    await expect(readContactBody(bodyRequest(body))).rejects.toMatchObject({ code: 'payload_too_large' })
  })
  it('accepts the exact byte boundary', async () => {
    const body = `"${'a'.repeat(CONTACT_BODY_LIMIT - 2)}"`
    expect((await readContactBody(bodyRequest(body)) as string).length).toBe(CONTACT_BODY_LIMIT - 2)
  })
  it.each(['', '{', '{"a":undefined}'])('rejects invalid JSON %j', body => {
    return expect(readContactBody(bodyRequest(body))).rejects.toBeInstanceOf(ContactBodyError)
  })
  it('rejects requests without a body', async () => {
    await expect(readContactBody(new Request('https://vexnexa.com/api/contact'))).rejects.toMatchObject({ code: 'invalid_input' })
  })
  it('reassembles multiple chunks, including a split UTF-8 character', async () => {
    const bytes = new TextEncoder().encode('{"name":"é"}')
    const stream = new ReadableStream({ start(controller) {
      controller.enqueue(bytes.slice(0, 10))
      controller.enqueue(bytes.slice(10))
      controller.close()
    } })
    const request = new Request('https://vexnexa.com/api/contact', { method: 'POST', body: stream, duplex: 'half' } as RequestInit)
    expect(await readContactBody(request)).toEqual({ name: 'é' })
  })
  it('rejects malformed UTF-8 instead of silently replacing bytes', async () => {
    const request = new Request('https://vexnexa.com/api/contact', { method: 'POST', body: new Uint8Array([34, 255, 34]) })
    await expect(readContactBody(request)).rejects.toMatchObject({ code: 'invalid_input' })
  })
  it('maps stream errors to a value-free invalid-input error', async () => {
    const stream = new ReadableStream({ start(controller) { controller.error(new Error('private stream failure')) } })
    const request = new Request('https://vexnexa.com/api/contact', { method: 'POST', body: stream, duplex: 'half' } as RequestInit)
    await expect(readContactBody(request)).rejects.toThrow('invalid_input')
  })
})

describe('best-effort rate limiter', () => {
  it('allows its quota, then blocks until the fixed window expires', () => {
    const limit = createContactRateLimiter({ limit: 2, windowMs: 2000 })
    expect(limit('visitor', 0).allowed).toBe(true)
    expect(limit('visitor', 500).allowed).toBe(true)
    expect(limit('visitor', 501)).toEqual({ allowed: false, retryAfter: 2 })
    expect(limit('visitor', 1999)).toEqual({ allowed: false, retryAfter: 1 })
    expect(limit('visitor', 2000).allowed).toBe(true)
  })
  it('isolates visitor buckets', () => {
    const limit = createContactRateLimiter({ limit: 1 })
    expect(limit('a', 0).allowed).toBe(true)
    expect(limit('a', 1).allowed).toBe(false)
    expect(limit('b', 1).allowed).toBe(true)
  })
  it('fails closed at capacity without evicting active limits', () => {
    const limit = createContactRateLimiter({ limit: 1, maxEntries: 2, windowMs: 1000 })
    expect(limit('a', 0).allowed).toBe(true)
    expect(limit('b', 100).allowed).toBe(true)
    expect(limit('c', 200)).toEqual({ allowed: false, retryAfter: 1 })
    expect(limit('a', 300).allowed).toBe(false)
    expect(limit('c', 1000).allowed).toBe(true)
  })
  it('does not share state across server instances', () => {
    const first = createContactRateLimiter({ limit: 1 })
    const second = createContactRateLimiter({ limit: 1 })
    expect(first('a', 0).allowed).toBe(true)
    expect(first('a', 1).allowed).toBe(false)
    expect(second('a', 1).allowed).toBe(true)
  })
  it.each([{ limit: 0 }, { windowMs: 0 }, { maxEntries: 0 }])('rejects invalid configuration %j', config => {
    expect(() => createContactRateLimiter(config)).toThrow('Invalid rate limit configuration')
  })
})

describe('mail construction', () => {
  it('produces plain text, with a stable reference and no generated timestamp', () => {
    const payload = contactSchema.parse({ ...valid, message: '<script>alert("hello")</script>\nPlain text.' })
    const text = buildContactText(payload)
    expect(text).toContain('Name: Alex Developer')
    expect(text).toContain('Email: alex@example.com')
    expect(text).toContain('Language: nl')
    expect(text).toContain(`Reference: ${valid.requestId}`)
    expect(text).toContain(payload.message)
    expect(text).not.toContain('website:')
    expect(buildContactText(payload)).toBe(text)
  })
  it.each(['info@vexnexa.com', 'VexNexa <updates@vexnexa.com>', 'VexNexa Games <hello@vexnexa.com>'])('accepts configured sender %s', value => {
    expect(isValidContactSender(value)).toBe(true)
  })
  it.each(['', 're_apikeyvalue', 'not-email', 'VexNexa <bad>', 'a@example.com,b@example.com', 'VexNexa <a@example.com>\nBcc: b@example.com', 'a'.repeat(321)])('rejects unsafe sender %j', value => {
    expect(isValidContactSender(value)).toBe(false)
  })
})
