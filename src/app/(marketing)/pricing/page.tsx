"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
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
  ArrowRight,
  Loader2,
  AlertTriangle,
  Info,
  FileSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";
import { ENTITLEMENTS, PLAN_NAMES, OVERFLOW_PRICING } from "@/lib/billing/plans";
import {
  type PlanKey,
  type BillingCycle,
  formatEuro,
  getDiscountBadge,
  getCTAText,
  planIncludesAssurance,
  WEBSITE_PACK_PRICES,
  PAGE_PACK_PRICES,
  ASSURANCE_ADDON_PRICES,
  BASE_PRICES,
  ANNUAL_PRICES,
  AUDIT_PRICES,
  AUDIT_BUNDLE_PRICES,
  EXTRA_SERVICES_PRICES,
} from "@/lib/pricing";
import {
  PLAN_PRICES,
  PLAN_DISPLAY_NAMES,
  getYearlyDiscountPercent,
  getMonthlyEquivalent,
} from "@/lib/billing/pricing-config";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { useTranslations } from "next-intl";
import { CheckoutDialog } from "@/components/checkout/CheckoutDialog";

// JSON-LD for pricing
function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VexNexa WCAG Monitoring",
    description:
      "White-label WCAG monitoring for agencies and EU-facing teams. Scan, report, and monitor accessibility.",
    brand: {
      "@type": "Brand",
      name: "VexNexa",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "34.95",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "34.95",
          priceCurrency: "EUR",
          unitText: "MONTH",
          valueAddedTaxIncluded: true,
        },
      },
      {
        "@type": "Offer",
        name: "Agency Plan",
        price: "99.95",
        priceCurrency: "EUR",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "99.95",
          priceCurrency: "EUR",
          unitText: "MONTH",
          valueAddedTaxIncluded: true,
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
  const t = useTranslations("pricing.hero");

  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            {t("badge")}
          </Badge>

          <h1 className="font-sans text-4xl font-bold tracking-tight lg:text-6xl">
            {t("title")}{" "}
            <span className="text-teal-700">{t("titleHighlight")}</span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>

          <p className="text-lg text-muted-foreground">{t("billingSubtitle")}</p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              All prices include VAT
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {t("badges.noSetup")}
            </Badge>
            <Badge variant="secondary" className="text-sm">
              {t("badges.cancelAnytime")}
            </Badge>
          </div>
        </div>

        <p className="text-sm opacity-75 mt-6 text-center">
          {t("needMore")}{" "}
          <Link href="/pricing#overflow" className="underline hover:opacity-100">
            {t("contactUs")}
          </Link>
        </p>
      </div>
    </section>
  );
}

