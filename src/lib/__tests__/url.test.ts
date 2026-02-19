import { describe, it, expect } from 'vitest'
import { normalizeUrl } from '../url'

describe('normalizeUrl', () => {
  it('adds https:// when no protocol is provided', () => {
    expect(normalizeUrl('example.com')).toBe('https://example.com/')
  })

  it('preserves https:// protocol', () => {
    expect(normalizeUrl('https://example.com')).toBe('https://example.com/')
  })

  it('preserves http:// protocol', () => {
    expect(normalizeUrl('http://example.com')).toBe('http://example.com/')
  })

  it('preserves path', () => {
    expect(normalizeUrl('https://example.com/about')).toBe('https://example.com/about')
  })

  it('strips query params and hash', () => {
    const result = normalizeUrl('https://example.com/page?q=1#section')
    expect(result).toBe('https://example.com/page')
  })

  it('trims whitespace', () => {
    expect(normalizeUrl('  example.com  ')).toBe('https://example.com/')
  })

  it('returns null for empty string', () => {
    expect(normalizeUrl('')).toBeNull()
  })

  it('returns null for invalid URL', () => {
    expect(normalizeUrl('not a url at all :::')).toBeNull()
  })

  it('handles null/undefined input gracefully', () => {
    expect(normalizeUrl(null as unknown as string)).toBeNull()
    expect(normalizeUrl(undefined as unknown as string)).toBeNull()
  })
})
