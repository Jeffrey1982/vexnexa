"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  Building2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/lib/analytics-events";
import { AgencyCTAStrip } from "@/components/marketing/AgencyCTAStrip";
import { ENTITLEMENTS, OVERFLOW_PRICING } from "@/lib/billing/plans";
import {
  type PlanKey,
  type BillingCycle,
  formatEuro,
  getDiscountBadge,
  WEBSITE_PACK_PRICES,
  PAGE_PACK_PRICES,
  ASSURANCE_ADDON_PRICES,
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
import { DirectCheckoutButton } from "@/components/pricing/DirectCheckoutButton";

// JSON-LD for pricing
function PricingJsonLd() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "VexNexa WCAG Monitoring",
    description:
      "White-label WCAG monitoring for agencies and EU-facing teams. Scan, report, and monitor accessibility.",
    image: "https://vexnexa.com/heroImage.webp",
    brand: {
      "@type": "Brand",
      name: "VexNexa",
    },
    offers: [
      {
        "@type": "Offer",
        name: "Pro Plan",
        url: "https://vexnexa.com/pricing",
        price: "34.95",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "0",
            currency: "EUR",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "NL",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 0,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 0,
              unitCode: "DAY",
            },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "NL",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 14,
          returnFees: "https://schema.org/FreeReturn",
          returnMethod: "https://schema.org/ReturnByMail",
        },
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
        url: "https://vexnexa.com/pricing",
        price: "99.95",
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        shippingDetails: {
          "@type": "OfferShippingDetails",
          shippingRate: {
            "@type": "MonetaryAmount",
            value: "0",
            currency: "EUR",
          },
          shippingDestination: {
            "@type": "DefinedRegion",
            addressCountry: "NL",
          },
          deliveryTime: {
            "@type": "ShippingDeliveryTime",
            handlingTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 0,
              unitCode: "DAY",
            },
            transitTime: {
              "@type": "QuantitativeValue",
              minValue: 0,
              maxValue: 0,
              unitCode: "DAY",
            },
          },
        },
        hasMerchantReturnPolicy: {
          "@type": "MerchantReturnPolicy",
          applicableCountry: "NL",
          returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
          merchantReturnDays: 14,
          returnFees: "https://schema.org/FreeReturn",
          returnMethod: "https://schema.org/ReturnByMail",
        },
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
            <span className="text-primary">{t("titleHighlight")}</span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            {t("subtitle")}
          </p>

          <p className="text-lg text-muted-foreground">{t("billingSubtitle")}</p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              {t("badges.vat")}
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
          <Link href="/contact" className="underline hover:opacity-100">
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
        period: tp("perYear"),
        subtext: tp("perMonthSubtext", { price: formatEuro(perMonth) }),
      };
    }
    return { mainPrice: formatEuro(price), period: tp("perMonth") };
  };

  const plans: Array<{
    key: PlanKey;
    name: string;
    description: string;
    highlighted: boolean;
    agencyPick: boolean;
    features: string[];
    limitations: string[];
    ctaVariant: "outline" | "default";
  }> = [
    {
      key: "FREE" as PlanKey,
      name: t('plans.starter.name'),
      description: t('plans.starter.description'),
      highlighted: false,
      agencyPick: false,
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
      agencyPick: false,
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
      agencyPick: true,
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
    <section id="plans" className="bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        {error && (
          <Alert className="mb-8 max-w-md mx-auto" variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-center mb-12 space-y-3">
          <div className="inline-flex items-center rounded-lg border border-border bg-card p-1 shadow-sm">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200",
                billingCycle === "monthly"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tp("billing.monthly")}
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={cn(
                "px-6 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative",
                billingCycle === "yearly"
                  ? "bg-primary-600 text-white shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tp("billing.yearly")}
              {discountPercent > 0 && (
                <Badge className="ml-2 bg-primary-600 text-xs text-white">
                  {tp("saveBadge", { percent: discountPercent })}
                </Badge>
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {tp("allPricesInclVat")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const priceDisplay = fmtPrice(plan.key, billingCycle);
            const discountBadge = getDiscountBadge(billingCycle, plan.key);
            const ctaText = tp(`cta.${plan.key.toLowerCase()}`);

            return (
              <Card
                key={plan.key}
                data-testid="plan-card"
                data-plan={plan.key}
                className={cn(
                  "relative flex flex-col border-border bg-card text-card-foreground shadow-sm transition-all duration-300 hover:border-primary-500",
                  plan.highlighted &&
                    "border-primary-600 shadow-xl ring-2 ring-primary-200 dark:ring-primary/30",
                  plan.agencyPick && "border-primary/50"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <Badge className="border-0 bg-primary-600 text-white shadow-sm hover:bg-primary-700">
                      <Star className="mr-1 h-3 w-3" />
                      {tp("mostPopular")}
                    </Badge>
                  </div>
                )}
                {plan.agencyPick && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 transform">
                    <Badge className="border border-primary/30 bg-accent text-accent-foreground shadow-sm">
                      <Building2 className="mr-1 h-3 w-3" />
                      {tp("bestForAgencies")}
                    </Badge>
                  </div>
                )}

                {discountBadge && (
                  <div className="absolute -top-2 -right-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary-600 text-white text-xs px-2 py-1"
                    >
                      {discountBadge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="font-sans text-xl font-semibold text-foreground">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-3">
                    {plan.key === "FREE" ? (
                      <p className="font-sans text-3xl font-bold tracking-tight text-foreground">
                        {tp("freeForeverPrice")}
                      </p>
                    ) : (
                      <>
                        <span className="font-sans text-3xl font-bold text-foreground">
                          {priceDisplay.mainPrice}
                        </span>
                        <span className="ml-1 align-baseline text-lg font-medium text-muted-foreground">
                          {priceDisplay.period}
                        </span>
                        {priceDisplay.subtext && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            ({priceDisplay.subtext})
                          </p>
                        )}
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {tp("inclVatShort")}
                        </p>
                      </>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-2 text-xs">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col">
                  <div className="space-y-2.5 flex-1">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <Check className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                    {plan.limitations.map((limitation, i) => (
                      <div
                        key={i}
                        className="flex items-start space-x-2"
                      >
                        <X className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <span className="text-sm text-muted-foreground">
                          {limitation}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    className={cn(
                      "mt-auto w-full transition-all duration-200",
                      plan.key === "FREE"
                        ? "border border-border bg-card text-foreground hover:bg-muted"
                        : "bg-primary-600 text-white hover:bg-primary-700"
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
                  <p className="text-[10px] text-center text-muted-foreground mt-2">
                    {tp("noCreditCard")}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Enterprise — contact sales link below the grid */}
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {PLAN_DISPLAY_NAMES.ENTERPRISE} — {tp("enterprise.description")}{" "}
          <Link
            href="/contact?subject=enterprise"
            className="font-medium text-primary underline underline-offset-4 hover:opacity-80"
          >
            {tp("cta.enterprise")}
          </Link>
        </p>

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

function AddOnsAccordionContent() {
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
      {/* Extra Website Packs */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-foreground">
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
                    buttonClassName="bg-primary-600 text-white hover:bg-primary-700"
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
      <Card className="border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="font-sans text-lg font-semibold text-foreground">
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
                      buttonClassName="bg-primary-600 text-white hover:bg-primary-700"
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
            <div className="rounded-lg border border-primary/30 bg-accent p-3">
              <p className="text-xs text-primary">
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
            <CardTitle className="font-sans text-lg font-semibold text-foreground">
              {tp("addons.assurance.title")}
            </CardTitle>
            <Badge className="bg-primary-600 text-white text-xs">
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
                <Check className="h-3.5 w-3.5 text-primary-500 flex-shrink-0 mt-0.5" />
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
            <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-accent p-2">
              <span className="text-sm">
                {tp("addons.assurance.businessEnterprise")}
              </span>
              <Badge
                variant="secondary"
                className="bg-primary-600 text-white text-xs"
              >
                {tp("addons.assurance.included")}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function OverflowAccordionContent() {
  const t = useTranslations("pricing.overflow");

  return (
    <div className="pt-4 space-y-6">
      <p className="text-muted-foreground">{t("subtitle")}</p>

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

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>{t("alert.title")}</strong> {t("alert.description")}
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Add-ons and overflow pricing, collapsed into accordions so they don't
 * compete visually with the three main plans.
 */
function ExpandableDetailsSection() {
  const tp = useTranslations("pricing.page");
  const tOverflow = useTranslations("pricing.overflow");

  return (
    <section id="packs" className="py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="addons" id="addons">
              <AccordionTrigger className="text-lg font-semibold">
                {tp("addons.accordionTrigger")}
              </AccordionTrigger>
              <AccordionContent>
                <AddOnsAccordionContent />
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="overflow" id="overflow">
              <AccordionTrigger className="text-lg font-semibold">
                {tOverflow("title")}
              </AccordionTrigger>
              <AccordionContent>
                <OverflowAccordionContent />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/** Short pointer to the manual audit services, moved to /audits. */
function AuditsLinkSection() {
  const tp = useTranslations("pricing.page");

  return (
    <section className="border-y border-border bg-muted/30 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div className="flex items-center gap-3">
            <FileSearch className="h-6 w-6 text-primary flex-shrink-0" aria-hidden="true" />
            <p className="text-lg font-medium">{tp("auditsLink.title")}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/audits">
              {tp("auditsLink.cta")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
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
            <AlertTriangle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">{t("title")}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>{t("warning")}</strong> {t("description")}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href="/legal/terms"
                  className="text-sm text-primary hover:underline"
                >
                  {t("links.terms")}
                </Link>
                <span className="text-muted-foreground">&bull;</span>
                <Link
                  href="/legal/privacy"
                  className="text-sm text-primary hover:underline"
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
    <section className="bg-primary-700 py-20 text-white">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="font-sans text-3xl font-bold lg:text-4xl">
            {t("title")}
          </h2>
          <p className="text-xl opacity-90">{t("subtitle")}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link
                href="/free-scan"
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
              className="border-white bg-transparent text-white hover:bg-card hover:text-primary"
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
        <div className="max-w-3xl mx-auto rounded-2xl border border-border bg-card p-8 text-center shadow-sm space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
            <Sparkles className="h-4 w-4" />
            {tPage("pilotBanner.badge")}
          </div>
          <h2 className="font-sans text-2xl font-bold text-foreground">
            {tPage("pilotBanner.title")}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {tPage("pilotBanner.subtitle")}
          </p>
          <Button asChild className="bg-primary-600 text-white hover:bg-primary-700">
            <Link href="/pilot-partner-program">
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
      <ExpandableDetailsSection />
      <AuditsLinkSection />
      <ComplianceDisclaimerSection />
      <ToolComparisonSection />
      <AgencyCTAStrip location="pricing" />
      <CTASection />
    </>
  );
}
