import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Target,
  FileText,
  Zap,
  Bell,
  BarChart3,
  Users,
  ArrowRight,
  Check,
  RefreshCw,
  Building2,
  Globe,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";

export const metadata: Metadata = {
  title: "Features — VexNexa",
  description:
    "WCAG 2.2 scanning, white-label PDF/DOCX reports, continuous monitoring, team collaboration, and multi-site management. Built for agencies and compliance teams.",
  openGraph: {
    title: "Features — VexNexa",
    description:
      "WCAG 2.2 scanning, white-label reports, continuous monitoring, and multi-site management for agencies and compliance teams.",
    url: "https://vexnexa.com/features",
  },
  alternates: { canonical: "https://vexnexa.com/features" },
};

const outcomeCards: {
  icon: typeof Shield;
  title: string;
  description: string;
}[] = [
  {
    icon: Target,
    title: "Catch issues before they stack up",
    description:
      "Scan any page against WCAG 2.2 and get severity-ranked violations with the affected elements, code context, and fix guidance your team actually needs.",
  },
  {
    icon: FileText,
    title: "Turn findings into client-ready reports",
    description:
      "Export PDF or DOCX reports with executive summaries, WCAG compliance matrices, and branded covers. White-label available on Business plans and above.",
  },
  {
    icon: Bell,
    title: "Monitor changes after releases",
    description:
      "Set up scheduled scans to catch regressions automatically. Get notified when scores drop or new critical issues appear — before your clients do.",
  },
  {
    icon: BarChart3,
    title: "Prioritise what to fix next",
    description:
      "Issues are ranked by severity and WCAG impact. Focus on the violations that block the most users first, and track score improvement over time.",
  },
];

const workflowSteps: { step: string; title: string; description: string }[] = [
  {
    step: "1",
    title: "Scan a site",
    description:
      "Paste a URL and run a scan. Results come back in seconds with every WCAG violation mapped to the affected element.",
  },
  {
    step: "2",
    title: "Review prioritised findings",
    description:
      "Issues are grouped by severity — critical, serious, moderate, minor. Each one shows the element, the WCAG criterion, and how to fix it.",
  },
  {
    step: "3",
    title: "Share reports and monitor over time",
    description:
      "Export branded reports for stakeholders. Schedule recurring scans to track improvement and catch new issues after every deployment.",
  },
];

const builtForItems: {
  icon: typeof Building2;
  title: string;
  description: string;
}[] = [
  {
    icon: Building2,
    title: "Agencies",
    description:
      "White-label reports, multi-site management, and team seats let you deliver accessibility as a service under your own brand.",
  },
  {
    icon: Users,
    title: "Internal product and compliance teams",
    description:
      "Dashboard overview, scheduled monitoring, and exportable evidence for audits, tenders, and internal governance.",
  },
  {
    icon: Globe,
    title: "Multi-site operators",
    description:
      "Manage dozens of sites from one account. Compare scores, spot regressions across properties, and report to stakeholders in one place.",
  },
];

const specifics: string[] = [
  "WCAG 2.1 and 2.2 AA coverage via axe-core engine",
  "PDF and DOCX report export with branded covers",
  "White-label: your logo, colours, company name, footer text",
  "Scheduled scans — daily, weekly, or monthly",
  "Regression alerts via email when scores drop",
  "Team seats with role-based access",
  "Multi-site dashboard with score comparisons",
  "Severity-ranked issues with element-level detail",
  "Remediation guidance with code examples",
  "Slack and Jira integration (Pro plans and above)",
];

export default function FeaturesPage(): React.ReactElement {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-sm">
              Platform overview
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              Accessibility monitoring and reporting that fits{" "}
              <span className="text-primary">real workflows</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Move from one-off scans to repeatable monitoring, branded
              reporting, and clearer accessibility follow-up for client and
              internal teams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <TrackedCTA
                href="/auth/register"
                event="features_cta_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                Start your free scan
                <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="features_cta_click"
                eventProps={{ location: "hero_secondary" }}
                size="lg"
                variant="outline"
              >
                View sample report
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome cards */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              What VexNexa helps you do
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Every feature is built around a practical outcome — not a checkbox.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {outcomeCards.map((card, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card/80">
                <CardContent className="p-8 space-y-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <card.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {card.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              How it works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From first scan to ongoing monitoring in three steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {workflowSteps.map((s) => (
              <div key={s.step} className="text-center space-y-4">
                <div className="w-12 h-12 rounded-full gradient-primary text-white font-bold text-xl flex items-center justify-center mx-auto">
                  {s.step}
                </div>
                <h3 className="text-lg font-semibold font-display">
                  {s.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <TrackedCTA
              href="/auth/register"
              event="features_cta_click"
              eventProps={{ location: "workflow" }}
              size="lg"
              className="gradient-primary text-white"
            >
              Try it now — free scan
              <Zap className="ml-2 h-5 w-5" />
            </TrackedCTA>
          </div>
        </div>
      </section>

      {/* Built for */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Built for teams that take accessibility seriously
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {builtForItems.map((item, i) => (
              <Card key={i} className="border-0 shadow-elegant bg-card/80">
                <CardContent className="p-8 space-y-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-2">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">
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

      {/* Specifics */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold font-display text-center mb-10">
              What&apos;s included
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              {specifics.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              Ready to try it?
            </h2>
            <p className="text-xl leading-relaxed">
              Create a free account, scan your first site, and see the results
              for yourself. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TrackedCTA
                href="/auth/register"
                event="features_cta_click"
                eventProps={{ location: "footer" }}
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
              >
                Start your free scan
                <Zap className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="features_cta_click"
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
                eventProps={{ location: "features_footer" }}
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
