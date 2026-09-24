import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContent,isLocale} from '../../../../../studio/lib/content';
import {pageMetadata} from '../../../../../studio/lib/metadata';
import {GameArt} from '../../../../../studio/components/GameArt';
import {StoreLink} from '../../../../../studio/components/StoreLink';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?pageMetadata(locale,'ipiwow'):{};}
export default async function GamePage({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const c=getContent(locale);return <main id="main-content">
  <section className="game-page-hero"><div className="wrap split"><div className="game-page-copy"><p className="eyebrow">{c.ipiwow.eyebrow}</p><Image src="/studio/ipiwow-wordmark.svg" width={520} height={114} alt="IpiWow" className="game-wordmark" priority/><h1>{c.ipiwow.tagline}</h1><p>{c.ipiwow.intro}</p><StoreLink label={c.common.appStore}/><small>{c.ipiwow.appStoreNote}</small></div><GameArt alts={c.ipiwow.screenshotAlts} mascotAlt={c.common.mascotAlt} priority/></div></section>
  <section className="wrap page-content"><h2 className="section-heading">{c.ipiwow.screenshotsTitle}</h2><div className="screenshots">{['home','categories','quiz'].map((screen,index)=><figure key={screen}><Image src={`/studio/ipiwow-${screen}.png`} width={1284} height={2778} alt={c.ipiwow.screenshotAlts[index]} sizes="(max-width:480px) 80vw, (max-width:800px) 30vw, 300px"/><figcaption>{c.ipiwow.screenshotAlts[index]}</figcaption></figure>)}</div><div className="game-features">{c.ipiwow.features.map(feature=><section key={feature.title}><h3>{feature.title}</h3><p>{feature.body}</p></section>)}</div></section>
  <section className="game-details"><div className="wrap"><h2>{c.ipiwow.detailsTitle}</h2><dl>{c.ipiwow.details.map(detail=><div key={detail.title}><dt>{detail.title}</dt><dd>{detail.body}</dd></div>)}</dl><h2>{c.ipiwow.languagesTitle}</h2><p>{c.ipiwow.languagesBody}</p><section className="parent-note"><h2>{c.ipiwow.parentTitle}</h2><p>{c.ipiwow.parentBody}</p><div className="button-row" style={{marginTop:'1.5rem'}}><Link className="button" href={`/${locale}/support`}>{c.ipiwow.supportCta}</Link><Link className="text-link" href={`/${locale}/privacy`}>{c.ipiwow.privacyCta}</Link></div></section></div></section>
</main>;}
