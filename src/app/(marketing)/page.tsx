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
      "https://linkedin.com/company/vexnexa",
      "https://twitter.com/vexnexa",
      "https://github.com/vexnexa",
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

// 1. Hero Section — outcome-led
function HeroSection() {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-left space-y-8">
            <h1 className="animate-slide-up text-4xl lg:text-5xl xl:text-6xl font-bold font-display tracking-tight leading-tight">
              White-label WCAG monitoring for{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                agencies and EU-facing teams
              </span>
            </h1>

            <p className="animate-slide-up text-xl lg:text-2xl text-muted-foreground leading-relaxed">
              Scan websites, catch accessibility regressions after every release, and deliver branded reports that support WCAG 2.2 and EAA readiness.
            </p>

            <div className="animate-scale-in flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4">
              <Button
                size="lg"
                className="button-hover gradient-primary text-white border-0 shadow-soft relative overflow-hidden group px-8 py-6 text-base"
                asChild
              >
                <Link
                  href="/auth/register"
                  onClick={() => trackEvent("homepage_cta_primary_click", { location: "hero" })}
                >
                  <span className="relative z-10 flex items-center">
                    Start your free scan
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
                  View sample report
                </Link>
              </Button>
            </div>

            <p className="animate-fade-in text-sm text-muted-foreground pt-4">
              Free account required. No credit card needed.
            </p>
          </div>

          <div className="relative animate-fade-in">
            <div className="relative z-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/heroImage.webp"
                alt="VexNexa accessibility scanning dashboard showing detailed WCAG reports and issue prioritization"
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

// 2. Trust / value strip
function TrustStrip() {
  const items = [
    { icon: Zap, text: "Automated checks in minutes" },
    { icon: FileText, text: "Branded reports for clients and stakeholders" },
    { icon: Bell, text: "Continuous monitoring for live websites" },
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
  const outcomes = [
    {
      icon: Eye,
      title: "Catch issues before clients do",
      description: "Run scans against WCAG 2.2 criteria and see prioritized issues with element-level detail. Fix what matters most first.",
    },
    {
      icon: FileText,
      title: "Turn scans into white-label reports",
      description: "Export branded PDF and DOCX reports under your own logo. Share professional accessibility reports with clients and stakeholders.",
    },
    {
      icon: RefreshCw,
      title: "Monitor accessibility after every release",
      description: "Schedule recurring scans. Get alerted when scores drop or new critical issues appear. Prevent regressions from reaching production.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Why teams choose VexNexa
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Operational accessibility tooling that fits into how you already work.
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
  const audiences = [
    {
      icon: Building2,
      title: "Agencies and web studios",
      description: "Scan client sites, export branded reports, and deliver ongoing monitoring as a service. Manage multiple client projects from one dashboard.",
    },
    {
      icon: Shield,
      title: "In-house compliance teams",
      description: "Track accessibility across your organisation. Schedule scans after every deployment. Build evidence of ongoing accessibility oversight for EAA readiness.",
    },
    {
      icon: Globe,
      title: "Partners managing multiple sites",
      description: "Monitor accessibility across a portfolio of websites. Catch regressions early. Deliver clear, prioritized reports to stakeholders.",
    },
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            Built for agencies and EU-facing teams
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you manage one site or fifty, VexNexa gives you the workflow tools to deliver accessible websites.
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
  const capabilities = [
    "WCAG 2.2 AA scanning with axe-core engine",
    "Severity-ranked issues: Critical, Serious, Moderate, Minor",
    "PDF and DOCX export with white-label branding",
    "Continuous monitoring with scheduled scans",
    "Score regression alerts via email",
    "Multi-site management from one dashboard",
    "Team collaboration with role-based access",
    "EU-hosted, GDPR compliant infrastructure",
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              What you get with{" "}
              <span className="text-primary">VexNexa</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to scan, report, and monitor — without the noise.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {capabilities.map((cap, i) => (
                <div key={i} className="flex items-start space-x-3">
                  <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{cap}</span>
                </div>
              ))}
            </div>

            <Button asChild className="mt-6 gradient-primary text-white hover:opacity-90" size="lg">
              <Link href="/auth/register">
                Start your free scan
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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

// 6. See what a report looks like
function SampleReportSection() {
  return (
    <section className="py-20 bg-muted/30 border-y">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            See what a report looks like
          </h2>
          <p className="text-xl text-muted-foreground">
            Professional, structured, and ready to share with clients or stakeholders. Browse a real sample report with accessibility scores, prioritized issues, and remediation guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" asChild className="gradient-primary text-white">
              <Link
                href="/sample-report"
                onClick={() => trackEvent("homepage_cta_sample_report_click", { location: "section" })}
              >
                View sample report
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/white-label-accessibility-reports">
                Learn about white-label reports
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// 7. How VexNexa fits your workflow
function WorkflowSection() {
  const steps = [
    {
      step: "1",
      icon: BarChart3,
      title: "Scan a site",
      description: "Enter a URL. Get a full WCAG 2.2 audit in minutes with severity-ranked issues and element-level context.",
    },
    {
      step: "2",
      icon: Eye,
      title: "Review prioritized issues",
      description: "See exactly what is wrong, why it matters, and how to fix it. Filter by severity, WCAG criterion, or page element.",
    },
    {
      step: "3",
      icon: FileText,
      title: "Share reports and monitor over time",
      description: "Export branded reports. Schedule recurring scans. Get notified when scores change. Build a continuous improvement loop.",
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
            How VexNexa fits your workflow
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Scan, review, report. Repeat as your sites evolve.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <div key={i} className="text-center space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto shadow-soft">
                <s.icon className="h-8 w-8 text-white" />
              </div>
              <div className="text-sm font-medium text-primary">Step {s.step}</div>
              <h3 className="text-xl font-semibold font-display">{s.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// 9. Final CTA Section
function FinalCTASection() {
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
            Start monitoring accessibility today
          </h2>
          <p className="text-xl leading-relaxed">
            Create your free account. Run your first scan. See results in minutes. Upgrade when you need monitoring, reports, and multi-site management.
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
                Start your free scan
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
                View pricing
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

  const faqItems = [
    {
      question: "Can VexNexa guarantee legal compliance?",
      answer: "No tool can guarantee 100% legal compliance. VexNexa detects and reports accessibility issues, helps prioritize fixes, and supports WCAG and EAA readiness. For legal risk assessment, consider combining automated scanning with expert review.",
    },
    {
      question: "Do I need an account to scan?",
      answer: "Yes, a free account is required. This lets us save your results, provide exports, and track improvements over time. No credit card needed to get started.",
    },
    {
      question: "Can I export branded reports for clients?",
      answer: "Yes. PDF and DOCX exports are available on paid plans. Business and Enterprise plans include white-label reports with your own logo, colours, and contact details.",
    },
    {
      question: "How does continuous monitoring work?",
      answer: "Schedule automatic scans daily, weekly, or monthly. VexNexa alerts you via email when scores drop or new critical issues appear. Track trends over time from your dashboard.",
    },
    {
      question: "Is VexNexa an accessibility overlay?",
      answer: "No. We scan your code structure and report real WCAG violations. We never inject widgets or scripts into your site. Our reports help developers fix issues at the source.",
    },
    {
      question: "What support is available?",
      answer: "All users get email support. We aim to respond within 1 business day. Business and Enterprise plans include priority support with faster response times.",
    },
  ];

  return (
    <>
      <JsonLd />
      <HeroSection />
      <TrustStrip />
      <WhyTeamsSection />
      <BuiltForSection />
      <WhatYouGetSection />
      <SampleReportSection />
      <WorkflowSection />
      <FAQ items={faqItems} />
      <FinalCTASection />
    </>
  );
}
