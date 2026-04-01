import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Check,
  X,
  Eye,
  Gauge,
  ListChecks,
  TrendingUp,
  Users,
  ShieldCheck,
  Lightbulb,
  FileText,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Website Accessibility Checker — Beyond Pass/Fail",
  description:
    "Check your website for accessibility issues with severity ranking, element-level detail, and fix guidance. More than a simple pass/fail score.",
  openGraph: {
    title: "Website Accessibility Checker — Beyond Pass/Fail",
    description:
      "Check your website for accessibility issues with severity ranking, element-level detail, and fix guidance. More than a simple pass/fail score.",
    url: "https://vexnexa.com/website-accessibility-checker",
    type: "website",
  },
  alternates: {
    canonical: "https://vexnexa.com/website-accessibility-checker",
  },
};

/* ═══════════════════════════════════════════════════════════
   JSON-LD
   ═══════════════════════════════════════════════════════════ */

function JsonLd(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "VexNexa Accessibility Checker",
    applicationCategory: "Accessibility Testing",
    operatingSystem: "Web",
    url: "https://vexnexa.com/website-accessibility-checker",
    description:
      "Website accessibility checker that goes beyond pass/fail. Severity-ranked issues, element-level context, and exportable reports.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Free accessibility check available",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero — comparison-driven angle
   ═══════════════════════════════════════════════════════════ */

function HeroSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            {t('hero.badge')}
          </Badge>

          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
            {t('hero.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                {t('hero.ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/features">{t('hero.ctaSecondary')}</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('hero.note')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   The Pass/Fail Problem
   ═══════════════════════════════════════════════════════════ */

function PassFailProblemSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold font-display text-center">
            {t('passFailProblem.title')}
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            {t('passFailProblem.subtitle')}
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            {t('passFailProblem.solution')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   What You Get — feature grid (distinct from /wcag-scan)
   ═══════════════════════════════════════════════════════════ */

function WhatYouGetSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  const features: { icon: typeof Eye; title: string; desc: string }[] = [
    {
      icon: Gauge,
      title: t('whatYouGet.weightedScore.title'),
      desc: t('whatYouGet.weightedScore.description'),
    },
    {
      icon: ListChecks,
      title: t('whatYouGet.severityTiers.title'),
      desc: t('whatYouGet.severityTiers.description'),
    },
    {
      icon: Eye,
      title: t('whatYouGet.elementDetail.title'),
      desc: t('whatYouGet.elementDetail.description'),
    },
    {
      icon: FileText,
      title: t('whatYouGet.wcagReferences.title'),
      desc: t('whatYouGet.wcagReferences.description'),
    },
    {
      icon: ShieldCheck,
      title: t('whatYouGet.riskAssessment.title'),
      desc: t('whatYouGet.riskAssessment.description'),
    },
    {
      icon: TrendingUp,
      title: t('whatYouGet.trendTracking.title'),
      desc: t('whatYouGet.trendTracking.description'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('whatYouGet.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('whatYouGet.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((f, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Side-by-Side Comparison
   ═══════════════════════════════════════════════════════════ */

function ComparisonSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  const items: { label: string; basic: string; vexnexa: string }[] = [
    {
      label: t('comparison.items.resultFormat.label'),
      basic: t('comparison.items.resultFormat.basic'),
      vexnexa: t('comparison.items.resultFormat.vexnexa'),
    },
    {
      label: t('comparison.items.issueContext.label'),
      basic: t('comparison.items.issueContext.basic'),
      vexnexa: t('comparison.items.issueContext.vexnexa'),
    },
    {
      label: t('comparison.items.prioritization.label'),
      basic: t('comparison.items.prioritization.basic'),
      vexnexa: t('comparison.items.prioritization.vexnexa'),
    },
    {
      label: t('comparison.items.reporting.label'),
      basic: t('comparison.items.reporting.basic'),
      vexnexa: t('comparison.items.reporting.vexnexa'),
    },
    {
      label: t('comparison.items.rechecking.label'),
      basic: t('comparison.items.rechecking.basic'),
      vexnexa: t('comparison.items.rechecking.vexnexa'),
    },
    {
      label: t('comparison.items.branding.label'),
      basic: t('comparison.items.branding.basic'),
      vexnexa: t('comparison.items.branding.vexnexa'),
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            {t('comparison.title')}
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12">
            {t('comparison.subtitle')}
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold w-1/3">
                    {t('comparison.table.capability')}
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-1/3">
                    {t('comparison.table.freeChecker')}
                  </th>
                  <th className="text-left py-3 pl-4 font-semibold text-primary w-1/3">
                    {t('comparison.table.vexnexa')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{item.label}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {item.basic}
                    </td>
                    <td className="py-3 pl-4">{item.vexnexa}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Who It's For
   ═══════════════════════════════════════════════════════════ */

function AudienceSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  const audiences: { icon: typeof Users; title: string; desc: string }[] = [
    {
      icon: Users,
      title: t('audience.marketing.title'),
      desc: t('audience.marketing.description'),
    },
    {
      icon: ShieldCheck,
      title: t('audience.procurement.title'),
      desc: t('audience.procurement.description'),
    },
    {
      icon: Lightbulb,
      title: t('audience.freelancers.title'),
      desc: t('audience.freelancers.description'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          {t('audience.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {audiences.map((a, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-14 h-14 mx-auto bg-primary/10 rounded-xl flex items-center justify-center">
                <a.icon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-semibold text-lg">{a.title}</h3>
              <p className="text-sm text-muted-foreground">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Honest Limitations
   ═══════════════════════════════════════════════════════════ */

function LimitationsSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  return (
    <section className="border-y border-border/40 bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">
            {t('limitations.title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('limitations.description')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('limitations.solution')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════ */

function FAQSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  const faqs: { q: string; a: string }[] = [
    {
      q: t('faq.q1.question'),
      a: t('faq.q1.answer'),
    },
    {
      q: t('faq.q2.question'),
      a: t('faq.q2.answer'),
    },
    {
      q: t('faq.q3.question'),
      a: t('faq.q3.answer'),
    },
    {
      q: t('faq.q4.question'),
      a: t('faq.q4.answer'),
    },
    {
      q: t('faq.q5.question'),
      a: t('faq.q5.answer'),
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            {t('faq.title')}
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Final CTA
   ═══════════════════════════════════════════════════════════ */

function FinalCTASection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  return (
    <section className="border-y border-border/40 bg-muted py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('finalCTA.title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('finalCTA.subtitle')}
          </p>
          <Button
            size="lg"
            className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
            asChild
          >
            <Link href="/auth/register">
              {t('finalCTA.ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */

function RelatedSolutionsSection(): React.ReactElement {
  const t = useTranslations('websiteAccessibilityChecker');
  
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            {t('relatedSolutions.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/wcag-scan" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.wcagScan.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.wcagScan.description')}</p>
            </Link>
            <Link href="/wcag-compliance-report" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.complianceReport.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.complianceReport.description')}</p>
            </Link>
            <Link href="/white-label-accessibility-reports" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.whiteLabel.title')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.whiteLabel.description')}</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WebsiteAccessibilityCheckerPage(): React.ReactElement {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <PassFailProblemSection />
      <WhatYouGetSection />
      <ComparisonSection />
      <AudienceSection />
      <LimitationsSection />
      <FAQSection />
      <RelatedSolutionsSection />
      <FinalCTASection />
    </>
  );
}
