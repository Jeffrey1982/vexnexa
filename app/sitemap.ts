import type {MetadataRoute} from 'next';
import {locales,pageNames} from '../studio/lib/content';
import {pagePaths} from '../studio/lib/metadata';
import {SITE_URL} from '../studio/lib/site';
export default function sitemap(): MetadataRoute.Sitemap {
  return pageNames.flatMap(page => locales.map(locale => ({
    url: `${SITE_URL}/${locale}${pagePaths[page]}`,
    alternates: {
      languages: Object.fromEntries([
        ...locales.map(lang => [lang === 'pt' ? 'pt-PT' : lang, `${SITE_URL}/${lang}${pagePaths[page]}`]),
        ['x-default', `${SITE_URL}/en${pagePaths[page]}`],
      ]),
    },
  })));
}
