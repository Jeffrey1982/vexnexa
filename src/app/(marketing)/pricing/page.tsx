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
import { ENTITLEMENTS, PLAN_NAMES, OVERFLOW_PRICING } from "@/lib/billing/plans";
import {
  BillingCycle,
  PlanKey,
  formatPriceDisplay,
  getDiscountBadge,
  getCTAText
} from "@/lib/pricing";
import {
  ASSURANCE_BASE_PRICES,
  ASSURANCE_PLAN_LIMITS,
  formatAssurancePriceDisplay,
  getAssuranceDiscountBadge,
  type BillingCycle as AssuranceBillingCycle,
} from "@/lib/assurance/pricing";
import { AssuranceTier } from "@prisma/client";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { useTranslations } from 'next-intl';

// JSON-LD for pricing
function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VexNexa Accessibility Scanner",
    description: "Web accessibility scanning with deeper coverage beyond WCAG",
    brand: {
      "@type": "Brand",
      name: "VexNexa",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "19.99",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "19.99",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "49.99",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "49.99",
          priceCurrency: "EUR",
          unitText: "MONTH",
        },
      },
      {
        "@type": "Offer",
        name: "Business Plan",
        price: "99.99",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "99.99",
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

          <p className="text-lg text-muted-foreground">
            {t('billingSubtitle')}
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

        <p className="text-sm opacity-75 mt-6 text-center">
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
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const plans = [
    {
      key: "STARTER" as PlanKey,
      name: t('plans.starter.name'),
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
      ctaVariant: "outline" as const,
    },
    {
      key: "PRO" as PlanKey,
      name: t('plans.pro.name'),
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
      ctaVariant: "default" as const,
    },
    {
      key: "BUSINESS" as PlanKey,
      name: t('plans.business.name'),
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
      ctaVariant: "default" as const,
    },
  ];

  const handleUpgrade = async (planKey: string) => {
    setLoading(planKey);
    setError(null);

    try {
      const response = await fetch("/api/mollie/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: planKey,
          billingCycle
        }),
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

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <div className="inline-flex items-center rounded-lg bg-muted p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                billingCycle === 'monthly'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('billing.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('semiannual')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === 'semiannual'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('billing.semiannual')}
              <Badge className="ml-2 bg-primary/90 text-xs">
                {t('billing.save8')}
              </Badge>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === 'annual'
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t('billing.annual')}
              <Badge className="ml-2 bg-primary text-xs">
                {t('billing.saveUpTo17')}
              </Badge>
            </button>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {t('billing.hint')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const priceDisplay = formatPriceDisplay(plan.key, billingCycle);
            const discountBadge = getDiscountBadge(billingCycle, plan.key);
            const ctaText = getCTAText(billingCycle, plan.key);

            return (
              <Card
                key={plan.key}
                className={cn(
                  "relative flex flex-col transition-all duration-300",
                  plan.highlighted && "border-[#FF7A00] shadow-xl lg:scale-105 ring-2 ring-[#FF7A00]/20"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#FF7A00] text-white hover:bg-[#FF7A00]/90">
                      <Star className="w-3 h-3 mr-1" />
                      {t('plans.pro.popular')}
                    </Badge>
                  </div>
                )}

                {discountBadge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="secondary" className="bg-green-500 text-white text-xs px-2 py-1">
                      {discountBadge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="font-display text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold font-display">{priceDisplay.mainPrice}</span>
                    <span className="text-muted-foreground">{priceDisplay.period}</span>
                    {priceDisplay.subtext && (
                      <p className="text-sm text-muted-foreground mt-1">
                        (≈ {priceDisplay.subtext})
                      </p>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm">{plan.description}</p>
                  {billingCycle === 'monthly' && (
                    <p className="text-xs text-primary mt-2">
                      {t('billing.switchToSave')}
                    </p>
                  )}
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
                    className={cn(
                      "w-full mt-auto transition-all duration-200",
                      plan.highlighted && "bg-[#FF7A00] hover:bg-[#FF7A00]/90"
                    )}
                    variant={plan.ctaVariant}
                    size="lg"
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('loading')}
                      </>
                    ) : (
                      <>
                        {ctaText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
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

function AssurancePricingSection() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<AssuranceBillingCycle>('monthly');

  const assurancePlans = [
    {
      tier: 'BASIC' as AssuranceTier,
      name: 'Basic Assurance',
      description: 'Perfect for single websites and small projects',
      domains: 1,
      features: [
        '1 monitored domain',
        'Weekly or bi-weekly scans',
        'Automated alerts',
        'Email notifications (up to 5 recipients)',
        'Score trend tracking',
        '12-month scan history',
        'Fixed 90% threshold'
      ],
      highlighted: false,
    },
    {
      tier: 'PRO' as AssuranceTier,
      name: 'Pro Assurance',
      description: 'Ideal for agencies and multi-site organizations',
      domains: 5,
      features: [
        '5 monitored domains',
        'Weekly or bi-weekly scans',
        'Automated alerts',
        'Email notifications (up to 5 recipients)',
        'Score trend tracking',
        '12-month scan history',
        'Fixed 90% threshold'
      ],
      highlighted: true,
    },
    {
      tier: 'PUBLIC_SECTOR' as AssuranceTier,
      name: 'Public Sector',
      description: 'Built for schools, governments, and public institutions',
      domains: 20,
      features: [
        '20 monitored domains',
        'Weekly or bi-weekly scans',
        'Automated alerts',
        'Email notifications (up to 5 recipients)',
        'Score trend tracking',
        '12-month scan history',
        'Custom threshold (60-100%)',
        'Compliance reporting'
      ],
      highlighted: false,
    },
  ];

  const handleSubscribe = async (tier: AssuranceTier) => {
    setLoading(tier);
    setError(null);

    try {
      const response = await fetch("/api/assurance/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          billingCycle
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      window.location.href = data.checkoutUrl || data.url;
    } catch (err) {
      console.error("Subscription error:", err);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setLoading(null);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
      <div className="container mx-auto px-4">
        {error && (
          <Alert className="mb-8 max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
            For Institutes & Companies
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4 text-gray-900 dark:text-gray-100">
            Accessibility <span className="text-primary">Assurance</span>
          </h2>
          <p className="text-xl text-gray-700 dark:text-gray-300 max-w-3xl mx-auto">
            Continuous monitoring & compliance tracking for schools, governments, and public institutions
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Automated scans • Alerts when scores drop • Peace of mind
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <div className="inline-flex items-center rounded-lg bg-white dark:bg-slate-900 p-1 shadow-sm border">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                billingCycle === 'monthly'
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('semiannual')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === 'semiannual'
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              6 Months
              <Badge className="ml-2 bg-green-500 text-white text-xs">
                Save 8%
              </Badge>
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === 'annual'
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              Annual
              <Badge className="ml-2 bg-green-600 text-white text-xs">
                Save 15%
              </Badge>
            </button>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Save more with longer billing cycles
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {assurancePlans.map((plan) => {
            const priceDisplay = formatAssurancePriceDisplay(plan.tier, billingCycle);
            const discountBadge = getAssuranceDiscountBadge(billingCycle, plan.tier);

            return (
              <Card
                key={plan.tier}
                className={cn(
                  "relative flex flex-col transition-all duration-300 bg-white dark:bg-slate-900",
                  plan.highlighted && "border-primary shadow-xl lg:scale-105 ring-2 ring-primary/20"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-white hover:bg-primary/90">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {discountBadge && billingCycle !== 'monthly' && (
                  <div className="absolute -top-2 -right-2">
                    <Badge variant="secondary" className="bg-green-500 text-white text-xs px-2 py-1">
                      {discountBadge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <CardTitle className="font-display text-2xl text-gray-900 dark:text-gray-100">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold font-display text-gray-900 dark:text-gray-100">{priceDisplay.mainPrice}</span>
                    <span className="text-gray-600 dark:text-gray-400">{priceDisplay.period}</span>
                    {priceDisplay.subtext && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        (≈ {priceDisplay.subtext})
                      </p>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-6 flex-1 flex flex-col">
                  <div className="space-y-3 flex-1">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "w-full mt-auto transition-all duration-200",
                      plan.highlighted && "bg-primary hover:bg-primary/90"
                    )}
                    variant={plan.highlighted ? "default" : "outline"}
                    size="lg"
                    onClick={() => handleSubscribe(plan.tier)}
                    disabled={loading === plan.tier}
                  >
                    {loading === plan.tier ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        {plan.tier === 'PUBLIC_SECTOR' ? 'Contact Sales' : 'Get Started'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Alert className="mt-12 max-w-4xl mx-auto bg-white dark:bg-slate-900">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-gray-700 dark:text-gray-300">
            <strong>Note:</strong> Accessibility Assurance is a monitoring service only.
            It does NOT provide audits, certifications, or remediation services.
            For full accessibility auditing, please choose one of our main scanning plans above.
          </AlertDescription>
        </Alert>
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
      vexnexa: "WCAG + 8 extra categories",
      overlay: "Superficial fixes only",
      generic: "Basic WCAG checks",
    },
    {
      feature: "Actionability",
      vexnexa: "Code snippets + remediation tips",
      overlay: "No developer guidance",
      generic: "Generic error messages",
    },
    {
      feature: "Team Features",
      vexnexa: true,
      overlay: false,
      generic: false,
    },
    {
      feature: "Continuous Monitoring",
      vexnexa: true,
      overlay: false,
      generic: false,
    },
    {
      feature: "API Access",
      vexnexa: true,
      overlay: false,
      generic: "Limited",
    },
    {
      feature: "False Positives",
      vexnexa: "Low",
      overlay: "N/A",
      generic: "High",
    },
    {
      feature: "Legal Stance",
      vexnexa: "Tool assists compliance",
      overlay: "Claims to fix issues",
      generic: "No legal claims",
    },
    {
      feature: "Cost Scaling",
      vexnexa: "Transparent overflow pricing",
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
      <AssurancePricingSection />
      <ComplianceDisclaimerSection />
      <ToolComparisonSection />
      <CTASection />
    </>
  );
}
