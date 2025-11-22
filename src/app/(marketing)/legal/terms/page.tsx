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

const lastUpdated = 'December 8, 2024'
const policyVersion = 'v1.1'

const sections = [
  { id: 'toepassing', label: '1. Definitions & Applicability' },
  { id: 'gebruik', label: '2. Use of the Service' },
  { id: 'api', label: '3. API & Fair Use' },
  { id: 'betalingen', label: '4. Payments & Subscriptions' },
  { id: 'beschikbaarheid', label: '5. Availability & Support' },
  { id: 'ip', label: '6. Intellectual Property' },
  { id: 'liability', label: '7. Warranties & Liability' },
  { id: 'privacy', label: '8. Privacy & Data Protection' },
  { id: 'beindiging', label: '9. Termination' },
  { id: 'recht', label: '10. Applicable Law & Disputes' },
  { id: 'wijzigingen', label: '11. Changes & Final Provisions' },
  { id: 'contact', label: '12. Contact' },
]

export default async function TermsPage() {
  const t = await getTranslations('legal.terms');
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
          {/* helper dividers */}
          {/* 1 */}
          <section id="toepassing">
            <h2>1. Definitions & Applicability</h2>
            <h3>Definitions</h3>
            <ul>
              <li><strong>VexNexa</strong>: the accessibility scanning service at vexnexa.com.</li>
              <li><strong>We/Us</strong>: the data controller and service provider (VexNexa).</li>
              <li><strong>User</strong>: any natural or legal person using the service.</li>
              <li><strong>Account</strong>: your personal or business access to functions and history.</li>
              <li><strong>Scan</strong>: an automated test of a web page for accessibility.</li>
              <li><strong>API</strong>: programming interface for automated access to the service.</li>
            </ul>
            <h3>Applicability</h3>
            <p>
              These terms apply to all use of VexNexa, including free and paid accounts, the API,
              trial periods, and all related communication. Deviations are only valid if agreed in writing.
            </p>
            <div className="not-prose mt-5 rounded-lg border bg-muted/40 p-4">
              <p className="font-medium">Legal Information (Service Provider)</p>
              <p className="text-sm text-muted-foreground">
                <strong>Business Type:</strong> Sole proprietorship (Eenmanszaak) <br />
                <strong>Address:</strong> Gagarinstraat 28, 1562TB Krommenie, Netherlands <br />
                <strong>Chamber of Commerce:</strong> 94848262 &nbsp; <strong>Establishment Number:</strong> 000060294744 <br />
                <strong>E-mail:</strong> <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
              </p>
            </div>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 2 */}
          <section id="gebruik">
            <h2>2. Use of the Service</h2>
            <h3>Permitted Use</h3>
            <ul>
              <li>Scanning websites you own or have demonstrable permission for</li>
              <li>Internal and client projects (sharing reports is permitted)</li>
              <li>Education/research and commercial use within your bundle limits</li>
            </ul>
            <h3>Prohibited Use</h3>
            <ul>
              <li>Scans on sites without permission from the owner or administrator</li>
              <li>Circumventing rate limits, DDoS-like behavior, scraping personal data</li>
              <li>Reverse engineering, copying, or repackaging our software or output as your own tool</li>
              <li>Use in violation of laws and regulations (including copyright, privacy, computer crime laws)</li>
            </ul>
            <h3>Account & Security</h3>
            <ul>
              <li>Manage your login credentials carefully; all activity under your account is attributed to you</li>
              <li>Report abuse or suspected data breach directly via <a href="mailto:info@vexnexa.com">info@vexnexa.com</a></li>
              <li>We may temporarily block accounts if abuse or security risks are suspected</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 3 */}
          <section id="api">
            <h2>3. API & Fair Use</h2>
            <p>
              API access is available for eligible subscriptions. We enforce fair-use and technical limits
              (requests per minute/day, concurrent jobs). Details are available in your dashboard.
            </p>
            <ul>
              <li>API keys are personal; sharing or open-sourcing them is not permitted</li>
              <li>Results may be displayed in your own tooling, provided you credit &ldquo;VexNexa&rdquo; in automated reporting</li>
              <li>Changes to endpoints or limits may occur without prior notice in case of abuse or disruptions</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 4 */}
          <section id="betalingen">
            <h2>4. Payments & Subscriptions</h2>
            <h3>Free Tier (Trial)</h3>
            <ul>
              <li>The free Trial remains free with fixed monthly limits (100 pages/month, 1 website)</li>
              <li><strong>Hard limit:</strong> When exceeding free usage, the service will be blocked until the next month or until you upgrade to a paid plan</li>
              <li>Trial expires after the specified period; upgrade is required to continue using the service</li>
              <li>Features may change — we communicate substantial changes in advance</li>
              <li>No automatic overage billing; upgrade to a paid plan for further access</li>
            </ul>
            <h3>Paid Subscriptions</h3>
            <ul>
              <li>Prices excluding VAT; billing via Mollie (e.g., iDEAL/card)</li>
              <li>Prepaid per month; automatic renewal</li>
              <li>Cancellation possible until the last day of the current period (service continues until end of term)</li>
              <li>Mid-cycle upgrades are possible; costs are settled pro-rata</li>
            </ul>
            <h3>Limits & Overage (Paid Plans Only)</h3>
            <ul>
              <li><strong>Trial/Free:</strong> Hard limit - service is blocked when exceeded. Upgrade required for further access.</li>
              <li><strong>Paid plans:</strong> When exceeding limits, extra scans are automatically billed (€0.002/page, €2/extra site, €1/extra user per month)</li>
              <li>Warnings at 80% and 100% of your limit</li>
              <li>For consistent overages, we recommend upgrading to a higher plan</li>
            </ul>
            <h3>Refunds & Chargebacks</h3>
            <ul>
              <li>No refunds for early cancellation, unless legally required</li>
              <li>In case of prolonged general outage (&gt;48 hours), proportional credit may be offered</li>
              <li>Unjustified chargebacks may lead to (temporary) blocking and cost pass-through</li>
            </ul>
            <h3>Consumer Right of Withdrawal</h3>
            <p>
              For consumers within the EU, the right of withdrawal may apply. Through immediate delivery of the digital service
              within the withdrawal period (after explicit consent), the right of withdrawal may be waived for the delivered period.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 5 */}
          <section id="beschikbaarheid">
            <h2>5. Availability & Support</h2>
            <h3>SLA & Maintenance</h3>
            <ul>
              <li>We strive for high availability, but 100% uptime is not guaranteed</li>
              <li>Planned maintenance will be announced in advance where possible</li>
              <li>External factors (firewalls, robots.txt, rate limits) may prevent scans</li>
            </ul>
            <h3>Support</h3>
            <ul>
              <li><strong>Free:</strong> email within 72 hours</li>
              <li><strong>Pro:</strong> email within 24 hours</li>
              <li><strong>Team:</strong> priority (typically &lt; 4 hours), optional phone support</li>
            </ul>
            <h3>Changes</h3>
            <p>We may adjust features, algorithms, or UI; in case of material impact we communicate in a timely manner.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 6 */}
          <section id="ip">
            <h2>6. Intellectual Property</h2>
            <h3>Our Rights</h3>
            <ul>
              <li>Software, algorithms, UI, trademarks, and documentation remain the property of us (and/or licensors)</li>
              <li>No transfer of IP rights; only a limited, revocable license to use</li>
            </ul>
            <h3>Your Content & Reports</h3>
            <ul>
              <li>You retain rights to your own websites and materials</li>
              <li>You grant us the necessary license to perform scans and display results</li>
              <li>Reports may be used internally and commercially; attribution is appreciated but not required</li>
            </ul>
            <h3>Notices</h3>
            <p>
              Suspect an infringement (e.g., unauthorized use of your trademark)? Email{' '}
              <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 7 */}
          <section id="liability">
            <h2>7. Warranties & Liability</h2>
            <h3>Limited Warranty</h3>
            <ul>
              <li>Scans follow common methods (including rules similar to axe-core), but do not cover all WCAG criteria in all contexts</li>
              <li>False positives/negatives may occur; human review remains necessary</li>
            </ul>
            <h3>Limitation of Liability</h3>
            <ul>
              <li>Our total liability is limited to the amount you have paid in the last 12 months</li>
              <li>No liability for indirect/consequential damage, loss of profit, data loss, or reputational damage</li>
              <li>Exclusions do not apply in case of intent or willful recklessness to the extent permitted by law</li>
            </ul>
            <h3>Force Majeure</h3>
            <ul>
              <li>No liability for events beyond our reasonable control (including third-party outages, war, natural disasters, cyberattacks)</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 8 */}
          <section id="privacy">
            <h2>8. Privacy & Data Protection</h2>
            <p>
              We process personal data in accordance with our{' '}
              <Link className="text-primary hover:underline" href="/legal/privacy">privacy policy</Link>.
              That policy is an integral part of these terms.
            </p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 9 */}
          <section id="beindiging">
            <h2>9. Termination</h2>
            <h3>By You</h3>
            <ul>
              <li>Cancel via your account; access remains until end of billing period</li>
              <li>You can request deletion of account data in accordance with the privacy policy</li>
            </ul>
            <h3>By Us</h3>
            <ul>
              <li>In case of breach of terms, abuse, non-payment, or security risks, we may (temporarily) terminate</li>
              <li>Where reasonable, we will first give a warning and recovery period</li>
            </ul>
            <h3>Consequences</h3>
            <ul>
              <li>Access expires; data retention follows the privacy policy</li>
              <li>Outstanding amounts remain due</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 10 */}
          <section id="recht">
            <h2>10. Applicable Law & Disputes</h2>
            <h3>Law</h3>
            <p>Dutch law applies, excluding conflict of laws rules.</p>
            <h3>Dispute Resolution</h3>
            <ol>
              <li>First attempt to resolve internally: email <a href="mailto:info@vexnexa.com">info@vexnexa.com</a></li>
              <li>Response period: 30 days to find a solution</li>
              <li>If no solution is reached: mediation (if both parties agree)</li>
              <li>Competent court: Amsterdam District Court</li>
            </ol>
            <h3>Consumer Rights</h3>
            <p>Consumers retain statutory rights that cannot be contractually excluded.</p>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 11 */}
          <section id="wijzigingen">
            <h2>11. Changes & Final Provisions</h2>
            <h3>Changes</h3>
            <p>
              We may modify these terms (e.g., legislation, features, abuse prevention). For material changes,
              we will inform you — typically 30 days in advance. Continued use after the effective date constitutes acceptance.
            </p>
            <h3>Severability & Entire Agreement</h3>
            <ul>
              <li>If a provision is deemed invalid/void, the remaining provisions remain in effect</li>
              <li>We will replace an invalid provision with a valid provision of similar purport</li>
              <li>These terms + privacy policy constitute the entire agreement and supersede prior communications</li>
            </ul>
          </section>

          <div className="h-px bg-border my-10 not-prose" />

          {/* 12 */}
          <section id="contact">
            <h2>12. Contact</h2>
            <div className="not-prose rounded-lg border bg-muted/40 p-4 space-y-2">
              <p className="font-medium">Legal Questions</p>
              <p className="text-sm text-muted-foreground">
                <Mail className="inline h-4 w-4 mr-1" aria-hidden="true" />
                Email: <a className="text-primary hover:underline" href="mailto:info@vexnexa.com">info@vexnexa.com</a>
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
                  <Link href="/contact">Questions? Contact Us</Link>
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
