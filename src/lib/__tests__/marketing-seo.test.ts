import { describe, expect, it } from 'vitest'
import {
  INDEXABLE_MARKETING_LOCALES,
  buildAlternates,
  canonicalMarketingLocale,
  isIndexableMarketingLocale,
} from '../marketing-seo'

describe('marketing SEO locale policy', () => {
  it('only exposes completed marketing translations as indexable locales', () => {
    expect(INDEXABLE_MARKETING_LOCALES).toEqual(['en', 'nl'])
    expect(isIndexableMarketingLocale('en')).toBe(true)
    expect(isIndexableMarketingLocale('nl')).toBe(true)
    expect(isIndexableMarketingLocale('fr')).toBe(false)
  })

  it('limits hreflang alternates to indexable marketing locales', () => {
    expect(buildAlternates('/pricing', 'nl')).toEqual({
      canonical: 'https://vexnexa.com/nl/pricing',
      languages: {
        en: 'https://vexnexa.com/pricing',
        nl: 'https://vexnexa.com/nl/pricing',
        'x-default': 'https://vexnexa.com/pricing',
      },
    })
  })

  it('canonicalizes unfinished marketing locales back to the default locale', () => {
    expect(canonicalMarketingLocale('de')).toBe('en')
    expect(buildAlternates('/features', 'de').canonical).toBe('https://vexnexa.com/features')
  })
})
