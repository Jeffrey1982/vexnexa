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
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/3 right-1/3 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            PDF &amp; DOCX Export
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight leading-tight">
            WCAG Compliance Reports{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Stakeholders Actually Read
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Raw scan data doesn&apos;t get budget approved. VexNexa generates
            structured compliance reports with executive summaries, severity
            breakdowns, and prioritized fix lists — ready to attach to audits,
            tenders, and board presentations.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <TrackedCTA
              href="/auth/register"
              event="compliance_report_cta_click"
              eventProps={{ location: "hero" }}
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
            >
              Generate Your First Report
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
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold font-display text-center">
            Scan Results Alone Don&apos;t Convince Decision-Makers
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            You know the site has accessibility issues. The scanner confirmed
            it. But forwarding a screenshot of a tool&apos;s output to your
            compliance officer, procurement lead, or executive sponsor rarely
            moves the needle.
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Decision-makers need context: how bad is it, what should be fixed
            first, what does remediation look like, and how does the current
            state map to WCAG criteria. That requires a report — not a
            dashboard.
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
  const sections: {
    icon: typeof FileText;
    title: string;
    desc: string;
  }[] = [
    {
      icon: BarChart3,
      title: "Executive Summary",
      desc: "Health score, grade (A through F), risk level, and a plain-language overview. Designed for non-technical readers who need the headline, not the code.",
    },
    {
      icon: ListChecks,
      title: "Severity Breakdown",
      desc: "Issue counts by severity tier — critical, serious, moderate, minor. Visual donut chart and progress bars make the distribution immediately clear.",
    },
    {
      icon: ClipboardCheck,
      title: "WCAG Compliance Matrix",
      desc: "A criterion-by-criterion table showing pass, fail, needs manual review, or not tested for each relevant WCAG success criterion.",
    },
    {
      icon: Scale,
      title: "Top Priority Fixes",
      desc: "The highest-impact issues ranked by weighted severity. Each entry includes the affected element count and an impact score so teams know where to start.",
    },
    {
      icon: BookOpen,
      title: "Detailed Issue List",
      desc: "Every violation with its WCAG criterion, severity, affected CSS selectors, HTML snippets, and a link to the relevant WCAG understanding document.",
    },
    {
      icon: ShieldCheck,
      title: "EAA Readiness Indicator",
      desc: "For European compliance workflows: an EAA 2025 readiness badge and notes on how the site maps to European Accessibility Act requirements.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Inside a VexNexa Compliance Report
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every section is structured for a specific reader — from executives
            who need the one-page summary to developers who need the element
            selectors.
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
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Two Formats, One Consistent Report
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-50 dark:bg-red-950/30 rounded-lg flex items-center justify-center">
                    <Download className="h-5 w-5 text-red-600" />
                  </div>
                  <h3 className="font-semibold text-lg">PDF Report</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Print-optimized layout with visual charts, branded cover page,
                  and professional typography. Ideal for sharing with
                  stakeholders, attaching to RFP responses, or printing for
                  in-person meetings.
                </p>
                <ul className="space-y-2">
                  {[
                    "Paginated with running headers and footers",
                    "Donut charts, progress bars, and score cards",
                    "Optional white-label branding",
                    "Direct browser print — no conversion needed",
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
                  <h3 className="font-semibold text-lg">DOCX Report</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Editable Word document with the same content structure. Add
                  your own commentary, customize for specific clients, or paste
                  into existing proposal templates.
                </p>
                <ul className="space-y-2">
                  {[
                    "Fully editable in Microsoft Word or Google Docs",
                    "Structured headings for easy navigation",
                    "Tables, styled text, and severity indicators",
                    "White-label branding with embedded logo",
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
  const audiences: {
    icon: typeof Briefcase;
    title: string;
    useCase: string;
  }[] = [
    {
      icon: Scale,
      title: "Compliance Officers",
      useCase:
        "Attach WCAG compliance documentation to internal audits and regulatory filings. The WCAG matrix provides criterion-level evidence.",
    },
    {
      icon: Briefcase,
      title: "Procurement & Legal Teams",
      useCase:
        "Include accessibility reports in vendor assessments, RFP responses, and contract documentation. Structured PDF format meets formal requirements.",
    },
    {
      icon: Users,
      title: "Project Managers & Dev Leads",
      useCase:
        "Use the priority fix list to plan remediation sprints. Share the executive summary with leadership to secure budget for accessibility work.",
    },
    {
      icon: ShieldCheck,
      title: "Accessibility Consultants",
      useCase:
        "Deliver branded compliance reports as your primary deliverable. Add your analysis to the DOCX version and present findings in context.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          Reports Designed for the People Who Make Decisions
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
  return (
    <section className="border-y border-border/40 bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">
            A Compliance Report, Not a Compliance Guarantee
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            VexNexa reports document what automated testing detects. They cover
            a meaningful range of WCAG success criteria, but full conformance
            requires both automated and manual assessment. The report clearly
            marks which criteria were tested, which passed, and which need
            manual review.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Use VexNexa reports as part of a broader compliance process — not
            as a standalone legal certification.
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
      q: "What WCAG criteria does the compliance report cover?",
      a: "The report covers testable WCAG 2.1 Level AA criteria and selected WCAG 2.2 criteria. The WCAG compliance matrix explicitly shows each criterion's status — pass, fail, needs manual review, or not tested — so there's no ambiguity about coverage.",
    },
    {
      q: "Can I customize the report before sharing it?",
      a: "Yes. The DOCX export is fully editable — you can add commentary, remove sections, or paste content into your own templates. The PDF format is finalized for direct sharing or printing.",
    },
    {
      q: "Does the report include remediation guidance?",
      a: "Each violation includes a description of the issue, why it matters, and a link to the relevant WCAG understanding document. The top priority fixes section ranks issues by impact to help teams plan their remediation sprints.",
    },
    {
      q: "Can I add my own branding to the report?",
      a: "Yes. Business and Enterprise plans include white-label branding — your logo, colors, company name, and custom footer text on every export. See our white-label reporting page for details.",
    },
    {
      q: "How quickly can I generate a report?",
      a: "After a scan completes (typically under 60 seconds), the report is available for instant download in both PDF and DOCX formats. No manual formatting or assembly required.",
    },
    {
      q: "Is this report suitable for regulatory submissions?",
      a: "VexNexa reports are structured to support regulatory and procurement processes, but they document automated testing results only. For formal regulatory submissions, we recommend combining VexNexa reports with manual expert review documentation.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Compliance Reports — FAQ
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
    <section className="border-y border-border/40 bg-muted py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Generate a Report That Gets Read
          </h2>
          <p className="text-lg text-muted-foreground">
            Scan a URL, review the findings, and download a structured WCAG
            compliance report — all in under five minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Create Your First Report
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/pricing">View Plans &amp; Pricing</Link>
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
