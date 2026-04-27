import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar, Lock, Database, AlertTriangle, ListTree } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

export const metadata: Metadata = {
  title: 'Security & Privacy - VexNexa',
  description:
    'Security and privacy information from VexNexa: data handling, encryption, retention beleid en incident response.',
  keywords: [
    'security',
    'security',
    'privacy',
    'data protection',
    'encryption',
    'GDPR',
  ],
  openGraph: {
    title: 'Security & Privacy - VexNexa',
    description:
      'Security and privacy information from VexNexa: data handling, encryption, retention beleid en incident response.',
    url: 'https://vexnexa.com/legal/security',
    siteName: 'VexNexa',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Security & Privacy - VexNexa',
    description:
      'Security and privacy information from VexNexa: data handling, encryption, retention beleid en incident response.',
  },
  alternates: {
    canonical: 'https://vexnexa.com/legal/security',
    languages: { 'nl-NL': 'https://vexnexa.com/legal/security' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = 'December 8, 2024'
const policyVersion = 'v1.0'

export default async function SecurityPage() {
  const t = await getTranslations('legal.security');
  const tc = await getTranslations('legal.common');

  const sections = [
    { id: 'data-handling', label: t('sections.dataHandling') },
    { id: 'storage', label: t('sections.storage') },
    { id: 'retention', label: t('sections.retention') },
    { id: 'third-party', label: t('sections.thirdParty') },
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
                  {t('guarantees.title')}
                </CardTitle>
                <CardDescription>{t('guarantees.description')}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-3">
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    {t('guarantees.encryption')}
                  </p>
                  <p className="leading-relaxed">
                    {t('guarantees.encryptionDesc')}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    {t('guarantees.storage')}
                  </p>
                  <p className="leading-relaxed">
                    {t('guarantees.storageDesc')}
                  </p>
                </div>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    {t('guarantees.incident')}
                  </p>
                  <p className="leading-relaxed">
                    {t('guarantees.incidentDesc')}
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
          {/* Data Handling */}
          <section id="data-handling">
            <h2>{t('dataHandling.title')}</h2>
            <p>
              {t('dataHandling.content')}
            </p>
            <div className="not-prose mt-5 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('dataHandling.privacyByDesign.title')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('dataHandling.privacyByDesign.content')}
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Data Storage */}
          <section id="storage">
            <h2>{t('dataStorage.title')}</h2>
            <p>
              {t('dataStorage.content')}
            </p>
            <h3>{t('dataStorage.securityMeasures.title')}</h3>
            <ul>
              <li><strong>{t('dataStorage.securityMeasures.encryptionAtRest')}</strong></li>
              <li><strong>{t('dataStorage.securityMeasures.encryptionInTransit')}</strong></li>
              <li><strong>{t('dataStorage.securityMeasures.accessControl')}</strong></li>
              <li><strong>{t('dataStorage.securityMeasures.monitoring')}</strong></li>
              <li><strong>{t('dataStorage.securityMeasures.audits')}</strong></li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Data Retention */}
          <section id="retention">
            <h2>{t('dataRetention.title')}</h2>
            <p>
              {t('dataRetention.content')}
            </p>
            <h3>{t('dataRetention.retentionPeriods.title')}</h3>
            <ul>
              <li><strong>{t('dataRetention.retentionPeriods.activeUsers')}</strong></li>
              <li><strong>{t('dataRetention.retentionPeriods.afterCancellation')}</strong></li>
              <li><strong>{t('dataRetention.retentionPeriods.accountDeletion')}</strong></li>
              <li><strong>{t('dataRetention.retentionPeriods.auditLogs')}</strong></li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Third-Party Services */}
          <section id="third-party">
            <h2>{t('thirdParty.title')}</h2>
            <p>
              {t('thirdParty.content')}
            </p>
            <h3>{t('thirdParty.processors.title')}</h3>
            <ul>
              <li><strong>{t('thirdParty.processors.vercel')}</strong></li>
              <li><strong>{t('thirdParty.processors.supabase')}</strong></li>
              <li><strong>{t('thirdParty.processors.mollie')}</strong></li>
            </ul>
            <div className="not-prose mt-5 rounded-lg border bg-muted p-4">
              <p className="text-sm font-medium">{t('thirdParty.gdprCompliance.title')}</p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('thirdParty.gdprCompliance.content')}
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Security Incident Response */}
          <section id="incidents">
            <h2>{t('incidentResponse.title')}</h2>
            <p>
              {t('incidentResponse.content')}
            </p>
            <h3>{t('incidentResponse.process.title')}</h3>
            <ol>
              <li><strong>{t('incidentResponse.process.detection')}</strong></li>
              <li><strong>{t('incidentResponse.process.assessment')}</strong></li>
              <li><strong>{t('incidentResponse.process.containment')}</strong></li>
              <li><strong>{t('incidentResponse.process.investigation')}</strong></li>
              <li><strong>{t('incidentResponse.process.notification')}</strong></li>
              <li><strong>{t('incidentResponse.process.remediation')}</strong></li>
              <li><strong>{t('incidentResponse.process.postmortem')}</strong></li>
            </ol>
            <div className="not-prose mt-5 rounded-lg border border-border bg-muted p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                {t('incidentResponse.reportVulnerability.title')}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('incidentResponse.reportVulnerability.content')}{' '}
                <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
                  {t('incidentResponse.reportVulnerability.email')}
                </a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Contact */}
          <section id="contact">
            <h2>{t('contact.title')}</h2>
            <div className="not-prose rounded-lg border bg-muted p-4 space-y-2">
              <p className="font-medium">{t('contact.securityInquiries.title')}</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail: <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">{t('contact.securityInquiries.email')}</a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {t('contact.securityInquiries.description')}
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
                  <Link href="/legal/privacy">Privacy Policy</Link>
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
              <CardTitle className="text-base">{t('aside.securityQuestion')}</CardTitle>
              <CardDescription>{t('aside.securityDescription')}</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <a href="mailto:info@vexnexa.com">{t('aside.contactSecurity')}</a>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
