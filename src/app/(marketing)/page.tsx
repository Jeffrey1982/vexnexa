"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Check,
  ArrowRight,
  Zap,
  Shield,
  Users,
  FileText,
  Bell,
  Eye,
  RefreshCw,
  Building2,
  Globe,
  BarChart3,
} from "lucide-react";
import { FAQ } from "@/components/marketing/FAQ";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";
import { Quote, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { StandardsTrustBar } from "@/components/marketing/StandardsTrustBar";
import { PartnerStandardsBar } from "@/components/marketing/PartnerStandardsBar";

// JSON-LD structured data
function JsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VexNexa",
    description: "White-label WCAG monitoring for agencies and EU-facing teams. Scan websites, catch regressions, deliver branded reports.",
    url: "https://vexnexa.com",
    logo: "https://vexnexa.com/brand/vexnexa-logo.png",
    sameAs: [
      "https://twitter.com/vexnexa",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      url: "https://vexnexa.com/contact",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// 1. Hero Section
function HeroSection() {
  const t = useTranslations('home.hero');
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8">
            <h1 className="animate-slide-up text-4xl lg:text-5xl xl:text-6xl font-bold font-display tracking-tight leading-tight">
              {t('title')}{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="animate-slide-up text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              {t('subtitle')}
            </p>

            <p className="animate-slide-up text-sm text-muted-foreground leading-relaxed">
              {t('freeTier')}
            </p>

            <div className="animate-scale-in flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
              <Button
                size="lg"
                className="button-hover gradient-primary border-0 shadow-soft relative overflow-hidden group px-8 py-6 text-base"
                asChild
              >
                <Link
                  href="/auth/register"
                  onClick={() => trackEvent("homepage_cta_primary_click", { location: "hero" })}
                >
                  <span className="relative z-10 flex items-center">
                    {t('ctaPrimary')}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 to-white/20 transform translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="button-hover border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-8 py-6 text-base"
                asChild
              >
                <Link
                  href="/sample-report"
                  onClick={() => trackEvent("homepage_cta_sample_report_click")}
                >
                  {t('ctaSecondary')}
                </Link>
              </Button>
            </div>

            {/* Trust bullets */}
            <div className="animate-fade-in flex flex-col sm:flex-row gap-x-6 gap-y-2 justify-center lg:justify-start pt-2">
              {([t('trust1'), t('trust2'), t('trust3')] as string[]).map((item) => (
                <span key={item} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary shrink-0" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/heroImage.webp"
                alt={t('imageAlt')}
                className="aspect-square lg:aspect-[4/3] rounded-3xl border border-primary/20 w-full h-full object-cover"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 12px 24px -8px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
              />
              <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-xl animate-pulse" aria-hidden="true"></div>
              <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-accent/10 rounded-full blur-xl animate-pulse delay-500" aria-hidden="true"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 1B. Social proof — trusted by agencies
function SocialProofStrip() {
  const t = useTranslations('home.socialProof');
  const logos = [t('logo1'), t('logo2'), t('logo3'), t('logo4')];

  return (
    <section className="py-10 border-b">
      <div className="container mx-auto px-4">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-6">
          {t('title')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 max-w-3xl mx-auto">
          {logos.map((name, i) => (
            <div
              key={i}
              className="flex items-center justify-center h-10 px-6 rounded-md bg-muted/50 border border-border/40"
            >
              <span className="text-sm font-medium text-muted-foreground/70 select-none">
                {name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 2. Trust / value strip
function TrustStrip() {
  const t = useTranslations('home.trustStrip');
  const items = [
    { icon: Zap, text: t('automated') },
    { icon: FileText, text: t('branded') },
    { icon: Bell, text: t('continuous') },
  ];

  return (
    <section className="py-10 bg-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-center gap-3 text-center md:text-left">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <item.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-sm font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 3. Why teams choose VexNexa — outcome-focused cards
function WhyTeamsSection() {
  const t = useTranslations('home.whyTeams');
  const outcomes = [
    {
      icon: Eye,
      title: t('catchIssues.title'),
      description: t('catchIssues.description'),
    },
    {
      icon: FileText,
      title: t('whiteLabel.title'),
      description: t('whiteLabel.description'),
    },
    {
      icon: RefreshCw,
      title: t('monitor.title'),
      description: t('monitor.description'),
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {outcomes.map((outcome, i) => (
            <Card key={i} className="interactive-hover border-0 shadow-elegant bg-card/80 backdrop-blur-sm group">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                  <outcome.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-display group-hover:text-primary transition-colors">
                  {outcome.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {outcome.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// 4. Built for agencies and EU-facing teams
function BuiltForSection() {
  const t = useTranslations('home.builtFor');
  const audiences = [
    {
      icon: Building2,
      title: t('agencies.title'),
      description: t('agencies.description'),
    },
    {
      icon: Shield,
      title: t('compliance.title'),
      description: t('compliance.description'),
    },
    {
      icon: Globe,
      title: t('partners.title'),
      description: t('partners.description'),
    },
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {audiences.map((audience, i) => (
            <Card key={i} className="border-0 shadow-elegant bg-card/80 backdrop-blur-sm group interactive-hover">
              <CardContent className="p-8 space-y-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center group-hover:from-primary/30 group-hover:to-primary/20 transition-all duration-300">
                  <audience.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold font-display group-hover:text-primary transition-colors">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {audience.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// 5. What you get — workflow outcomes
function WhatYouGetSection() {
  const t = useTranslations('home.whatYouGet');
  const capabilities = [
    t('c1'), t('c2'), t('c3'), t('c4'),
    t('c5'), t('c6'), t('c7'), t('c8'),
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t('title')}{" "}
              <span className="text-primary">{t('titleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{cap}</span>
                </div>
              ))}
            </div>

            <Button asChild className="mt-6 gradient-primary hover:opacity-90" size="lg">
              <Link href="/auth/register">
                {t('cta')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary/60" />
              {t('axeCoreBadge')}
            </p>
          </div>

          <div className="relative">
            <div className="bg-white rounded-2xl p-4"
              style={{
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.35), 0 8px 16px -6px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Screenshot1.png"
                alt="VexNexa scan results showing prioritized accessibility issues with remediation tips"
                className="w-full h-80 lg:h-96 rounded-xl object-cover"
                style={{
                  boxShadow: '0 10px 20px -6px rgba(0, 0, 0, 0.2)'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 5B. Testimonials — what pilot partners say
function TestimonialsSection() {
  const t = useTranslations('home.testimonials');
  const testimonials = [
    { quote: t('t1.quote'), attribution: t('t1.attribution') },
    { quote: t('t2.quote'), attribution: t('t2.attribution') },
    { quote: t('t3.quote'), attribution: t('t3.attribution') },
  ];

  return (
    <section className="py-20 bg-muted/30 border-y">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <Card key={i} className="border-0 shadow-elegant bg-card/80 backdrop-blur-sm">
              <CardContent className="p-8 space-y-4">
                <Quote className="h-8 w-8 text-primary/30" />
                <p className="text-sm leading-relaxed italic">&ldquo;{t.quote}&rdquo;</p>
                <p className="text-xs text-muted-foreground font-medium">{t.attribution}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// 6. See what a report looks like
function SampleReportSection() {
  const t = useTranslations('home.sampleReport');
  return (
    <section className="py-20 bg-muted/30 border-y">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild className="gradient-primary">
              <Link
                href="/sample-report"
                onClick={() => trackEvent("homepage_cta_sample_report_click", { location: "section" })}
              >
                {t('ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/white-label-accessibility-reports">
                {t('ctaSecondary')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 7. Agency offer — direct conversion layer
function AgencyOfferSection() {
  const t = useTranslations('home.agencyOffer');
  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Building2 className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">
              {t('badge')}
            </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button
              size="lg"
              className="button-hover gradient-primary border-0 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link
                href="/sample-report"
                onClick={() => trackEvent("agency_offer_cta_click", { location: "homepage" })}
              >
                {t('ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="button-hover border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 px-8 py-6 text-base"
              asChild
            >
              <Link
                href="/contact?from=homepage"
                onClick={() => trackEvent("agency_contact_cta_click", { location: "homepage" })}
              >
                {t('ctaSecondary')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 8. How VexNexa fits your workflow
function WorkflowSection() {
  const t = useTranslations('home.workflow');
  const steps = [
    { step: "1", icon: BarChart3, title: t('s1.title'), description: t('s1.description') },
    { step: "2", icon: Eye, title: t('s2.title'), description: t('s2.description') },
    { step: "3", icon: FileText, title: t('s3.title'), description: t('s3.description') },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            {t('title')}
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
                <s.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-sm font-medium text-primary">{t('stepLabel')} {s.step}</div>
              <h3 className="text-xl font-semibold font-display">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 8B. Pilot Partner Program banner
function PilotPartnerBanner() {
  const t = useTranslations('home.pilotBanner');
  return (
    <section className="py-16 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4" />
            {t('badge')}
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            {t('subtitle')}
          </p>
          <PartnerStandardsBar />
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Button size="lg" asChild className="gradient-primary">
              <Link
                href="/pilot-partner-program"
                onClick={() => trackEvent("pilot_banner_click", { location: "homepage" })}
              >
                {t('ctaPrimary')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link
                href="/partner-apply"
                onClick={() => trackEvent("pilot_banner_click", { location: "homepage_apply" })}
              >
                {t('ctaSecondary')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 9. Final CTA Section
function FinalCTASection() {
  const t = useTranslations('home.finalCta');
  return (
    <section className="py-20 gradient-primary text-primary-foreground relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <div className="absolute top-10 left-10 w-32 h-32 border border-primary-foreground/20 rounded-full"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 border border-primary-foreground/10 rounded-full"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 border border-primary-foreground/15 rounded-full"></div>
      </div>

      <div className="container mx-auto px-4 text-center relative z-10">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-xl leading-relaxed">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="secondary"
              className="button-hover bg-white text-primary hover:bg-white/90 shadow-soft px-8 py-6 text-base"
              asChild
            >
              <Link
                href="/auth/register"
                onClick={() => trackEvent("homepage_cta_primary_click", { location: "final" })}
              >
                {t('ctaPrimary')}
                <Zap className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="button-hover bg-transparent border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground px-8 py-6 text-base"
              asChild
            >
              <Link href="/pricing">
                {t('ctaSecondary')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// Main Page Component
export default function HomePage() {
  useEffect((): void => {
    if (typeof window === 'undefined') return;

    const hash: string = window.location.hash;
    if (!hash) return;

    const hashParams: URLSearchParams = new URLSearchParams(hash.substring(1));
    const type: string | null = hashParams.get('type');
    const accessToken: string | null = hashParams.get('access_token');

    if (type === 'recovery' && accessToken) {
      window.location.replace(`/auth/reset-password${hash}`);
    }
  }, []);

  const t = useTranslations('home.faqSection');
  const faqItems = [
    { question: t('q1.question'), answer: t('q1.answer') },
    { question: t('q2.question'), answer: t('q2.answer') },
    { question: t('q3.question'), answer: t('q3.answer') },
    { question: t('q4.question'), answer: t('q4.answer') },
    { question: t('q5.question'), answer: t('q5.answer') },
    { question: t('q6.question'), answer: t('q6.answer') },
  ];

  return (
    <>
      <JsonLd />
      <HeroSection />
      <SocialProofStrip />
      <TrustStrip />
      <WhyTeamsSection />
      <BuiltForSection />
      <WhatYouGetSection />
      <StandardsTrustBar variant="compact" showHeading={false} />
      <TestimonialsSection />
      <SampleReportSection />
      <AgencyOfferSection />
      <WorkflowSection />
      <PilotPartnerBanner />
      <FAQ items={faqItems} />
      <FinalCTASection />
    </>
  );
}
