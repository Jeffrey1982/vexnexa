import Image from 'next/image';
import Link from 'next/link';
import {notFound} from 'next/navigation';
import {ArrowRight} from 'lucide-react';
import {getContent,isLocale} from '../../../../studio/lib/content';
import {pageMetadata} from '../../../../studio/lib/metadata';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?pageMetadata(locale,'studio'):{};}
export default async function Studio({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const c=getContent(locale);return <main id="main-content"><section className="page-hero"><div className="wrap"><p className="eyebrow">{c.studio.eyebrow}</p><h1>{c.studio.title}</h1><p className="lead">{c.studio.intro}</p></div></section><section className="wrap page-content"><div className="split"><div className="prose">{c.studio.paragraphs.map(p=><p key={p}>{p}</p>)}<Link className="button" href={`/${locale}/contact`}>{c.studio.contactCta}<ArrowRight size={20} aria-hidden="true"/></Link></div><div className="studio-portrait"><Image src="/studio/ipiwow-mascot.png" width={1280} height={1280} alt={c.common.mascotAlt} sizes="(max-width:800px) 80vw, 420px"/></div></div><div className="values">{c.studio.values.map(value=><section key={value.title}><h3>{value.title}</h3><p>{value.body}</p></section>)}</div></section></main>;}
