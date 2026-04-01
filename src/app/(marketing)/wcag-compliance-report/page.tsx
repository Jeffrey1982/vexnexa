import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Check,
  FileText,
  BookOpen,
  Scale,
  BarChart3,
  ListChecks,
  ShieldCheck,
  Download,
  Users,
  ClipboardCheck,
  Briefcase,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";
import { useTranslations } from "next-intl";

/* ═══════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "WCAG Compliance Report — Executive-Ready Output",
  description:
    "Generate structured WCAG compliance reports with health scores, severity breakdowns, WCAG matrix, and fix priorities. PDF and DOCX formats.",
  openGraph: {
    title: "WCAG Compliance Report — Executive-Ready Output",
    description:
      "Generate structured WCAG compliance reports with health scores, severity breakdowns, WCAG matrix, and fix priorities. PDF and DOCX formats.",
    url: "https://vexnexa.com/wcag-compliance-report",
    type: "website",
  },
  alternates: {
    canonical: "https://vexnexa.com/wcag-compliance-report",
  },
};

/* ═══════════════════════════════════════════════════════════
   JSON-LD
   ═══════════════════════════════════════════════════════════ */

function JsonLd(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VexNexa WCAG Compliance Report",
    description:
      "Structured WCAG compliance reports with executive summaries, severity breakdowns, WCAG compliance matrices, and prioritized fix lists. Available as PDF and DOCX.",
    url: "https://vexnexa.com/wcag-compliance-report",
    brand: {
      "@type": "Organization",
      name: "VexNexa",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Free trial includes report generation",
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
   Hero — report-focused, procurement-ready angle
   ═══════════════════════════════════════════════════════════ */

function HeroSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            {t('hero.badge')}
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight leading-tight">
            {t('hero.title')}{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <TrackedCTA
              href="/auth/register"
              event="compliance_report_cta_click"
              eventProps={{ location: "hero" }}
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
            >
              {t('hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </TrackedCTA>
            <TrackedCTA
              href="/sample-report"
              event="compliance_report_cta_click"
              eventProps={{ location: "hero_secondary" }}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base"
            >
              Preview a Sample Report
            </TrackedCTA>
          </div>

          <p className="text-sm text-muted-foreground">
            Free trial. No credit card required. First report in minutes.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   The Reporting Gap
   ═══════════════════════════════════════════════════════════ */

function ReportingGapSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold font-display text-center">
            {t('reportingGap.title')}
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            {t('reportingGap.subtitle')}
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            {t('reportingGap.context')}
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   What's in the Report — detailed breakdown
   ═══════════════════════════════════════════════════════════ */

function ReportStructureSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  const sections: {
    icon: typeof FileText;
    title: string;
    desc: string;
  }[] = [
    {
      icon: BarChart3,
      title: t('reportStructure.executiveSummary.title'),
      desc: t('reportStructure.executiveSummary.description'),
    },
    {
      icon: ListChecks,
      title: t('reportStructure.severityBreakdown.title'),
      desc: t('reportStructure.severityBreakdown.description'),
    },
    {
      icon: ClipboardCheck,
      title: t('reportStructure.wcagMatrix.title'),
      desc: t('reportStructure.wcagMatrix.description'),
    },
    {
      icon: Scale,
      title: t('reportStructure.topPriority.title'),
      desc: t('reportStructure.topPriority.description'),
    },
    {
      icon: BookOpen,
      title: t('reportStructure.detailedList.title'),
      desc: t('reportStructure.detailedList.description'),
    },
    {
      icon: ShieldCheck,
      title: t('reportStructure.eaaReadiness.title'),
      desc: t('reportStructure.eaaReadiness.description'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('reportStructure.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('reportStructure.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {sections.map((s, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <s.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Export Formats
   ═══════════════════════════════════════════════════════════ */

function ExportFormatsSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            {t('exportFormats.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('exportFormats.pdf.title')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('exportFormats.pdf.description')}
                </p>
                <ul className="space-y-2">
                  {[
                    t('exportFormats.pdf.features.paginated'),
                    t('exportFormats.pdf.features.charts'),
                    t('exportFormats.pdf.features.branding'),
                    t('exportFormats.pdf.features.print')
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-lg">{t('exportFormats.docx.title')}</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t('exportFormats.docx.description')}
                </p>
                <ul className="space-y-2">
                  {[
                    t('exportFormats.docx.features.editable'),
                    t('exportFormats.docx.features.headings'),
                    t('exportFormats.docx.features.formatting'),
                    t('exportFormats.docx.features.branding')
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Who Uses These Reports
   ═══════════════════════════════════════════════════════════ */

function AudienceSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  const audiences: {
    icon: typeof Briefcase;
    title: string;
    useCase: string;
  }[] = [
    {
      icon: Scale,
      title: t('audience.compliance.title'),
      useCase: t('audience.compliance.useCase'),
    },
    {
      icon: Users,
      title: t('audience.agency.title'),
      useCase: t('audience.agency.useCase'),
    },
    {
      icon: Briefcase,
      title: t('audience.procurement.title'),
      useCase: t('audience.procurement.useCase'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          {t('audience.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {audiences.map((a, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.useCase}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Honest Scope
   ═══════════════════════════════════════════════════════════ */

function ScopeSection(): React.ReactElement {
  const t = useTranslations('wcagComplianceReport');
  
  return (
    <section className="border-y border-border/40 bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">
            {t('scope.title')}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('scope.description')}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {t('scope.disclaimer')}
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
  const t = useTranslations('wcagComplianceReport');
  
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
    {
      q: t('faq.q6.question'),
      a: t('faq.q6.answer'),
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
  const t = useTranslations('wcagComplianceReport');
  
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
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/pricing">{t('finalCTA.ctaSecondary')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Page
   ═══════════════════════════════════════════════════════════ */

function RelatedSolutionsSection(): React.ReactElement {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Beyond the Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/white-label-accessibility-reports" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Add Your Brand</h3>
              <p className="text-sm text-muted-foreground">Deliver reports under your own logo with full white-label customization.</p>
            </Link>
            <Link href="/website-accessibility-checker" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">How the Checker Works</h3>
              <p className="text-sm text-muted-foreground">See how VexNexa ranks and prioritizes issues before they reach the report.</p>
            </Link>
            <Link href="/accessibility-monitoring-agencies" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Track Compliance Over Time</h3>
              <p className="text-sm text-muted-foreground">Schedule recurring scans and generate monthly progress reports automatically.</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WcagComplianceReportPage(): React.ReactElement {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <ReportingGapSection />
      <ReportStructureSection />
      <ExportFormatsSection />
      <AudienceSection />
      <ScopeSection />
      <FAQSection />
      <RelatedSolutionsSection />
      <FinalCTASection />
    </>
  );
}