function PricingCards() {
  const t = useTranslations("pricing");
  const tp = useTranslations("pricing.page");
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [checkoutPlan, setCheckoutPlan] = useState<PlanKey | null>(null);

  /** Get the display price for a plan */
  const fmtPrice = (
    planKey: PlanKey,
    cycle: BillingCycle
  ): { mainPrice: string; period: string; subtext?: string } => {
    if (planKey === "FREE") {
      return { mainPrice: "Free", period: "forever", subtext: "" };
    }
    const price = PLAN_PRICES[planKey][cycle];
    if (cycle === "yearly") {
      const perMonth = getMonthlyEquivalent(planKey);
      return {
        mainPrice: formatEuro(price),
        period: "/year",
        subtext: `${formatEuro(perMonth)}/month`,
      };
    }
    return { mainPrice: formatEuro(price), period: "/month" };
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
      key: "FREE" as PlanKey,
      name: t('plans.starter.name'),
      description: t('plans.starter.description'),
      highlighted: false,
      features: [
        `${ENTITLEMENTS.FREE.sites} ${t('plans.starter.features.site')}`,
        `${ENTITLEMENTS.FREE.pagesPerMonth.toLocaleString()} ${t('plans.starter.features.pages')}`,
        `${ENTITLEMENTS.FREE.users} ${t('plans.starter.features.user')}`,
        t('plans.starter.features.pdf'),
        t('plans.starter.features.history', { count: 1 }),
        t('plans.starter.features.support'),
      ],
      limitations: [
        t('plans.starter.limitations.noWordExports'),
        t('plans.starter.limitations.noScheduling'),
        t('plans.starter.limitations.noCrawling'),
        t('plans.starter.limitations.noIntegrations'),
        t('plans.starter.limitations.noWhiteLabel'),
      ],
      ctaVariant: "outline",
    },
    {
      key: "PRO" as PlanKey,
      name: PLAN_DISPLAY_NAMES.PRO,
      description: tp("pro.description"),
      highlighted: true,
      features: [
        tp("pro.features.sites", { count: ENTITLEMENTS.PRO.sites }),
        tp("pro.features.pages", {
          count: ENTITLEMENTS.PRO.pagesPerMonth.toLocaleString(),
        }),
        tp("pro.features.users", { count: ENTITLEMENTS.PRO.users }),
        tp("pro.features.exports"),
        tp("pro.features.whiteLabel"),
        tp("pro.features.history", { count: ENTITLEMENTS.PRO.historyMonths }),
        tp("pro.features.integrations"),
        tp("pro.features.support"),
      ],
      limitations: [],
      ctaVariant: "default",
    },
    {
      key: "BUSINESS" as PlanKey,
      name: PLAN_DISPLAY_NAMES.BUSINESS,
      description: tp("business.description"),
      highlighted: false,
      features: [
        tp("business.features.sites", { count: ENTITLEMENTS.BUSINESS.sites }),
        tp("business.features.pages", {
          count: ENTITLEMENTS.BUSINESS.pagesPerMonth.toLocaleString(),
        }),
        tp("business.features.users", { count: ENTITLEMENTS.BUSINESS.users }),
        tp("business.features.whiteLabel"),
        tp("business.features.integrations"),
        tp("business.features.history", {
          count: ENTITLEMENTS.BUSINESS.historyMonths,
        }),
        tp("business.features.assurance"),
        tp("business.features.auditDiscount"),
        tp("business.features.support"),
      ],
      limitations: [],
      ctaVariant: "default",
    },
    {
      key: "PIONEER" as PlanKey,
      name: PLAN_DISPLAY_NAMES.PIONEER,
      description: "Pioneer partner access with premium VNI reporting and white-label workflows.",
      highlighted: false,
      features: [
        `${ENTITLEMENTS.PIONEER.sites} websites`,
        `${ENTITLEMENTS.PIONEER.pagesPerMonth.toLocaleString()} pages per month`,
        `${ENTITLEMENTS.PIONEER.users} users`,
        "VNI scans and PDF/DOCX reports",
        "White-label reports",
        "Priority support and SLA",
      ],
      limitations: [],
      ctaVariant: "default",
    },
  ];

  const handleUpgrade = (planKey: PlanKey) => {
    if (planKey === "FREE") {
      window.location.href = "/auth/register";
      return;
    }
    setCheckoutPlan(planKey);
    setError(null);
  };

  const discountPercent = getYearlyDiscountPercent("PRO");

  return (
    <section id="plans" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        {error && (
          <Alert className="mb-8 max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-center mb-12 space-y-3">
          <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                billingCycle === "monthly"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tp("billing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === "yearly"
                  ? "bg-teal-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              )}
            >
              {tp("billing.yearly")}
              {discountPercent > 0 && (
                <Badge className="ml-2 bg-teal-600 text-xs text-white">
                  Save {discountPercent}%
                </Badge>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-600">
            All prices include VAT
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const priceDisplay = fmtPrice(plan.key, billingCycle);
            const discountBadge = getDiscountBadge(billingCycle, plan.key);
            const ctaText = getCTAText(billingCycle, plan.key);
            const isPioneer = plan.key === "PIONEER";

            return (
              <Card
                key={plan.key}
                data-testid="plan-card"
                data-plan={plan.key}
                className={cn(
                  "relative flex flex-col border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-300 hover:border-teal-500",
                  plan.highlighted &&
                    "border-teal-600 shadow-xl ring-2 ring-teal-200",
                  isPioneer && "bg-teal-50"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <Badge className="border-0 bg-teal-600 text-white shadow-sm hover:bg-teal-700">
                      <Star className="mr-1 h-3 w-3" />
                      {tp("mostPopular")}
                    </Badge>
                  </div>
                )}
                {isPioneer && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <Badge className="border border-teal-200 bg-teal-50 text-teal-700 shadow-sm">
                      Pioneer Deal
                    </Badge>
                  </div>
                )}

                {discountBadge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge
                      variant="secondary"
                      className="bg-teal-600 text-white text-xs px-2 py-1"
                    >
                      {discountBadge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="font-sans text-xl font-semibold text-slate-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-3">
                    {plan.key === "FREE" ? (
                      <p className="font-sans text-3xl font-bold tracking-tight text-slate-900">
                        {tp("freeForeverPrice")}
                      </p>
                    ) : (
                      <>
                        <span className="font-sans text-3xl font-bold text-slate-900">
                          {priceDisplay.mainPrice}
                        </span>
                        <span className="ml-1 align-baseline text-lg font-medium text-slate-600">
                          {priceDisplay.period}
                        </span>
                        {priceDisplay.subtext && (
                          <p className="mt-1 text-xs text-slate-600">
                            ({priceDisplay.subtext})
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                          incl. VAT
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-slate-600 mt-2 text-xs">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2.5 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-700">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2 opacity-60"
                      >
                        <X className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-slate-500">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "mt-auto w-full transition-all duration-200",
                      plan.key === "FREE"
                        ? "border-slate-300 text-slate-900 hover:bg-slate-100"
                        : "bg-teal-600 text-white hover:bg-teal-700"
                    )}
                    variant={plan.ctaVariant}
                    size="lg"
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={loading === plan.key}
                  >
                    {loading === plan.key ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t("loading")}
                      </>
                    ) : (
                      <>
                        {ctaText}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                  <p className="text-[10px] text-center text-slate-500 mt-2">
                    {tp("noCreditCard")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise block */}
        <div className="max-w-5xl mx-auto mt-12">
          <Card className="border-dashed border-slate-300 bg-white">
            <CardContent className="flex flex-col md:flex-row items-center justify-between gap-6 py-8">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-sans text-xl font-bold text-slate-900">
                  {PLAN_DISPLAY_NAMES.ENTERPRISE}
                </h3>
                <p className="text-slate-600 text-sm max-w-lg">
                  {tp("enterprise.description")}
                </p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {[
                    tp("enterprise.features.sites", {
                      count: ENTITLEMENTS.ENTERPRISE.sites,
                    }),
                    tp("enterprise.features.unlimitedUsers"),
                    tp("enterprise.features.sla"),
                    tp("enterprise.features.accountManager"),
                  ].map((f, i) => (
                    <Badge key={i} variant="secondary" className="bg-slate-100 text-xs text-slate-700">
                      {f}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button size="lg" variant="outline" asChild className="shrink-0 border-slate-300 text-slate-900 hover:bg-slate-100">
                <Link href="/contact?subject=enterprise">
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Checkout Dialog */}
        <CheckoutDialog
          open={!!checkoutPlan}
          onOpenChange={(open) => {
            if (!open) setCheckoutPlan(null);
          }}
          planKey={checkoutPlan}
          billingCycle={billingCycle}
        />
      </div>
    </section>
  );
}

function DirectCheckoutButton(props: {
  endpoint: "/api/billing/create-audit-payment" | "/api/billing/create-addon-payment";
  payload: Record<string, unknown>;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  buttonClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tCommon = useTranslations("common");

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props.payload),
      });

      if (res.status === 401) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent("/pricing")}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      const checkoutUrl = data.checkoutUrl || data.url;
      if (!checkoutUrl) {
        throw new Error("Checkout URL missing");
      }

      window.location.href = checkoutUrl;
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed");
      setLoading(false);
    }
  };

  return (
    <div className={props.className}>
      <Button
        className={`w-full ${props.buttonClassName ?? ""}`}
        variant={props.variant ?? "outline"}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tCommon("loading")}
          </>
        ) : (
          props.children
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}

function AuditServicesSection() {
  const tp = useTranslations("pricing.page");

  const audits = [
    {
      ...AUDIT_PRICES.QUICK,
      description: tp("audits.quick.description"),
      features: [
        tp("audits.quick.features.pages"),
        tp("audits.quick.features.wcag"),
        tp("audits.quick.features.report"),
      ],
    },
    {
      ...AUDIT_PRICES.FULL,
      description: tp("audits.full.description"),
      features: [
        tp("audits.full.features.pages"),
        tp("audits.full.features.wcag"),
        tp("audits.full.features.code"),
        tp("audits.full.features.report"),
      ],
    },
    {
      ...AUDIT_PRICES.ENTERPRISE,
      description: tp("audits.enterprise.description"),
      features: [
        tp("audits.enterprise.features.pages"),
        tp("audits.enterprise.features.wcag"),
        tp("audits.enterprise.features.legal"),
        tp("audits.enterprise.features.implementation"),
      ],
    },
    {
      ...AUDIT_PRICES.FAST_FIX,
      description: "Fast-Fix audit with prioritized remediation guidance and one audit credit.",
      features: [
        "Priority technical review",
        "VNI and WCAG remediation report",
        "Developer-ready fix guidance",
      ],
    },
  ];

  return (
    <section id="audits" className="border-y border-slate-200 bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 border-teal-200 bg-white text-teal-700"
          >
            <FileSearch className="w-3 h-3 mr-1" />
            {tp("audits.badge")}
          </Badge>
          <h2 className="mb-4 font-sans text-3xl font-bold text-slate-900 lg:text-5xl">
            {tp("audits.title")}{" "}
            <span className="text-teal-700">{tp("audits.titleHighlight")}</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {tp("audits.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {audits.map((audit) => (
            <Card
              key={audit.productId}
              className="flex h-full flex-col border-slate-200 bg-white shadow-sm transition-colors hover:border-teal-500"
            >
              <CardHeader className="min-h-36">
                <CardTitle className="font-sans text-xl font-semibold leading-tight text-slate-900">
                  {audit.label}
                </CardTitle>
                <p className="text-slate-600 text-sm">
                  {audit.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  {audit.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans text-3xl font-bold text-slate-900">
                        {formatEuro(audit.price)}
                      </span>
                      <span className="text-slate-600 text-sm">
                        {tp("audits.oneTime")}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-1">
                      incl. VAT
                    </p>
                  </div>
                  <DirectCheckoutButton
                    variant="default"
                    buttonClassName="bg-teal-600 text-white hover:bg-teal-700"
                    endpoint="/api/billing/create-audit-payment"
                    payload={{
                      productId: audit.productId,
                      amount: audit.price,
                      currency: "EUR",
                    }}
                  >
                    {tp("audits.cta")}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </DirectCheckoutButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AuditBundlesSection() {
  const tp = useTranslations("pricing.page");

  const bundles = [
    {
      ...AUDIT_BUNDLE_PRICES.STARTER,
      features: [
        tp("auditBundles.starter.features.audits"),
        tp("auditBundles.starter.features.report"),
        tp("auditBundles.starter.features.support"),
      ],
    },
    {
      ...AUDIT_BUNDLE_PRICES.PRO,
      features: [
        tp("auditBundles.pro.features.audits"),
        tp("auditBundles.pro.features.report"),
        tp("auditBundles.pro.features.support"),
      ],
    },
    {
      ...AUDIT_BUNDLE_PRICES.BUSINESS,
      features: [
        tp("auditBundles.business.features.audits"),
        tp("auditBundles.business.features.code"),
        tp("auditBundles.business.features.implementation"),
        tp("auditBundles.business.features.contact"),
      ],
    },
    {
      ...AUDIT_BUNDLE_PRICES.ENTERPRISE,
      features: [
        tp("auditBundles.enterprise.features.audits"),
        tp("auditBundles.enterprise.features.vpat"),
        tp("auditBundles.enterprise.features.legal"),
        tp("auditBundles.enterprise.features.manager"),
      ],
    },
  ];

  return (
    <section id="audit-bundles" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4">
            <ShieldCheck className="w-3 h-3 mr-1" />
            {tp("auditBundles.badge")}
          </Badge>
          <h2 className="mb-4 font-sans text-3xl font-bold text-slate-900 lg:text-5xl">
            {tp("auditBundles.title")}{" "}
            <span className="text-teal-700">
              {tp("auditBundles.titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {tp("auditBundles.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {bundles.map((bundle) => (
            <Card
              key={bundle.productId}
              className="flex flex-col border-slate-200 bg-white shadow-sm transition-colors hover:border-teal-500"
            >
              <CardHeader>
                <CardTitle className="font-sans text-lg font-semibold text-slate-900">
                  {bundle.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="font-sans text-2xl font-bold text-slate-900">
                    {formatEuro(bundle.price)}
                  </span>
                  <span className="text-slate-600 text-sm">
                    {tp("addons.perMonth")}
                  </span>
                  <p className="text-[10px] uppercase tracking-wide text-slate-500 mt-0.5">
                    incl. VAT
                  </p>
                </div>
                <div className="space-y-2 flex-1">
                  {bundle.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-teal-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <DirectCheckoutButton
                  variant="default"
                  buttonClassName="bg-teal-600 text-white hover:bg-teal-700"
                  endpoint="/api/billing/create-audit-payment"
                  payload={{ productId: bundle.productId }}
                  className="mt-4"
                >
                    {tp("auditBundles.cta")}{" "}
                    <ArrowRight className="ml-2 h-4 w-4" />
                </DirectCheckoutButton>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AddOnsSection() {
  const tp = useTranslations("pricing.page");

  const websitePacks = [
    {
      label: tp("addons.websites.site1"),
      price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_1,
      type: "EXTRA_WEBSITE_1",
    },
    {
      label: tp("addons.websites.sites5"),
      price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_5,
      type: "EXTRA_WEBSITE_5",
    },
    {
      label: tp("addons.websites.sites10"),
      price: WEBSITE_PACK_PRICES.EXTRA_WEBSITE_10,
      type: "EXTRA_WEBSITE_10",
    },
  ];

  const volumePacks = [
    {
      label: tp("addons.pages.25k"),
      price: PAGE_PACK_PRICES.PAGE_PACK_25K,
      pages: 25000,
      type: "PAGE_PACK_25K",
    },
    {
      label: tp("addons.pages.100k"),
      price: PAGE_PACK_PRICES.PAGE_PACK_100K,
      pages: 100000,
      type: "PAGE_PACK_100K",
    },
    {
      label: tp("addons.pages.250k"),
      price: PAGE_PACK_PRICES.PAGE_PACK_250K,
      pages: 250000,
      type: "PAGE_PACK_250K",
    },
  ];

  const assuranceFeatures = [
    tp("addons.assurance.features.scans"),
    tp("addons.assurance.features.alerts"),
    tp("addons.assurance.features.audit"),
    tp("addons.assurance.features.eaa"),
    tp("addons.assurance.features.graph"),
  ];

  return (
    <section id="packs" className="bg-slate-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge
            variant="outline"
            className="mb-4 bg-card"
          >
            {tp("addons.badge")}
          </Badge>
          <h2 className="mb-4 font-sans text-3xl font-bold text-slate-900 lg:text-5xl">
            {tp("addons.title")}{" "}
            <span className="text-teal-700">
              {tp("addons.titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            {tp("addons.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Extra Website Packs */}
          <Card className="border-slate-200 bg-white shadow-sm transition-colors hover:border-teal-500">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-slate-900">
                {tp("addons.websites.title")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {tp("addons.websites.description")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {websitePacks.map((pack, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted"
                  >
                    <span className="font-medium text-sm">{pack.label}</span>
                    <div className="text-right">
                      <span className="font-bold">
                        {formatEuro(pack.price)}
                        <span className="text-xs text-muted-foreground font-normal">
                          {tp("addons.perMonth")}
                        </span>
                      </span>
                      <p className="text-[10px] text-muted-foreground">
                        incl. VAT
                      </p>
                      <DirectCheckoutButton
                        variant="default"
                        buttonClassName="bg-teal-600 text-white hover:bg-teal-700"
                        endpoint="/api/billing/create-addon-payment"
                        payload={{ type: pack.type }}
                        className="mt-2"
                      >
                        Checkout
                      </DirectCheckoutButton>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Page Volume Packs */}
          <Card className="border-slate-200 bg-white shadow-sm transition-colors hover:border-teal-500">
            <CardHeader>
              <CardTitle className="font-sans text-xl font-semibold text-slate-900">
                {tp("addons.pages.title")}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {tp("addons.pages.description")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {volumePacks.map((pack, i) => {
                  const perPage = (pack.price / pack.pages).toFixed(5);
                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-muted"
                    >
                      <div>
                        <span className="font-medium text-sm">
                          {pack.label}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {tp("addons.perPage", { price: perPage })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">
                          {formatEuro(pack.price)}
                          <span className="text-xs text-muted-foreground font-normal">
                            {tp("addons.perMonth")}
                          </span>
                        </span>
                        <p className="text-[10px] text-muted-foreground">
                          incl. VAT
                        </p>
                        <DirectCheckoutButton
                          variant="default"
                          buttonClassName="bg-teal-600 text-white hover:bg-teal-700"
                          endpoint="/api/billing/create-addon-payment"
                          payload={{ type: pack.type }}
                          className="mt-2"
                        >
                          Checkout
                        </DirectCheckoutButton>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 space-y-3">
                <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                  <p className="text-xs text-teal-700">
                    <strong>Agency</strong>{" "}
                    {tp("addons.pages.businessNote")} &middot;{" "}
                    <strong>Enterprise</strong>{" "}
                    {tp("addons.pages.enterpriseNote")}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {tp("addons.needHigher")} {tp("addons.contactEnterprise")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Assurance Add-on */}
          <Card className="bg-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-sans text-xl font-semibold text-slate-900">
                  {tp("addons.assurance.title")}
                </CardTitle>
                <Badge className="bg-teal-600 text-white text-xs">
                  {tp("addons.assurance.badge")}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {tp("addons.assurance.description")}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                {assuranceFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start space-x-2">
                    <Check className="h-3.5 w-3.5 text-teal-500 flex-shrink-0 mt-0.5" />
                    <span className="text-xs">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted">
                  <span className="text-sm">Starter</span>
                  <div className="text-right">
                    <span className="font-bold text-sm">
                      +{formatEuro(ASSURANCE_ADDON_PRICES.STARTER ?? 0)}
                      {tp("addons.perMonth")}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      incl. VAT
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50 bg-muted">
                  <span className="text-sm">Pro</span>
                  <div className="text-right">
                    <span className="font-bold text-sm">
                      +{formatEuro(ASSURANCE_ADDON_PRICES.PRO ?? 0)}
                      {tp("addons.perMonth")}
                    </span>
                    <p className="text-[10px] text-muted-foreground">
                      incl. VAT
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 p-2">
                  <span className="text-sm">
                    {tp("addons.assurance.businessEnterprise")}
                  </span>
                  <Badge
                    variant="secondary"
                    className="bg-teal-600 text-white text-xs"
                  >
                    {tp("addons.assurance.included")}
                  </Badge>
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
  const t = useTranslations("pricing.overflow");

  return (
    <section id="overflow" className="border-y border-border/40 bg-muted py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="mb-4 font-sans text-3xl font-bold lg:text-4xl">
              {t("title")}
            </h2>
            <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.resource")}</TableHead>
                  <TableHead>{t("table.price")}</TableHead>
                  <TableHead>{t("table.description")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    {t("resources.extraPages")}
                  </TableCell>
                  <TableCell>
                    {OVERFLOW_PRICING.extraPage.amount}/
                    {OVERFLOW_PRICING.extraPage.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraPage.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    {t("resources.extraSites")}
                  </TableCell>
                  <TableCell>
                    {OVERFLOW_PRICING.extraSite.amount}/
                    {OVERFLOW_PRICING.extraSite.unit}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraSite.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    {t("resources.extraUsers")}
                  </TableCell>
                  <TableCell>
                    {OVERFLOW_PRICING.extraUser.amount}/
                    {OVERFLOW_PRICING.extraUser.unit}
                  </TableCell>
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
              <strong>{t("alert.title")}</strong> {t("alert.description")}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
}

function ComplianceDisclaimerSection() {
  const t = useTranslations("pricing.compliance");

  return (
    <section className="border-y border-border/60 bg-muted py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-teal-700 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t("title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>{t("warning")}</strong> {t("description")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/legal/terms"
                  className="text-sm text-teal-700 hover:underline"
                >
                  {t("links.terms")}
                </Link>
                <span className="text-muted-foreground">&bull;</span>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-teal-700 hover:underline"
                >
                  {t("links.privacy")}
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
  const t = useTranslations("pricing.comparison");

  const featureKeys = [
    "coverage",
    "actionability",
    "team",
    "monitoring",
    "api",
    "falsePositives",
    "legal",
    "cost",
  ] as const;

  const comparisonData = featureKeys.map((key) => ({
    feature: t(`features.${key}.name`),
    vexnexa: t.raw(`features.${key}.vexnexa`),
    overlay: t.raw(`features.${key}.overlay`),
    generic: t.raw(`features.${key}.generic`),
  }));

  return (
    <ComparisonTable
      title={t("title")}
      description={t("subtitle")}
      rows={comparisonData}
      disclaimer={t("disclaimer")}
    />
  );
}

function CTASection() {
  const t = useTranslations("pricing.cta");

  return (
    <section className="bg-slate-900 py-20 text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="font-sans text-3xl font-bold lg:text-4xl">
            {t("title")}
          </h2>
          <p className="text-xl opacity-90">{t("subtitle")}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link
                href="/auth/register"
                onClick={() =>
                  trackEvent("pricing_cta_click", { location: "footer" })
                }
              >
                {t("startTrial")}
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="border-white bg-transparent text-white hover:bg-white hover:text-slate-900"
              asChild
            >
              <Link href="/pricing#overflow">{t("needMore")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function PilotOfferBanner() {
  const tPage = useTranslations("pricing.page");
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-4 py-1.5 text-sm font-semibold text-teal-700">
            <Sparkles className="h-4 w-4" />
            {tPage("pilotBanner.badge")}
          </div>
          <h3 className="font-sans text-2xl font-bold text-slate-900">
            {tPage("pilotBanner.title")}
          </h3>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {tPage("pilotBanner.subtitle")}
          </p>
          <Button asChild className="bg-teal-600 text-white hover:bg-teal-700">
            <Link href="/pricing#plans">
              {tPage("pilotBanner.cta")}{" "}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
      <PilotOfferBanner />
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
