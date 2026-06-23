import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { ArrowRight, CheckCircle2, CreditCard, FileWarning, MonitorCheck, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { localizedUrl } from "@/lib/marketing-seo";

const path = "/toegankelijkheid-webshop-eaa";

export const metadata: Metadata = {
  title: "Toegankelijkheid Webshop en EAA Compliance",
  description:
    "Bereid je webshop voor op de European Accessibility Act. Scan checkout, productpagina's, formulieren en klantflows op WCAG- en EAA-risico's.",
  keywords: [
    "toegankelijkheid webshop",
    "EAA webshop",
    "European Accessibility Act webshop",
    "webshop toegankelijk maken",
    "ecommerce accessibility audit",
    "WCAG webshop",
  ],
  openGraph: {
    title: "Toegankelijkheid Webshop en EAA Compliance",
    description:
      "Vind toegankelijkheidsproblemen in productpagina's, checkout, formulieren en klantflows voordat ze omzet of compliance raken.",
    url: localizedUrl("nl", path),
    type: "website",
  },
};

const copy = {
  nl: {
    badge: "EAA voor e-commerce",
    title: "Maak je webshop beter toegankelijk voor klanten en EAA-compliance",
    intro:
      "De European Accessibility Act maakt digitale toegankelijkheid concreet voor veel e-commerce diensten. VexNexa helpt productpagina's, checkout, formulieren en klantflows monitoren op WCAG-risico's.",
    primary: "Check mijn webshop",
    secondary: "Bekijk EAA monitoring",
    cards: [
      ["Productpagina's", "Controleer afbeeldingen, varianten, knoppen, prijsinformatie, headings en productcontent."],
      ["Checkout en formulieren", "Vind labels, foutmeldingen, focusproblemen en blokkades in betaal- en accountflows."],
      ["Doorlopende monitoring", "Voorkom dat nieuwe campagnes, apps of thema-updates opnieuw toegankelijkheidsproblemen introduceren."],
    ],
    proofTitle: "Waarom dit SEO- en business-kans tegelijk is",
    proof:
      "Toegankelijke webshops zijn beter bruikbaar voor meer klanten. Dezelfde verbeteringen die WCAG ondersteunen, zoals duidelijke labels, goede structuur en begrijpelijke foutmeldingen, helpen vaak ook conversie, kwaliteit en vindbaarheid.",
    checklist: ["WCAG 2.2 AA scan per belangrijke template", "Prioriteiten voor checkout en betaalflow", "Rapportage voor compliance en management", "Alerts bij nieuwe regressies"],
  },
  en: {
    badge: "EAA for e-commerce",
    title: "Prepare your webshop for accessibility and EAA compliance",
    intro:
      "The European Accessibility Act makes digital accessibility concrete for many e-commerce services. VexNexa helps monitor product pages, checkout, forms, and customer journeys for WCAG risk.",
    primary: "Check my webshop",
    secondary: "View EAA monitoring",
    cards: [
      ["Product pages", "Check images, variants, buttons, price information, headings, and product content."],
      ["Checkout and forms", "Find labels, error messages, focus issues, and blockers in payment and account flows."],
      ["Continuous monitoring", "Prevent campaigns, apps, or theme updates from reintroducing accessibility problems."],
    ],
    proofTitle: "A compliance and conversion opportunity",
    proof:
      "Accessible webshops are easier for more customers to use. The same improvements that support WCAG, such as clear labels, strong structure, and understandable errors, often help conversion, quality, and organic visibility.",
    checklist: ["WCAG 2.2 AA scans per key template", "Priorities for checkout and payment flows", "Reports for compliance and management", "Alerts when regressions appear"],
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
          serviceType: "E-commerce accessibility monitoring",
          provider: { "@type": "Organization", name: "VexNexa", url: "https://vexnexa.com" },
          url: localizedUrl(locale, path),
          description: c.intro,
        }),
      }}
    />
  );
}

export default async function WebshopAccessibilityPage() {
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
                <Link href="/contact?intent=eaa-webshop">{c.primary}<ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/eaa-compliance-monitoring">{c.secondary}</Link>
              </Button>
            </div>
          </div>
          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-3">
            {c.cards.map(([title, description], index) => {
              const Icon = [ShoppingCart, CreditCard, MonitorCheck][index];
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
        <div className="container mx-auto grid gap-8 px-4 lg:grid-cols-2">
          <div>
            <FileWarning className="mb-4 h-9 w-9 text-primary" />
            <h2 className="text-3xl font-bold">{c.proofTitle}</h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">{c.proof}</p>
          </div>
          <div className="grid gap-3">
            {c.checklist.map((item) => (
              <div key={item} className="flex gap-3 rounded-lg bg-background p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
