import { isMarketingLocale, isMarketingPath } from './marketing-seo';

/** Strip a supported locale for route comparison, never for external URLs. */
export function stripMarketingLocale(pathname: string): string {
  return pathname.replace(/^\/(?:en|nl|de|fr|es|pt)(?=\/|$)/, '') || '/';
}

/** Localize only known, root-relative marketing routes; preserve explicit targets. */
export function localizeMarketingHref(href: string, locale: string): string {
  if (!isMarketingLocale(locale) || locale === 'en') return href;
  if (!href.startsWith('/') || href.startsWith('//') || /[\\\s\u0000-\u001f\u007f]/.test(href)) return href;

  const path = href.split(/[?#]/, 1)[0];
  if (/^\/(?:en|nl|de|fr|es|pt)(?=\/|$)/.test(path) || !isMarketingPath(path)) return href;

  const suffix = href.slice(path.length);
  return `/${locale}${path === '/' ? '' : path}${suffix}`;
}
