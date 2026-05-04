import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, CheckCircle2, Code2, Gauge, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'The Digital Accessibility Pivot: Why Overlays are Failing in 2026 - VexNexa',
  description:
    'Why agencies should move away from accessibility overlays and toward source-code monitoring, real WCAG evidence, and white-label recurring accessibility services.',
  alternates: {
    canonical: 'https://vexnexa.com/blog/the-digital-accessibility-pivot',
  },
  openGraph: {
    title: 'The Digital Accessibility Pivot: Why Overlays are Failing in 2026',
    description:
      'A practical agency guide to replacing accessibility overlays with code-based monitoring, better usability, and recurring compliance services.',
    url: 'https://vexnexa.com/blog/the-digital-accessibility-pivot',
    type: 'article',
  },
}

const comparisonRows = [
  {
    dimension: 'Compliance posture',
    overlays: 'Adds a client-side widget while the underlying barriers often remain in templates, forms, menus, and checkout flows.',
    vexnexa: 'Monitors source-level issues with axe-core powered evidence, severity, selectors, and remediation guidance.',
  },
  {
    dimension: 'Assistive technology experience',
    overlays: 'Can conflict with screen readers, focus order, keyboard navigation, or user preferences when injected after load.',
    vexnexa: 'Prioritizes fixes in the actual user journey, so assistive technology users encounter fewer barriers at the source.',
  },
  {
    dimension: 'Performance and SEO',
    overlays: 'Adds third-party JavaScript to every page and may not improve the semantic HTML search engines and crawlers read.',
    vexnexa: 'Improves the underlying markup, content structure, labels, headings, alt text, and interactive states.',
  },
  {
    dimension: 'Agency revenue model',
    overlays: 'One-time install with limited strategic value and growing client questions about risk.',
    vexnexa: 'White-label monitoring turns accessibility into a recurring service with reports, alerts, and client-ready proof.',
  },
]

const sourceLinks = [
  {
    label: 'EcomBack 2025 ADA Website Accessibility Lawsuit Report',
    href: 'https://www.ecomback.com/annual-2025-ada-website-accessibility-lawsuit-report',
  },
  {
    label: 'EcomBack 2025 Mid-Year ADA Website Accessibility Lawsuit Report',
    href: 'https://www.ecomback.com/ada-website-lawsuits-recap-report/2025-mid-year-ada-website-lawsuit-report',
  },
  {
    label: 'Seyfarth ADA Title III 2024 federal website lawsuit analysis',
    href: 'https://www.adatitleiii.com/2025/04/federal-court-website-accessibility-lawsuit-filings-continue-to-decrease-in-2024/',
  },
]

