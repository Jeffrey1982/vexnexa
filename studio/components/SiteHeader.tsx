'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Menu, X, Globe2 } from 'lucide-react';
import { locales, languageNames, type Locale, type StudioContent } from '../lib/content';

export function SiteHeader({ locale, copy }: { locale: Locale; copy: StudioContent }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  return <>
    <a className="skip-link" href="#main-content">{copy.common.skipToContent}</a>
    <header className="site-header">
      <div className="header-inner wrap">
        <Link href={`/${locale}`} className="wordmark" aria-label="VexNexa Game Studio" onClick={() => setOpen(false)}>
          VexNexa<span>GAME STUDIO</span>
        </Link>
        <nav aria-label={copy.common.menu} className={open ? 'main-nav is-open' : 'main-nav'}>
          <Link href={`/${locale}#games`} onClick={() => setOpen(false)}>{copy.nav.games}</Link>
          <Link href={`/${locale}/studio`} onClick={() => setOpen(false)}>{copy.nav.studio}</Link>
          <Link href={`/${locale}/contact`} onClick={() => setOpen(false)}>{copy.nav.contact}</Link>
        </nav>
        <div className="header-actions">
          <label className="language-picker"><Globe2 size={18} aria-hidden="true" />
            <span className="sr-only">{copy.common.language}</span>
            <select value={locale} aria-label={copy.common.language} onChange={(event) => {
              const suffix = pathname.split('/').slice(2).join('/');
              setOpen(false);
              router.push(`/${event.target.value}${suffix ? `/${suffix}` : ''}${window.location.hash}`);
            }}>{locales.map(lang => <option key={lang} value={lang}>{languageNames[lang]}</option>)}</select>
          </label>
          <button className="menu-button" type="button" aria-expanded={open} aria-label={open ? copy.common.closeMenu : copy.common.menu} onClick={() => setOpen(!open)}>
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>
    </header>
  </>;
}
