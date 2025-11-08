"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Check,
  X,
  Zap,
  Star,
  Users,
  ArrowRight,
  Loader2,
  AlertTriangle,
  Info,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENTITLEMENTS, PLAN_NAMES, formatPrice, OVERFLOW_PRICING } from "@/lib/billing/plans";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { useTranslations } from 'next-intl';

// JSON-LD for pricing
function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "TutusPorta Accessibility Scanner",
    description: "Web accessibility scanning with deeper coverage beyond WCAG",
    brand: {
      "@type": "Brand",
      name: "TutusPorta by Vexnexa",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "9.00",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "9.00",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "29.00",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "29.00",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: "Business Plan",
        price: "79.00",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "79.00",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}



function HeroSection() {
  const t = useTranslations('pricing.hero');

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            {t('badge')}
          </Badge>

          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            {t('title')}{" "}
            <span className="text-primary">{t('titleHighlight')}</span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t('subtitle')}
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {t('badges.vat')}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {t('badges.noSetup')}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {t('badges.cancelAnytime')}
            </Badge>
          </div>
        </div>
        
        <p className="text-sm opacity-75 mt-6">
          {t('needMore')} <Link href="/contact" className="underline hover:opacity-100">{t('contactUs')}</Link>
        </p>
      </div>
    </section>
  );
}

function PricingCards() {
  const t = useTranslations('pricing');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      key: "STARTER" as const,
      name: t('plans.starter.name'),
      price: "€9",
      period: "/month",
      description: t('plans.starter.description'),
      highlighted: false,
      features: [
        t('plans.starter.features.sites', { count: ENTITLEMENTS.STARTER.sites }),
        t('plans.starter.features.pages', { count: ENTITLEMENTS.STARTER.pagesPerMonth }),
        t('plans.starter.features.users', { count: ENTITLEMENTS.STARTER.users }),
        t('plans.starter.features.pdfExport'),
        t('plans.starter.features.basicReports'),
        t('plans.starter.features.emailSupport'),
      ],
      limitations: [
        t('plans.starter.limitations.noWord'),
        t('plans.starter.limitations.noScheduling'),
        t('plans.starter.limitations.limitedIntegrations'),
      ],
      cta: t('plans.starter.cta'),
      ctaVariant: "outline" as const,
    },
    {
      key: "PRO" as const,
      name: t('plans.pro.name'),
      price: "€29",
      period: "/month",
      description: t('plans.pro.description'),
      highlighted: true,
      features: [
        t('plans.pro.features.sites', { count: ENTITLEMENTS.PRO.sites }),
        t('plans.pro.features.pages', { count: ENTITLEMENTS.PRO.pagesPerMonth }),
        t('plans.pro.features.users', { count: ENTITLEMENTS.PRO.users }),
        t('plans.pro.features.exports'),
        t('plans.pro.features.advancedReports'),
        t('plans.pro.features.scheduling'),
        t('plans.pro.features.integrations'),
        t('plans.pro.features.prioritySupport'),
      ],
      limitations: [],
      cta: t('plans.pro.cta'),
      ctaVariant: "default" as const,
    },
    {
      key: "BUSINESS" as const,
      name: t('plans.business.name'),
      price: "€79",
      period: "/month",
      description: t('plans.business.description'),
      highlighted: false,
      features: [
        t('plans.business.features.sites', { count: ENTITLEMENTS.BUSINESS.sites }),
        t('plans.business.features.pages', { count: ENTITLEMENTS.BUSINESS.pagesPerMonth }),
        t('plans.business.features.users', { count: ENTITLEMENTS.BUSINESS.users }),
        t('plans.business.features.allExports'),
        t('plans.business.features.whiteLabel'),
        t('plans.business.features.advancedScheduling'),
        t('plans.business.features.allIntegrations'),
        t('plans.business.features.prioritySupport'),
      ],
      limitations: [],
      cta: t('plans.business.cta'),
      ctaVariant: "default" as const,
    },
    {
      key: "ENTERPRISE" as const,
      name: t('plans.enterprise.name'),
      price: t('plans.enterprise.price'),
      period: "",
      description: t('plans.enterprise.description'),
      highlighted: false,
      features: [
        t('plans.enterprise.features.unlimitedSites'),
        t('plans.enterprise.features.unlimitedPages'),
        t('plans.enterprise.features.unlimitedUsers'),
        t('plans.enterprise.features.customIntegrations'),
        t('plans.enterprise.features.sso'),
        t('plans.enterprise.features.dedicatedSupport'),
        t('plans.enterprise.features.sla'),
        t('plans.enterprise.features.onPremise'),
      ],
      limitations: [],
      cta: t('plans.enterprise.cta'),
      ctaHref: "/contact",
      ctaVariant: "outline" as const,
    },
  ];

  const handleUpgrade = async (planKey: string, href?: string) => {
    if (href) {
      window.location.href = href;
      return;
    }

    setLoading(planKey);
    setError(null);

    try {
      const response = await fetch("/api/mollie/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout");
      }

      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(null);
    }
  };

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        {error && (
          <Alert className="mb-8 max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={cn(
                "relative flex flex-col",
                plan.highlighted && "border-primary shadow-xl lg:scale-105"
              )}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    {t('plans.pro.popular')}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-8">
                <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold font-display">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
              </CardHeader>

              <CardContent className="space-y-6 flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-start space-x-3">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}

                  {plan.limitations.map((limitation, limitationIndex) => (
                    <div
                      key={limitationIndex}
                      className="flex items-start space-x-3 opacity-60"
                    >
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{limitation}</span>
                    </div>
                  ))}
                </div>

                <Button
                  className="w-full mt-auto"
                  variant={plan.ctaVariant}
                  size="lg"
                  onClick={() => handleUpgrade(plan.key, plan.ctaHref)}
                  disabled={loading === plan.key}
                >
                  {loading === plan.key ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t('loading')}
                    </>
                  ) : (
                    <>
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            {t('footer.note')}{" "}
            <Link href="/contact" className="text-primary hover:underline ml-1">
              {t('footer.contact')}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function OverflowPricingSection() {
  const t = useTranslations('pricing.overflow');

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              {t('title')}
            </h2>
            <p className="text-xl text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.resource')}</TableHead>
                  <TableHead>{t('table.price')}</TableHead>
                  <TableHead>{t('table.description')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">{t('resources.extraPages')}</TableCell>
                  <TableCell>€{OVERFLOW_PRICING.extraPage.amount}/{OVERFLOW_PRICING.extraPage.unit}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraPage.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t('resources.extraSites')}</TableCell>
                  <TableCell>€{OVERFLOW_PRICING.extraSite.amount}/{OVERFLOW_PRICING.extraSite.unit}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraSite.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">{t('resources.extraUsers')}</TableCell>
                  <TableCell>€{OVERFLOW_PRICING.extraUser.amount}/{OVERFLOW_PRICING.extraUser.unit}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraUser.description}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>

          <Alert className="mt-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>{t('alert.title')}</strong> {t('alert.description')}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
}

