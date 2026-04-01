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
  Zap,
  Shield,
  Target,
  ArrowRight,
  Check,
  AlertTriangle,
  BarChart3,
  Clock,
  Globe,
  FileText,
  Search,
  Layers,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";
import { useTranslations } from "next-intl";

/* ═══════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "WCAG Scan — Test Your Site Against WCAG 2.2",
  description:
    "Run a WCAG scan on any page in seconds. Get severity-ranked violations, affected elements, and fix guidance based on WCAG 2.1 and 2.2 criteria.",
  openGraph: {
    title: "WCAG Scan — Test Your Site Against WCAG 2.2",
    description:
      "Run a WCAG scan on any page in seconds. Get severity-ranked violations, affected elements, and fix guidance based on WCAG 2.1 and 2.2 criteria.",
    url: "https://vexnexa.com/wcag-scan",
    type: "website",
  },
  alternates: {
    canonical: "https://vexnexa.com/wcag-scan",
  },
};

/* ═══════════════════════════════════════════════════════════
   JSON-LD
   ═══════════════════════════════════════════════════════════ */

function JsonLd(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "VexNexa WCAG Scanner",
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    url: "https://vexnexa.com/wcag-scan",
    description:
      "Automated WCAG 2.2 scanning tool that detects accessibility violations ranked by severity, with element-level detail and fix guidance.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      description: "Free trial scan available",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      ratingCount: "82",
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
   Hero
   ═══════════════════════════════════════════════════════════ */

function HeroSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/3 left-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-accent/8 rounded-full blur-3xl" />
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
            <TrackedCTA
              href="/auth/register"
              event="wcag_scan_cta_click"
              eventProps={{ location: "hero" }}
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
            >
              {t('hero.ctaPrimary')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </TrackedCTA>
            <TrackedCTA
              href="/sample-report"
              event="wcag_scan_cta_click"
              eventProps={{ location: "hero_secondary" }}
              size="lg"
              variant="outline"
              className="px-8 py-6 text-base"
            >
              {t('hero.ctaSecondary')}
            </TrackedCTA>
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
   Problem
   ═══════════════════════════════════════════════════════════ */

function ProblemSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold font-display text-center">
            {t('problem.title')}
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            {t('problem.subtitle')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            {[
              {
                icon: AlertTriangle,
                title: t('problem.issues.flatErrors.title'),
                desc: t('problem.issues.flatErrors.description'),
              },
              {
                icon: Search,
                title: t('problem.issues.noElementContext.title'),
                desc: t('problem.issues.noElementContext.description'),
              },
              {
                icon: Clock,
                title: t('problem.issues.staleResults.title'),
                desc: t('problem.issues.staleResults.description'),
              },
            ].map((item, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-lg flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Solution Overview
   ═══════════════════════════════════════════════════════════ */

function SolutionSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t('solution.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {t('solution.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: Target,
                title: t('solution.features.severityRanked.title'),
                desc: t('solution.features.severityRanked.description'),
              },
              {
                icon: Layers,
                title: t('solution.features.elementDetail.title'),
                desc: t('solution.features.elementDetail.description'),
              },
              {
                icon: BarChart3,
                title: t('solution.features.healthScore.title'),
                desc: t('solution.features.healthScore.description'),
              },
              {
                icon: FileText,
                title: t('solution.features.exportReports.title'),
                desc: t('solution.features.exportReports.description'),
              },
            ].map((item, i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   How It Works
   ═══════════════════════════════════════════════════════════ */

function HowItWorksSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  const steps: { num: string; title: string; desc: string }[] = [
    {
      num: "1",
      title: t('howItWorks.steps.enterUrl.title'),
      desc: t('howItWorks.steps.enterUrl.description'),
    },
    {
      num: "2",
      title: t('howItWorks.steps.scanRuns.title'),
      desc: t('howItWorks.steps.scanRuns.description'),
    },
    {
      num: "3",
      title: t('howItWorks.steps.reviewResults.title'),
      desc: t('howItWorks.steps.reviewResults.description'),
    },
    {
      num: "4",
      title: t('howItWorks.steps.exportShare.title'),
      desc: t('howItWorks.steps.exportShare.description'),
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          {t('howItWorks.title')}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.num} className="text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full gradient-primary text-white font-bold text-lg flex items-center justify-center">
                {step.num}
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Differentiation
   ═══════════════════════════════════════════════════════════ */

function DifferentiationSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  const rows: { feature: string; vexnexa: boolean; basic: boolean }[] = [
    { feature: t('comparison.features.severityRanked'), vexnexa: true, basic: false },
    { feature: t('comparison.features.elementSelectors'), vexnexa: true, basic: false },
    { feature: t('comparison.features.wcag22Coverage'), vexnexa: true, basic: false },
    { feature: t('comparison.features.pdfDocxExport'), vexnexa: true, basic: false },
    { feature: t('comparison.features.healthTracking'), vexnexa: true, basic: false },
    { feature: t('comparison.features.whiteLabel'), vexnexa: true, basic: false },
    { feature: t('comparison.features.basicPassFail'), vexnexa: true, basic: true },
    { feature: t('comparison.features.freeSinglePage'), vexnexa: true, basic: true },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-4">
            {t('comparison.title')}
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            {t('comparison.subtitle')}
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold">{t('comparison.table.feature')}</th>
                  <th className="text-center py-3 px-4 font-semibold text-primary">
                    {t('comparison.table.vexnexa')}
                  </th>
                  <th className="text-center py-3 pl-4 font-semibold text-muted-foreground">
                    {t('comparison.table.basicChecker')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 pr-4">{row.feature}</td>
                    <td className="py-3 px-4 text-center">
                      <Check className="h-5 w-5 text-primary mx-auto" />
                    </td>
                    <td className="py-3 pl-4 text-center">
                      {row.basic ? (
                        <Check className="h-5 w-5 text-muted-foreground mx-auto" />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
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
   Use Cases
   ═══════════════════════════════════════════════════════════ */

function UseCasesSection(): React.ReactElement {
  const t = useTranslations('wcagScan');
  
  const cases: { icon: typeof Globe; title: string; desc: string }[] = [
    {
      icon: Globe,
      title: t('useCases.siteOwners.title'),
      desc: t('useCases.siteOwners.description'),
    },
    {
      icon: Zap,
      title: t('useCases.developers.title'),
      desc: t('useCases.developers.description'),
    },
    {
      icon: Shield,
      title: t('useCases.compliance.title'),
      desc: t('useCases.compliance.description'),
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          Built for Teams That Ship Accessible Products
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {cases.map((c, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <c.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{c.title}</h3>
                <p className="text-sm text-muted-foreground">{c.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Trust / Credibility
   ═══════════════════════════════════════════════════════════ */

function TrustSection(): React.ReactElement {
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl font-bold font-display">
            Trusted Foundations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">axe-core</p>
              <p className="text-sm text-muted-foreground">
                Open-source engine used by 40% of the internet&apos;s top sites
                for accessibility testing.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">WCAG 2.2</p>
              <p className="text-sm text-muted-foreground">
                Coverage includes the latest W3C success criteria for AA
                conformance.
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-3xl font-bold text-primary">EU Ready</p>
              <p className="text-sm text-muted-foreground">
                Reports include EAA 2025 readiness indicators for European
                compliance workflows.
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl mx-auto">
            Automated scanning covers a significant portion of testable WCAG
            criteria. Some criteria — especially those related to cognitive
            accessibility, content meaning, and complex interactions — require
            manual expert review for full conformance.
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
  const faqs: { q: string; a: string }[] = [
    {
      q: "What WCAG version does VexNexa scan against?",
      a: "VexNexa scans against WCAG 2.1 Level AA by default and includes coverage for selected WCAG 2.2 success criteria. You can see which specific criteria each violation maps to in the scan results.",
    },
    {
      q: "How long does a WCAG scan take?",
      a: "Most single-page scans complete in under 60 seconds. Multi-page scans depend on the number of pages and site complexity, but typically finish within a few minutes.",
    },
    {
      q: "Does a passing scan mean my site is fully WCAG compliant?",
      a: "No. Automated scans can detect roughly 30–50% of WCAG criteria reliably. Issues related to content meaning, reading order, and complex interactions often require manual testing. VexNexa reports clearly indicate when manual review is recommended.",
    },
    {
      q: "Can I scan pages behind a login?",
      a: "Yes. VexNexa supports authenticated scanning for pages that require login credentials. Contact our team for setup guidance on authenticated scan workflows.",
    },
    {
      q: "What output formats are available?",
      a: "Scan results can be exported as PDF and DOCX reports with full violation details, severity rankings, and fix guidance. Both formats are designed for sharing with stakeholders and attaching to compliance documentation.",
    },
    {
      q: "Is VexNexa free to try?",
      a: "Yes. You can run your first scan without a credit card. Paid plans unlock multi-page scanning, continuous monitoring, team collaboration, and white-label report branding.",
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Common Questions About WCAG Scanning
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
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Your First WCAG Scan Is Free
          </h2>
          <p className="text-lg text-muted-foreground">
            See exactly which WCAG violations affect your site — ranked by
            severity, with the element detail and fix steps to act on today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Scan Your Site Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/pricing">View Plans</Link>
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
  const t = useTranslations('wcagScan');
  
  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            {t('relatedSolutions.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/wcag-compliance-report" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.complianceReports')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.complianceReports.description')}</p>
            </Link>
            <Link href="/website-accessibility-checker" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.accessibilityChecker')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.accessibilityChecker.description')}</p>
            </Link>
            <Link href="/accessibility-monitoring-agencies" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">{t('relatedSolutions.ongoingMonitoring')}</h3>
              <p className="text-sm text-muted-foreground">{t('relatedSolutions.ongoingMonitoring.description')}</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WcagScanPage(): React.ReactElement {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <ProblemSection />
      <SolutionSection />
      <HowItWorksSection />
      <DifferentiationSection />
      <UseCasesSection />
      <FinalCTASection />
      <RelatedSolutionsSection />
    </>
  );
}
