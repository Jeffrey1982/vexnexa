import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeLogoDimensions, getImageDimensions } from './image-dimensions'
import { extractQueryOverrides, resolveWhiteLabelConfig, validateHex, validateImageUrl } from './resolve-white-label'
import { fetchImageAsBuffer, fetchImageAsDataUrl } from './fetch-image'
import { getStoredWhiteLabel } from './get-stored-white-label'
import { DEFAULT_CTA, DEFAULT_WHITE_LABEL } from './types'

const findUnique = vi.hoisted(() => vi.fn())
vi.mock('@/lib/prisma', () => ({ prisma: { whiteLabel: { findUnique } } }))
vi.mock('@/lib/billing/entitlements', () => ({ assertWithinLimits: vi.fn().mockResolvedValue(undefined) }))

function png(width: number, height: number) {
  const buffer = Buffer.alloc(24)
  buffer.set([0x89, 0x50, 0x4e, 0x47])
  buffer.writeUInt32BE(width, 16)
  buffer.writeUInt32BE(height, 20)
  return buffer
}

describe('report logo dimensions', () => {
  it.each([Buffer.alloc(0), Buffer.from('not an image'), png(0, 20), png(20, 0), png(20, 20).subarray(0, 12)])('rejects malformed or zero-sized PNG data', (buffer) => {
    expect(getImageDimensions(buffer)).toBeNull()
  })
  it('reads PNG width and height without decoding pixels', () => {
    expect(getImageDimensions(png(320, 80))).toEqual({ width: 320, height: 80 })
  })
  it.each([0xc0, 0xc2, 0xc5, 0xc7, 0xc9, 0xcb, 0xcd, 0xcf])('reads JPEG SOF marker %s after metadata', (marker) => {
    const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, marker, 0, 8, 8, 0, 40, 0, 80])
    expect(getImageDimensions(buffer)).toEqual({ width: 80, height: 40 })
  })
  it.each([
    [0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0],
    [0xff, 0xd8, 0xff, 0xc0, 0, 8, 8, 0, 0, 0, 0],
    [0xff, 0xd8, 0, 0, 0, 0, 0, 0],
    [0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xe0],
  ])('returns null for truncated or invalid JPEG structures', (...bytes) => {
    expect(getImageDimensions(Buffer.from(bytes))).toBeNull()
  })
  it.each([
    ['<svg viewBox="0,0,200,50" width="10" height="10"></svg>', { width: 200, height: 50 }],
    ['<svg width="33.5px" height="25"></svg>', { width: 33.5, height: 25 }],
    ['<svg viewBox="0 0 0 0" width="20" height="30"></svg>', { width: 20, height: 30 }],
    ['<svg viewBox="0 0 2"></svg>', null],
    ['<svg width="0" height="30"></svg>', null],
    ['<svg width="20"></svg>', null],
    ['<svg height="20"></svg>', null],
  ])('handles SVG native sizes: %s', (svg, expected) => {
    expect(getImageDimensions(Buffer.from(svg))).toEqual(expected)
  })
  it.each([
    [400, 100, { width: 128, height: 32 }],
    [20, 10, { width: 48, height: 24 }],
    [100, 25, { width: 100, height: 25 }],
    [1000, 36, { width: 200, height: 33 }],
    [1, 1000, { width: 1, height: 32 }],
  ])('scales %sx%s logos into a bounded DOCX box', (width, height, expected) => {
    expect(computeLogoDimensions(png(width, height))).toEqual(expected)
  })
  it('uses a safe default when native dimensions cannot be determined', () => {
    expect(computeLogoDimensions(Buffer.alloc(0))).toEqual({ width: 120, height: 32 })
  })
})

