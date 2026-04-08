"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Check,
  X,
  AlertTriangle,
  FileText,
  Download,
  Zap,
  Shield,
  Eye,
  Code,
} from "lucide-react";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";
import { useTranslations } from "next-intl";

// Sample data — realistic but not from any real site
const SAMPLE_SCORE = 72;
const SAMPLE_DOMAIN = "example-agency.com";

const severityCounts = {
  critical: 3,
  serious: 8,
  moderate: 14,
  minor: 6,
};

const sampleIssues: {
  title: string;
  severity: "critical" | "serious" | "moderate" | "minor";
  wcag: string;
  element: string;
  description: string;
  fix: string;
}[] = [
  {
    title: "Images missing alternative text",
    severity: "critical",
    wcag: "1.1.1 Non-text Content (A)",
    element: '<img src="/hero-banner.jpg">',
    description:
      "5 images are missing alt attributes. Screen readers cannot convey their content to users who rely on assistive technology.",
    fix: 'Add descriptive alt text to each image, e.g. alt="Team collaborating on a project".',
  },
  {
    title: "Form inputs without labels",
    severity: "serious",
    wcag: "1.3.1 Info and Relationships (A)",
    element: '<input type="email" placeholder="Email">',
    description:
      "3 form inputs rely on placeholder text instead of associated <label> elements. Placeholders disappear on focus and are not reliably announced by screen readers.",
    fix: "Add a visible <label> element with a for attribute matching the input's id.",
  },
  {
    title: "Insufficient colour contrast on body text",
    severity: "serious",
    wcag: "1.4.3 Contrast (Minimum) (AA)",
    element: '<p class="text-light">',
    description:
      "Body text (#999 on #fff) has a contrast ratio of 2.85:1. WCAG AA requires at least 4.5:1 for normal text.",
    fix: "Darken the text colour to at least #767676 to meet the 4.5:1 ratio.",
  },
  {
    title: "Missing skip navigation link",
    severity: "moderate",
    wcag: "2.4.1 Bypass Blocks (A)",
    element: "<body>",
    description:
      "No skip-to-content link is present. Keyboard users must tab through the entire navigation on every page.",
    fix: 'Add a visually hidden skip link as the first focusable element: <a href="#main-content" class="skip-link">Skip to content</a>.',
  },
  {
    title: "Interactive elements not keyboard accessible",
    severity: "serious",
    wcag: "2.1.1 Keyboard (A)",
    element: '<div onclick="toggle()">',
    description:
      "2 clickable <div> elements cannot be reached or activated with the keyboard. Users who cannot use a mouse are blocked.",
    fix: "Replace <div> with <button> or add tabindex=\"0\", role=\"button\", and a keydown handler for Enter/Space.",
  },
  {
    title: "Page language not set",
    severity: "moderate",
    wcag: "3.1.1 Language of Page (A)",
    element: "<html>",
    description:
      "The <html> element is missing the lang attribute. Screen readers may mispronounce content.",
    fix: 'Add lang="en" (or the correct language) to the <html> tag.',
  },
];

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  serious: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  minor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
};

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 90 ? "#22c55e" : score >= 70 ? "#f59e0b" : score >= 50 ? "#f97316" : "#ef4444";

  return (
    <div className="relative w-36 h-36 mx-auto">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/20" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold font-display">{score}</span>
        <span className="text-xs text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
}

