import Image from 'next/image';
import {notFound} from 'next/navigation';
import {getContent,isLocale} from '../../../../studio/lib/content';
import {pageMetadata} from '../../../../studio/lib/metadata';
import {ContactForm} from '../../../../studio/components/ContactForm';
import {CONTACT_EMAIL} from '../../../../studio/lib/site';
type Props={params:Promise<{locale:string}>};
export async function generateMetadata({params}:Props){const{locale}=await params;return isLocale(locale)?pageMetadata(locale,'contact'):{};}
export default async function Contact({params}:Props){const{locale}=await params;if(!isLocale(locale))notFound();const c=getContent(locale);return <main id="main-content"><section className="page-hero"><div className="wrap"><p className="eyebrow">{c.contact.eyebrow}</p><h1>{c.contact.title}</h1><p className="lead">{c.contact.intro}</p></div></section><div className="wrap contact-layout"><aside className="contact-aside"><h2>{c.contact.directTitle}</h2><p>{c.contact.directBody}<br/><a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a></p><Image className="contact-mascot" src="/studio/ipiwow-mascot.png" alt="" width={1280} height={1280} sizes="230px"/></aside><ContactForm locale={locale} copy={c.contact}/></div></main>;}
