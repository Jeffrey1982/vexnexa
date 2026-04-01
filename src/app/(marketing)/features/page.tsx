import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";
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
  TrendingUp,
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



export default function FeaturesPage(): React.ReactElement {
  const t = useTranslations('features');
  
  const specifics: string[] = [
    t('specifics.wcagCoverage'),
    t('specifics.reportExport'),
    t('specifics.whiteLabel'),
    t('specifics.scheduledScans'),
    t('specifics.regressionAlerts'),
    t('specifics.teamSeats'),
    t('specifics.multiSiteDashboard'),
    t('specifics.severityRanked'),
    t('specifics.remediationGuidance'),
    t('specifics.slackJiraIntegration'),
  ];

  const outcomeCards: {
    icon: typeof Shield;
    title: string;
    description: string;
  }[] = [
    {
      icon: Target,
      title: t('outcomes.catchIssues.title'),
      description: t('outcomes.catchIssues.description'),
    },
    {
      icon: FileText,
      title: t('outcomes.clientReports.title'),
      description: t('outcomes.clientReports.description'),
    },
    {
      icon: TrendingUp,
      title: t('outcomes.monitorChanges.title'),
      description: t('outcomes.monitorChanges.description'),
    },
    {
      icon: BarChart3,
      title: t('outcomes.prioritise.title'),
      description: t('outcomes.prioritise.description'),
    },
  ];

  const workflowSteps: { step: string; title: string; description: string }[] = [
    {
      step: "1",
      title: t('workflow.step1.title'),
      description: t('workflow.step1.description'),
    },
    {
      step: "2",
      title: t('workflow.step2.title'),
      description: t('workflow.step2.description'),
    },
    {
      step: "3",
      title: t('workflow.step3.title'),
      description: t('workflow.step3.description'),
    },
  ];

  const builtForItems: {
    icon: typeof Building2;
    title: string;
    description: string;
  }[] = [
    {
      icon: Building2,
      title: t('builtFor.agencies.title'),
      description: t('builtFor.agencies.description'),
    },
    {
      icon: Users,
      title: t('builtFor.internal.title'),
      description: t('builtFor.internal.description'),
    },
    {
      icon: Globe,
      title: t('builtFor.multiSite.title'),
      description: t('builtFor.multiSite.description'),
    },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge variant="outline" className="text-sm">
              {t('hero.badge')}
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              {t('hero.title')}{" "}
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <TrackedCTA
                href="/auth/register"
                event="features_cta_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="features_cta_click"
                eventProps={{ location: "hero_secondary" }}
                size="lg"
                variant="outline"
              >
                {t('hero.ctaSecondary')}
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>

      {/* Outcome cards */}
      <section className="border-y border-border/40 bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('outcomes.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('outcomes.subtitle')}
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
              {t('workflow.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('workflow.subtitle')}
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
      <section className="border-y border-border/40 bg-muted py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('builtFor.title')}
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
              {t('finalCTA.title')}
            </h2>
            <p className="text-xl leading-relaxed">
              {t('finalCTA.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <TrackedCTA
                href="/auth/register"
                event="features_cta_click"
                eventProps={{ location: "footer" }}
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-muted"
              >
                {t('finalCTA.ctaPrimary')}
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
                {t('finalCTA.ctaSecondary')}
              </TrackedCTA>
              <TrackedCTA
                href="/contact"
                event="contact_cta_click"
                eventProps={{ location: "features_footer" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t('finalCTA.ctaContact')}
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
