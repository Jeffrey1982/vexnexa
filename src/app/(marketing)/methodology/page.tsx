import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Camera, CheckCircle2, FileText, GitBranch, ListChecks, ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Accessibility Scan Methodology - VexNexa",
  description:
    "How VexNexa runs accessibility scans, maps WCAG findings, stores evidence, and separates automated checks from manual review.",
  alternates: {
    canonical: "https://vexnexa.com/methodology",
  },
  robots: { index: true, follow: true },
};

const scanSteps = [
  {
    title: "Crawl and render",
    body: "VexNexa loads the target page in a browser context, follows eligible internal pages, and records page metadata, viewport and engine details.",
    icon: Activity,
  },
  {
    title: "Automated WCAG checks",
    body: "The scan runs axe-core and additional checks for keyboard, screen reader, mobile, cognitive and page-quality signals.",
    icon: ListChecks,
  },
  {
    title: "Evidence capture",
    body: "Findings keep affected selectors, snippets, failure summaries, screenshots when available, and page URLs for traceability.",
    icon: Camera,
  },
  {
    title: "Report and workflow",
    body: "Results are grouped by severity, mapped to WCAG criteria, converted to a remediation report, and synced into issue workflow states.",
    icon: GitBranch,
  },
];

const coverage = [
  "WCAG 2.1 and WCAG 2.2 automated checks through axe-core",
  "Severity, affected element count and estimated remediation effort",
  "Multi-page crawl evidence with scan configuration and engine version",
  "Keyboard navigation and focus-order indicators",
  "Screen reader compatibility indicators",
  "Mobile accessibility, semantic structure and cognitive review signals",
];

export default function MethodologyPage() {
  return (
    <main className="container mx-auto px-4 py-12 sm:py-16">
      <section className="max-w-4xl">
        <Badge variant="outline">Methodology</Badge>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          How VexNexa produces accessibility findings
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          VexNexa is an automated accessibility monitoring and reporting platform. It helps teams find, prioritize and track WCAG issues, while being clear about what automation can and cannot prove.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/sample-report">View sample report</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/compliance">Compliance overview</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        {scanSteps.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  {step.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{step.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
                Automated coverage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-2">
                {coverage.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none text-green-600" aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-primary" aria-hidden="true" />
                Manual review still matters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p>
                Automated checks are strong at finding technical defects, but they cannot confirm every accessibility requirement or user experience. Examples that need human review include whether alt text is meaningful, whether content order makes sense, whether keyboard flows match task intent, and whether complex widgets are understandable.
              </p>
              <p>
                VexNexa reports should be treated as remediation intelligence and monitoring evidence, not as a complete legal certification.
              </p>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
                Report traceability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>Each report records scan ID, date, scanned pages, engine version, viewport and standards tested.</p>
              <p>Findings include WCAG mappings and affected elements so engineering teams can reproduce and fix issues.</p>
            </CardContent>
          </Card>
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Useful links</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Link href="/legal/security" className="text-primary hover:underline">Security policy</Link>
              <Link href="/legal/privacy" className="text-primary hover:underline">Privacy policy</Link>
              <Link href="/wcag-compliance-report" className="text-primary hover:underline">WCAG report format</Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
