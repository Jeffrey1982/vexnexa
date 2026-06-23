import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, Code2, EyeOff, FileText, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl } from "@/lib/marketing-seo";

const path = "/accessibility-overlay-alternative";

export const metadata: Metadata = {
  title: "Accessibility Overlay Alternative for Real WCAG Fixes",
  description:
    "A practical alternative to accessibility overlays: scan, monitor, report and fix WCAG issues at the source instead of adding a surface-level widget.",
  keywords: [
    "accessibility overlay alternative",
    "accessibility widget alternative",
    "WCAG overlay alternative",
    "fix accessibility at source",
    "accessibility overlay compliance",
  ],
  openGraph: {
    title: "Accessibility Overlay Alternative for Real WCAG Fixes",
    description:
      "Move beyond overlays with source-level WCAG scanning, monitoring, reporting and remediation workflows.",
    url: localizedUrl("en", path),
    type: "website",
  },
};

const copy = {
  nl: {
    badge: "Geen overlay als schijnoplossing",
    title: "Een accessibility overlay alternatief dat problemen bij de bron laat oplossen",
    intro:
      "Een widget kan bezoekers opties geven, maar lost vaak geen structurele WCAG-problemen op in HTML, interacties, content of componenten. VexNexa richt zich op detectie, bewijs, prioritering en herstel bij de bron.",
    primary: "Vergelijk je aanpak",
    secondary: "Bekijk WCAG scan",
    cards: [
      ["Scan de echte pagina", "Vind issues in markup, formulieren, contrast, labels, headings en ARIA in plaats van alleen visuele voorkeuren aan te bieden."],
      ["Monitor regressies", "Zie wanneer nieuwe content, releases of scripts toegankelijkheidsproblemen opnieuw introduceren."],
      ["Rapporteer herstelbaar werk", "Geef developers en stakeholders duidelijke bevindingen met WCAG-context en prioriteit."],
    ],
    comparisonTitle: "Overlay versus bronaanpak",
    comparison: [
      ["Overlay", "Past meestal een extra laag toe bovenop bestaande problemen."],
      ["VexNexa", "Maakt problemen zichtbaar zodat teams ze duurzaam kunnen oplossen."],
    ],
  },
  en: {
    badge: "Beyond surface-level widgets",
    title: "An accessibility overlay alternative focused on fixing issues at the source",
    intro:
      "A widget can offer visitor preferences, but it often does not resolve structural WCAG issues in HTML, interactions, content, or components. VexNexa focuses on detection, evidence, prioritization, and source-level remediation.",
    primary: "Compare your approach",
    secondary: "View WCAG scan",
    cards: [
      ["Scan the real page", "Find issues in markup, forms, contrast, labels, headings, and ARIA instead of only offering visual preferences."],
      ["Monitor regressions", "See when new content, releases, or scripts reintroduce accessibility problems."],
      ["Report fixable work", "Give developers and stakeholders clear findings with WCAG context and priority."],
    ],
    comparisonTitle: "Overlay versus source-level workflow",
    comparison: [
      ["Overlay", "Usually adds a layer on top of existing accessibility problems."],
      ["VexNexa", "Makes issues visible so teams can fix them sustainably."],
    ],
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
          name: "VexNexa accessibility monitoring",
          applicationCategory: "Accessibility Testing",
          operatingSystem: "Web",
          url: localizedUrl(locale, path),
          description: c.intro,
        }),
      }}
    />
  );
}

export default async function OverlayAlternativePage() {
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
                <Link href="/contact?intent=overlay-alternative">{c.primary}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/wcag-scan">{c.secondary}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {c.cards.map(([title, description], index) => {
              const Icon = [ScanSearch, ShieldCheck, FileText][index];
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
          <h2 className="text-3xl font-bold">{c.comparisonTitle}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {c.comparison.map(([title, description], index) => {
              const Icon = index === 0 ? EyeOff : Code2;
              return (
                <Card key={title}>
                  <CardContent className="space-y-3 pt-6">
                    <Icon className="h-8 w-8 text-primary" />
                    <h3 className="text-xl font-semibold">{title}</h3>
                    <p className="text-muted-foreground">{description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
