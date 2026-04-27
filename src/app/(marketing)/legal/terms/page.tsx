import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Scale, Mail, Calendar, AlertTriangle, ListTree } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Terms of Service - VexNexa',
  description:
    'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
  keywords: [
    'algemene voorwaarden',
    'terms of service',
    'usage terms',
    'service conditions',
    'liability',
  ],
  openGraph: {
    title: 'Terms of Service - VexNexa',
    description:
      'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
    url: 'https://vexnexa.com/legal/terms',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Terms of Service - VexNexa',
    description:
      'Read VexNexa terms of service: usage terms, payments, liability and service conditions.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/legal/terms',
    languages: { 'nl-NL': 'https://vexnexa.com/legal/terms' },
  },
  robots: { index: true, follow: true },
}


export default async function TermsPage() {
  const t = await getTranslations('legal.terms');
  const tc = await getTranslations('legal.common');
  
  const sections = [
    { id: 'toepassing', label: t('section1.title') },
    { id: 'gebruik', label: t('section2.title') },
    { id: 'api', label: t('section3.title') },
    { id: 'betalingen', label: t('section4.title') },
    { id: 'beschikbaarheid', label: t('section5.title') },
    { id: 'ip', label: t('section6.title') },
    { id: 'liability', label: t('section7.title') },
    { id: 'privacy', label: t('section8.title') },
    { id: 'beindiging', label: t('section9.title') },
    { id: 'recht', label: t('section10.title') },
    { id: 'wijzigingen', label: t('section11.title') },
    { id: 'contact', label: t('section12.title') },
  ]

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        {tc('skipToContent')}
      </a>

      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-primary/5 via-transparent to-transparent">
        <div className="absolute -top-24 -right-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative p-6 sm:p-10">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded-md"
          >
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {tc('backToHome')}
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">{t('title')}</h1>
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {tc('lastUpdated')}: {t('lastUpdated')}
            </Badge>
            <Badge variant="secondary" aria-label={`Policy version ${t('version')}`}>
              {t('version')}
            </Badge>
          </div>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t('description')}
          </p>

          {/* Summary */}
          <div className="mt-8">
            <Card className="border-warning/30 bg-warning/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Scale className="h-5 w-5" aria-hidden="true" />
                  {t('summary.title')}
                </CardTitle>
                <CardDescription>{t('summary.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.mayTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                    <li>{t('summary.mayItems.0')}</li>
                    <li>{t('summary.mayItems.1')}</li>
                    <li>{t('summary.mayItems.2')}</li>
                    <li>{t('summary.mayItems.3')}</li>
                  </ul>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.notAllowedTitle')}</p>
                  <ul className="list-disc pl-5 space-y-1 leading-relaxed">
                    <li>{t('summary.notAllowedItems.0')}</li>
                    <li>{t('summary.notAllowedItems.1')}</li>
                    <li>{t('summary.notAllowedItems.2')}</li>
                  </ul>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-sm text-muted-foreground border-t pt-3">
                    <AlertTriangle className="inline h-4 w-4 mr-1" aria-hidden="true" />
                    {t('summary.byUsing')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Content + Aside */}
      <div className="mt-14 grid gap-10 lg:grid-cols-[1fr_300px]">
        {/* Main content */}
        <div
          className={[
            'prose prose-slate max-w-none',
            '[&_h2]:mt-14 [&&_h2]:mb-5 [&&_h2]:scroll-mt-24',
            '[&_h3]:mt-9  [&&_h3]:mb-3',
            '[&_ul]:my-5 [&&_ul>li]:my-2 [&&_ol]:my-5 [&&_ol>li]:my-2 leading-relaxed',
            '[&_h2]:pb-2 [&&_h2]:border-b [&&_h2]:border-muted',
          ].join(' ')}
        >
          {/* 1 */}
          <section id="toepassing">
            <h2>{t('section1.title')}</h2>
            <h3>{t('section1.definitionsTitle')}</h3>
            <ul>
              <li><strong>{t('section1.definitions.0.term')}</strong>: {t('section1.definitions.0.desc')}</li>
              <li><strong>{t('section1.definitions.1.term')}</strong>: {t('section1.definitions.1.desc')}</li>
              <li><strong>{t('section1.definitions.2.term')}</strong>: {t('section1.definitions.2.desc')}</li>
              <li><strong>{t('section1.definitions.3.term')}</strong>: {t('section1.definitions.3.desc')}</li>
              <li><strong>{t('section1.definitions.4.term')}</strong>: {t('section1.definitions.4.desc')}</li>
              <li><strong>{t('section1.definitions.5.term')}</strong>: {t('section1.definitions.5.desc')}</li>
            </ul>
            <h3>{t('section1.applicabilityTitle')}</h3>
            <p>{t('section1.applicability')}</p>
            <div className="not-prose mt-5 rounded-lg border bg-muted p-4">
              <p className="font-medium">{t('section1.legalInfoTitle')}</p>
              <p className="text-sm text-muted-foreground">
                <strong>Bedrijfsnaam:</strong> {t('section1.companyName')} <br />
                <strong>Adres:</strong> {t('section1.address')} <br />
                <strong>KvK-nummer:</strong> {t('section1.kvk')} &nbsp; <strong>Vestigingsnummer:</strong> {t('section1.establishment')} <br />
                <strong>E-mail:</strong>{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('section1.email')}</a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="gebruik">
            <h2>{t('section2.title')}</h2>
            <h3>{t('section2.allowedTitle')}</h3>
            <ul>
              <li>{t('section2.allowed.0')}</li>
              <li>{t('section2.allowed.1')}</li>
              <li>{t('section2.allowed.2')}</li>
            </ul>
            <h3>{t('section2.notAllowedTitle')}</h3>
            <ul>
              <li>{t('section2.notAllowed.0')}</li>
              <li>{t('section2.notAllowed.1')}</li>
              <li>{t('section2.notAllowed.2')}</li>
              <li>{t('section2.notAllowed.3')}</li>
            </ul>
            <h3>{t('section2.accountSecurityTitle')}</h3>
            <ul>
              <li>{t('section2.accountSecurity.0')}</li>
              <li>
                {t('section2.accountSecurity.1')}{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('section1.email')}</a>
              </li>
              <li>{t('section2.accountSecurity.2')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="api">
            <h2>{t('section3.title')}</h2>
            <p>{t('section3.content')}</p>
            <ul>
              <li>{t('section3.rules.0')}</li>
              <li>{t('section3.rules.1')}</li>
              <li>{t('section3.rules.2')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="betalingen">
            <h2>{t('section4.title')}</h2>

            <div className="not-prose my-5 rounded-lg border-l-4 border-primary bg-primary/5 p-4">
              <p className="text-sm">{t('section4.priceNotice')}</p>
            </div>

            <h3>{t('section4.trialTitle')}</h3>
            <ul>
              <li>{t('section4.trial.0')}</li>
              <li><strong>{t('section4.trial.1').split(':')[0]}:</strong>{t('section4.trial.1').substring(t('section4.trial.1').indexOf(':') + 1)}</li>
              <li>{t('section4.trial.2')}</li>
              <li>{t('section4.trial.3')}</li>
              <li>{t('section4.trial.4')}</li>
            </ul>

            <h3>{t('section4.paidTitle')}</h3>
            <ul>
              <li><strong>{t('section4.paid.0')}</strong></li>
              <li>
                {t('section4.paid.1').replace('Mollie B.V.', '<strong>Mollie B.V.</strong>')}
              </li>
              <li>{t('section4.paid.2')}</li>
              <li>{t('section4.paid.3')}</li>
              <li>{t('section4.paid.4')}</li>
            </ul>

            <h3>{t('section4.limitsTitle')}</h3>
            <ul>
              <li><strong>{t('section4.limits.0').split(':')[0]}:</strong>{t('section4.limits.0').substring(t('section4.limits.0').indexOf(':') + 1)}</li>
              <li>
                <strong>{t('section4.limits.1').split(':')[0]}:</strong>{t('section4.limits.1').substring(t('section4.limits.1').indexOf(':') + 1)}
              </li>
              <li>{t('section4.limits.2')}</li>
              <li>{t('section4.limits.3')}</li>
            </ul>

            <h3>{t('section4.refundsTitle')}</h3>
            <ul>
              <li>{t('section4.refunds.0')}</li>
              <li>{t('section4.refunds.1')}</li>
              <li>{t('section4.refunds.2')}</li>
            </ul>

            <h3>{t('section4.withdrawalTitle')}</h3>
            <p>{t('section4.withdrawalIntro')}</p>
            <p><strong>{t('section4.withdrawalWaiver')}</strong></p>
            <p>{t('section4.withdrawalFuture')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="beschikbaarheid">
            <h2>{t('section5.title')}</h2>
            <h3>{t('section5.slaTitle')}</h3>
            <ul>
              <li>{t('section5.sla.0')}</li>
              <li>{t('section5.sla.1')}</li>
              <li>{t('section5.sla.2')}</li>
            </ul>
            <h3>{t('section5.supportTitle')}</h3>
            <ul>
              <li><strong>Free:</strong> {t('section5.support.0')}</li>
              <li><strong>Pro:</strong> {t('section5.support.1')}</li>
              <li><strong>Team:</strong> {t('section5.support.2')}</li>
            </ul>
            <h3>{t('section5.changesTitle')}</h3>
            <p>{t('section5.changes')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ip">
            <h2>{t('section6.title')}</h2>
            <h3>{t('section6.ourRightsTitle')}</h3>
            <ul>
              <li>{t('section6.ourRights.0')}</li>
              <li>{t('section6.ourRights.1')}</li>
            </ul>
            <h3>{t('section6.yourContentTitle')}</h3>
            <ul>
              <li>{t('section6.yourContent.0')}</li>
              <li>{t('section6.yourContent.1')}</li>
              <li>{t('section6.yourContent.2')}</li>
            </ul>
            <h3>{t('section6.noticesTitle')}</h3>
            <p>
              {t('section6.notices')}{' '}
              <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('section1.email')}</a>.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="liability">
            <h2>{t('section7.title')}</h2>
            <h3>{t('section7.warrantyTitle')}</h3>
            <ul>
              <li>{t('section7.warranty.0')}</li>
              <li>{t('section7.warranty.1')}</li>
            </ul>
            <h3>{t('section7.liabilityTitle')}</h3>
            <ul>
              <li>{t('section7.liability.0')}</li>
              <li>{t('section7.liability.1')}</li>
              <li>{t('section7.liability.2')}</li>
            </ul>
            <h3>{t('section7.forceMajeureTitle')}</h3>
            <ul>
              <li>{t('section7.forceMajeure')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="privacy">
            <h2>{t('section8.title')}</h2>
            <p>
              {t('section8.content')}{' '}
              <Link className="text-primary hover:underline" href="/legal/privacy">{t('footer.privacyLink')}</Link>.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="beindiging">
            <h2>{t('section9.title')}</h2>
            <h3>{t('section9.byYouTitle')}</h3>
            <ul>
              <li>{t('section9.byYou.0')}</li>
              <li>{t('section9.byYou.1')}</li>
            </ul>
            <h3>{t('section9.byUsTitle')}</h3>
            <ul>
              <li>{t('section9.byUs.0')}</li>
              <li>{t('section9.byUs.1')}</li>
            </ul>
            <h3>{t('section9.consequencesTitle')}</h3>
            <ul>
              <li>{t('section9.consequences.0')}</li>
              <li>{t('section9.consequences.1')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="recht">
            <h2>{t('section10.title')}</h2>
            <h3>{t('section10.lawTitle')}</h3>
            <p>{t('section10.law')}</p>
            <h3>{t('section10.disputesTitle')}</h3>
            <ol>
              <li>
                {t('section10.disputes.0')}{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('section1.email')}</a>
              </li>
              <li>{t('section10.disputes.1')}</li>
              <li>{t('section10.disputes.2')}</li>
              <li>{t('section10.disputes.3')}</li>
            </ol>
            <h3>{t('section10.consumerRightsTitle')}</h3>
            <p>{t('section10.consumerRights')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="wijzigingen">
            <h2>{t('section11.title')}</h2>
            <h3>{t('section11.changesTitle')}</h3>
            <p>{t('section11.changes')}</p>
            <h3>{t('section11.severabilityTitle')}</h3>
            <ul>
              <li>{t('section11.severability.0')}</li>
              <li>{t('section11.severability.1')}</li>
              <li>{t('section11.severability.2')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="contact">
            <h2>{t('section12.title')}</h2>
            <div className="not-prose rounded-lg border bg-muted p-4 space-y-2">
              <p className="font-medium">{t('section12.titleText')}</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                {t('section12.email')}{' '}
                <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('section1.email')}</a>
              </p>
            </div>
          </section>

          {/* Footer strip */}
          <div className="not-prose mt-12 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{tc('lastUpdated')}: {t('lastUpdated')}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/privacy">{t('footer.privacyLink')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">{t('footer.contactLink')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Aside */}
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ListTree className="h-4 w-4" />
                {tc('onThisPage')}
              </CardTitle>
              <CardDescription>{tc('quickNavigation')}</CardDescription>
            </CardHeader>
            <CardContent className="text-sm">
              <nav aria-label="Table of contents" className="space-y-2">
                {sections.map((s) => (
                  <div key={s.id}>
                    <Link
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring rounded"
                    >
                      {s.label}
                    </Link>
                  </div>
                ))}
              </nav>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{tc('needHelp')}</CardTitle>
              <CardDescription>{tc('responseTime')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <Link href="/contact">{tc('contactUs')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
