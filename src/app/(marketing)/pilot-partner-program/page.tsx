import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Check,
  Building2,
  Globe,
  Users,
  FileText,
  RefreshCw,
  MessageCircle,
  Handshake,
  ClipboardCheck,
  Rocket,
  Shield,
  AlertTriangle,
  Eye,
} from "lucide-react";
import { TrackedCTA } from "@/components/marketing/TrackedCTA";

export const metadata: Metadata = {
  title: "Pilot Partner Program | Accessibility Monitoring & Reporting",
  description:
    "Apply to become a VexNexa pilot partner and explore accessibility monitoring, reporting, and white-label workflows for agencies, institutions, and EU-facing teams.",
  openGraph: {
    title: "VexNexa Pilot Partner Program — Accessibility Monitoring & Reporting",
    description:
      "Join a limited pilot group to explore WCAG monitoring, branded reporting, and accessibility workflows with direct VexNexa support.",
    url: "https://vexnexa.com/pilot-partner-program",
  },
  alternates: { canonical: "https://vexnexa.com/pilot-partner-program" },
};

const audiences: {
  icon: typeof Building2;
  title: string;
  description: string;
}[] = [
  {
    icon: Building2,
    title: "Agencies and digital partners",
    description:
      "You manage client websites and need a repeatable way to scan, report, and monitor accessibility. The pilot gives you a real workflow to test with your team and clients.",
  },
  {
    icon: Globe,
    title: "Institutions and public-facing teams",
    description:
      "You run websites that serve a broad audience — education, government, healthcare, nonprofits. The pilot helps you understand your accessibility baseline and track improvements over time.",
  },
  {
    icon: Shield,
    title: "EU-facing companies managing compliance",
    description:
      "You need ongoing accessibility oversight for EAA readiness or internal policy. The pilot gives you monitoring, evidence of improvement, and clear issue prioritisation.",
  },
];

const benefits: { icon: typeof FileText; title: string; description: string }[] = [
  {
    icon: Eye,
    title: "Scan and reporting workflows",
    description:
      "Run WCAG 2.2 scans on real sites and generate structured reports with severity-ranked issues and actionable guidance.",
  },
  {
    icon: FileText,
    title: "Branded deliverables",
    description:
      "Export white-label PDF and DOCX reports under your own logo — ready to share with clients, stakeholders, or leadership.",
  },
  {
    icon: RefreshCw,
    title: "Ongoing monitoring",
    description:
      "Set up recurring scans to catch regressions after redesigns, content changes, or new releases. Track scores over time.",
  },
  {
    icon: MessageCircle,
    title: "Direct feedback loop",
    description:
      "Share what works, what doesn't, and what you'd like to see. Pilot partners have a direct line to the product team.",
  },
  {
    icon: Rocket,
    title: "Early input on improvements",
    description:
      "Your feedback shapes upcoming features. Pilot partners influence the roadmap based on real-world usage.",
  },
  {
    icon: Users,
    title: "Setup support",
    description:
      "We help you get started — from your first scan to recurring monitoring — so you're productive from day one.",
  },
];

const expectations: { title: string; description: string }[] = [
  {
    title: "Honest product feedback",
    description:
      "Tell us what works, what's confusing, and what's missing. We value direct, practical input.",
  },
  {
    title: "A short feedback check-in",
    description:
      "After your initial use, we'll schedule a brief check-in to learn from your experience.",
  },
  {
    title: "Optional collaboration reference",
    description:
      "If the pilot is useful, we may ask if we can reference the collaboration — only with your explicit approval.",
  },
  {
    title: "Optional case study or logo mention",
    description:
      "Never assumed. Only pursued if you're comfortable and see mutual value in sharing.",
  },
];

const agencyBenefits: string[] = [
  "Run scans on client websites and get a structured WCAG 2.2 report in minutes",
  "Export branded PDF and DOCX reports with your agency logo and colours",
  "Prioritise issues by severity so clients know where to start",
  "Schedule recurring scans to monitor accessibility over time",
  "Manage multiple client sites from a single dashboard",
  "Explore white-label delivery workflows for client-facing reports",
];

const processSteps: { step: string; title: string; description: string }[] = [
  {
    step: "1",
    title: "Apply",
    description:
      "Tell us about your team, how many sites you manage, and what you're looking for. Takes under two minutes.",
  },
  {
    step: "2",
    title: "We review fit",
    description:
      "We look at whether VexNexa is a practical fit for your workflow and reach out with next steps.",
  },
  {
    step: "3",
    title: "Get access and onboarding",
    description:
      "Once accepted, you'll scan a live site, review your first report, and configure monitoring — with hands-on support.",
  },
  {
    step: "4",
    title: "Use it on a real site",
    description:
      "Run the pilot on real client or organisational sites. Share feedback as you go.",
  },
];

