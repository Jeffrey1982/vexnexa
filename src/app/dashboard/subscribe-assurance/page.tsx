"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  ArrowLeft,
  Loader2,
  Globe,
  Bell,
  BarChart3,
  Clock,
  AlertTriangle,
  Lock,
  CreditCard,
  X,
} from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { createClient } from "@/lib/supabase/client-new";
import { PriceModeToggle } from "@/components/pricing/PriceModeToggle";
import { usePriceDisplayMode } from "@/lib/pricing/use-price-display-mode";
import { grossToNet } from "@/lib/pricing/vat-math";

type BillingCycle = "monthly" | "semiannual" | "annual";
type AssuranceTier = "BASIC" | "PRO" | "PUBLIC_SECTOR";

interface PlanConfig {
  tier: AssuranceTier;
  name: string;
  description: string;
  domains: number;
  monthly: number;
  semiannual: number;
  annual: number;
  features: string[];
  popular?: boolean;
}

interface SubscribeError {
  message: string;
  requestId?: string;
  isConfigIssue?: boolean;
}

interface PaymentMethod {
  id: string;
  description: string;
  imageUrl: string;
  imageSvg: string;
}

interface TaxQuote {
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  tax: {
    ratePercent: number;
    mode: string;
    label: string;
    notes: string | null;
  };
}

const PLANS: PlanConfig[] = [
  {
    tier: "BASIC",
    name: "Basic",
    description: "Perfect for single websites and small projects",
    domains: 1,
    monthly: 9.99,
    semiannual: 55.99,
    annual: 101.99,
    features: [
      "1 domain monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "12-month scan history",
      "Up to 5 email recipients",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    description: "Ideal for agencies and multi-site organizations",
    domains: 5,
    monthly: 24.99,
    semiannual: 137.99,
    annual: 254.99,
    popular: true,
    features: [
      "Up to 5 domains monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "12-month scan history",
      "Up to 5 email recipients",
      "Priority support",
    ],
  },
  {
    tier: "PUBLIC_SECTOR",
    name: "Public Sector",
    description: "Built for schools, governments, and public institutions",
    domains: 20,
    monthly: 49.99,
    semiannual: 275.99,
    annual: 509.99,
    features: [
      "Up to 20 domains monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "Custom score thresholds (60-100)",
      "12-month scan history",
      "Up to 5 email recipients",
      "Dedicated support",
    ],
  },
];

const CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  semiannual: "Every 6 months",
  annual: "Annual",
};

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getPrice(plan: PlanConfig, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return plan.monthly;
    case "semiannual":
      return plan.semiannual;
    case "annual":
      return plan.annual;
  }
}

function getPerMonth(plan: PlanConfig, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return plan.monthly;
    case "semiannual":
      return plan.semiannual / 6;
    case "annual":
      return plan.annual / 12;
  }
}

