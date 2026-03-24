import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Zap,
  FileText,
  Bell,
  Users,
  Building2,
  Eye,
  RefreshCw,
  Shield,
  Globe,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";

export const metadata: Metadata = {
  title: "WCAG Accessibility Reporting for Agencies",
  description:
    "Scan client websites for WCAG 2.2 issues, deliver branded accessibility reports, and monitor compliance across your portfolio. Built for agencies and web studios.",
  openGraph: {
    title: "WCAG Accessibility Reporting for Agencies — VexNexa",
    description:
      "Scan client sites, deliver white-label reports, and monitor accessibility across your portfolio.",
    url: "https://vexnexa.com/for-agencies",
  },
  alternates: { canonical: "https://vexnexa.com/for-agencies" },
};

export default function ForAgenciesPage() {
  const painPoints: { title: string; description: string }[] = [
    {
      title: "Clients ask about accessibility but you lack a repeatable process",
      description:
        "Without a standardised workflow, every accessibility review takes longer than it should. VexNexa gives you a scannable, reportable, monitorable process from day one.",
    },
    {
      title: "You cannot scale manual audits across 10+ client sites",
      description:
        "Manual testing is important but expensive. Automated scans give you baseline coverage across your entire portfolio so you can focus manual effort where it counts.",
    },
    {
      title: "Reports look inconsistent or unprofessional",
      description:
        "Generic scan output does not impress clients. VexNexa exports branded PDF and DOCX reports under your own logo with clear issue prioritisation.",
    },
  ];

  const workflows: { icon: typeof FileText; title: string; description: string }[] = [
    {
      icon: Eye,
      title: "Scan any client site in minutes",
      description:
        "Enter a URL, get a full WCAG 2.2 audit with severity-ranked issues. No setup needed per client.",
    },
    {
      icon: FileText,
      title: "Export white-label reports",
      description:
        "Generate branded PDF and DOCX reports with your logo, colours, and contact info. Ready to share with clients.",
    },
    {
      icon: RefreshCw,
      title: "Schedule recurring scans",
      description:
        "Set up weekly or monthly monitoring. Get alerted when scores drop or new critical issues appear on any client site.",
    },
    {
      icon: Users,
      title: "Manage multiple clients from one dashboard",
      description:
        "Organise sites by client. Track scores, trends, and open issues across your entire portfolio.",
    },
    {
      icon: Bell,
      title: "Catch regressions before clients do",
      description:
        "After a redesign, migration, or new release — VexNexa catches accessibility regressions automatically.",
    },
    {
      icon: Shield,
      title: "Support EAA readiness for EU clients",
      description:
        "Help clients strengthen their ongoing accessibility oversight with continuous monitoring and evidence of improvement.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              Accessibility reporting your agency can{" "}
              <span className="text-primary">actually deliver</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Scan client sites for WCAG 2.2 issues, export branded reports, set up continuous monitoring, and manage accessibility across your entire portfolio — all from one platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <TrackedCTA
                href="/auth/register"
                event="agencies_page_cta_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                Start your free scan
                <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="agencies_page_cta_click"
                eventProps={{ location: "hero_secondary" }}
                size="lg"
                variant="outline"
              >
                View sample report
              </TrackedCTA>
            </div>
            <p className="text-sm text-muted-foreground">
              Free account required. No credit card needed.
            </p>
          </div>
        </div>
      </section>

      {/* Agency pain points */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Common challenges agencies face
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accessibility is becoming a client expectation, not a nice-to-have.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {painPoints.map((point, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card/80">
                <CardContent className="p-8 space-y-3">
                  <h3 className="text-lg font-semibold font-display">{point.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {point.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why VexNexa fits agency workflows */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Why VexNexa fits agency workflows
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Practical tooling that maps to how agencies already work with clients.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {workflows.map((wf, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card/80 group interactive-hover">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                    <wf.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-display group-hover:text-primary transition-colors">
                    {wf.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {wf.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-8 text-center">
              Included on Business and Enterprise plans
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                "White-label PDF and DOCX reports",
                "Custom logo, colours, and footer text",
                "Multi-site dashboard",
                "Scheduled scans with email alerts",
                "Role-based team access",
                "WCAG 2.2 AA coverage with axe-core",
                "Severity-ranked issue prioritisation",
                "EU-hosted, GDPR compliant",
              ].map((item, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AgencyCTAStrip location="for-agencies" />

      {/* CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              Start delivering accessibility to your clients
            </h2>
            <p className="text-xl leading-relaxed">
              Create a free account, scan your first client site, and see how VexNexa fits your workflow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TrackedCTA
                href="/auth/register"
                event="agencies_page_cta_click"
                eventProps={{ location: "footer" }}
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Start your free scan <Zap className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="agencies_page_cta_click"
                eventProps={{ location: "footer_secondary" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                View sample report
              </TrackedCTA>
              <TrackedCTA
                href="/contact"
                event="contact_cta_click"
                eventProps={{ location: "agencies_footer" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                Contact us
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
