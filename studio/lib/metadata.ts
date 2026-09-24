import type { Metadata } from 'next';
import { getSeo, locales, type Locale, type PageName } from './content';
import { SITE_URL } from './site';
export const pagePaths: Record<PageName, string> = {home:'',ipiwow:'/games/ipiwow',studio:'/studio',contact:'/contact',privacy:'/privacy',support:'/support'};
export function pageMetadata(locale: Locale, page: PageName): Metadata {
  const seo = getSeo(locale, page);
  const path = pagePaths[page];
  return { ...seo, metadataBase: new URL(SITE_URL),
    alternates: {canonical:`${SITE_URL}/${locale}${path}`,languages: Object.fromEntries([...locales.map(lang => [lang === 'pt' ? 'pt-PT' : lang, `${SITE_URL}/${lang}${path}`]), ['x-default',`${SITE_URL}/en${path}`]])},
    openGraph: {...seo,type:'website',url:`${SITE_URL}/${locale}${path}`,siteName:'VexNexa',images:[{url:'/studio/ipiwow-mascot.png',width:1280,height:1280,alt:'IpiWow'}]},
    twitter: {card:'summary',...seo,images:['/studio/ipiwow-mascot.png']},
  };
}
