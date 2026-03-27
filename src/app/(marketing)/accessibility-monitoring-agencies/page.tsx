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
  Bell,
  BarChart3,
  Globe,
  RefreshCw,
  Users,
  Shield,
  TrendingDown,
  Clock,
  Layers,
  AlertTriangle,
  Building2,
  Briefcase,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════
   SEO Metadata
   ═══════════════════════════════════════════════════════════ */

export const metadata: Metadata = {
  title: "Accessibility Monitoring for Agencies & Teams",
  description:
    "Track WCAG compliance across client sites continuously. Catch regressions, prove ongoing value, and deliver monthly accessibility reports.",
  openGraph: {
    title: "Accessibility Monitoring for Agencies & Teams",
    description:
      "Track WCAG compliance across client sites continuously. Catch regressions, prove ongoing value, and deliver monthly accessibility reports.",
    url: "https://vexnexa.com/accessibility-monitoring-agencies",
    type: "website",
  },
  alternates: {
    canonical: "https://vexnexa.com/accessibility-monitoring-agencies",
  },
};

/* ═══════════════════════════════════════════════════════════
   JSON-LD
   ═══════════════════════════════════════════════════════════ */

function JsonLd(): React.ReactElement {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "VexNexa Accessibility Monitoring",
    provider: {
      "@type": "Organization",
      name: "VexNexa",
      url: "https://vexnexa.com",
    },
    serviceType: "Accessibility Monitoring",
    description:
      "Continuous WCAG accessibility monitoring for agencies managing multiple client websites. Track regressions, generate recurring reports, and prove ongoing compliance.",
    url: "https://vexnexa.com/accessibility-monitoring-agencies",
    areaServed: "Worldwide",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   Hero — monitoring + recurring value angle
   ═══════════════════════════════════════════════════════════ */

function HeroSection(): React.ReactElement {
  return (
    <section className="relative py-20 lg:py-28 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/5 w-72 h-72 bg-accent/8 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="text-sm">
            Multi-Site Monitoring
          </Badge>

          <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight leading-tight">
            Catch Accessibility Regressions{" "}
            <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Before Your Clients Do
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            One-time audits go stale. Content changes, deploys happen, and WCAG
            violations creep back in. VexNexa monitors your client sites
            continuously — so you can prove ongoing value, not just
            point-in-time compliance.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Start Monitoring Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/pricing">See Agency Plans</Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground">
            Pro, Business, and Enterprise plans include monitoring. Free trial
            available.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════
   The Recurring Problem
   ═══════════════════════════════════════════════════════════ */

function ProblemSection(): React.ReactElement {
  const problems: { icon: typeof AlertTriangle; title: string; desc: string }[] = [
    {
      icon: TrendingDown,
      title: "Fixes don't stick",
      desc: "Your team fixed 30 issues last quarter. A CMS update reintroduced 12 of them. Without monitoring, nobody noticed for weeks.",
    },
    {
      icon: Clock,
      title: "Audits expire instantly",
      desc: "A one-time audit reflects one moment. The next deploy, the next content update, the next plugin change — and the report is already outdated.",
    },
    {
      icon: AlertTriangle,
      title: "Clients question the value",
      desc: "If you can't show measurable improvement over time, accessibility work feels like a one-off expense instead of ongoing protection.",
    },
  ];

  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold font-display">
              One-Time Audits Create a False Sense of Compliance
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Websites are living products. Accessibility is not a checkbox you
              complete once — it&apos;s a standard you maintain.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {problems.map((p, i) => (
              <Card key={i} className="text-center">
                <CardContent className="pt-6 space-y-3">
                  <div className="w-12 h-12 mx-auto bg-destructive/10 rounded-lg flex items-center justify-center">
                    <p.icon className="h-6 w-6 text-destructive" />
                  </div>
                  <h3 className="font-semibold">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
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
   What Monitoring Gives You
   ═══════════════════════════════════════════════════════════ */

function MonitoringFeaturesSection(): React.ReactElement {
  const features: { icon: typeof Bell; title: string; desc: string }[] = [
    {
      icon: RefreshCw,
      title: "Scheduled Recurring Scans",
      desc: "Set scan frequency per site — weekly, biweekly, or monthly. VexNexa runs them automatically and stores every result.",
    },
    {
      icon: BarChart3,
      title: "Score Trend Over Time",
      desc: "See health scores plotted across scans. Identify whether fixes improved things, or whether new deployments caused regressions.",
    },
    {
      icon: Bell,
      title: "Regression Alerts",
      desc: "Get notified when a site's score drops or when new critical violations appear. React before the client notices.",
    },
    {
      icon: Layers,
      title: "Multi-Site Dashboard",
      desc: "Manage all client sites from a single view. Compare scores, spot the worst performers, and allocate remediation effort.",
    },
    {
      icon: Globe,
      title: "Per-Site Scan History",
      desc: "Every scan is stored with full violation detail. Compare any two scans to see exactly what changed between them.",
    },
    {
      icon: Shield,
      title: "Branded Monthly Reports",
      desc: "Combine monitoring with white-label exports. Deliver monthly progress reports under your brand — proving the value of your retainer.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Continuous Oversight Without Manual Re-Scanning
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Set it up once. VexNexa handles the recurring scans, stores the
            history, and alerts you when something regresses.
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
   The Agency Monitoring Workflow
   ═══════════════════════════════════════════════════════════ */

function WorkflowSection(): React.ReactElement {
  return (
    <section className="border-y border-border/40 bg-muted py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-12">
            How Agencies Use VexNexa Monitoring
          </h2>
          <div className="space-y-8">
            {[
              {
                phase: "Onboarding",
                desc: "Run a baseline scan for each new client site. Establish the starting health score and document the initial violation count.",
              },
              {
                phase: "Remediation Sprint",
                desc: "Fix the highest-impact issues first. Re-scan to verify. The score trend shows measurable improvement your client can see.",
              },
              {
                phase: "Ongoing Monitoring",
                desc: "Schedule recurring scans. VexNexa runs them automatically and stores the results. You get alerts if regressions appear.",
              },
              {
                phase: "Monthly Reporting",
                desc: "Export a white-label progress report at the end of each month. Show what improved, what's stable, and what needs attention next.",
              },
              {
                phase: "Retention & Upsell",
                desc: "Data-backed monthly reports prove the value of your retainer. Clients see concrete results — not vague promises about compliance.",
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-6 items-start">
                <div className="w-10 h-10 shrink-0 rounded-full gradient-primary text-white font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{step.phase}</h3>
                  <p className="text-muted-foreground">{step.desc}</p>
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
   Who This Is For
   ═══════════════════════════════════════════════════════════ */

function AudienceSection(): React.ReactElement {
  const audiences: { icon: typeof Building2; title: string; desc: string }[] = [
    {
      icon: Building2,
      title: "Web Design & Development Agencies",
      desc: "Add accessibility monitoring to your maintenance contracts. It's a natural extension of the sites you already build and manage.",
    },
    {
      icon: Briefcase,
      title: "Accessibility Consultancies",
      desc: "Move from project-based billing to recurring revenue. Monitoring gives you ongoing work and ongoing client relationships.",
    },
    {
      icon: Users,
      title: "In-House Web Teams",
      desc: "Track accessibility across your own portfolio of sites. Catch regressions from content updates, CMS changes, and new deployments.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold font-display text-center mb-12">
          Monitoring That Supports Recurring Relationships
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
   Honest Scope Note
   ═══════════════════════════════════════════════════════════ */

function ScopeNoteSection(): React.ReactElement {
  return (
    <section className="border-y border-border/40 bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <h2 className="text-2xl font-bold font-display">
            Monitoring Complements — It Doesn&apos;t Replace — Expert Review
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Automated monitoring catches a meaningful range of WCAG violations
            — missing alt text, contrast failures, form label issues, ARIA
            misuse, and more. But some criteria, especially those involving
            content meaning and complex user flows, still require human judgment.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Use VexNexa monitoring to maintain the baseline and catch regressions
            automatically. Schedule manual expert reviews periodically to cover
            what automation can&apos;t.
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
      q: "How often can I schedule monitoring scans?",
      a: "Monitoring scans can be configured weekly, biweekly, or monthly per site. Pro plans support up to 3 monitored sites, Business up to 10, and Enterprise up to 25 (with additional packs available).",
    },
    {
      q: "Will I get notified about regressions?",
      a: "Yes. VexNexa sends alerts when a monitored site's health score drops significantly or when new critical-severity violations appear. Notifications can be configured via email and Slack (on plans with integration support).",
    },
    {
      q: "Can I compare two scan results for the same site?",
      a: "Every scan is stored with its full violation list, score, and severity breakdown. You can view the history timeline and compare any two scans to see exactly what changed.",
    },
    {
      q: "Does monitoring include white-label reporting?",
      a: "On Business and Enterprise plans, yes. You can export any monitoring scan result as a branded PDF or DOCX report. This is ideal for monthly client deliverables.",
    },
    {
      q: "Can I monitor sites I don't own?",
      a: "VexNexa scans publicly accessible pages. You can monitor any site with public URLs. For pages behind authentication, contact our team about authenticated scan workflows.",
    },
    {
      q: "Is monitoring just re-running scans automatically?",
      a: "Monitoring is more than scheduled scans. It includes score trend tracking, regression detection, alerting, and historical comparison — features that don't exist in a one-off scan workflow.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold font-display text-center mb-10">
            Monitoring for Agencies — FAQ
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
            Turn One-Time Audits Into Ongoing Value
          </h2>
          <p className="text-lg text-muted-foreground">
            Set up monitoring for your first client site today. See score
            trends, catch regressions early, and prove the impact of your
            accessibility work — month after month.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gradient-primary text-white border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link href="/auth/register">
                Start Monitoring Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-base" asChild>
              <Link href="/contact">Talk to Our Team</Link>
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
            Complete Your Agency Toolkit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/white-label-accessibility-reports" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">White-Label Reports</h3>
              <p className="text-sm text-muted-foreground">Deliver branded monthly reports to clients — your logo, your colors, your expertise.</p>
            </Link>
            <Link href="/wcag-scan" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">On-Demand WCAG Scans</h3>
              <p className="text-sm text-muted-foreground">Run ad-hoc scans between scheduled monitoring checks when clients need immediate answers.</p>
            </Link>
            <Link href="/wcag-compliance-report" className="group block p-5 rounded-xl border hover:border-primary/40 hover:shadow-md transition-all">
              <h3 className="font-semibold group-hover:text-primary transition-colors mb-2">Structured Compliance Reports</h3>
              <p className="text-sm text-muted-foreground">Export any monitoring scan as a PDF or DOCX with WCAG matrix and executive summary.</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function AccessibilityMonitoringAgenciesPage(): React.ReactElement {
  return (
    <>
      <JsonLd />
      <HeroSection />
      <ProblemSection />
      <MonitoringFeaturesSection />
      <WorkflowSection />
      <AudienceSection />
      <ScopeNoteSection />
      <FAQSection />
      <RelatedSolutionsSection />
      <FinalCTASection />
    </>
  );
}
