import Link from 'next/link';
import {notFound} from 'next/navigation';
import {getContent,isLocale} from '../../../../studio/lib/content';
import {pageMetadata} from '../../../../studio/lib/metadata';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?pageMetadata(locale,'privacy'):{};}
export default async function Privacy({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const c=getContent(locale);return <main id="main-content"><section className="page-hero"><div className="wrap"><p className="eyebrow">{c.privacy.eyebrow}</p><h1>{c.privacy.title}</h1><p className="lead">{c.privacy.intro}</p></div></section><div className="wrap page-content"><article className="prose">{c.privacy.sections.map(section=><section key={section.title}><h2>{section.title}</h2><p>{section.body}</p></section>)}<Link className="button" href={`/${locale}/contact`}>{c.privacy.contactCta}</Link></article></div></main>;}