describe('white-label resolution', () => {
  it.each([[undefined, undefined], [null, undefined], ['', undefined], ['abc', undefined], ['#abcdef', '#abcdef'], ['A012fF', '#A012fF'], ['#aabbccdd', undefined]])('validates six-digit hex %s', (value, expected) => {
    expect(validateHex(value)).toBe(expected)
  })
  it.each(['', 'invalid', 'ftp://vexnexa.com/logo.png', 'https://evil-vexnexa.com/logo.png', 'https://vexnexa.com.attacker.test/logo.png', 'http://169.254.169.254/latest'])('rejects unapproved image source %s', (url) => {
    expect(validateImageUrl(url)).toBe('')
  })
  it.each(['https://vexnexa.com/logo.png', 'https://cdn.vexnexa.com/logo.png', 'data:image/png;base64,YQ=='])('retains approved image source %s', (url) => {
    expect(validateImageUrl(url)).toBe(url)
  })
  it('uses defaults when neither query nor stored settings exist', () => {
    const result = resolveWhiteLabelConfig({})
    expect(result.whiteLabelConfig).toEqual(DEFAULT_WHITE_LABEL)
    expect(result.ctaConfig).toEqual(DEFAULT_CTA)
    expect(result.reportStyle).toBe('corporate')
    expect(result.faviconUrl).toBe('')
  })
  it('prioritizes valid query values and preserves explicit branding opt-out', () => {
    const query = { logo: 'https://vexnexa.com/q.png', favicon: 'https://vexnexa.com/f.png', color: 'abcdef', company: 'Query Agency', footer: 'Query footer', branding: 'false', reportStyle: 'premium', ctaUrl: 'https://example.test/contact', ctaText: 'Contact us', supportEmail: 'help@example.test' }
    const result = resolveWhiteLabelConfig(query, { companyName: 'Stored Agency', primaryColor: '#123456', showVexNexaBranding: true })
    expect(result.whiteLabelConfig).toMatchObject({ logoUrl: query.logo, companyNameOverride: query.company, primaryColor: '#abcdef', footerText: query.footer, showVexNexaBranding: false })
    expect(result.themeConfig.primaryColor).toBe('#abcdef')
    expect(result.ctaConfig).toEqual({ ctaUrl: query.ctaUrl, ctaText: query.ctaText, supportEmail: query.supportEmail })
    expect(result.reportStyle).toBe('premium')
    expect(result.faviconUrl).toBe(query.favicon)
  })
  it('falls back from invalid overrides to stored branding settings', () => {
    const stored = { logoUrl: 'https://vexnexa.com/stored.png', faviconUrl: 'https://vexnexa.com/f.ico', primaryColor: '#123456', companyName: 'Stored', showVexNexaBranding: false, footerText: 'Footer', ctaUrl: 'https://example.test', ctaText: 'Ask', supportEmail: 'help@example.test' }
    const result = resolveWhiteLabelConfig({ logo: 'bad', color: 'bad', favicon: 'bad', reportStyle: 'unknown' }, stored)
    expect(result.whiteLabelConfig).toEqual({ logoUrl: stored.logoUrl, primaryColor: stored.primaryColor, companyNameOverride: stored.companyName, showVexNexaBranding: false, footerText: stored.footerText })
    expect(result.faviconUrl).toBe(stored.faviconUrl)
    expect(result.ctaConfig).toEqual({ ctaUrl: stored.ctaUrl, ctaText: stored.ctaText, supportEmail: stored.supportEmail })
  })
  it('extracts only supported query settings and preserves absent values', () => {
    const keys = ['logo', 'color', 'company', 'branding', 'favicon', 'reportStyle', 'ctaUrl', 'ctaText', 'supportEmail', 'footer']
    expect(extractQueryOverrides(new URL('https://example.test/'))).toEqual(Object.fromEntries(keys.map((key) => [key, undefined])))
    const values = Object.fromEntries(keys.map((key) => [key, `${key} value`]))
    expect(extractQueryOverrides(new URL(`https://example.test/?${new URLSearchParams(values)}`))).toEqual(values)
  })
  it('maps nullable stored fields without inventing branding', async () => {
    findUnique.mockResolvedValueOnce(null)
    expect(await getStoredWhiteLabel('u1')).toBeUndefined()
    findUnique.mockResolvedValueOnce({ logoUrl: null, faviconUrl: null, primaryColor: null, companyName: null, showPoweredBy: false, footerText: null, supportEmail: null })
    expect(await getStoredWhiteLabel('u1')).toEqual({ logoUrl: undefined, faviconUrl: undefined, primaryColor: undefined, companyName: undefined, showVexNexaBranding: false, footerText: undefined, supportEmail: undefined })
    findUnique.mockResolvedValueOnce({ logoUrl: 'logo', faviconUrl: 'favicon', primaryColor: '#123456', companyName: 'Agency', showPoweredBy: true, footerText: 'Footer', supportEmail: 'help@example.test' })
    expect(await getStoredWhiteLabel('u2')).toMatchObject({ logoUrl: 'logo', faviconUrl: 'favicon', companyName: 'Agency', showVexNexaBranding: true, supportEmail: 'help@example.test' })
    expect(findUnique).toHaveBeenLastCalledWith({ where: { userId: 'u2' } })
  })
})

