"use client";

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
import { useTranslations } from "next-intl";

// Dynamic metadata will be handled by the layout or generateMetadata function

export default function ForAgenciesPage() {
  const t = useTranslations('forAgencies');
  
  const painPoints = [
    { title: t('painPoints.p1.title'), description: t('painPoints.p1.description') },
    { title: t('painPoints.p2.title'), description: t('painPoints.p2.description') },
    { title: t('painPoints.p3.title'), description: t('painPoints.p3.description') },
  ];

  const workflows: { icon: typeof FileText; title: string; description: string }[] = [
    { icon: Eye, title: t('workflows.w1.title'), description: t('workflows.w1.description') },
    { icon: FileText, title: t('workflows.w2.title'), description: t('workflows.w2.description') },
    { icon: RefreshCw, title: t('workflows.w3.title'), description: t('workflows.w3.description') },
    { icon: Users, title: t('workflows.w4.title'), description: t('workflows.w4.description') },
    { icon: Bell, title: t('workflows.w5.title'), description: t('workflows.w5.description') },
    { icon: Shield, title: t('workflows.w6.title'), description: t('workflows.w6.description') },
  ];

  return (
    <>
      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
              {t('hero.title')}{" "}
              <span className="text-primary">{t('hero.titleHighlight')}</span>
            </h1>
            <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {t('hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <TrackedCTA
                href="/auth/register"
                event="agencies_page_cta_click"
                eventProps={{ location: "hero" }}
                size="lg"
                className="gradient-primary text-white"
              >
                {t('hero.ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="agencies_page_cta_click"
                eventProps={{ location: "hero_secondary" }}
                size="lg"
                variant="outline"
              >
                {t('hero.ctaSecondary')}
              </TrackedCTA>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('hero.noCreditCard')}
            </p>
          </div>
        </div>
      </section>

      {/* Agency pain points */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('painPoints.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('painPoints.subtitle')}
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
              {t('workflows.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('workflows.subtitle')}
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
              {t('included.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                t('included.i1'), t('included.i2'), t('included.i3'), t('included.i4'),
                t('included.i5'), t('included.i6'), t('included.i7'), t('included.i8'),
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

      {/* How agencies use VexNexa — workflow visual */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('agencyWorkflow.title')}
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('agencyWorkflow.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {[
              { step: "1", icon: Globe, title: t('agencyWorkflow.s1.title'), description: t('agencyWorkflow.s1.description') },
              { step: "2", icon: FileText, title: t('agencyWorkflow.s2.title'), description: t('agencyWorkflow.s2.description') },
              { step: "3", icon: RefreshCw, title: t('agencyWorkflow.s3.title'), description: t('agencyWorkflow.s3.description') },
              { step: "4", icon: Bell, title: t('agencyWorkflow.s4.title'), description: t('agencyWorkflow.s4.description') },
            ].map((s, i) => (
              <div key={i} className="relative text-center space-y-3">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
                  <s.icon className="h-7 w-7 text-white" />
                </div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider">{t('agencyWorkflow.stepLabel')} {s.step}</div>
                <h3 className="text-lg font-semibold font-display">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
                {i < 3 && (
                  <div className="hidden md:block absolute top-7 -right-3 text-muted-foreground/30">
                    <ArrowRight className="h-6 w-6" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <AgencyCTAStrip location="for-agencies" />

      {/* Pilot Partner Program — prominent */}
      <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-5">
            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold">
              {t('pilotBanner.badge')}
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t('pilotBanner.title')}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('pilotBanner.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <TrackedCTA
                href="/pilot-partner-program"
                event="agencies_page_cta_click"
                eventProps={{ location: "pilot_banner" }}
                size="lg"
                className="gradient-primary text-white"
              >
                {t('pilotBanner.ctaPrimary')} <ArrowRight className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/contact?from=pilot-agencies"
                event="agencies_page_cta_click"
                eventProps={{ location: "pilot_apply" }}
                size="lg"
                variant="outline"
              >
                {t('pilotBanner.ctaSecondary')}
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t('finalCta.title')}
            </h2>
            <p className="text-xl leading-relaxed">
              {t('finalCta.subtitle')}
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
                {t('finalCta.ctaPrimary')} <Zap className="ml-2 h-5 w-5" />
              </TrackedCTA>
              <TrackedCTA
                href="/sample-report"
                event="agencies_page_cta_click"
                eventProps={{ location: "footer_secondary" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t('finalCta.ctaSecondary')}
              </TrackedCTA>
              <TrackedCTA
                href="/contact"
                event="contact_cta_click"
                eventProps={{ location: "agencies_footer" }}
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {t('finalCta.ctaTertiary')}
              </TrackedCTA>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
