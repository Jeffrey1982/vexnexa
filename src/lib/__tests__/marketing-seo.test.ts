import { describe, expect, it } from 'vitest'
import {
  INDEXABLE_MARKETING_LOCALES,
  buildAlternates,
  canonicalMarketingLocale,
  isIndexableMarketingLocale,
} from '../marketing-seo'

describe('marketing SEO locale policy', () => {
  it('exposes completed marketing translations as indexable locales', () => {
    expect(INDEXABLE_MARKETING_LOCALES).toEqual(['en', 'nl', 'de', 'fr', 'es', 'pt'])
    expect(isIndexableMarketingLocale('en')).toBe(true)
    expect(isIndexableMarketingLocale('nl')).toBe(true)
    expect(isIndexableMarketingLocale('fr')).toBe(true)
  })

  it('limits hreflang alternates to indexable marketing locales', () => {
    expect(buildAlternates('/pricing', 'nl')).toEqual({
      canonical: 'https://vexnexa.com/nl/pricing',
      languages: {
        en: 'https://vexnexa.com/pricing',
        nl: 'https://vexnexa.com/nl/pricing',
        de: 'https://vexnexa.com/de/pricing',
        fr: 'https://vexnexa.com/fr/pricing',
        es: 'https://vexnexa.com/es/pricing',
        pt: 'https://vexnexa.com/pt/pricing',
        'x-default': 'https://vexnexa.com/pricing',
      },
    })
  })

  it('keeps localized canonical urls for supported marketing locales', () => {
    expect(canonicalMarketingLocale('de')).toBe('de')
    expect(buildAlternates('/features', 'de').canonical).toBe('https://vexnexa.com/de/features')
  })
})
