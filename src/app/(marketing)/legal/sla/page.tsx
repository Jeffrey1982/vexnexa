import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar, Clock, Activity, ListTree } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'SLA & Support - VexNexa',
  description:
    'Service Level Agreement en support informatie van VexNexa: uptime garanties, response times en support levels.',
  keywords: [
    'SLA',
    'service level agreement',
    'support',
    'uptime',
    'response time',
    'beschikbaarheid',
  ],
  openGraph: {
    title: 'SLA & Support - VexNexa',
    description:
      'Service Level Agreement en support informatie van VexNexa: uptime garanties, response times en support levels.',
    url: 'https://vexnexa.com/legal/sla',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'SLA & Support - VexNexa',
    description:
      'Service Level Agreement en support informatie van VexNexa: uptime garanties, response times en support levels.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/legal/sla',
    languages: { 'nl-NL': 'https://vexnexa.com/legal/sla' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = '8 december 2024'
const policyVersion = 'v1.0'

export default async function SLAPage() {
  const t = await getTranslations('legal.sla');
  const tc = await getTranslations('legal.common');

  const sections = [
    { id: 'agreement', label: t('sections.agreement') },
    { id: 'support', label: t('sections.support') },
    { id: 'incidents', label: t('sections.incidents') },
    { id: 'contact', label: t('sections.contact') },
  ]

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      {/* Skip link */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:ring"
      >
        Skip to main content
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
            {tc('backToHomepage')}
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

          {/* Summary */}
          <div className="mt-8">
            <Card className="border-primary/30 bg-primary/10">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  {t('keyPoints.title')}
                </CardTitle>
                <CardDescription>{t('keyPoints.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    {t('keyPoints.uptime')}
                  </p>
                  <p className="leading-relaxed">
                    {t('keyPoints.uptimeDesc')}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {t('keyPoints.support')}
                  </p>
                  <p className="leading-relaxed">
                    {t('keyPoints.supportDesc')}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {t('keyPoints.monitoring')}
                  </p>
                  <p className="leading-relaxed">
                    {t('keyPoints.monitoringDesc')}
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
            '[&_h2]:mt-14 [&_h2]:mb-5 [&_h2]:scroll-mt-24',
            '[&_h3]:mt-9  [&_h3]:mb-3',
            '[&_ul]:my-5 [&_ul>li]:my-2 [&_ol]:my-5 [&_ol>li]:my-2 leading-relaxed',
            '[&_h2]:pb-2 [&_h2]:border-b [&_h2]:border-muted',
          ].join(' ')}
        >
          {/* Service Level Agreement */}
          <section id="agreement">
            <h2>{t('agreement.title')}</h2>
            <p>
              {t('agreement.content')}
            </p>
            <ul>
              <li>
                <strong>{t('agreement.uptime')}</strong>
              </li>
              <li>
                <strong>{t('agreement.scheduledMaintenance')}</strong>
              </li>
              <li>
                <strong>{t('agreement.scanProcessing')}</strong>
              </li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Support Levels */}
          <section id="support">
            <h2>{t('supportLevels.title')}</h2>

            <h3>{t('supportLevels.starter.title')}</h3>
            <ul>
              <li>{t('supportLevels.starter.email')}</li>
              <li>{t('supportLevels.starter.responseTime')}</li>
              <li>{t('supportLevels.starter.documentation')}</li>
            </ul>

            <h3>{t('supportLevels.pro.title')}</h3>
            <ul>
              <li>{t('supportLevels.pro.priorityEmail')}</li>
              <li>{t('supportLevels.pro.responseTime')}</li>
              <li>{t('supportLevels.pro.advancedDocumentation')}</li>
              <li>{t('supportLevels.pro.checkInCalls')}</li>
            </ul>

            <h3>{t('supportLevels.business.title')}</h3>
            <ul>
              <li>{t('supportLevels.business.prioritySupport')}</li>
              <li>{t('supportLevels.business.responseTime')}</li>
              <li>{t('supportLevels.business.accountManager')}</li>
              <li>{t('supportLevels.business.monthlyCalls')}</li>
              <li>{t('supportLevels.business.priorityFeatures')}</li>
            </ul>

            <h3>{t('supportLevels.enterprise.title')}</h3>
            <ul>
              <li>{t('supportLevels.enterprise.support247')}</li>
              <li>{t('supportLevels.enterprise.responseTime')}</li>
              <li>{t('supportLevels.enterprise.accountTeam')}</li>
              <li>{t('supportLevels.enterprise.customSla')}</li>
              <li>{t('supportLevels.enterprise.onCallSupport')}</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Incident Response */}
          <section id="incidents">
            <h2>{t('incidentResponse.title')}</h2>
            <p>
              {t('incidentResponse.content')}
            </p>
            <ul>
              <li><strong>{t('incidentResponse.critical')}</strong></li>
              <li><strong>{t('incidentResponse.high')}</strong></li>
              <li><strong>{t('incidentResponse.medium')}</strong></li>
              <li><strong>{t('incidentResponse.low')}</strong></li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Contact Support */}
          <section id="contact">
            <h2>{t('contact.title')}</h2>
            <div className="not-prose rounded-lg border bg-muted p-4 space-y-2">
              <p className="font-medium">{t('contact.supportContact.title')}</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail: <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('contact.supportContact.email')}</a>
              </p>
              <p className="text-sm text-muted-foreground">
                {t('contact.supportContact.dashboardForm')}
              </p>
            </div>
            <div className="not-prose mt-4 rounded-lg border bg-muted p-4 space-y-2">
              <p className="font-medium">{t('contact.businessInfo.title')}</p>
              <p className="text-sm text-muted-foreground">
                <strong>Address:</strong> {t('contact.businessInfo.address')} <br />
                <strong>Chamber of Commerce:</strong> {t('contact.businessInfo.kvk')} <br />
                <strong>Establishment Number:</strong> {t('contact.businessInfo.establishment')}
              </p>
            </div>
          </section>

          {/* Footer strip */}
          <div className="not-prose mt-12 rounded-xl border bg-background p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-muted-foreground">{tc('lastUpdated')}: {t('lastUpdated')}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/security">Security</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Contact us</Link>
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
              <nav aria-label="Inhoudsopgave" className="space-y-2">
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
              <CardTitle className="text-base">{t('aside.needHelp')}</CardTitle>
              <CardDescription>{t('aside.responseTime')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <Link href="/contact">{t('aside.contactUs')}</Link>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
