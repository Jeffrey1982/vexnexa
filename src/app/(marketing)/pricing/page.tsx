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

const plans = [
  {
    key: "STARTER" as const,
    name: "Starter",
    price: "€9",
    period: "/month",
    description: "For small websites and personal use",
    highlighted: false,
    features: [
      `${ENTITLEMENTS.STARTER.sites} website`,
      `${ENTITLEMENTS.STARTER.pagesPerMonth} pages/month`,
      `${ENTITLEMENTS.STARTER.users} user`,
      "PDF export",
      "Basic reports",
      "Email support",
    ],
    limitations: [
      "No Word export",
      "No scheduling",
      "Limited integrations",
    ],
    cta: "Start with Starter",
    ctaVariant: "outline" as const,
  },
  {
    key: "PRO" as const,
    name: "Pro",
    price: "€29",
    period: "/month",
    description: "For professionals who scan regularly",
    highlighted: true,
    features: [
      `${ENTITLEMENTS.PRO.sites} websites`,
      `${ENTITLEMENTS.PRO.pagesPerMonth} pages/month`,
      `${ENTITLEMENTS.PRO.users} users`,
      "PDF + Word export",
      "Advanced reports",
      "Scheduling",
      "Slack & Jira integration",
      "Priority support",
    ],
    limitations: [],
    cta: "Try Pro",
    ctaVariant: "default" as const,
  },
  {
    key: "BUSINESS" as const,
    name: "Business",
    price: "€79",
    period: "/month",
    description: "For teams and enterprise use",
    highlighted: false,
    features: [
      `${ENTITLEMENTS.BUSINESS.sites} websites`,
      `${ENTITLEMENTS.BUSINESS.pagesPerMonth} pages/month`,
      `${ENTITLEMENTS.BUSINESS.users} users`,
      "All exports (PDF + Word)",
      "White label reports",
      "Advanced scheduling",
      "All integrations",
      "Priority support (4h response)",
    ],
    limitations: [],
    cta: "Start with Business",
    ctaVariant: "default" as const,
  },
  {
    key: "ENTERPRISE" as const,
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Unlimited scanning for large organizations",
    highlighted: false,
    features: [
      "Unlimited websites",
      "Unlimited pages",
      "Unlimited users",
      "Custom integrations",
      "SSO/SAML",
      "Dedicated support",
      "SLA guarantee",
      "On-premise option",
    ],
    limitations: [],
    cta: "Talk to us",
    ctaHref: "/contact",
    ctaVariant: "outline" as const,
  },
];

function HeroSection() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <Badge variant="outline" className="mb-4">
            💰 Transparent pricing
          </Badge>

          <h1 className="text-4xl lg:text-6xl font-bold font-display tracking-tight">
            Choose the right plan for{" "}
            <span className="text-primary">your project</span>
          </h1>

          <p className="text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto">
            From free trial to enterprise features. All prices are transparent and
            monthly cancellable.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Badge variant="secondary" className="text-sm">
              All prices exclude VAT
            </Badge>
            <Badge variant="secondary" className="text-sm">
              No setup fees
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Cancel anytime
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
                    Popular
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
                      Loading...
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
            All plans exclude VAT. Cancel anytime.{" "}
            <Link href="/contact" className="text-primary hover:underline ml-1">
              Questions? Contact us.
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function OverflowPricingSection() {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold font-display mb-4">
              Overflow Pricing
            </h2>
            <p className="text-xl text-muted-foreground">
              When you exceed your plan limits, we charge small amounts instead of
              blocking you
            </p>
          </div>

          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Overflow Price</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Extra Pages</TableCell>
                  <TableCell>€{OVERFLOW_PRICING.extraPage.amount}/{OVERFLOW_PRICING.extraPage.unit}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraPage.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Extra Websites</TableCell>
                  <TableCell>€{OVERFLOW_PRICING.extraSite.amount}/{OVERFLOW_PRICING.extraSite.unit}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {OVERFLOW_PRICING.extraSite.description}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Extra Users</TableCell>
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
              <strong>How it works:</strong> When you consistently exceed your plan limits,
              we&apos;ll notify you and recommend upgrading. Small overages are automatically
              billed monthly. You&apos;re always in control.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </section>
  );
}

function ComplianceDisclaimerSection() {
  return (
    <section className="py-12 border-y bg-amber-50 dark:bg-amber-950/20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-semibold text-lg mb-2">Compliance Disclaimer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>No tool can guarantee 100% legal compliance in all contexts.</strong>{" "}
                TutusPorta detects and reports issues, assists remediation, and helps you adhere
                to WCAG and related standards. For legal risk assessment, consider an expert audit
                and ongoing governance process. Our scanner is a tool to assist your compliance
                efforts, not a legal guarantee.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/legal/terms" className="text-sm text-primary hover:underline">
                  Terms of Service
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link href="/legal/privacy" className="text-sm text-primary hover:underline">
                  Privacy Policy
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
      title="How TutusPorta Compares"
      description="Comparing our approach to overlay widgets and generic accessibility scanners"
      rows={comparisonData}
      disclaimer="Overlay widgets inject JavaScript that attempts to modify your site on the client side. While they may help some users, they don't fix underlying code issues and can create new accessibility problems. Generic scanners often miss context-specific issues. TutusPorta provides deeper automated coverage and actionable guidance for developers."
    />
  );
}

function CTASection() {
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold font-display">
            Start scanning today
          </h2>
          <p className="text-xl opacity-90">
            Start with a free trial and upgrade when you need more functionality. No
            setup fees, no surprises.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/register">
                Start free trial
                <Zap className="ml-2 h-4 w-4" />
              </Link>
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              asChild
            >
              <Link href="/contact">
                Contact sales
                <Users className="ml-2 h-4 w-4" />
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
