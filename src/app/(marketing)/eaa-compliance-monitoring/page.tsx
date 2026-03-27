import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Zap,
  Shield,
  RefreshCw,
  Bell,
  FileText,
  BarChart3,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";

export const metadata: Metadata = {
  title: "Accessibility Monitoring for Ongoing EAA Readiness",
  description:
    "Strengthen your EAA readiness with continuous WCAG monitoring. Track accessibility issues over time, catch regressions after releases, and build evidence of ongoing improvement.",
  openGraph: {
    title: "Accessibility Monitoring for EAA Readiness — VexNexa",
    description:
      "Continuous WCAG monitoring to support EAA readiness. Track issues, catch regressions, build evidence of improvement.",
    url: "https://vexnexa.com/eaa-compliance-monitoring",
  },
  alternates: { canonical: "https://vexnexa.com/eaa-compliance-monitoring" },
};

export default function EaaComplianceMonitoringPage() {
  const whyOngoing: { icon: typeof Shield; title: string; description: string }[] = [
    {
      icon: RefreshCw,
      title: "Websites change constantly",
      description:
        "Every new feature, content update, or redesign can introduce accessibility regressions. A one-off scan only captures a single moment in time.",
    },
    {
      icon: AlertTriangle,
      title: "The EAA expects ongoing effort",
      description:
        "The European Accessibility Act is not a one-time checkbox. Organisations need to demonstrate that they actively monitor and improve accessibility over time.",
    },
    {
      icon: Clock,
      title: "Issues compound if left unchecked",
      description:
        "Small accessibility problems accumulate with each release. Catching them early is cheaper and faster than fixing a backlog later.",
    },
  ];

  const whatYouTrack: string[] = [
    "WCAG 2.2 AA violations ranked by severity",
    "Accessibility score trends over weeks and months",
    "New issues introduced after deployments",
    "Score regressions with email alerts",
    "Issue resolution progress over time",
    "Multi-site compliance status in one dashboard",
  ];

  const workflow: { step: string; title: string; description: string }[] = [
    {
      step: "1",
      title: "Set up your sites",
      description:
        "Add the websites you want to monitor. Configure scan frequency — daily, weekly, or monthly.",
    },
    {
      step: "2",
      title: "Track results over time",
      description:
        "Review accessibility scores, issue trends, and severity breakdowns. See how your sites improve with each fix.",
    },
    {
      step: "3",
      title: "Act on alerts and export evidence",
      description:
        "Receive email alerts when scores drop. Export branded reports as evidence of ongoing monitoring and improvement.",
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              Accessibility monitoring for{" "}
              <span className="text-primary">ongoing EAA readiness</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              One-off scans are not enough. Strengthen your accessibility oversight with continuous WCAG monitoring, regression alerts, and evidence of improvement over time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <TrackedCTA
                href="/auth/register"
                event="eaa_page_cta_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                Start monitoring
                <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/pricing"
                event="eaa_page_cta_click"
                eventProps={{ location: "hero_secondary" }}
                size="lg"
                variant="outline"
              >
                View plans
              </TrackedCTA>
            </div>
            <p className="text-sm text-muted-foreground">
              Free account required. No credit card needed.
            </p>
          </div>
        </div>
      </section>

      {/* Compliance disclaimer */}
      <section className="border-y border-border/60 bg-muted py-6">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto flex items-start gap-4">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground leading-relaxed">
              <strong>Important:</strong> No automated tool can guarantee full legal compliance with the European Accessibility Act. VexNexa helps you monitor WCAG conformance, catch regressions, and build evidence of ongoing improvement — but it is not a substitute for legal advice or manual accessibility testing. <strong>New to the EAA?</strong> Read our guide: <Link href="/blog/what-is-the-european-accessibility-act" className="underline hover:text-primary">What Is the European Accessibility Act?</Link>
            </p>
          </div>
        </div>
      </section>

      {/* Why continuous monitoring */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Why one-off scans are not enough
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Accessibility is a moving target. Continuous monitoring helps you stay ahead.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {whyOngoing.map((item, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card/80 group interactive-hover">
                <CardContent className="p-8 space-y-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-display group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What you can track */}
      <section className="border-y border-border/40 bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold font-display mb-4 text-center">
              What teams track with VexNexa
            </h2>
            <p className="text-xl text-muted-foreground text-center mb-8">
              A clear view of accessibility status across your sites.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {whatYouTrack.map((item, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Practical workflow */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              A practical workflow for accessibility oversight
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {workflow.map((s, i) => (
              <div key={i} className="text-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
                  <span className="text-2xl font-bold text-white">{s.step}</span>
                </div>
                <h3 className="text-xl font-semibold font-display">{s.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              Start building your accessibility evidence
            </h2>
            <p className="text-xl leading-relaxed">
              Set up monitoring in minutes. Track improvement over time. Export reports when you need them.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TrackedCTA
                href="/auth/register"
                event="eaa_page_cta_click"
                eventProps={{ location: "footer" }}
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-muted"
              >
                Start your free scan <Zap className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="eaa_page_cta_click"
                eventProps={{ location: "footer_report" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                View sample report
              </TrackedCTA>
              <TrackedCTA
                href="/contact"
                event="eaa_page_cta_click"
                eventProps={{ location: "footer_secondary" }}
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