export default function SubscribeAssurancePage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingTier, setLoadingTier] = useState<AssuranceTier | null>(null);
  const [error, setError] = useState<SubscribeError | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const [selectedPlan, setSelectedPlan] = useState<AssuranceTier | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);
  const [taxQuote, setTaxQuote] = useState<TaxQuote | null>(null);
  const [displayMode] = usePriceDisplayMode();

  /** Convert a gross price for display based on current mode */
  const dp = (gross: number): number =>
    displayMode === 'excl' ? grossToNet(gross) : gross;

  // Hydration-safe mount gating
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user after mount (client-only)
  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [mounted]);

  // Fetch available payment methods when tier or cycle changes
  const fetchMethods = useCallback(async (tier: AssuranceTier, cycle: BillingCycle): Promise<void> => {
    setMethodsLoading(true);
    try {
      const res = await fetch(`/api/billing/methods?tier=${tier}&billingCycle=${cycle}`);
      if (res.ok) {
        const data = await res.json();
        setPaymentMethods(data.methods || []);
      }
    } catch {
      // Silently fail — methods section just won't show
    } finally {
      setMethodsLoading(false);
    }
  }, []);

  // Fetch tax quote from server when plan/cycle changes
  const fetchTaxQuote = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/billing/profile');
      if (!res.ok) return;
      const { profile } = await res.json();
      if (!profile) return;

      // Use the billing profile to compute tax via the quote endpoint
      // For assurance, we pass the plan as the tier
      const quoteRes = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: 'STARTER', billingCycle: 'monthly' }),
      });
      if (!quoteRes.ok) return;
      const quoteData = await quoteRes.json();

      // We only need the tax rate info, we'll apply it to the assurance price
      if (selectedPlan) {
        const plan = PLANS.find((p) => p.tier === selectedPlan);
        if (!plan) return;
        const basePrice = getPrice(plan, billingCycle);
        const vatAmount = Math.round(basePrice * (quoteData.tax.ratePercent / 100) * 100) / 100;
        setTaxQuote({
          baseAmount: basePrice,
          vatAmount,
          totalAmount: Math.round((basePrice + vatAmount) * 100) / 100,
          tax: quoteData.tax,
        });
      }
    } catch {
      // Non-fatal: tax quote just won't show
    }
  }, [selectedPlan, billingCycle]);

  useEffect(() => {
    if (!mounted || !selectedPlan) return;
    fetchMethods(selectedPlan, billingCycle);
    fetchTaxQuote();
  }, [mounted, selectedPlan, billingCycle, fetchMethods, fetchTaxQuote]);

  const handleSelectPlan = (tier: AssuranceTier): void => {
    setSelectedPlan(tier);
    setError(null);
  };

  const handleSubscribe = async (): Promise<void> => {
    if (!selectedPlan || loadingTier) return;
    setLoadingTier(selectedPlan);
    setError(null);

    try {
      const res = await fetch("/api/assurance/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedPlan, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok || data.ok === false) {
        const isConfigIssue = data.code === 'CONFIG_MISSING_ENV' || data.code === 'CONFIG_MISSING_PRICE_ID';
        setError({
          message: data.message || "Payment setup failed. Please try again.",
          requestId: data.requestId,
          isConfigIssue,
        });
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: unknown) {
      setError({
        message: "Something went wrong. Please check your connection and try again.",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  const activePlan = selectedPlan ? PLANS.find((p) => p.tier === selectedPlan) : null;

  // SSR-safe skeleton
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-16 border-b border-border" />
        <div className="flex-1">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 text-white mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                Accessibility Assurance
              </h1>
              <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
                Automated accessibility monitoring for your websites. Get alerted
                when scores drop and track WCAG compliance over time.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {PLANS.map((plan) => (
                <Card key={plan.tier} className="relative flex flex-col border-border">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="h-8 bg-muted/30 rounded animate-pulse mb-6" />
                    <div className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((f) => (
                        <div key={f} className="h-4 bg-muted/20 rounded animate-pulse" />
                      ))}
                    </div>
                    <div className="h-10 bg-muted/30 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={authUser} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-500 text-white shadow-glow-teal mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Accessibility Assurance
            </h1>
            <p className="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
              Automated accessibility monitoring for your websites. Get alerted
              when scores drop and track WCAG compliance over time.
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              {
                icon: Globe,
                title: "Domain Monitoring",
                desc: "Monitor multiple domains automatically",
              },
              {
                icon: Clock,
                title: "Scheduled Scans",
                desc: "Weekly or biweekly automated scans",
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                desc: "Email alerts when scores drop",
              },
              {
                icon: BarChart3,
                title: "Compliance Tracking",
                desc: "12-month WCAG compliance history",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border"
              >
                <feature.icon className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-foreground text-sm">
                    {feature.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Cycle Toggle + VAT Mode Toggle */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="flex flex-wrap items-center justify-center gap-4">
            <div className="inline-flex items-center bg-card border border-border rounded-lg p-1">
              {(
                [
                  { value: "monthly" as const, label: "Monthly", badge: "" },
                  { value: "semiannual" as const, label: "6 Months", badge: "Save 7-8%" },
                  { value: "annual" as const, label: "Annual", badge: "Save 15%" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBillingCycle(option.value)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === option.value
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                  {option.badge && billingCycle !== option.value && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <PriceModeToggle />
            </div>
            {displayMode === 'excl' && (
              <p className="text-xs text-muted-foreground">Prices shown excl. VAT. Company details required at checkout.</p>
            )}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-destructive/10 border border-destructive/30 rounded-lg text-sm text-center">
              <div className="flex items-center justify-center gap-2 text-destructive mb-1">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span className="font-medium">{error.message}</span>
              </div>
              {error.isConfigIssue && (
                <p className="text-muted-foreground text-xs mt-1">
                  Support has been notified and is looking into this.
                </p>
              )}
              {error.requestId && (
                <p className="text-muted-foreground text-xs mt-1">
                  Ref: {error.requestId}
                </p>
              )}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const price = getPrice(plan, billingCycle);
              const perMonth = getPerMonth(plan, billingCycle);
              const isSelected = selectedPlan === plan.tier;

              return (
                <Card
                  key={plan.tier}
                  className={`relative flex flex-col cursor-pointer transition-all ${
                    isSelected
                      ? "border-primary shadow-lg ring-2 ring-primary/30"
                      : plan.popular
                        ? "border-primary/50 shadow-md ring-1 ring-primary/10"
                        : "border-border hover:border-primary/30"
                  }`}
                  onClick={() => handleSelectPlan(plan.tier)}
                >
                  {plan.popular && !isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary hover:bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  {isSelected && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-green-600 hover:bg-green-600 text-white">
                        <Check className="w-3 h-3 mr-1" />
                        Selected
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-foreground">
                          {formatEuro(dp(billingCycle === "monthly" ? price : perMonth))}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          /month
                        </span>
                      </div>
                      {billingCycle !== "monthly" && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatEuro(dp(price))} billed{" "}
                          {billingCycle === "semiannual"
                            ? "every 6 months"
                            : "annually"}
                        </p>
                      )}
                      {displayMode === 'excl' && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">excl. VAT</p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-foreground/80"
                        >
                          <Check className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* Select Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlan(plan.tier);
                      }}
                      className={`w-full ${
                        isSelected
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : plan.popular
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                            : ""
                      }`}
                      variant={isSelected ? "default" : plan.popular ? "default" : "outline"}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Selected
                        </>
                      ) : (
                        `Select ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* ── Checkout Summary (shown when plan selected) ── */}
          {activePlan && (
            <div className="max-w-2xl mx-auto mt-10 space-y-6">
              {/* Checkout Summary Card */}
              <Card className="border-border">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-primary" />
                      Checkout Summary
                    </CardTitle>
                    <button
                      onClick={() => setSelectedPlan(null)}
                      className="text-muted-foreground hover:text-foreground p-1 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Plan</span>
                      <span className="font-medium text-foreground">
                        Assurance {activePlan.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Billing cycle</span>
                      <span className="font-medium text-foreground">
                        {CYCLE_LABELS[billingCycle]}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Domains included</span>
                      <span className="font-medium text-foreground">
                        {activePlan.domains === 1 ? "1 domain" : `Up to ${activePlan.domains} domains`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Subtotal (ex. VAT)</span>
                      <span className="font-medium text-foreground">
                        {formatEuro(getPrice(activePlan, billingCycle))}
                      </span>
                    </div>
                    {taxQuote && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">{taxQuote.tax.label}</span>
                        <span className="font-medium text-foreground">
                          {taxQuote.vatAmount === 0 ? '—' : formatEuro(taxQuote.vatAmount)}
                        </span>
                      </div>
                    )}
                    {taxQuote?.tax.mode === 'reverse_charge' && (
                      <div className="text-xs text-muted-foreground italic py-1">
                        VAT reverse charge applies — you account for VAT
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm font-medium text-foreground">Total</span>
                      <div className="text-right">
                        <span className="text-xl font-bold text-foreground">
                          {formatEuro(taxQuote ? taxQuote.totalAmount : getPrice(activePlan, billingCycle))}
                        </span>
                        {billingCycle !== "monthly" && (
                          <div className="text-xs text-muted-foreground">
                            ({formatEuro(taxQuote ? taxQuote.totalAmount / (billingCycle === 'semiannual' ? 6 : 12) : getPerMonth(activePlan, billingCycle))}/month)
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* What's included */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                      What&apos;s included
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {activePlan.features.map((f) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs text-foreground/70">
                          <Check className="w-3 h-3 text-green-500 shrink-0" />
                          {f}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment Methods (dynamic) */}
              {(paymentMethods.length > 0 || methodsLoading) && (
                <Card className="border-border">
                  <CardContent className="pt-6">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Payment methods (where available)
                    </div>
                    {methodsLoading ? (
                      <div className="flex gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="w-14 h-9 bg-muted/30 rounded animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {paymentMethods.map((method) => (
                          <div
                            key={method.id}
                            className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/20 border border-border"
                            title={method.description}
                          >
                            {method.imageSvg ? (
                              <img
                                src={method.imageSvg}
                                alt={method.description}
                                className="h-5 w-auto"
                              />
                            ) : method.imageUrl ? (
                              <img
                                src={method.imageUrl}
                                alt={method.description}
                                className="h-5 w-auto"
                              />
                            ) : (
                              <CreditCard className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-xs text-foreground">{method.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Secure Payment Section */}
              <Card className="border-border bg-muted/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Lock className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-foreground">Secure payment</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Payments are handled securely by{" "}
                    <span className="font-medium text-foreground">Mollie</span>, a PCI DSS Level 1
                    certified payment provider trusted by over 200,000 businesses across Europe.
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    You&apos;ll be redirected to Mollie&apos;s secure checkout to complete your payment.
                    Your card details are never stored on our servers.
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      PCI DSS compliant
                    </div>
                    <div className="flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      256-bit SSL encryption
                    </div>
                    <div className="flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                      Cancel anytime
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Proceed to Payment Button */}
              <Button
                onClick={handleSubscribe}
                disabled={loadingTier !== null}
                className="w-full h-12 text-base bg-primary hover:bg-primary/90 text-primary-foreground"
                size="lg"
              >
                {loadingTier ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Redirecting to secure checkout...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Proceed to Payment — {formatEuro(getPrice(activePlan, billingCycle))}
                  </>
                )}
              </Button>
            </div>
          )}

          {/* FAQ / Info */}
          <div className="mt-12 max-w-2xl mx-auto text-center text-sm text-muted-foreground">
            <p>
              All plans include a secure payment via Mollie. You can cancel
              anytime with a 7-day grace period. Prices are in EUR and exclude
              VAT where applicable.
            </p>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