describe('report image fetch boundary', () => {
  const fetchMock = vi.fn()
  beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', fetchMock); fetchMock.mockReset() })
  afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals() })
  it('never fetches invalid or already embedded images', async () => {
    expect(await fetchImageAsDataUrl('https://unapproved.test/x.png')).toBe('')
    expect(await fetchImageAsBuffer('https://unapproved.test/x.png')).toBeNull()
    expect(await fetchImageAsDataUrl('data:image/png;base64,YQ==')).toBe('data:image/png;base64,YQ==')
    expect(await fetchImageAsBuffer('data:image/png;base64,YQ==')).toEqual(Buffer.from('a'))
    expect(await fetchImageAsBuffer('data:image/png;base64,')).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
  it('encodes only successful image responses and supplies cancellation', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response('abc', { headers: { 'Content-Type': 'image/png' } })))
    expect(await fetchImageAsDataUrl('https://vexnexa.com/logo.png')).toBe('data:image/png;base64,YWJj')
    expect(await fetchImageAsBuffer('https://vexnexa.com/logo.png')).toEqual(Buffer.from('abc'))
    expect(fetchMock).toHaveBeenCalledWith('https://vexnexa.com/logo.png', expect.objectContaining({ signal: expect.any(AbortSignal), headers: { Accept: 'image/*' } }))
    expect(vi.getTimerCount()).toBe(0)
  })
  it.each([['http error', () => new Response('', { status: 404 })], ['not an image', () => new Response('html', { headers: { 'Content-Type': 'text/html' } })], ['oversized image', () => new Response(new Uint8Array(2 * 1024 * 1024 + 1), { headers: { 'Content-Type': 'image/png' } })]])('drops %s responses', async (_name, response) => {
    fetchMock.mockImplementation(() => Promise.resolve(response()))
    expect(await fetchImageAsDataUrl('https://vexnexa.com/logo.png')).toBe('')
    expect(await fetchImageAsBuffer('https://vexnexa.com/logo.png')).toBeNull()
  })
  it('handles missing content-type according to each export format', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(new Response(new Uint8Array([1]))))
    expect(await fetchImageAsDataUrl('https://vexnexa.com/logo.png')).toBe('data:image/png;base64,AQ==')
    expect(await fetchImageAsBuffer('https://vexnexa.com/logo.png')).toBeNull()
  })
  it('aborts a hanging provider after five seconds and returns the fallback', async () => {
    fetchMock.mockImplementation((_url, init) => new Promise((_resolve, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted')))))
    const data = fetchImageAsDataUrl('https://vexnexa.com/logo.png')
    const buffer = fetchImageAsBuffer('https://vexnexa.com/logo.png')
    await vi.advanceTimersByTimeAsync(5_000)
    expect(await data).toBe('')
    expect(await buffer).toBeNull()
  })
})
