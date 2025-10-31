import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Shield, Mail, Calendar, ListTree } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy - TutusPorta',
  description: 'Read our privacy policy: how TutusPorta handles your data, cookies and privacy. GDPR compliant.',
  keywords: ['privacy policy','privacy policy','GDPR','AVG','data protection','cookies','data protection'],
  openGraph: {
    title: 'Privacy Policy - TutusPorta',
    description: 'Read our privacy policy: how TutusPorta handles your data, cookies and privacy. GDPR compliant.',
    url: 'https://tutusporta.com/legal/privacy',
    siteName: 'TutusPorta',
    type: 'website',
    locale: 'nl_NL',
  },
  twitter: {
    card: 'summary',
    title: 'Privacy Policy - TutusPorta',
    description: 'Read our privacy policy: how TutusPorta handles your data, cookies and privacy. GDPR compliant.',
  },
  alternates: {
    canonical: 'https://tutusporta.com/legal/privacy',
    languages: { 'nl-NL': 'https://tutusporta.com/legal/privacy' },
  },
  robots: { index: true, follow: true },
}

const lastUpdated = 'December 8, 2024'
const policyVersion = 'v1.2'

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
  { id: 'contact-klachten', label: '14. Contact & complaints' },
]

export default function PrivacyPage() {
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
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
            <Badge variant="outline" className="flex items-center gap-2">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              Last updated: {lastUpdated}
            </Badge>
            <Badge variant="secondary" aria-label={`Policy version ${policyVersion}`}>
              {policyVersion}
            </Badge>
          </div>
          <p className="mt-3 max-w-2xl text-base sm:text-lg text-muted-foreground">
            How TutusPorta handles your personal data and protects your privacy.
          </p>

          {/* Summary strip */}
          <div className="mt-8">
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Shield className="h-5 w-5" aria-hidden="true" />
                  Privacy at a glance
                </CardTitle>
                <CardDescription>The most important points in one overview.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">✅ What we DO</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>Only scan publicly accessible pages</li>
                    <li>Store data securely in the EU</li>
                    <li>Data minimization & transparency</li>
                    <li>Clear rights and settings</li>
                  </ul>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">❌ What we DON'T do</p>
                  <ul className="list-disc pl-5 space-y-2 leading-relaxed">
                    <li>Store personal data from page content</li>
                    <li>Sell data to third parties</li>
                    <li>Non-essential cookies without consent</li>
                    <li>Unsecured transfers outside the EU</li>
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
            <h2>1. Who we are</h2>
            <p>
              TutusPorta is een accessibility-scanning service ontwikkeld in Nederland. We helpen website-eigenaren hun sites
              toegankelijker te maken door WCAG-compliance te testen.
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Contact details (data controller)</p>
              <p className="text-sm text-muted-foreground">
                <strong>Company name:</strong> VexNexa B.V. (TutusPorta is part of VexNexa) <br />
                <strong>Address:</strong> Hoofdstraat 123, 1234 AB Amsterdam <br />
                <strong>Chamber of Commerce:</strong> 12345678 &nbsp;|&nbsp; <strong>VAT:</strong> NL123456789B01 <br />
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  privacy@tutusporta.com
                </a>
                {' '}| <strong>Website:</strong>{' '}
                <a href="https://tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  tutusporta.com
                </a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="welke-gegevens">
            <h2>2. What data we collect</h2>

            <h3>Scan data</h3>
            <ul>
              <li>URL of the scanned page</li>
              <li>Technical metadata about accessibility issues</li>
              <li>Scan timestamps</li>
              <li>IP address for rate-limiting and abuse prevention</li>
            </ul>
            <p>
              <strong>Belangrijk:</strong> we slaan <u>geen</u> persoonsgegevens uit pagina-inhoud op (zoals namen, e-mails,
              telefoonnummers); we analyseren alleen HTML-structuur en toegankelijkheid.
            </p>

            <h3>Account data (optional)</h3>
            <ul>
              <li>Email address</li>
              <li>Name (if provided)</li>
              <li>Hashed password</li>
              <li>Account preferences</li>
            </ul>

            <h3>Contact</h3>
            <ul>
              <li>Name and email address</li>
              <li>Message content</li>
              <li>Submission timestamp</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="rechtsgronden">
            <h2>3. Legal basis (Art. 6 GDPR)</h2>
            <ul>
              <li><strong>Performance of contract</strong> – scans, results, account management.</li>
              <li><strong>Legitimate interest</strong> – security (rate-limiting, abuse detection), basic improvements.</li>
              <li><strong>Consent</strong> – analytics/marketing cookies and any opt-in communication.</li>
              <li><strong>Legal obligation</strong> – retention requirements and requests from authorities.</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="cookies">
            <h2>4. Cookies and tracking</h2>

            <h3>Functional cookies (necessary)</h3>
            <ul>
              <li>Session for logged-in users</li>
              <li>Preferences (language, theme)</li>
              <li>Cookie consent status</li>
            </ul>

            <h3>Analytics cookies (optional)</h3>
            <p>
              Met toestemming kunnen we privacy-vriendelijke analytics gebruiken (bijv. Vercel Analytics of alternatief).
              We meten geaggregeerde statistieken, geen individuele profielen.
            </p>
            <ul>
              <li>Visitor statistics (aggregated/anonymous)</li>
              <li>Popular pages and features&apos;s en features</li>
              <li>Technical performance</li>
            </ul>
            <p>
              You can manage consent through the{' '}
              <Link href="/legal/cookies#instellingen" className="text-primary underline-offset-4 hover:underline">
                cookie settings
              </Link>.
            </p>

            <h3>UTM parameters</h3>
            <p>We kunnen UTM parameters tijdelijk bewaren om herkomst te begrijpen. Deze bevatten geen persoonsgegevens.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="verwerking-doelen">
            <h2>5. How and why we use data</h2>
            <ul>
              <li>Performing scans and displaying results</li>
              <li>Account management and login</li>
              <li>Customer service and support</li>
              <li>Service improvement (with consent for analytics)</li>
              <li>Compliance with laws and regulations</li>
            </ul>
            <p>We do <strong>not</strong> sell or rent your data to third parties for marketing purposes.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ontvangers">
            <h2>6. Recipients and processors</h2>
            <p>We only share data with service providers who process on our behalf under a data processing agreement.</p>
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
            <h2>7. Transfers outside EU/EEA</h2>
            <p>
              Indien doorgifte buiten de EU plaatsvindt (bijv. edge-routing of supportlogs), gebruiken we passende
              waarborgen zoals EU Standard Contractual Clauses en aanvullende maatregelen.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="beveiliging">
            <h2>8. Data storage, security & retention</h2>

            <h3>Storage locations</h3>
            <ul>
              <li>Database/compute in EU data centers</li>
              <li>Backups within Europe</li>
            </ul>

            <h3>Security measures</h3>
            <ul>
              <li>TLS/HTTPS end-to-end</li>
              <li>Hashed passworden</li>
              <li>Least-privilege access control & monitoring</li>
              <li>Regular patches/updates</li>
              <li>Dataminimalisatie</li>
            </ul>

            <h3>Retention periods</h3>
            <ul>
              <li>Scan data: 1 year (Free); longer for paid accounts (configurable in your account)</li>
              <li>Account data: until account deletion or as long as legally required</li>
              <li>Contact messages: up to 2 years</li>
              <li>Analytics: up to 24 months (aggregated/anonymized where possible)</li>
            </ul>
            <p>We delete or anonymize earlier when data is no longer needed, unless retention is legally required.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="rechten">
            <h2>9. Your rights (GDPR/AVG)</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <p className="font-medium">🔍 Right of access</p>
                <p className="text-sm text-muted-foreground">Request what data we have about you.</p>
                <p className="font-medium">✏️ Rectification</p>
                <p className="text-sm text-muted-foreground">Have incorrect data corrected.</p>
                <p className="font-medium">🗑️ Erasure</p>
                <p className="text-sm text-muted-foreground">Have data deleted.</p>
              </div>
              <div className="space-y-2">
                <p className="font-medium">⏸️ Restriction</p>
                <p className="text-sm text-muted-foreground">Restrict processing (temporarily).</p>
                <p className="font-medium">📦 Data portability</p>
                <p className="text-sm text-muted-foreground">Receive data in a common format.</p>
                <p className="font-medium">❌ Objection</p>
                <p className="text-sm text-muted-foreground">Objection tegen verwerking op basis van gerechtvaardigd belang.</p>
              </div>
            </div>
            <p className="mt-3">
              Je rechten uitoefenen? Mail{' '}
              <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                privacy@tutusporta.com
              </a>. We respond within 30 days.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="kinderen">
            <h2>10. Children</h2>
            <p>Not directed at children under 16 years. Contact us if data has been collected; we will delete it.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="datalek">
            <h2>11. Data breaches</h2>
            <p>We immediately investigate the impact, limit risks and report if required to the Dutch Data Protection Authority and affected parties.’s en melden indien vereist aan de Autoriteit Persoonsgegevens en betrokkenen.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="automated">
            <h2>12. Automated decision-making</h2>
            <p>We do not make decisions based solely on automated processing with legal effects for you.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 13 */}
          <section id="wijzigingen">
            <h2>13. Changes to this policy</h2>
            <p>We communicate significant changes via email (if applicable), a notification on the site and update of the date.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 14 */}
          <section id="contact-klachten">
            <h2>14. Contact & complaints</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">Get in touch</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                Email:{' '}
                <a href="mailto:privacy@tutusporta.com" className="text-primary underline-offset-4 hover:underline">
                  privacy@tutusporta.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                Or use the{' '}
                <Link href="/contact" className="text-primary underline-offset-4 hover:underline">
                  contact form
                </Link>.
              </p>
            </div>
            <p className="mt-3">
              Niet tevreden? Dien een klacht in bij de Autoriteit Persoonsgegevens via{' '}
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
              <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
              <div className="flex gap-3">
                <Button variant="outline" asChild>
                  <Link href="/legal/terms">Terms of Service</Link>
                </Button>
                <Button asChild>
                  <Link href="/contact">Vragen? Get in touch</Link>
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
                On this page
              </CardTitle>
              <CardDescription>Quick navigation to sections</CardDescription>
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
              <CardTitle className="text-base">Need help?</CardTitle>
              <CardDescription>We typically respond within 1 business day.</CardDescription>
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