export default function DigitalAccessibilityPivotPage() {
  return (
    <main className="bg-background">
      <section className="border-b border-border/60 bg-[linear-gradient(180deg,hsl(var(--muted))_0%,hsl(var(--background))_100%)]">
        <div className="container mx-auto px-4 py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div className="max-w-4xl">
              <Badge variant="outline" className="bg-background/80">
                Agency resource
              </Badge>
              <h1 className="mt-5 max-w-4xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                The Case Against Accessibility Overlays: Why Your Agency Needs a Pivot.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                Overlays promised a shortcut to compliance. The market is now learning the expensive part:
                shortcuts do not remove inaccessible code, broken journeys, or litigation exposure.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/contact?subject=white-label-demo">
                    Request a White-Label Demo for Your Agency
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button variant="outline" asChild size="lg">
                  <Link href="/white-label-accessibility-reports">View white-label reports</Link>
                </Button>
              </div>
            </div>

            <aside className="rounded-lg border border-border bg-background p-6 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldAlert className="h-5 w-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">The 2026 agency risk</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    2025 reporting found 983 ADA website lawsuits against sites using accessibility widgets,
                    representing 24.90% of tracked filings. That is not protection; it is a warning signal.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <article className="container mx-auto px-4 py-14 lg:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-14">
            <section className="space-y-5">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                The &quot;Lawsuit Magnet&quot; Effect: Data from 2025-2026 ADA Claims.
              </h2>
              <div className="space-y-4 text-base leading-8 text-muted-foreground">
                <p>
                  Accessibility widgets used to be sold as a visible sign that a brand was taking inclusion
                  seriously. In litigation data, they increasingly look like a visible sign that the underlying
                  website may still contain unresolved barriers.
                </p>
                <p>
                  EcomBack&apos;s 2025 ADA website accessibility report found 3,948 tracked lawsuits, with
                  983 filed against websites using accessibility widgets. That equals 24.90% of tracked cases,
                  effectively one in four. Its mid-year 2025 report also counted 456 widget-related cases in the
                  first half of the year, making up 22.64% of total filings at that point.
                </p>
                <p>
                  For agencies planning 2026 retainers, the message is clear: selling a widget as the compliance
                  strategy creates a fragile promise. Plaintiffs, users, procurement teams, and in-house counsel
                  are looking beyond the presence of a toolbar and asking whether the actual buying, booking,
                  signup, and support journeys work.
                </p>
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                Why Source-Code Monitoring Trumps JavaScript Widgets.
              </h2>
              <div className="space-y-4 text-base leading-8 text-muted-foreground">
                <p>
                  A JavaScript overlay runs after the page loads. It can attempt to modify contrast, labels,
                  keyboard behavior, or reading order, but it does not rebuild the product experience at the
                  source. If the navigation traps focus, if a checkout field lacks a reliable label, or if a modal
                  opens without focus management, the better fix belongs in code.
                </p>
                <p>
                  VexNexa&apos;s monitoring model uses axe-core powered scans to inspect the rendered experience and
                  surface concrete issues: selectors, severity, WCAG context, affected elements, and remediation
                  guidance. That gives developers and agencies a fix list, not a cosmetic patch.
                </p>
                <p>
                  Source-level remediation also supports the rest of the business case. Cleaner semantics can help
                  crawlers understand structure, reduce dependency on third-party scripts, protect Core Web Vitals,
                  and deliver a more predictable screen reader and keyboard experience.
                </p>
              </div>
            </section>

            <section className="space-y-6" aria-labelledby="comparison-table">
              <div>
                <Badge variant="secondary">Comparison Table</Badge>
                <h2 id="comparison-table" className="mt-3 font-display text-3xl font-bold tracking-tight">
                  Overlays vs. VexNexa
                </h2>
              </div>
              <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
                <div className="grid grid-cols-[1fr_1.25fr_1.25fr] border-b border-border bg-muted/50 text-sm font-semibold text-foreground">
                  <div className="p-4">Dimension</div>
                  <div className="border-l border-border p-4">Accessibility overlays</div>
                  <div className="border-l border-border p-4">VexNexa</div>
                </div>
                {comparisonRows.map((row) => (
                  <div key={row.dimension} className="grid grid-cols-1 border-b border-border last:border-b-0 md:grid-cols-[1fr_1.25fr_1.25fr]">
                    <div className="bg-muted/25 p-4 text-sm font-semibold text-foreground md:bg-transparent">
                      {row.dimension}
                    </div>
                    <div className="flex gap-3 border-t border-border p-4 text-sm leading-6 text-muted-foreground md:border-l md:border-t-0">
                      <XCircle className="mt-0.5 h-4 w-4 flex-none text-destructive" aria-hidden="true" />
                      <span>{row.overlays}</span>
                    </div>
                    <div className="flex gap-3 border-t border-border p-4 text-sm leading-6 text-muted-foreground md:border-l md:border-t-0">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-teal-600" aria-hidden="true" />
                      <span>{row.vexnexa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-5">
              <h2 className="font-display text-3xl font-bold tracking-tight">
                From Liability to Monthly Recurring Revenue (MRR).
              </h2>
              <div className="space-y-4 text-base leading-8 text-muted-foreground">
                <p>
                  The agency opportunity is not to resell fear. It is to productize confidence. Accessibility can
                  become an ongoing client service: baseline scan, prioritized fixes, recurring monitoring,
                  release checks, and executive-ready reporting under your agency&apos;s brand.
                </p>
                <p>
                  That model looks less like a one-off audit and more like insurance-as-a-service: monthly
                  monitoring, documented progress, alerts when regressions appear, and clean evidence clients can
                  share with leadership, legal teams, and procurement.
                </p>
                <p>
                  VexNexa gives agencies the infrastructure to package that service without building the scanner,
                  report engine, export workflow, or white-label dashboard from scratch.
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-border bg-card p-6 shadow-sm lg:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <h3 className="font-display text-2xl font-bold">
                    The VexNexa Advantage: Clean Code, Real Compliance.
                  </h3>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                    Replace the overlay pitch with a stronger agency offer: monitor real accessibility issues,
                    guide source-code fixes, export branded reports, and prove progress month after month.
                  </p>
                </div>
                <Button asChild className="flex-none">
                  <Link href="/contact?subject=white-label-demo">
                    Request a White-Label Demo for Your Agency
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <h2 className="font-semibold text-foreground">What agencies can sell</h2>
              <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
                <div className="flex gap-3">
                  <Code2 className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                  <span>Code-based WCAG monitoring instead of overlay installation.</span>
                </div>
                <div className="flex gap-3">
                  <Gauge className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                  <span>Recurring accessibility health checks after every client release.</span>
                </div>
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-primary" aria-hidden="true" />
                  <span>White-label evidence reports clients can share internally.</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-5">
              <h2 className="font-semibold text-foreground">Sources</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6">
                {sourceLinks.map((source) => (
                  <li key={source.href}>
                    <a
                      href={source.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground underline underline-offset-4 hover:text-primary"
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </article>
    </main>
  )
}
