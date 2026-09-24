import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, WifiOff, CircleOff } from 'lucide-react';
import { getContent, isLocale } from '../../../studio/lib/content';
import { pageMetadata } from '../../../studio/lib/metadata';
import { GameArt, Hills, Phone } from '../../../studio/components/GameArt';
import { StoreLink } from '../../../studio/components/StoreLink';

type Props = {params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props) {const {locale}=await params;return isLocale(locale)?pageMetadata(locale,'home'):{};}
export default async function Home({params}:Props) {
  const {locale}=await params; if(!isLocale(locale))notFound(); const c=getContent(locale);
  const icons=[BookOpen,WifiOff,CircleOff];
  return <main id="main-content">
    <section className="hero"><div className="wrap hero-inner">
      <div className="hero-copy"><p className="eyebrow">{c.home.eyebrow}</p><h1>{c.home.heroTitle.map(line=><span key={line}>{line}</span>)}</h1><p className="hero-intro">{c.home.intro}</p><Link className="button" href="#games">{c.home.cta}<ArrowRight size={20} aria-hidden="true"/></Link></div>
      <GameArt alts={c.ipiwow.screenshotAlts} mascotAlt={c.common.mascotAlt} priority />
    </div><Hills/></section>
    <section className="spotlight wrap" id="games" aria-labelledby="game-heading">
      <div className="spotlight-copy"><p className="eyebrow">{c.home.gamesEyebrow}</p><Link href={`/${locale}/games/ipiwow`} className="game-logo-link"><Image src="/studio/ipiwow-wordmark.svg" alt="IpiWow" width={440} height={97}/></Link><h2 id="game-heading">{c.home.spotlightTitle}</h2><p>{c.home.spotlightDescription}</p><div className="button-row"><StoreLink label={c.common.appStore}/><Link className="text-link" href={`/${locale}/games/ipiwow`}>{c.home.gameCta}<ArrowRight size={18} aria-hidden="true"/></Link></div></div>
      <div className="spotlight-preview"><Phone screen="quiz" alt={c.ipiwow.screenshotAlts[2]}/><ul className="game-facts">{c.home.facts.map((fact,i)=>{const Icon=icons[i];return <li key={fact}><span className={`fact-icon fact-${i}`}><Icon size={25} aria-hidden="true"/></span>{fact}</li>;})}</ul></div>
    </section>
    <section className="studio-strip"><div className="wrap"><h2>{c.home.studioTitle}</h2><Link className="text-link" href={`/${locale}/studio`}>{c.home.studioCta}<ArrowRight size={20} aria-hidden="true"/></Link></div></section>
  </main>;
}
