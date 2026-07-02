import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, CheckCircle2, FileSearch, Gauge, ListChecks, MonitorCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl } from "@/lib/marketing-seo";

const path = "/website-toegankelijkheid-testen";

export const metadata: Metadata = {
  title: "Website Toegankelijkheid Testen met WCAG Checker",
  description:
    "Test je website op toegankelijkheid, WCAG 2.2 AA issues, contrast, alt-tekst, formulieren en keyboard-problemen. Krijg prioriteiten en rapportage.",
  openGraph: {
    title: "Website Toegankelijkheid Testen met WCAG Checker",
    description:
      "Vind WCAG-problemen met duidelijke prioriteiten, element-context en rapportage voor teams.",
    url: localizedUrl("nl", path),
    type: "website",
  },
};

const copy = {
  nl: {
    badge: "WCAG website test",
    title: "Website toegankelijkheid testen zonder te verdwalen in losse foutmeldingen",
    intro:
      "Test je website op veelvoorkomende toegankelijkheidsproblemen en krijg een duidelijk beeld van wat eerst opgelost moet worden. VexNexa koppelt scans aan WCAG-context, ernst en rapportage.",
    primary: "Test mijn website",
    secondary: "Bekijk audit-aanpak",
    cards: [
      ["WCAG scan", "Controleer op detecteerbare WCAG 2.1 en WCAG 2.2 issues zoals contrast, labels, headings en ARIA."],
      ["Prioriteiten", "Zie welke problemen kritisch zijn voor gebruikers, compliance en herstelwerk."],
      ["Rapportage", "Deel bevindingen met developers, klanten of compliance stakeholders."],
    ],
    testsTitle: "Wat moet je minimaal testen?",
    tests: ["Contrast en leesbaarheid", "Alt-tekst en afbeeldingen", "Form labels en foutmeldingen", "Keyboard focus en navigatie", "Headings en paginastructuur", "ARIA en interactieve componenten"],
  },
  en: {
    badge: "WCAG website test",
    title: "Test website accessibility without getting lost in flat error lists",
    intro:
      "Test your website for common accessibility problems and get a clear view of what to fix first. VexNexa connects scans to WCAG context, severity, and reporting.",
    primary: "Test my website",
    secondary: "View audit workflow",
    cards: [
      ["WCAG scan", "Check detectable WCAG 2.1 and WCAG 2.2 issues such as contrast, labels, headings, and ARIA."],
      ["Priorities", "See which problems are critical for users, compliance, and remediation work."],
      ["Reporting", "Share findings with developers, clients, or compliance stakeholders."],
    ],
    testsTitle: "What should you test first?",
    tests: ["Contrast and readability", "Alt text and images", "Form labels and errors", "Keyboard focus and navigation", "Headings and page structure", "ARIA and interactive components"],
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
          "@type": "WebApplication",
          name: c.title,
          applicationCategory: "Accessibility Testing",
          operatingSystem: "Web",
          url: localizedUrl(locale, path),
          description: c.intro,
        }),
      }}
    />
  );
}

export default async function WebsiteAccessibilityTestPage() {
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
                <Link href="/free-scan">{c.primary}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/digitale-toegankelijkheid-audit">{c.secondary}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {c.cards.map(([title, description], index) => {
              const Icon = [FileSearch, Gauge, MonitorCheck][index];
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
            <ListChecks className="h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{c.testsTitle}</h2>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {c.tests.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
