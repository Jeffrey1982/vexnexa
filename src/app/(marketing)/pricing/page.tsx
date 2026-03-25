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
  FileSearch,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";
import { ENTITLEMENTS, PLAN_NAMES, OVERFLOW_PRICING } from "@/lib/billing/plans";
import {
  BillingCycle,
  PlanKey,
  formatEuro,
  getDiscountBadge,
  getCTAText,
  planIncludesAssurance,
  WEBSITE_PACK_PRICES,
  PAGE_PACK_PRICES,
  ASSURANCE_ADDON_PRICES,
  BASE_PRICES,
  ANNUAL_PRICES,
  OLD_PRICES,
  AUDIT_PRICES,
  AUDIT_BUNDLE_PRICES,
  EXTRA_SERVICES_PRICES,
} from "@/lib/pricing";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { useTranslations } from 'next-intl';
import { PriceModeToggle } from "@/components/pricing/PriceModeToggle";
import { usePriceDisplayMode, usePricingCountry } from "@/lib/pricing/use-price-display-mode";
import { getPriceInclVat, getClientVatRate, PRICING_COUNTRY_OPTIONS } from "@/lib/pricing/vat-math";
import { CheckoutDialog } from "@/components/checkout/CheckoutDialog";

// JSON-LD for pricing
function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VexNexa WCAG Monitoring",
    description: "White-label WCAG monitoring for agencies and EU-facing teams. Scan, report, and monitor accessibility.",
    brand: {
      "@type": "Brand",
      name: "VexNexa",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Starter Plan",
        price: "19.00",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "19.00", priceCurrency: "EUR", unitText: "MONTH" },
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "44.00",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "44.00", priceCurrency: "EUR", unitText: "MONTH" },
      },
      {
        "@type": "Offer",
        name: "Business Plan",
        price: "129.00",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "129.00", priceCurrency: "EUR", unitText: "MONTH" },
      },
      {
        "@type": "Offer",
        name: "Enterprise Plan",
        price: "349.00",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "349.00", priceCurrency: "EUR", unitText: "MONTH" },
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
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);
  const [displayMode] = usePriceDisplayMode();
  const [country] = usePricingCountry();

  /** Convert a net (excl. VAT) price for display based on current mode + country */
  const dp = (net: number): number =>
    displayMode === 'incl' ? getPriceInclVat(net, country) : net;

  const vatRate = getClientVatRate(country);
  const vatPercent = Math.round(vatRate * 1000) / 10;
  const countryOption = PRICING_COUNTRY_OPTIONS.find((o) => o.code === country);

  /** Format price display with VAT mode awareness */
  const fmtPrice = (planKey: PlanKey, cycle: BillingCycle): {
    mainPrice: string; period: string; subtext?: string;
  } => {
    if (planKey === 'ENTERPRISE') {
      if (cycle === 'yearly') {
        const total = dp(ANNUAL_PRICES.ENTERPRISE);
        const perMonth = total / 12;
        return { mainPrice: formatEuro(total), period: '/year', subtext: `${formatEuro(perMonth)}/month` };
      }
      return { mainPrice: formatEuro(dp(BASE_PRICES.ENTERPRISE)), period: '/month' };
    }
    if (cycle === 'yearly') {
      const total = dp(ANNUAL_PRICES[planKey]);
      const perMonth = total / 12;
      return { mainPrice: formatEuro(total), period: '/year', subtext: `${formatEuro(perMonth)}/month` };
    }
    return { mainPrice: formatEuro(dp(BASE_PRICES[planKey])), period: '/month' };
  };

  const plans: Array<{
    key: PlanKey;
    name: string;
    description: string;
    highlighted: boolean;
    features: string[];
    limitations: string[];
    ctaVariant: "outline" | "default";
  }> = [
    {
      key: "STARTER",
      name: "Starter",
      description: "For individuals & small sites",
      highlighted: false,
      features: [
        `${ENTITLEMENTS.STARTER.sites} website`,
        `${ENTITLEMENTS.STARTER.pagesPerMonth.toLocaleString()} pages/month`,
        `${ENTITLEMENTS.STARTER.users} user`,
        "PDF export",
        `${ENTITLEMENTS.STARTER.historyMonths}-month history`,
        "Email support",
      ],
      limitations: [
        "No Word export",
        "No scheduling",
        "No integrations",
      ],
      ctaVariant: "outline",
    },
    {
      key: "PRO",
      name: "Pro",
      description: "For teams & growing businesses",
      highlighted: true,
      features: [
        `${ENTITLEMENTS.PRO.sites} websites`,
        `${ENTITLEMENTS.PRO.pagesPerMonth.toLocaleString()} pages/month`,
        `${ENTITLEMENTS.PRO.users} users`,
        "PDF + Word export",
        "White-label rapporten",
        `${ENTITLEMENTS.PRO.historyMonths}-month history`,
        "Slack & Jira integrations",
        "Priority support",
      ],
      limitations: [],
      ctaVariant: "default",
    },
    {
      key: "BUSINESS",
      name: "Business",
      description: "For agencies & enterprises",
      highlighted: false,
      features: [
        `${ENTITLEMENTS.BUSINESS.sites} websites`,
        `${ENTITLEMENTS.BUSINESS.pagesPerMonth.toLocaleString()} pages/month`,
        `${ENTITLEMENTS.BUSINESS.users} users`,
        "White-label reports",
        "All integrations",
        `${ENTITLEMENTS.BUSINESS.historyMonths}-month history`,
        "Assurance included",
        "20% korting op losse audits",
        "4h priority support",
      ],
      limitations: [],
      ctaVariant: "default",
    },
    {
      key: "ENTERPRISE",
      name: "Enterprise",
      description: "Custom solutions at scale",
      highlighted: false,
      features: [
        `${ENTITLEMENTS.ENTERPRISE.sites} websites`,
        "Unlimited users",
        "All features included",
        "Assurance included",
        "30% korting op losse audits",
        "SLA guarantee",
        "Dedicated account manager",
        `${ENTITLEMENTS.ENTERPRISE.historyMonths}-month history`,
        "Custom billing",
      ],
      limitations: [],
      ctaVariant: "default",
    },
  ];

  const handleUpgrade = (planKey: string) => {
    if (planKey === "ENTERPRISE") {
      window.location.href = "/contact?subject=enterprise";
      return;
    }
    setCheckoutPlan(planKey as PlanKey);
    setError(null);
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

        {/* Billing Cycle Toggle + VAT Mode Toggle + Country */}
        <div className="flex flex-col items-center mb-12 space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-4">
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
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={cn(
                  "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                  billingCycle === 'yearly'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Yearly
                <Badge className="ml-2 bg-primary text-xs">
                  Save 15%
                </Badge>
              </button>
            </div>
            <PriceModeToggle />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const priceDisplay = fmtPrice(plan.key, billingCycle);
            const discountBadge = getDiscountBadge(billingCycle, plan.key);
            const ctaText = getCTAText(billingCycle, plan.key);
            const oldPrice = OLD_PRICES[plan.key];
            const newPrice = BASE_PRICES[plan.key];

            return (
              <Card
                key={plan.key}
                className={cn(
                  "relative flex flex-col transition-all duration-300",
                  plan.highlighted && "border-[#FF7A00] shadow-xl ring-2 ring-[#FF7A00]/20"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-[#FF7A00] text-white hover:bg-[#FF7A00]/90">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
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

                <CardHeader className="text-center pb-6">
                  <CardTitle className="font-display text-xl">{plan.name}</CardTitle>
                  <div className="mt-3">
                    {/* Strikethrough old price */}
                    {billingCycle === 'monthly' && oldPrice !== newPrice && (
                      <span className="text-sm text-muted-foreground line-through mr-2">
                        {formatEuro(dp(oldPrice))}
                      </span>
                    )}
                    <span className="text-3xl font-bold font-display">{priceDisplay.mainPrice}</span>
                    <span className="text-muted-foreground text-sm">{priceDisplay.period}</span>
                    {priceDisplay.subtext && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (≈ {priceDisplay.subtext})
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {displayMode === 'excl'
                        ? `excl. BTW · ${countryOption?.label ?? 'NL'} ${vatPercent}%`
                        : `incl. ${vatPercent}% BTW (${countryOption?.label ?? 'NL'})`}
                    </p>
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2.5 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div key={i} className="flex items-start space-x-2 opacity-60">
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
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</>
                    ) : (
                      <>{ctaText}<ArrowRight className="ml-2 h-4 w-4" /></>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground">
            Need a custom solution?{" "}
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Contact our sales team
            </Link>
          </p>
        </div>

        {/* Checkout Dialog — unified Individual/Company flow with VAT validation */}
        <CheckoutDialog
          open={!!checkoutPlan}
          onOpenChange={(open) => { if (!open) setCheckoutPlan(null); }}
          planKey={checkoutPlan}
          billingCycle={billingCycle}
        />
      </div>
    </section>
  );
}

function AuditServicesSection() {
  const [displayMode] = usePriceDisplayMode();
  const [country] = usePricingCountry();
  const dp = (net: number): number =>
    displayMode === 'incl' ? getPriceInclVat(net, country) : net;

  const vatRate = getClientVatRate(country);
  const vatPercent = Math.round(vatRate * 1000) / 10;
  const countryOption = PRICING_COUNTRY_OPTIONS.find((o) => o.code === country);

  const audits = [
    {
      ...AUDIT_PRICES.QUICK,
      description: "Snelle scan van de belangrijkste pagina's",
      features: ["Top 10 pagina's", "WCAG 2.2 check", "Rapport binnen 48u"],
    },
    {
      ...AUDIT_PRICES.FULL,
      description: "Volledige site audit met diepgaande analyse",
      features: ["Alle pagina's", "WCAG 2.2 + EAA", "Code review", "Rapport + roadmap"],
    },
    {
      ...AUDIT_PRICES.ENTERPRISE,
      description: "Enterprise-grade audit met compliance advies",
      features: ["Volledige site", "WCAG 2.2 + EAA + VPAT", "Legal review", "Implementatiebegeleiding"],
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/20 dark:via-amber-950/20 dark:to-yellow-950/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
            <FileSearch className="w-3 h-3 mr-1" />
            EAA Audit Diensten
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
            Handmatige <span className="text-primary">Accessibility Audits</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Laat je website professioneel auditen door onze experts
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {audits.map((audit) => (
            <Card key={audit.productId} className="bg-white dark:bg-slate-900 flex flex-col">
              <CardHeader>
                <CardTitle className="font-display text-xl">{audit.label}</CardTitle>
                <p className="text-muted-foreground text-sm">{audit.description}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-3xl font-bold font-display">{formatEuro(dp(audit.price))}</span>
                  <span className="text-muted-foreground text-sm ml-1">eenmalig</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {displayMode === 'excl'
                      ? `excl. BTW · ${countryOption?.label ?? 'NL'} ${vatPercent}%`
                      : `incl. ${vatPercent}% BTW`}
                  </p>
                </div>
                <div className="space-y-2 flex-1">
                  {audit.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" asChild>
                  <Link href={`/contact?subject=audit&product=${audit.productId}`}>
                    Audit aanvragen <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditBundlesSection() {
  const [displayMode] = usePriceDisplayMode();
  const [country] = usePricingCountry();
  const dp = (net: number): number =>
    displayMode === 'incl' ? getPriceInclVat(net, country) : net;

  const vatRate = getClientVatRate(country);
  const vatPercent = Math.round(vatRate * 1000) / 10;
  const countryOption = PRICING_COUNTRY_OPTIONS.find((o) => o.code === country);

  const bundles = [
    {
      ...AUDIT_BUNDLE_PRICES.STARTER,
      features: ["1 quickscan/kwartaal", "Basis rapport", "Email support"],
    },
    {
      ...AUDIT_BUNDLE_PRICES.PRO,
      features: ["1 full audit/kwartaal", "Uitgebreid rapport + roadmap", "Priority support"],
    },
    {
      ...AUDIT_BUNDLE_PRICES.BUSINESS,
      features: ["2 full audits/kwartaal", "Code review", "Implementatiebegeleiding", "Dedicated contact"],
    },
    {
      ...AUDIT_BUNDLE_PRICES.ENTERPRISE,
      features: ["Onbeperkt audits", "VPAT + compliance docs", "Legal support", "Account manager"],
    },
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <ShieldCheck className="w-3 h-3 mr-1" />
            Audit + Monitoring Bundels
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
            Doorlopende <span className="text-primary">audit bundels</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Combineer geautomatiseerde monitoring met handmatige audits
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {bundles.map((bundle) => (
            <Card key={bundle.productId} className="bg-white dark:bg-slate-900 flex flex-col">
              <CardHeader>
                <CardTitle className="font-display text-lg">{bundle.label}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="text-2xl font-bold font-display">{formatEuro(dp(bundle.price))}</span>
                  <span className="text-muted-foreground text-sm">/mo</span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {displayMode === 'excl'
                      ? `excl. BTW · ${countryOption?.label ?? 'NL'} ${vatPercent}%`
                      : `incl. ${vatPercent}% BTW`}
                  </p>
                </div>
                <div className="space-y-2 flex-1">
                  {bundle.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4" variant="outline" asChild>
                  <Link href={`/contact?subject=audit-bundle&product=${bundle.productId}`}>
                    Bundel kiezen <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddOnsSection() {
  const [displayMode] = usePriceDisplayMode();
  const [country] = usePricingCountry();
  const dp = (net: number): number =>
    displayMode === 'incl' ? getPriceInclVat(net, country) : net;

  const vatRate = getClientVatRate(country);
  const vatPercent = Math.round(vatRate * 1000) / 10;
  const countryOption = PRICING_COUNTRY_OPTIONS.find((o) => o.code === country);

  const websitePacks = [
    { label: "+1 website", price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_1 },
    { label: "+5 websites", price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_5 },
    { label: "+10 websites", price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_10 },
  ];

  const volumePacks = [
    { label: "+25,000 pages/month", price: PAGE_PACK_PRICES.PAGE_PACK_25K, pages: 25000 },
    { label: "+100,000 pages/month", price: PAGE_PACK_PRICES.PAGE_PACK_100K, pages: 100000 },
    { label: "+250,000 pages/month", price: PAGE_PACK_PRICES.PAGE_PACK_250K, pages: 250000 },
  ];

  const assuranceFeatures = [
    "Weekly automated scans",
    "Score drop alerts",
    "Audit log archive",
    "EAA readiness tracking",
    "Historical compliance graph",
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/20 dark:via-purple-950/20 dark:to-pink-950/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 bg-white dark:bg-slate-900">
            Flexible Add-Ons
          </Badge>
          <h2 className="text-3xl lg:text-5xl font-bold font-display mb-4">
            Scale as you <span className="text-primary">grow</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Add extra websites, scanning capacity, or continuous monitoring to any plan
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Extra Website Packs */}
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="font-display text-xl">Extra Websites</CardTitle>
              <p className="text-muted-foreground text-sm">Need more websites? Add them to any plan.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {websitePacks.map((pack, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                    <span className="font-medium text-sm">{pack.label}</span>
                    <div className="text-right">
                      <span className="font-bold">{formatEuro(dp(pack.price))}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                      <p className="text-[10px] text-muted-foreground">
                        {displayMode === 'excl' ? `excl. BTW` : `incl. BTW`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Page Volume Packs */}
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <CardTitle className="font-display text-xl">Page Volume Packs</CardTitle>
              <p className="text-muted-foreground text-sm">Increase monthly scanning capacity with volume packs.</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volumePacks.map((pack, i) => {
                  const displayPrice = dp(pack.price);
                  const perPage = (displayPrice / pack.pages).toFixed(5);
                  return (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <span className="font-medium text-sm">{pack.label}</span>
                        <span className="block text-[10px] text-muted-foreground">≈ €{perPage}/page</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{formatEuro(displayPrice)}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
                        <p className="text-[10px] text-muted-foreground">
                          {displayMode === 'excl' ? `excl. BTW` : `incl. BTW`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-3">
                <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <p className="text-xs text-green-700 dark:text-green-300">
                    <strong>Business</strong> includes 25,000 pages/month &middot; <strong>Enterprise</strong> includes 100,000 pages/month
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Need higher capacity? <Link href="/contact?subject=enterprise-volume" className="text-primary hover:underline font-medium">Contact sales</Link> for enterprise volume.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assurance Add-on */}
          <Card className="bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display text-xl">Assurance</CardTitle>
                <Badge className="bg-green-500 text-white text-xs">Monitoring</Badge>
              </div>
              <p className="text-muted-foreground text-sm">Automated compliance monitoring & alerts</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {assuranceFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Check className="h-3.5 w-3.5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Starter</span>
                  <div className="text-right">
                    <span className="font-bold text-sm">+{formatEuro(dp(ASSURANCE_ADDON_PRICES.STARTER ?? 0))}/mo</span>
                    <p className="text-[10px] text-muted-foreground">{displayMode === 'excl' ? 'excl. BTW' : 'incl. BTW'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Pro</span>
                  <div className="text-right">
                    <span className="font-bold text-sm">+{formatEuro(dp(ASSURANCE_ADDON_PRICES.PRO ?? 0))}/mo</span>
                    <p className="text-[10px] text-muted-foreground">{displayMode === 'excl' ? 'excl. BTW' : 'incl. BTW'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                  <span className="text-sm">Business & Enterprise</span>
                  <Badge variant="secondary" className="bg-green-500 text-white text-xs">Included</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
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
              <Link
                href="/auth/register"
                onClick={() => trackEvent("pricing_cta_click", { location: "footer" })}
              >
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
      <AddOnsSection />
      <AuditServicesSection />
      <AuditBundlesSection />
      <OverflowPricingSection />
      <ComplianceDisclaimerSection />
      <ToolComparisonSection />
      <AgencyCTAStrip location="pricing" />
      <CTASection />
    </>
  );
}
