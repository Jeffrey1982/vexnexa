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
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 left-1/3 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            Smarter Accessibility Checking
          </Badge>

          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight leading-tight">
            An Accessibility Checker That{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Ranks What Matters
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Stop scrolling through unsorted error dumps. VexNexa checks your
            site for WCAG violations and shows you exactly which issues are
            critical, which are minor, and where each one lives in your HTML.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Check Your Site Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/features">Explore All Features</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Free check. No credit card. Results in seconds.
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
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl font-bold font-display text-center">
            Why &ldquo;78% Accessible&rdquo; Tells You Almost Nothing
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            A single percentage hides more than it reveals. Two sites can both
            score 78% — one has three critical keyboard traps, the other has
            forty missing alt texts on decorative images. The first is unusable.
            The second is mostly fine.
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Basic accessibility checkers treat every failed rule equally.
            VexNexa doesn&apos;t. Every violation is weighted by real-world
            impact so you can separate the urgent from the cosmetic.
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
  const features: { icon: typeof Eye; title: string; desc: string }[] = [
    {
      icon: Gauge,
      title: "Weighted Health Score",
      desc: "Not a simple ratio. Critical issues weigh more than minor ones, giving you a score that reflects actual user impact.",
    },
    {
      icon: ListChecks,
      title: "Severity Tiers",
      desc: "Four tiers — Critical, Serious, Moderate, Minor — so your team can triage without guessing. Critical issues always appear first.",
    },
    {
      icon: Eye,
      title: "Element-Level Context",
      desc: "Each issue shows the CSS selector, HTML snippet, and WCAG success criterion. Click through to understand exactly what failed and why.",
    },
    {
      icon: Lightbulb,
      title: "Fix Guidance per Issue",
      desc: "Every violation includes a plain-language explanation of the problem and a direct link to the relevant WCAG understanding document.",
    },
    {
      icon: TrendingUp,
      title: "Historical Tracking",
      desc: "Re-check the same page over time and compare scores. See whether your fixes actually improved the accessibility posture.",
    },
    {
      icon: FileText,
      title: "Shareable Reports",
      desc: "Export results as a branded PDF or editable DOCX. Attach to stakeholder updates, procurement responses, or audit documentation.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            What a Real Accessibility Check Looks Like
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Every check produces structured, actionable output — not just a
            color-coded badge.
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
  const items: { label: string; basic: string; vexnexa: string }[] = [
    {
      label: "Result format",
      basic: "Single score or badge",
      vexnexa: "Severity-ranked violation list",
    },
    {
      label: "Issue context",
      basic: "Rule ID only",
      vexnexa: "CSS selector + HTML snippet + WCAG ref",
    },
    {
      label: "Prioritization",
      basic: "None — flat list",
      vexnexa: "4-tier severity + weighted impact score",
    },
    {
      label: "Reporting",
      basic: "Screenshot or copy/paste",
      vexnexa: "PDF and DOCX with full detail",
    },
    {
      label: "Re-checking",
      basic: "Manual re-run, no history",
      vexnexa: "Score history + regression tracking",
    },
    {
      label: "Branding",
      basic: "Third-party logo on output",
      vexnexa: "White-label with your brand",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            How VexNexa Compares to Free Checkers
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 pr-4 font-semibold w-1/3">
                    Capability
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-1/3">
                    Free Checker
                  </th>
                  <th className="text-left py-3 pl-4 font-semibold text-primary w-1/3">
                    VexNexa
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
  const audiences: { icon: typeof Users; title: string; desc: string }[] = [
    {
      icon: Users,
      title: "Marketing & Content Teams",
      desc: "Check landing pages before campaigns go live. Avoid publishing inaccessible content that excludes visitors or triggers complaints.",
    },
    {
      icon: ShieldCheck,
      title: "Procurement & Compliance",
      desc: "Attach accessibility reports to vendor assessments, RFP responses, and internal audits. Structured evidence, not just a screenshot.",
    },
    {
      icon: Lightbulb,
      title: "Freelancers & Consultants",
      desc: "Add accessibility checking to your deliverables. Export branded reports that demonstrate the value you bring to every project.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          Designed for People Who Need More Than a Badge
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
  return (
    <section className="py-12 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">
            What Automated Checking Can&apos;t Do
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            No tool catches everything. Automated accessibility checkers
            reliably detect issues like missing alt text, color contrast
            failures, and missing form labels. But criteria that depend on
            content meaning, logical reading order, or complex keyboard
            interactions still need a human reviewer.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            VexNexa flags where manual review is recommended and helps you
            prioritize what automated testing does find — so your team spends
            expert time where it counts.
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
      q: "How is VexNexa different from WAVE or Lighthouse?",
      a: "WAVE and Lighthouse are excellent free tools for quick spot-checks. VexNexa adds severity ranking, element-level CSS selectors, exportable PDF/DOCX reports, score tracking over time, and white-label branding — features designed for teams that need to act on results, not just view them.",
    },
    {
      q: "Can I check more than one page at a time?",
      a: "Yes. Paid plans support multi-page scans across your site. Each page produces its own severity-ranked violation list and contributes to an overall site health score.",
    },
    {
      q: "What accessibility standards does VexNexa check against?",
      a: "VexNexa checks against WCAG 2.1 Level AA and selected WCAG 2.2 criteria using the axe-core engine. Each reported violation references the specific success criterion it relates to.",
    },
    {
      q: "Will VexNexa tell me my site is 'compliant'?",
      a: "No — and any tool that does should be treated with caution. VexNexa reports what it detects and indicates where manual review is needed. Full WCAG conformance requires both automated and manual assessment.",
    },
    {
      q: "Can I share results with non-technical stakeholders?",
      a: "Absolutely. PDF and DOCX exports include an executive summary with a health score, grade, and issue breakdown — designed to be readable without technical knowledge.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Accessibility Checker — FAQ
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
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            See What a Real Accessibility Check Reveals
          </h2>
          <p className="text-lg text-muted-foreground">
            Run your first check free — no credit card, no commitment. If the
            results are useful, your team will know what to do next.
          </p>
          <Button
            size="lg"
            className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
            asChild
          >
            <Link href="/auth/register">
              Start Your Free Check
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
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold font-display text-center mb-8">
            Related Accessibility Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/wcag-scan" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Run a WCAG Scan</h3>
              <p className="text-sm text-muted-foreground">Paste a URL and get severity-ranked violations in seconds.</p>
            </Link>
            <Link href="/wcag-compliance-report" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Export Compliance Reports</h3>
              <p className="text-sm text-muted-foreground">Download structured PDF and DOCX reports for stakeholders and audits.</p>
            </Link>
            <Link href="/white-label-accessibility-reports" className="group block p-5 rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Brand Your Reports</h3>
              <p className="text-sm text-muted-foreground">Deliver reports under your own logo with white-label branding.</p>
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
