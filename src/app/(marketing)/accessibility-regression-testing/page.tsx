import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, BellRing, GitBranch, LineChart, ListChecks, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl } from "@/lib/marketing-seo";

const path = "/accessibility-regression-testing";

export const metadata: Metadata = {
  title: "Accessibility Regression Testing and WCAG Monitoring",
  description:
    "Catch WCAG regressions before they become compliance issues. Monitor releases, content changes and client sites with scheduled accessibility scans.",
  openGraph: {
    title: "Accessibility Regression Testing and WCAG Monitoring",
    description:
      "Scheduled WCAG scans, alerts and reports for teams that need to keep accessibility from drifting release after release.",
    url: localizedUrl("en", path),
    type: "website",
  },
};

const copy = {
  nl: {
    badge: "Continuous WCAG monitoring",
    title: "Accessibility regression testing voor teams die toegankelijkheid niet willen laten afglijden",
    intro:
      "Elke release, campagne, plugin of contentwijziging kan nieuwe toegankelijkheidsproblemen veroorzaken. VexNexa monitort belangrijke pagina's en laat zien wat verandert.",
    primary: "Monitor regressies",
    secondary: "Voor agencies",
    cards: [
      ["Scheduled scans", "Scan belangrijke templates, domeinen en klantwebsites op vaste momenten."],
      ["Alerts bij verslechtering", "Krijg signalen wanneer scores dalen of nieuwe kritieke WCAG-issues verschijnen."],
      ["Trendrapportage", "Laat stakeholders zien of toegankelijkheid verbetert, stabiel blijft of achteruitgaat."],
    ],
    workflowTitle: "Van eenmalige audit naar doorlopende kwaliteitscontrole",
    workflow: ["Baseline vastleggen", "Nieuwe issues detecteren", "Prioriteiten delen", "Herstel aantonen"],
  },
  en: {
    badge: "Continuous WCAG monitoring",
    title: "Accessibility regression testing for teams that cannot let compliance drift",
    intro:
      "Every release, campaign, plugin, or content change can introduce new accessibility issues. VexNexa monitors key pages and shows what changed.",
    primary: "Monitor regressions",
    secondary: "For agencies",
    cards: [
      ["Scheduled scans", "Scan important templates, domains, and client websites on a regular schedule."],
      ["Regression alerts", "Get signals when scores drop or new critical WCAG issues appear."],
      ["Trend reporting", "Show stakeholders whether accessibility is improving, stable, or drifting backward."],
    ],
    workflowTitle: "From one-time audit to ongoing quality control",
    workflow: ["Establish a baseline", "Detect new issues", "Share priorities", "Prove remediation"],
  },
};

function JsonLd({ locale }: { locale: "nl" | "en" }) {
  const c = copy[locale];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VexNexa accessibility regression testing",
          applicationCategory: "QualityAssuranceApplication",
          operatingSystem: "Web",
          url: localizedUrl(locale, path),
          description: c.intro,
        }),
      }}
    />
  );
}

export default async function AccessibilityRegressionTestingPage() {
  const h = await headers();
  const locale = h.get("x-vn-locale") === "nl" ? "nl" : "en";
  const c = copy[locale];

  return (
    <>
      <JsonLd locale={locale} />
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="outline">{c.badge}</Badge>
            <h1 className="mt-6 text-4xl font-bold tracking-tight lg:text-6xl">{c.title}</h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">{c.intro}</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/contact?intent=regression-testing">{c.primary}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/accessibility-monitoring-agencies">{c.secondary}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {c.cards.map(([title, description], index) => {
              const Icon = [GitBranch, BellRing, LineChart][index];
              return (
                <Card key={title}>
                  <CardContent className="space-y-4 pt-6">
                    <Icon className="h-8 w-8 text-primary" />
                    <h2 className="text-xl font-semibold">{title}</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
      <section className="border-y bg-muted py-16">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{c.workflowTitle}</h2>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {c.workflow.map((item, index) => (
              <div key={item} className="rounded-lg bg-background p-5">
                <ListChecks className="mb-3 h-6 w-6 text-primary" />
                <div className="text-sm font-semibold">0{index + 1}</div>
                <div className="mt-1">{item}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
