import Link from 'next/link';
import { locales, languageNames, type Locale, type StudioContent } from '../lib/content';

export function SiteFooter({locale, copy}: {locale: Locale; copy: StudioContent}) {
  return <footer className="site-footer wrap">
    <div><Link className="footer-wordmark" href={`/${locale}`}>VexNexa</Link><p>{copy.footer.tagline}</p></div>
    <nav className="footer-links" aria-label={copy.footer.support}>
      <Link href={`/${locale}/privacy`}>{copy.footer.privacy}</Link>
      <Link href={`/${locale}/support`}>{copy.footer.support}</Link>
      <Link href={`/${locale}/contact`}>{copy.nav.contact}</Link>
    </nav>
    <nav className="footer-languages" aria-label={copy.common.language}>
      {locales.map(lang => <Link key={lang} href={`/${lang}`} hrefLang={lang === 'pt' ? 'pt-PT' : lang} lang={lang} aria-label={languageNames[lang]} aria-current={lang === locale ? 'page' : undefined}>{lang.toUpperCase()}</Link>)}
    </nav>
    <small className="footer-copyright">© {new Date().getFullYear()} VexNexa. {copy.footer.rights}</small>
  </footer>;
}
