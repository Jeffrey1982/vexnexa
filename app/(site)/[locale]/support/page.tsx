import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContent,isLocale} from '../../../../studio/lib/content';
import {pageMetadata} from '../../../../studio/lib/metadata';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?pageMetadata(locale,'support'):{};}
export default async function Support({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const c=getContent(locale);return <main id="main-content"><section className="page-hero"><div className="wrap"><p className="eyebrow">{c.support.eyebrow}</p><h1>{c.support.title}</h1><p className="lead">{c.support.intro}</p></div></section><div className="wrap page-content"><article className="prose"><section><h2>{c.support.gameTitle}</h2><p>{c.support.gameBody}</p></section><section><h2>{c.support.formerTitle}</h2><p>{c.support.formerBody}</p><p>{c.support.billingNote}</p></section><Link className="button" href={`/${locale}/contact`}>{c.support.contactCta}</Link></article></div></main>;}
