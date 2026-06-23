import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, ScanSearch, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl } from "@/lib/marketing-seo";

const path = "/digitale-toegankelijkheid-audit";

export const metadata: Metadata = {
  title: "Digitale Toegankelijkheid Audit voor WCAG en EAA",
  description:
    "Laat je website toetsen op WCAG 2.2 AA, EAA-risico's en praktische toegankelijkheidsproblemen. Inclusief scan, auditrapport en prioriteiten voor herstel.",
  keywords: [
    "digitale toegankelijkheid audit",
    "toegankelijkheidsaudit website",
    "WCAG audit",
    "website toegankelijkheid audit",
    "EAA audit",
    "WCAG 2.2 AA audit",
  ],
  openGraph: {
    title: "Digitale Toegankelijkheid Audit voor WCAG en EAA",
    description:
      "Combineer automatische WCAG-scans met praktische auditrapportage voor teams die toegankelijkheid aantoonbaar willen verbeteren.",
    url: localizedUrl("nl", path),
    type: "website",
  },
};

const copy = {
  nl: {
    badge: "WCAG 2.2 AA audit",
    title: "Digitale toegankelijkheid audit voor websites die aantoonbaar beter moeten worden",
    intro:
      "VexNexa helpt teams toegankelijkheidsproblemen vinden, prioriteren en rapporteren. Je krijgt geen losse foutlijst, maar een duidelijk auditbeeld met WCAG-criteria, ernst, bewijs en hersteladvies.",
    primary: "Start een audit",
    secondary: "Bekijk voorbeeldrapport",
    sections: [
      ["Automatische scan", "Detecteer veelvoorkomende WCAG-problemen zoals contrast, alt-tekst, labels, headings en ARIA-fouten."],
      ["Handmatige prioritering", "Zet technische issues om naar begrijpelijke herstelprioriteiten voor design, content en development."],
      ["Rapportage als bewijs", "Exporteer bevindingen voor stakeholders, klanten, aanbestedingen of interne compliance-overleggen."],
    ],
    useCasesTitle: "Geschikt voor",
    useCases: [
      "Webshops die onder de European Accessibility Act vallen",
      "Agencies die WCAG-rapporten voor klanten leveren",
      "SaaS- en productteams die regressies willen voorkomen",
      "Overheids- en semi-publieke websites met WCAG-verplichtingen",
    ],
    faqTitle: "Veel gezochte vragen rond toegankelijkheidsaudits",
    faq: [
      ["Wat is een digitale toegankelijkheid audit?", "Een audit toetst of een website bruikbaar is voor mensen met beperkingen en vergelijkt bevindingen met WCAG-criteria zoals WCAG 2.1/2.2 AA."],
      ["Is een automatische WCAG-scan genoeg?", "Nee. Scans zijn sterk voor detecteerbare patronen, maar context, toetsenbordgedrag, interacties en de kwaliteit van labels vragen vaak menselijke beoordeling."],
      ["Welke output krijg ik?", "Een prioriteitenlijst met issue-type, ernst, getroffen elementen, WCAG-referenties en hersteladvies dat teams direct kunnen gebruiken."],
    ],
  },
  en: {
    badge: "WCAG 2.2 AA audit",
    title: "Digital accessibility audits for websites that need clear WCAG evidence",
    intro:
      "VexNexa helps teams find, prioritize, and report accessibility issues. Instead of a flat error list, you get WCAG criteria, severity, evidence, and practical remediation guidance.",
    primary: "Start an audit",
    secondary: "View sample report",
    sections: [
      ["Automated scan", "Detect common WCAG issues such as contrast, alt text, form labels, heading structure, and ARIA errors."],
      ["Manual prioritization", "Turn technical findings into clear remediation priorities for design, content, and development teams."],
      ["Evidence-ready reports", "Export findings for stakeholders, clients, procurement, and internal compliance reviews."],
    ],
    useCasesTitle: "Built for",
    useCases: [
      "E-commerce teams preparing for the European Accessibility Act",
      "Agencies delivering WCAG reports to clients",
      "SaaS and product teams preventing regressions",
      "Public-sector websites with WCAG obligations",
    ],
    faqTitle: "Common accessibility audit questions",
    faq: [
      ["What is a digital accessibility audit?", "An audit evaluates whether a website is usable by people with disabilities and maps findings to WCAG criteria such as WCAG 2.1/2.2 AA."],
      ["Is an automated WCAG scan enough?", "No. Scans are useful for detectable patterns, but context, keyboard behavior, interactions, and label quality often need human judgement."],
      ["What do I receive?", "A prioritized issue list with severity, affected elements, WCAG references, and remediation guidance your team can act on."],
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
          "@type": "Service",
          name: c.title,
          serviceType: "Digital accessibility audit",
          provider: { "@type": "Organization", name: "VexNexa", url: "https://vexnexa.com" },
          areaServed: "EU",
          url: localizedUrl(locale, path),
          description: c.intro,
        }),
      }}
    />
  );
}

export default async function AccessibilityAuditPage() {
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
                <Link href="/contact?intent=accessibility-audit">{c.primary}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sample-report">{c.secondary}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {c.sections.map(([title, description], index) => {
              const Icon = [ScanSearch, ClipboardCheck, FileText][index];
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
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <ShieldCheck className="mb-4 h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{c.useCasesTitle}</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {c.useCases.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container mx-auto max-w-4xl px-4">
          <h2 className="text-3xl font-bold">{c.faqTitle}</h2>
          <div className="mt-8 space-y-6">
            {c.faq.map(([question, answer]) => (
              <div key={question}>
                <h3 className="font-semibold">{question}</h3>
                <p className="mt-2 text-muted-foreground">{answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
