import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar, ListTree } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Privacy Policy - VexNexa',
  description: 'Read our privacy policy: how VexNexa handles your data, cookies and privacy. GDPR compliant.',
  keywords: ['privacy policy','privacy policy','GDPR','AVG','data protection','cookies','data protection'],
  openGraph: {
    title: 'Privacy Policy - VexNexa',
    description: 'Read our privacy policy: how VexNexa handles your data, cookies and privacy. GDPR compliant.',
    url: 'https://vexnexa.com/legal/privacy',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - VexNexa',
    description: 'Read our privacy policy: how VexNexa handles your data, cookies and privacy. GDPR compliant.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/legal/privacy',
    languages: { 'nl-NL': 'https://vexnexa.com/legal/privacy' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = 'December 8, 2024' // Will use translation
const policyVersion = 'v1.2' // Will use translation

const sections = [
  { id: 'wie-we-zijn', label: '1. Who we are' },
  { id: 'welke-gegevens', label: '2. What data we collect' },
  { id: 'rechtsgronden', label: '3. Legal basis (Art. 6 GDPR)' },
  { id: 'cookies', label: '4. Cookies and tracking' },
  { id: 'verwerking-doelen', label: '5. How and why we use data' },
  { id: 'ontvangers', label: '6. Recipients and processors' },
  { id: 'doorgifte', label: '7. Transfers outside EU/EEA' },
  { id: 'beveiliging', label: '8. Data storage, security & retention' },
  { id: 'rechten', label: '9. Your rights (GDPR/AVG)' },
  { id: 'kinderen', label: '10. Children' },
  { id: 'datalek', label: '11. Data breaches' },
  { id: 'automated', label: '12. Automated decision-making' },
  { id: 'wijzigingen', label: '13. Changes to this policy' },
  { id: 'contact-klachten', label: '14. Contact & complaints' }
]

export default async function PrivacyPage() {
  const t = await getTranslations('legal.privacy');
  const tc = await getTranslations('legal.common');

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
            <Badge variant="secondary" aria-label={`Policy version ${policyVersion}`}>
              {policyVersion}
            </Badge>
          </div>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            {t('description')}
          </p>

          {/* Summary strip */}
          <div className="mt-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  {t('summary.title')}
                </CardTitle>
                <CardDescription>{t('summary.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.doTitle')}</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>{t('summary.doItems.0')}</li>
                    <li>{t('summary.doItems.1')}</li>
                    <li>{t('summary.doItems.2')}</li>
                    <li>{t('summary.doItems.3')}</li>
                  </ul>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">{t('summary.dontTitle')}</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>{t('summary.dontItems.0')}</li>
                    <li>{t('summary.dontItems.1')}</li>
                    <li>{t('summary.dontItems.2')}</li>
                    <li>{t('summary.dontItems.3')}</li>
                  </ul>
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
            // basis typografie
            'prose prose-slate max-w-none',
            // extra spacing tussen koppen & content
            '[&_h2]:mt-14 [&&_h2]:mb-5 [&&_h2]:scroll-mt-24',
            '[&_h3]:mt-9  [&&_h3]:mb-3',
            // lijsten luchtiger
            '[&_ul]:my-5 [&&_ul>li]:my-2 [&&_ol]:my-5 [&&_ol>li]:my-2 leading-relaxed',
            // subtiele onderstreping onder h2
            '[&_h2]:pb-2 [&&_h2]:border-b [&&_h2]:border-muted',
          ].join(' ')}
        >
          {/* helper: secties scheiden met dunne lijn */}
          const Divider = () =&gt; <div className="h-px bg-border my-10 not-prose" />

          {/* 1 */}
          <section id="wie-we-zijn">
            <h2>{t('section1.title')}</h2>
            <p>
              {t('section1.content')}
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">{t('section1.contactTitle')}</p>
              <p className="text-sm text-muted-foreground">
                <strong>Address:</strong> Provencialeweg 46B, 1562TB Krommenie, Netherlands <br />
                <strong>Chamber of Commerce:</strong> 94848262 &nbsp;|&nbsp; <strong>Establishment Number:</strong> 000060294744 <br />
                <strong>{t('section1.email')}:</strong>{' '}
                <a href="mailto:info@vexnexa.com" className="text-primary underline-offset-4 hover:underline">
                  info@vexnexa.com
                </a>
                {' '}| <strong>{t('section1.website')}:</strong>{' '}
                <a href="https://vexnexa.com" className="text-primary underline-offset-4 hover:underline">
                  vexnexa.com
                </a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="welke-gegevens">
            <h2>{t('section2.title')}</h2>

            <h3>{t('section2.scanDataTitle')}</h3>
            <ul>
              <li>{t('section2.scanDataItems.0')}</li>
              <li>{t('section2.scanDataItems.1')}</li>
              <li>{t('section2.scanDataItems.2')}</li>
              <li>{t('section2.scanDataItems.3')}</li>
            </ul>
            <p>
              <strong>{t('section2.important')}:</strong> {t('section2.importantNote')}
            </p>

            <h3>{t('section2.accountTitle')}</h3>
            <ul>
              <li>{t('section2.accountItems.0')}</li>
              <li>{t('section2.accountItems.1')}</li>
              <li>{t('section2.accountItems.2')}</li>
              <li>{t('section2.accountItems.3')}</li>
            </ul>

            <h3>{t('section2.contactTitle')}</h3>
            <ul>
              <li>{t('section2.contactItems.0')}</li>
              <li>{t('section2.contactItems.1')}</li>
              <li>{t('section2.contactItems.2')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="rechtsgronden">
            <h2>{t('section3.title')}</h2>
            <ul>
              <li>{t('section3.items.0')}</li>
              <li>{t('section3.items.1')}</li>
              <li>{t('section3.items.2')}</li>
              <li>{t('section3.items.3')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="cookies">
            <h2>{t('section4.title')}</h2>

            <h3>{t('section4.functionalTitle')}</h3>
            <ul>
              <li>{t('section4.functionalItems.0')}</li>
              <li>{t('section4.functionalItems.1')}</li>
              <li>{t('section4.functionalItems.2')}</li>
            </ul>

            <h3>{t('section4.analyticsTitle')}</h3>
            <p>
              {t('section4.analyticsIntro')}
            </p>
            <ul>
              <li>{t('section4.analyticsItems.0')}</li>
              <li>{t('section4.analyticsItems.1')}</li>
              <li>{t('section4.analyticsItems.2')}</li>
            </ul>
            <p>
              You can manage consent through the{' '}
              <Link href="/legal/cookies#instellingen" className="text-primary underline-offset-4 hover:underline">
                {t('section4.cookieSettings')}
              </Link>.
            </p>

            <h3>{t('section4.utmTitle')}</h3>
            <p>{t('section4.utmText')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="verwerking-doelen">
            <h2>{t('section5.title')}</h2>
            <ul>
              <li>{t('section5.items.0')}</li>
              <li>{t('section5.items.1')}</li>
              <li>{t('section5.items.2')}</li>
              <li>{t('section5.items.3')}</li>
              <li>{t('section5.items.4')}</li>
            </ul>
            <p>{t('section5.noSelling')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ontvangers">
            <h2>{t('section6.title')}</h2>
            <p>{t('section6.intro')}</p>
            <ul>
              <li>Hosting & edge: {/* Vercel (EU-regio) */}</li>
              <li>Database & opslag: {/* Supabase (EU project/region) */}</li>
              <li>Betalingen: {/* Mollie B.V. */}</li>
              <li>E-mail/transactioneel: {/* Resend/Postmark/Sendgrid, etc. */}</li>
              <li>Monitoring/logging: {/* partij of “n.v.t.” */}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="doorgifte">
            <h2>{t('section7.title')}</h2>
            <p>
              {t('section7.content')}
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="beveiliging">
            <h2>{t('section8.title')}</h2>

            <h3>{t('section8.storageTitle')}</h3>
            <ul>
              <li>{t('section8.storageItems.0')}</li>
              <li>{t('section8.storageItems.1')}</li>
            </ul>

            <h3>{t('section8.securityTitle')}</h3>
            <ul>
              <li>{t('section8.securityItems.0')}</li>
              <li>{t('section8.securityItems.1')}</li>
              <li>{t('section8.securityItems.2')}</li>
              <li>{t('section8.securityItems.3')}</li>
              <li>{t('section8.securityItems.4')}</li>
            </ul>

            <h3>{t('section8.retentionTitle')}</h3>
            <ul>
              <li>{t('section8.retentionItems.0')}</li>
              <li>{t('section8.retentionItems.1')}</li>
              <li>{t('section8.retentionItems.2')}</li>
              <li>{t('section8.retentionItems.3')}</li>
            </ul>
            <p>{t('section8.retentionNote')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="rechten">
            <h2>{t('section9.title')}</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="font-medium">{t('section9.accessTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.accessDesc')}</p>
                <p className="font-medium">{t('section9.rectificationTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.rectificationDesc')}</p>
                <p className="font-medium">{t('section9.erasureTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.erasureDesc')}</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">{t('section9.restrictionTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.restrictionDesc')}</p>
                <p className="font-medium">{t('section9.portabilityTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.portabilityDesc')}</p>
                <p className="font-medium">{t('section9.objectionTitle')}</p>
                <p className="text-sm text-muted-foreground">{t('section9.objectionDesc')}</p>
              </div>
            </div>
            <p className="mt-3">
              Je rechten uitoefenen? Mail{' '}
              <a href="mailto:info@vexnexa.com" className="text-primary underline-offset-4 hover:underline">
                info@vexnexa.com
              </a>. {t('section9.responseText')}
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="kinderen">
            <h2>{t('section10.title')}</h2>
            <p>{t('section10.content')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="datalek">
            <h2>11. Data breaches</h2>
            <p>We immediately investigate the impact, limit risks and report if required to the Dutch Data Protection Authority and affected parties.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="automated">
            <h2>{t('section12.title')}</h2>
            <p>{t('section12.content')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 13 */}
          <section id="wijzigingen">
            <h2>{t('section13.title')}</h2>
            <p>{t('section13.content')}</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 14 */}
          <section id="contact-klachten">
            <h2>{t('section14.title')}</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">{t('section14.getInTouch')}</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                Email:{' '}
                <a href="mailto:info@vexnexa.com" className="text-primary underline-offset-4 hover:underline">
                  info@vexnexa.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Or use the{' '}
                <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                  {t('section14.contactForm')}
                </Link>.
              </p>
            </div>
            <p className="mt-3">
              Not satisfied? File a complaint with the Dutch Data Protection Authority via{' '}
              <a
                href="https://autoriteitpersoonsgegevens.nl"
                className="text-primary underline-offset-4 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                autoriteitpersoonsgegevens.nl
              </a>.
            </p>
          </section>

          {/* Footer strip */}
          <div className="not-prose mt-12 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{tc('lastUpdated')}: {t('lastUpdated')}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/terms">{t('footer.termsLink')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">{t('footer.questions')}</Link>
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
                <Link href="/contact">Contact us</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
