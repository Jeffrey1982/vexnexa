import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardCheck, FileWarning, LockKeyhole, Scale, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Compliance & Trust - VexNexa",
  description:
    "VexNexa compliance overview for WCAG, EAA readiness, security, privacy and responsible accessibility reporting.",
  alternates: {
    canonical: "https://vexnexa.com/compliance",
  },
  robots: { index: true, follow: true },
};

const pillars = [
  {
    title: "WCAG reporting",
    body: "Reports map automated findings to WCAG criteria and show severity, affected elements, remediation guidance and traceable evidence.",
    icon: ClipboardCheck,
  },
  {
    title: "EAA readiness",
    body: "VexNexa helps teams monitor barriers relevant to EN 301 549 and the European Accessibility Act, without claiming legal certification.",
    icon: Scale,
  },
  {
    title: "Security and privacy",
    body: "Application data is handled through controlled infrastructure, encrypted transport, access control and documented retention policies.",
    icon: LockKeyhole,
  },
];

const readinessChecklist = [
  "Run recurring scans on important pages and customer journeys",
  "Prioritize critical and serious findings before moderate and minor work",
  "Document accepted risk and false-positive decisions with a reason",
  "Combine automated scans with manual keyboard, screen reader and content review",
  "Keep evidence, reports and remediation notes available for audits",
];

export default function CompliancePage() {
  return (
    <main className="container mx-auto px-4 py-12 sm:py-16">
      <section className="max-w-4xl">
        <Badge variant="outline">Trust center</Badge>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Compliance support without overclaiming
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
          VexNexa gives teams structured accessibility evidence, WCAG mapping and remediation workflow. It supports compliance programs, but it does not replace legal advice, manual auditing or certification by a qualified auditor.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Button asChild>
            <Link href="/methodology">Read methodology</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/legal/security">Security details</Link>
          </Button>
        </div>
      </section>

      <section className="mt-12 grid gap-4 md:grid-cols-3">
        {pillars.map((pillar) => {
          const Icon = pillar.icon;
          return (
            <Card key={pillar.title} className="rounded-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                  {pillar.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-muted-foreground">{pillar.body}</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
              Practical readiness checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm leading-6 text-muted-foreground">
              {readinessChecklist.map((item) => (
                <li key={item} className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-green-600" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <Card className="rounded-lg border-amber-300/70 bg-amber-50/70 dark:border-amber-700/60 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base">
                <FileWarning className="h-5 w-5 text-amber-700 dark:text-amber-300" aria-hidden="true" />
                Important limitation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm leading-6 text-amber-900 dark:text-amber-100">
              <p>
                No automated scanner can guarantee full accessibility or legal compliance. Use VexNexa as monitoring, prioritization and evidence tooling alongside manual testing and expert review.
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="text-base">Policy pages</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm">
              <Link href="/legal/privacy" className="text-primary hover:underline">Privacy policy</Link>
              <Link href="/legal/security" className="text-primary hover:underline">Security policy</Link>
              <Link href="/legal/terms" className="text-primary hover:underline">Terms of service</Link>
              <Link href="/legal/sla" className="text-primary hover:underline">SLA</Link>
            </CardContent>
          </Card>
        </aside>
      </section>
    </main>
  );
}
