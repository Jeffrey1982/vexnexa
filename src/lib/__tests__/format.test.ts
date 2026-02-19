import { describe, it, expect } from 'vitest'
import {
  formatImpact,
  getFaviconFromUrl,
  getScoreColor,
  getImpactColor,
} from '../format'

describe('format utilities', () => {
  describe('formatImpact', () => {
    it('capitalizes first letter', () => {
      expect(formatImpact('critical')).toBe('Critical')
      expect(formatImpact('serious')).toBe('Serious')
      expect(formatImpact('moderate')).toBe('Moderate')
      expect(formatImpact('minor')).toBe('Minor')
    })
  })

  describe('getFaviconFromUrl', () => {
    it('returns Google favicon URL for valid URL', () => {
      const result = getFaviconFromUrl('https://example.com/page')
      expect(result).toBe('https://www.google.com/s2/favicons?domain=example.com&sz=32')
    })

    it('returns fallback for invalid URL', () => {
      expect(getFaviconFromUrl('not-a-url')).toBe('/favicon.ico')
    })
  })

  describe('getScoreColor', () => {
    it('returns emerald for scores >= 80', () => {
      expect(getScoreColor(80)).toBe('emerald')
      expect(getScoreColor(100)).toBe('emerald')
    })

    it('returns amber for scores 50-79', () => {
      expect(getScoreColor(50)).toBe('amber')
      expect(getScoreColor(79)).toBe('amber')
    })

    it('returns red for scores < 50', () => {
      expect(getScoreColor(0)).toBe('red')
      expect(getScoreColor(49)).toBe('red')
    })
  })

  describe('getImpactColor', () => {
    it('returns red colors for critical', () => {
      const colors = getImpactColor('critical')
      expect(colors.bg).toContain('red')
      expect(colors.text).toContain('red')
    })

    it('returns orange colors for serious', () => {
      const colors = getImpactColor('serious')
      expect(colors.bg).toContain('orange')
    })

    it('returns amber colors for moderate', () => {
      const colors = getImpactColor('moderate')
      expect(colors.bg).toContain('amber')
    })

    it('returns slate colors for minor', () => {
      const colors = getImpactColor('minor')
      expect(colors.bg).toContain('slate')
    })
  })
})
