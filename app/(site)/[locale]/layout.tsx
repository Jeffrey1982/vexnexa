import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { notFound } from 'next/navigation';
import { Barlow_Condensed, Atkinson_Hyperlegible_Next } from 'next/font/google';
import { locales, isLocale, getContent } from '../../../studio/lib/content';
import { SiteHeader } from '../../../studio/components/SiteHeader';
import { SiteFooter } from '../../../studio/components/SiteFooter';
import { LegacyWorkerCleanup } from '../../../studio/components/LegacyWorkerCleanup';
import '../../../studio/styles.css';

const display = Barlow_Condensed({subsets:['latin','latin-ext'],weight:['600','700','800'],display:'swap',variable:'--font-display'});
const body = Atkinson_Hyperlegible_Next({subsets:['latin','latin-ext'],display:'swap',variable:'--font-body',adjustFontFallback:false,fallback:['Arial','sans-serif']});
export const viewport: Viewport = {width:'device-width',initialScale:1,themeColor:'#87dff0'};
export const dynamicParams = false;
export function generateStaticParams() { return locales.map(locale => ({locale})); }
export default async function Layout({children,params}: {children:ReactNode;params:Promise<{locale:string}>}) {
  const {locale} = await params;
  if (!isLocale(locale)) notFound();
  const copy = getContent(locale);
  return <html lang={locale === 'pt' ? 'pt-PT' : locale}><body className={`${display.variable} ${body.variable}`}><SiteHeader locale={locale} copy={copy}/>{children}<SiteFooter locale={locale} copy={copy}/><LegacyWorkerCleanup/></body></html>;
}