function ComplianceDisclaimerSection() {
  const t = useTranslations('pricing.compliance');

  return (
    <section className="py-12 border-y bg-amber-50 dark:bg-amber-950/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t('title')}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>{t('warning')}</strong>{" "}
                {t('description')}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/legal/terms" className="text-sm text-primary hover:underline">
                  {t('links.terms')}
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/legal/privacy" className="text-sm text-primary hover:underline">
                  {t('links.privacy')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolComparisonSection() {
  const t = useTranslations('pricing.comparison');

  const comparisonData = [
    {
      feature: "Coverage Depth",
      tutusporta: "WCAG + 8 extra categories",
      overlay: "Superficial fixes only",
      generic: "Basic WCAG checks",
    },
    {
      feature: "Actionability",
      tutusporta: "Code snippets + remediation tips",
      overlay: "No developer guidance",
      generic: "Generic error messages",
    },
    {
      feature: "Team Features",
      tutusporta: true,
      overlay: false,
      generic: false,
    },
    {
      feature: "Continuous Monitoring",
      tutusporta: true,
      overlay: false,
      generic: false,
    },
    {
      feature: "API Access",
      tutusporta: true,
      overlay: false,
      generic: "Limited",
    },
    {
      feature: "False Positives",
      tutusporta: "Low",
      overlay: "N/A",
      generic: "High",
    },
    {
      feature: "Legal Stance",
      tutusporta: "Tool assists compliance",
      overlay: "Claims to fix issues",
      generic: "No legal claims",
    },
    {
      feature: "Cost Scaling",
      tutusporta: "Transparent overflow pricing",
      overlay: "Per-page fees",
      generic: "Fixed tiers only",
    },
  ];

  return (
    <ComparisonTable
      title={t('title')}
      description={t('subtitle')}
      rows={comparisonData}
      disclaimer={t('disclaimer')}
    />
  );
}

function CTASection() {
  const t = useTranslations('pricing.cta');

  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            {t('title')}
          </h2>
          <p className="text-xl opacity-90">
            {t('subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                {t('startTrial')}
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/pricing#overflow">
                {t('needMore')}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <PricingJsonLd />
      <HeroSection />
      <PricingCards />
      <OverflowPricingSection />
      <ComplianceDisclaimerSection />
      <ToolComparisonSection />
      <CTASection />
    </>
  );
}