const importantNotes: string[] = [
  "Automated scans provide valuable coverage but do not replace a full manual audit. Depending on your requirements, additional testing may still be needed.",
  "Pilot availability is limited. VexNexa may prioritise applications that represent a strong fit for the current feature set.",
  "The pilot is a real product experience — not a beta test. You'll use the same tools and workflows available to paying customers.",
  "Public references, logo use, or case studies are never assumed. Any collaboration of that kind requires your explicit approval.",
];

export default function PilotPartnerProgramPage(): JSX.Element {
  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium text-primary">
              <Handshake className="h-4 w-4" aria-hidden="true" />
              Limited pilot program
            </div>

            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              Become a VexNexa{" "}
              <span className="text-primary">pilot partner</span>
            </h1>

            <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Get access to practical accessibility monitoring and reporting
              workflows while helping shape how VexNexa supports agencies,
              institutions, and EU-facing teams.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <TrackedCTA
                href="/partner-apply"
                event="pilot_partner_apply_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                Apply for pilot access
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="pilot_partner_sample_report_click"
                eventProps={{ location: "hero" }}
                size="lg"
                variant="outline"
              >
                View sample report
              </TrackedCTA>
            </div>

            <p className="text-sm text-muted-foreground pt-2">
              Limited pilot spots. Best fit for agencies, institutions, and
              teams managing live websites. Start with one site — no long-term commitment.
            </p>
          </div>
        </div>
      </section>

      {/* Who this is for */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Who this is for
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The pilot is designed for teams that manage real websites and want
              a practical accessibility workflow — not a one-time scan.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            {audiences.map((a, i) => (
              <Card key={i} className="h-full border-0 shadow-elegant">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <a.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">{a.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {a.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What pilot partners get */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              What pilot partners get
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Start with one live site, run your first scan, and see the
              full reporting workflow — with direct support from the VexNexa team.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((b, i) => (
              <Card key={i} className="h-full border-0 shadow-elegant">
                <CardContent className="p-8 space-y-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <b.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-semibold font-display">{b.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {b.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* What we ask in return */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              What we ask in return
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              This is a collaborative partnership. We value your time and
              feedback — no obligations beyond honest input.
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid sm:grid-cols-2 gap-6">
            {expectations.map((e, i) => (
              <Card key={i} className="h-full border-0 shadow-elegant">
                <CardContent className="p-6 space-y-2">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="font-semibold font-display">{e.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                        {e.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why this works well for agencies */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold uppercase tracking-wider">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                For agencies
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold font-display">
                Why this works well for agencies
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                If you manage client websites, the pilot gives you a real
                workflow to test — from scanning and reporting to ongoing
                monitoring. See how VexNexa fits your existing process before
                committing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <TrackedCTA
                  href="/partner-apply"
                  event="pilot_partner_apply_click"
                  eventProps={{ location: "agency_section" }}
                  className="gradient-primary text-white"
                >
                  Apply as an agency partner
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                </TrackedCTA>
                <TrackedCTA
                  href="/for-agencies"
                  event="pilot_partner_contact_click"
                  eventProps={{ location: "agency_section" }}
                  variant="outline"
                >
                  Learn more about agency use
                </TrackedCTA>
              </div>
            </div>

            <div className="space-y-3">
              {agencyBenefits.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-muted"
                >
                  <Check className="h-5 w-5 text-success mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <span className="text-sm leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What to expect from the pilot */}
      <section className="border-y border-border/40 bg-muted py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              What to expect
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The process is straightforward. Apply, get set up, and start using
              VexNexa on a real site.
            </p>
          </div>

          <div className="max-w-4xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((s, i) => (
              <div key={i} className="relative">
                <Card className="h-full border-0 shadow-elegant">
                  <CardContent className="p-6 space-y-3">
                    <div className="h-10 w-10 rounded-full gradient-primary text-white flex items-center justify-center font-bold text-lg font-display">
                      {s.step}
                    </div>
                    <h3 className="font-semibold font-display">{s.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {s.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Important notes */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
              <h2 className="text-2xl font-bold font-display">
                Important notes
              </h2>
            </div>

            <div className="space-y-4">
              {importantNotes.map((note, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl border bg-card"
                >
                  <ClipboardCheck className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              Interested in becoming a pilot partner?
            </h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Tell us about your team and what you're looking for. We review
              every application and aim to respond within 1 business day.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <TrackedCTA
                href="/partner-apply"
                event="pilot_partner_apply_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                className="bg-background text-primary hover:bg-muted"
              >
                Apply for pilot access
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="pilot_partner_sample_report_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                variant="outline"
                className="text-primary hover:bg-primary/5"
              >
                View sample report
              </TrackedCTA>
              <TrackedCTA
                href="/partner-apply"
                event="pilot_partner_contact_click"
                eventProps={{ location: "final_cta" }}
                size="lg"
                variant="outline"
                className="text-primary hover:bg-primary/5"
              >
                Ask a question
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