export default function SampleReportPage() {
  const t = useTranslations('sampleReport');
  
  useEffect(() => {
    trackEvent("sample_report_view");
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <Badge variant="outline" className="text-sm">
              {t('badge')}
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold font-display tracking-tight">
              {t('title')}{" "}
              <span className="text-primary">{t('titleHighlight')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
              <Button size="lg" className="gradient-primary" asChild>
                <Link
                  href="/auth/register"
                  onClick={() => trackEvent("sample_report_cta_click", { location: "hero" })}
                >
                  {t('ctaPrimary')}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link
                  href="/white-label-accessibility-reports"
                  onClick={() => trackEvent("sample_report_cta_click", { location: "hero_secondary" })}
                >
                  {t('ctaSecondary')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Download CTA */}
      <section className="pb-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5">
              <CardContent className="p-8 text-center space-y-4">
                <Download className="h-10 w-10 text-primary mx-auto" />
                <h3 className="text-xl font-bold font-display">{t('downloadTitle')}</h3>
                <p className="text-muted-foreground max-w-lg mx-auto text-sm">
                  {t('downloadSubtitle')}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  <Button variant="outline" asChild>
                    <Link href="/contact?from=sample-pdf&type=branded">
                      <Download className="mr-2 h-4 w-4" />
                      {t('downloadBranded')}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/contact?from=sample-pdf&type=whitelabel">
                      <Download className="mr-2 h-4 w-4" />
                      {t('downloadWhiteLabel')}
                    </Link>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('downloadNote')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Report content */}
      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Report header */}
            <Card className="mb-8 overflow-hidden">
              <div className="gradient-primary p-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <p className="text-sm opacity-80 mb-1">{t('reportLabel')}</p>
                    <h2 className="text-2xl font-bold font-display">{SAMPLE_DOMAIN}</h2>
                    <p className="text-sm opacity-80 mt-2">
                      {t('scannedInfo')}
                    </p>
                  </div>
                  <ScoreRing score={SAMPLE_SCORE} />
                </div>
              </div>
            </Card>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {(
                [
                  { label: t('severity.critical'), count: severityCounts.critical, color: "text-red-600" },
                  { label: t('severity.serious'), count: severityCounts.serious, color: "text-orange-600" },
                  { label: t('severity.moderate'), count: severityCounts.moderate, color: "text-yellow-600" },
                  { label: t('severity.minor'), count: severityCounts.minor, color: "text-blue-600" },
                ] as const
              ).map((s) => (
                <Card key={s.label}>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold font-display ${s.color}`}>{s.count}</p>
                    <p className="text-sm text-muted-foreground">{s.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Executive summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  {t('executiveSummary')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  The site has <strong>31 accessibility issues</strong> across 4 severity levels. The overall accessibility score is <strong>{SAMPLE_SCORE}/100</strong>, indicating room for improvement in key areas including image alternative text, form labelling, and colour contrast.
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <strong>3 critical issues</strong> are blocking access for assistive technology users and should be addressed immediately. Fixing the top 5 issues by severity would improve the score by an estimated 15–20 points.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>{t('checkHeading')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>{t('checkAria')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <X className="h-4 w-4 text-destructive" />
                    <span>{t('checkKeyboard')}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Issue list */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Eye className="h-5 w-5 text-primary" />
                  {t('topPriority')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {sampleIssues.map((issue, i) => (
                  <div key={i} className="border rounded-lg p-5 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <Badge className={severityColors[issue.severity]} variant="secondary">
                        {issue.severity.charAt(0).toUpperCase() + issue.severity.slice(1)}
                      </Badge>
                      <h3 className="font-semibold">{issue.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                    <div className="bg-muted/50 rounded-md p-3 font-mono text-xs overflow-x-auto">
                      <code>{issue.element}</code>
                    </div>
                    <div className="flex items-start gap-2">
                      <Code className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <p className="text-sm"><strong>Fix:</strong> {issue.fix}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">WCAG {issue.wcag}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* What's included note */}
            <Card className="mb-8 border-primary/20">
              <CardContent className="p-6">
                <h3 className="font-semibold font-display mb-3 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {t('fullReportTitle')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    t('fullReportItems.matrix'),
                    t('fullReportItems.charts'),
                    t('fullReportItems.complete'),
                    t('fullReportItems.guidance'),
                    t('fullReportItems.config'),
                    t('fullReportItems.eaa'),
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* White-label note */}
            <Card className="mb-8 border-border/50 bg-card">
              <CardContent className="p-6">
                <h3 className="font-semibold font-display mb-2 flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  {t('exportTitle')}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {t('exportSubtitle')}
                </p>
                <div className="mt-4">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/white-label-accessibility-reports">
                      {t('exportLearnMore')}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <AgencyCTAStrip location="sample-report" />

      {/* CTA */}
      <section className="py-16 gradient-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl lg:text-4xl font-bold font-display">
              {t('ctaTitle')}
            </h2>
            <p className="text-xl leading-relaxed">
              {t('ctaSubtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="bg-background text-primary hover:bg-muted"
                asChild
              >
                <Link
                  href="/auth/register"
                  onClick={() => trackEvent("sample_report_cta_click", { location: "footer" })}
                >
                  {t('ctaButton')} <Zap className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link
                  href="/pricing"
                  onClick={() => trackEvent("pricing_cta_click", { location: "sample_report" })}
                >
                  {t('ctaPricing')}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
