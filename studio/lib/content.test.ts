import { describe, expect, it } from 'vitest';
import {
  content, defaultLocale, getContent, getSeo, isLocale,
  languageNames, locales, pageNames, type Locale,
} from './content';

function leaves(value: unknown, path = ''): Array<[string, string]> {
  if (typeof value === 'string') return [[path, value]];
  if (value === null || typeof value !== 'object') {
    throw new Error(`Unexpected non-text value at ${path}`);
  }
  return Object.entries(value).flatMap(([key, child]) =>
    leaves(child, path ? `${path}.${key}` : key));
}

describe('studio languages', () => {
  it('supports exactly the seven approved languages with native labels', () => {
    expect(locales).toEqual(['nl', 'en', 'de', 'fr', 'es', 'pt', 'tl']);
    expect(Object.keys(content)).toEqual([...locales]);
    expect(Object.keys(languageNames)).toEqual([...locales]);
    expect(languageNames).toEqual({
      nl: 'Nederlands', en: 'English', de: 'Deutsch', fr: 'Français',
      es: 'Español', pt: 'Português', tl: 'Tagalog',
    });
    expect(defaultLocale).toBe('nl');
  });

  it.each(locales)('accepts the exact route language %s', locale => {
    expect(isLocale(locale)).toBe(true);
    expect(getContent(locale)).toBe(content[locale]);
  });

  it.each([
    '', 'NL', 'nl-NL', 'pt-BR', 'fil', 'it', '../nl', '/en', 'en/',
    ' en', 'en ', '<script>', '__proto__', 'constructor', null, undefined, 0, {}, [],
  ])('rejects unsupported or malformed route language %j', value => {
    expect(isLocale(value)).toBe(false);
  });
});

describe('complete explicit translations', () => {
  const expectedPaths = leaves(content.nl).map(([path]) => path).sort();

  it.each(locales)('%s has the same complete structure, with no empty or malformed text', locale => {
    const strings = leaves(content[locale]);
    expect(strings.map(([path]) => path).sort()).toEqual(expectedPaths);
    for (const [path, text] of strings) {
      expect(text, `${locale}.${path}`).toBe(text.trim());
      expect(text.length, `${locale}.${path}`).toBeGreaterThan(0);
      expect(text.length, `${locale}.${path}`).toBeLessThanOrEqual(1_000);
      expect(text, `${locale}.${path}`).toBe(text.normalize('NFC'));
      expect(text, `${locale}.${path}`).not.toMatch(/[\u0000-\u001f\u007f\ufffd]/);
      expect(text, `${locale}.${path}`).not.toMatch(/<[^>]*>|\[TODO\]|\{\{.*?\}\}|—/);
    }
  });

  it.each(locales)('%s keeps navigation, headings and actions within useful layout limits', locale => {
    const dictionary = getContent(locale);
    for (const label of Object.values(dictionary.nav)) expect(label.length).toBeLessThanOrEqual(30);
    for (const line of dictionary.home.heroTitle) expect(line.length).toBeLessThanOrEqual(40);
    for (const action of [
      dictionary.home.cta, dictionary.home.gameCta, dictionary.home.studioCta,
      dictionary.home.contactCta, dictionary.studio.contactCta, dictionary.contact.submit,
    ]) expect(action.length).toBeLessThanOrEqual(45);
    expect(dictionary.home.facts).toHaveLength(3);
    expect(dictionary.ipiwow.features).toHaveLength(3);
    expect(dictionary.ipiwow.screenshotAlts).toHaveLength(3);
    expect(dictionary.ipiwow.details).toHaveLength(4);
    expect(dictionary.privacy.sections).toHaveLength(7);
  });

  it('has independently authored visitor-facing copy for every language', () => {
    expect(new Set(locales.map(locale => content[locale].home.intro)).size).toBe(7);
    expect(new Set(locales.map(locale => content[locale].home.heroTitle.join(' '))).size).toBe(7);
    expect(new Set(locales.map(locale => content[locale].contact.successBody)).size).toBe(7);
    expect(new Set(locales.map(locale => content[locale].privacy.intro)).size).toBe(7);
    for (const locale of locales.filter((value): value is Exclude<Locale, 'en'> => value !== 'en')) {
      expect(content[locale].contact.errors).not.toBe(content.en.contact.errors);
      expect(content[locale].privacy.sections).not.toBe(content.en.privacy.sections);
      expect(content[locale].studio.paragraphs).not.toEqual(content.en.studio.paragraphs);
    }
  });

  it.each(locales)('%s preserves verified game facts and contact recovery paths', locale => {
    const dictionary = getContent(locale);
    expect(dictionary.home.spotlightDescription).toContain('200');
    expect(dictionary.ipiwow.details[0].body).toContain('10');
    expect(dictionary.ipiwow.details[1].body).toContain('200');
    expect(dictionary.ipiwow.appStoreNote).toContain('iPhone');
    expect(dictionary.ipiwow.appStoreNote).toContain('App Store');
    expect(dictionary.contact.errors.name).toContain('2');
    expect(dictionary.contact.errors.name).toContain('100');
    expect(dictionary.contact.errors.message).toContain('10');
    expect(dictionary.contact.errors.send).toContain('info@vexnexa.com');
    expect(dictionary.contact.errors.unavailable).toContain('info@vexnexa.com');
    expect(dictionary.privacy.sections[2].body).toContain('Vercel');
    expect(dictionary.privacy.sections[2].body).toContain('Resend');
    expect(dictionary.support.billingNote.length).toBeGreaterThan(80);
    const unverifiedClaims = /€|\$\d|Android|Steam|Google Play|five.star|award.winning/i;
    expect(unverifiedClaims.test(JSON.stringify(dictionary))).toBe(false);
  });
});

describe('localized SEO content', () => {
  it.each(locales)('%s supplies concise metadata for all six pages', locale => {
    const dictionary = getContent(locale);
    expect(Object.keys(dictionary.seo)).toEqual([...pageNames]);
    for (const page of pageNames) {
      const seo = getSeo(locale, page);
      expect(seo).toBe(dictionary.seo[page]);
      expect(seo.title).toContain('VexNexa');
      expect(seo.title.length).toBeLessThanOrEqual(70);
      expect(seo.description.length).toBeGreaterThanOrEqual(70);
      expect(seo.description.length).toBeLessThanOrEqual(180);
    }
    expect(new Set(Object.values(dictionary.seo).map(seo => seo.title)).size).toBe(6);
    expect(new Set(Object.values(dictionary.seo).map(seo => seo.description)).size).toBe(6);
  });
});
