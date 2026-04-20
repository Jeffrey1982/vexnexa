/**
 * Unit tests for src/lib/normalizeUrl.ts — URL canonicalisation used
 * throughout the crawler and scan pipeline to dedupe pages.
 */

import { describe, it, expect } from 'vitest'
import { normalizeUrl, sameOrigin } from '../normalizeUrl'

describe('normalizeUrl', () => {
  it('lowercases the hostname', () => {
    expect(normalizeUrl('https://VEXNEXA.COM/foo')).toBe('https://vexnexa.com/foo')
  })

  it('strips the hash fragment', () => {
    expect(normalizeUrl('https://example.com/p#section')).toBe('https://example.com/p')
  })

  it('sorts query parameters for stable comparison', () => {
    const a = normalizeUrl('https://example.com/p?b=2&a=1')
    const b = normalizeUrl('https://example.com/p?a=1&b=2')
    expect(a).toBe(b)
  })

  it('keeps https and http URLs intact', () => {
    expect(normalizeUrl('http://example.com/')).toMatch(/^http:/)
    expect(normalizeUrl('https://example.com/')).toMatch(/^https:/)
  })

  it('falls back to trimmed input on non-http(s) protocols', () => {
    expect(normalizeUrl('mailto:hi@example.com')).toBe('mailto:hi@example.com')
    expect(normalizeUrl('  not-a-url  ')).toBe('not-a-url')
  })

  it('is idempotent', () => {
    const once = normalizeUrl('https://A.Example.COM/p?b=2&a=1#frag')
    const twice = normalizeUrl(once)
    expect(twice).toBe(once)
  })
})

describe('sameOrigin', () => {
  it('returns true for same origin URLs', () => {
    expect(sameOrigin('https://vexnexa.com/a', 'https://vexnexa.com/b')).toBe(true)
  })
  it('returns false for different hosts', () => {
    expect(sameOrigin('https://vexnexa.com/a', 'https://evil.com/a')).toBe(false)
  })
  it('returns false for different ports', () => {
    expect(sameOrigin('https://vexnexa.com:8443/a', 'https://vexnexa.com/a')).toBe(false)
  })
  it('returns false for malformed URLs', () => {
    expect(sameOrigin('not-a-url', 'https://example.com/')).toBe(false)
  })
})
