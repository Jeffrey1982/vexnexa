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
  Palette,
  Building2,
  FileText,
  Repeat,
  Users,
  Shield,
  Globe,
  Briefcase,
  Sparkles,
  Download,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "White-Label Accessibility Reports for Agencies",
  description:
    "Deliver branded WCAG compliance reports under your own logo. White-label PDF and DOCX exports designed for agencies and consultants.",
  openGraph: {
    title: "White-Label Accessibility Reports for Agencies",
    description:
      "Deliver branded WCAG compliance reports under your own logo. White-label PDF and DOCX exports designed for agencies and consultants.",
    url: "https://vexnexa.com/white-label-accessibility-reports",
    type: "website",
  },
  alternates: {
    canonical: "https://vexnexa.com/white-label-accessibility-reports",
  },
};

/* ═══════════════════════════════════════════════════════════
   JSON-LD
   ═══════════════════════════════════════════════════════════ */

function JsonLd(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "VexNexa White-Label Accessibility Reports",
    provider: {
      "@type": "Organization",
      name: "VexNexa",
      url: "https://vexnexa.com",
    },
    serviceType: "White-Label Accessibility Reporting",
    description:
      "Branded WCAG compliance reports for agencies and consultants. Custom logo, colors, and company details on every PDF and DOCX export.",
    url: "https://vexnexa.com/white-label-accessibility-reports",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero — agency-focused
   ═══════════════════════════════════════════════════════════ */

function HeroSection(): React.ReactElement {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/3 left-1/5 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            Agency &amp; Consultant Feature
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight leading-tight">
            Accessibility Reports{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Branded as Yours
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Your clients see your logo, your colors, your company name. VexNexa
            handles the scanning and report generation — you deliver
            professional WCAG compliance documentation under your own brand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Try White-Label Reports Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/sample-report">See a Sample Report</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Available on Business and Enterprise plans. Start a free trial to
            preview.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   The Agency Problem
   ═══════════════════════════════════════════════════════════ */

function AgencyProblemSection(): React.ReactElement {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold font-display text-center">
            Your Clients Shouldn&apos;t See Someone Else&apos;s Brand
          </h2>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            You run the audit. You explain the findings. You guide the
            remediation. So why does the exported report carry another
            company&apos;s logo and link back to their sales page?
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            Generic accessibility tools treat your deliverables as their
            marketing channel. Every report you share becomes an ad for the tool
            — not for your expertise.
          </p>
          <p className="text-lg text-muted-foreground text-center leading-relaxed">
            White-label reports solve this. The output is yours. The trust stays
            with you.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   What You Can Brand
   ═══════════════════════════════════════════════════════════ */

function BrandingOptionsSection(): React.ReactElement {
  const options: { icon: typeof Palette; title: string; desc: string }[] = [
    {
      icon: Palette,
      title: "Logo & Colors",
      desc: "Upload your logo and set a primary color. Both appear on the report cover, headers, and accent elements throughout.",
    },
    {
      icon: Building2,
      title: "Company Name & Domain",
      desc: "Your company name replaces VexNexa branding. The report reads as if your team built it from scratch.",
    },
    {
      icon: FileText,
      title: "Custom Footer Text",
      desc: "Add a tagline, disclaimer, or contact line to the footer of every page. Useful for legal notes or support contact.",
    },
    {
      icon: Sparkles,
      title: "Corporate or Premium Style",
      desc: "Choose between a clean white corporate layout or a dark premium cover — whichever matches your client presentation style.",
    },
    {
      icon: Download,
      title: "PDF and DOCX Formats",
      desc: "White-label branding applies to both PDF (for printing and sharing) and DOCX (for editing before delivery).",
    },
    {
      icon: Globe,
      title: "Custom CTA & Support Links",
      desc: "Replace default links with your own website, support email, or call-to-action URL. Drive clients back to your site, not ours.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Full Control Over Report Branding
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Configure your brand once in settings. Every export automatically
            applies your branding — no manual editing needed.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {options.map((opt, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <opt.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{opt.title}</h3>
                <p className="text-sm text-muted-foreground">{opt.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   What's Inside a White-Label Report
   ═══════════════════════════════════════════════════════════ */

function ReportContentsSection(): React.ReactElement {
  const sections: string[] = [
    "Executive summary with health score, grade, and risk level",
    "Severity breakdown — critical, serious, moderate, minor counts",
    "WCAG compliance matrix showing pass/fail per criterion",
    "Top priority fixes ranked by weighted impact",
    "Detailed issue list with CSS selectors and fix guidance",
    "Visual charts — donut charts, progress bars, maturity indicators",
    "EAA 2025 readiness indicator for European clients",
    "Scan configuration details and methodology notes",
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-4">
            Every Report Includes
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Professional structure that clients and procurement teams expect.
            All under your brand.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sections.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   Agency Workflow
   ═══════════════════════════════════════════════════════════ */

function WorkflowSection(): React.ReactElement {
  const steps: { num: string; title: string; desc: string }[] = [
    {
      num: "1",
      title: "Configure your brand",
      desc: "Upload your logo, set colors, and add your company name in white-label settings. Takes two minutes.",
    },
    {
      num: "2",
      title: "Scan your client's site",
      desc: "Run a WCAG scan on any URL. Results are ready in seconds with full severity detail.",
    },
    {
      num: "3",
      title: "Export branded reports",
      desc: "Download PDF or DOCX. Your branding is applied automatically — cover, headers, footer, colors.",
    },
    {
      num: "4",
      title: "Deliver to your client",
      desc: "Share the report as your own deliverable. The client sees your expertise, not a third-party tool.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          From Scan to Client Delivery in Minutes
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
   Who Uses White-Label
   ═══════════════════════════════════════════════════════════ */

function AudienceSection(): React.ReactElement {
  const audiences: { icon: typeof Briefcase; title: string; desc: string }[] = [
    {
      icon: Briefcase,
      title: "Digital Agencies",
      desc: "Bundle accessibility audits into your web design or development packages. Deliver branded reports alongside your design mockups.",
    },
    {
      icon: Users,
      title: "Accessibility Consultants",
      desc: "Position yourself as the expert — not the middleman. Share reports that carry your name and build long-term trust with clients.",
    },
    {
      icon: Repeat,
      title: "Managed Service Providers",
      desc: "Offer recurring accessibility monitoring as a value-add service. Monthly branded reports become a retention tool.",
    },
    {
      icon: Shield,
      title: "Compliance Resellers",
      desc: "Resell accessibility reporting under your brand for regulated industries. White-label exports make this seamless.",
    },
  ];

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          Built for Teams That Serve Clients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {audiences.map((a, i) => (
            <Card key={i} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6 space-y-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
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
      q: "Which plans include white-label reports?",
      a: "White-label branding is available on Business and Enterprise plans. You can start a free trial to preview how your brand looks on exported reports before committing.",
    },
    {
      q: "Can I use different branding for different clients?",
      a: "Currently, white-label settings apply account-wide. If you need per-client branding, you can override settings via URL parameters when generating exports — allowing different logos and colors per export.",
    },
    {
      q: "Does the VexNexa name appear anywhere in white-label exports?",
      a: "No. When white-label branding is configured, VexNexa branding is completely removed from the report cover, headers, footer, and metadata. The report presents entirely under your brand.",
    },
    {
      q: "What file formats support white-label branding?",
      a: "Both PDF and DOCX exports support full white-label branding including logo, colors, company name, and custom footer text.",
    },
    {
      q: "Can I add my own legal disclaimers or terms?",
      a: "Yes. The custom footer text field supports any text you want to include — disclaimers, contact information, terms references, or compliance notes.",
    },
    {
      q: "Do white-label reports still include all the technical detail?",
      a: "Absolutely. White-label only changes the branding and presentation layer. The full WCAG violation detail, severity rankings, fix guidance, and WCAG criterion references remain unchanged.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            White-Label Reporting — FAQ
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
            Your Brand. Your Reports. Their Trust.
          </h2>
          <p className="text-lg text-muted-foreground">
            Start delivering accessibility reports that reinforce your
            expertise — not someone else&apos;s marketing.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/pricing">Compare Plans</Link>
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
            More for Agencies &amp; Teams
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/accessibility-monitoring-agencies" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Continuous Monitoring</h3>
              <p className="text-sm text-muted-foreground">Pair white-label reports with ongoing monitoring for maximum client value.</p>
            </Link>
            <Link href="/wcag-compliance-report" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Report Structure Details</h3>
              <p className="text-sm text-muted-foreground">See what&apos;s inside every compliance report — executive summary, WCAG matrix, and more.</p>
            </Link>
            <Link href="/wcag-scan" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">WCAG Scanner</h3>
              <p className="text-sm text-muted-foreground">The scan engine behind every report — severity-ranked violations with element detail.</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function WhiteLabelAccessibilityReportsPage(): React.ReactElement {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <AgencyProblemSection />
      <BrandingOptionsSection />
      <ReportContentsSection />
      <WorkflowSection />
      <AudienceSection />
      <FAQSection />
      <RelatedSolutionsSection />
      <FinalCTASection />
    </>
  );
}
