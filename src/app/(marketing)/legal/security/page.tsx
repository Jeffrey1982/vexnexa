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

const sections = [
  { id: 'data-handling', label: 'Data Handling' },
  { id: 'storage', label: 'Data Storage' },
  { id: 'retention', label: 'Data Retention' },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'incidents', label: 'Security Incidents' },
  { id: 'contact', label: 'Contact' },
]

export default async function SecurityPage() {
  const t = await getTranslations('legal.security');
  const tc = await getTranslations('legal.common');

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
            Back to homepage
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
                    Incident Response
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
            <h2>Data Handling</h2>
            <p>
              VexNexa scans publicly accessible web pages. We temporarily store scan results
              and metadata to provide our service. We do not collect or store personal data from
              the websites we scan.
            </p>
            <div className="not-prose mt-5 rounded-lg border border-primary/30 bg-primary/10 p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Privacy by Design
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                We only scan publicly accessible content and do not attempt to access protected areas or extract personal information.
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Data Storage */}
          <section id="storage">
            <h2>Data Storage</h2>
            <p>
              All scan data is stored securely in encrypted databases. Access is restricted to
              authorized personnel only. We use industry-standard encryption for data at rest and
              in transit.
            </p>
            <h3>Security Measures</h3>
            <ul>
              <li><strong>Encryption at rest:</strong> AES-256 encryption for stored data</li>
              <li><strong>Encryption in transit:</strong> TLS 1.3 for all connections</li>
              <li><strong>Access control:</strong> Role-based access with multi-factor authentication</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring and logging</li>
              <li><strong>Regular audits:</strong> Quarterly security assessments and penetration testing</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Data Retention */}
          <section id="retention">
            <h2>Data Retention</h2>
            <p>
              Scan results are retained for the duration of your subscription plus 30 days. You
              can request deletion of your data at any time through your account settings or by
              contacting support.
            </p>
            <h3>Retention Periods</h3>
            <ul>
              <li><strong>Active users:</strong> Scan data retained for the duration of subscription</li>
              <li><strong>After cancellation:</strong> Data retained for 30 days for reactivation</li>
              <li><strong>Account deletion:</strong> All data permanently deleted within 7 days</li>
              <li><strong>Audit logs:</strong> Retained for 1 year for compliance purposes</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Third-Party Services */}
          <section id="third-party">
            <h2>Third-Party Services</h2>
            <p>
              We use select third-party services for hosting, analytics, and payment processing.
              All third parties are vetted for security and privacy compliance.
            </p>
            <h3>Third-Party Processors</h3>
            <ul>
              <li><strong>Vercel:</strong> Hosting and CDN (SOC 2 Type II certified)</li>
              <li><strong>Supabase:</strong> Database and authentication (ISO 27001 certified)</li>
              <li><strong>Mollie:</strong> Payment processing (PCI DSS compliant)</li>
            </ul>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="text-sm font-medium">GDPR Compliance</p>
              <p className="text-sm text-muted-foreground mt-2">
                All our third-party processors are GDPR compliant and have Data Processing Agreements in place.
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Security Incident Response */}
          <section id="incidents">
            <h2>Security Incident Response</h2>
            <p>
              In the event of a security incident, we will notify affected users within 72 hours
              and provide details about the incident and remediation steps.
            </p>
            <h3>Incident Response Process</h3>
            <ol>
              <li><strong>Detection:</strong> Automated monitoring and alerting systems</li>
              <li><strong>Assessment:</strong> Immediate evaluation of severity and impact</li>
              <li><strong>Containment:</strong> Isolate affected systems to prevent spread</li>
              <li><strong>Investigation:</strong> Root cause analysis and forensics</li>
              <li><strong>Notification:</strong> Inform affected users within 72 hours</li>
              <li><strong>Remediation:</strong> Fix vulnerabilities and restore service</li>
              <li><strong>Post-mortem:</strong> Document learnings and improve processes</li>
            </ol>
            <div className="not-prose mt-5 rounded-lg border border-orange-300 bg-orange-50 p-4">
              <p className="text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Report a Vulnerability
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                If you discover a security vulnerability, please report it responsibly to{' '}
                <a href="mailto:security@vexnexa.com" className="text-primary hover:underline">
                  security@vexnexa.com
                </a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* Contact */}
          <section id="contact">
            <h2>Contact</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">Security Inquiries</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                E-mail: <a className="text-primary hover:underline" href="mailto:security@vexnexa.com">security@vexnexa.com</a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                For security vulnerabilities or privacy concerns, please contact us at the email above.
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
              <CardTitle className="text-base">Security Vraag?</CardTitle>
              <CardDescription>We nemen security serieus.</CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button asChild className="w-full">
                <a href="mailto:security@vexnexa.com">Contact Security</a>
              </Button>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  )
}
