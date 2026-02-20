"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ENTITLEMENTS, PLAN_NAMES, OVERFLOW_PRICING } from "@/lib/billing/plans";
import {
  BillingCycle,
  PlanKey,
  formatPriceDisplay,
  formatEuro,
  getDiscountBadge,
  getCTAText,
  planIncludesAssurance,
  getAssurancePrice,
  WEBSITE_PACK_PRICES,
  PAGE_PACK_PRICES,
  ASSURANCE_ADDON_PRICES,
  calculateTotalMonthly,
  BASE_PRICES,
  ANNUAL_PRICES,
} from "@/lib/pricing";
import { ComparisonTable } from "@/components/marketing/ComparisonTable";
import { useTranslations } from 'next-intl';
import { PriceModeToggle } from "@/components/pricing/PriceModeToggle";
import { usePriceDisplayMode } from "@/lib/pricing/use-price-display-mode";
import { grossToNet, BASE_VAT_RATE } from "@/lib/pricing/vat-math";

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
        price: "24.99",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "24.99", priceCurrency: "EUR", unitText: "MONTH" },
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "59.99",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "59.99", priceCurrency: "EUR", unitText: "MONTH" },
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
        price: "299.00",
        priceCurrency: "EUR",
        priceSpecification: { "@type": "UnitPriceSpecification", price: "299.00", priceCurrency: "EUR", unitText: "MONTH" },
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
  customer: {
    type: string;
    country: string;
    companyName: string | null;
    hasValidVat: boolean;
  };
}

function PricingCards() {
  const t = useTranslations('pricing');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);
  const [taxQuote, setTaxQuote] = useState<TaxQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [displayMode] = usePriceDisplayMode();
  const [purchaseAs, setPurchaseAs] = useState<'individual' | 'company'>('individual');
  const [companyFields, setCompanyFields] = useState({
    companyName: '', registrationNumber: '', vatId: '', billingCountry: 'NL',
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** Whether company details are required at checkout */
  const requiresCompanyDetails = displayMode === 'excl' || purchaseAs === 'company';

  /** Validate company fields — returns true if valid */
  const validateCompanyFields = (): boolean => {
    if (!requiresCompanyDetails) return true;
    const errors: Record<string, string> = {};
    if (!companyFields.companyName.trim()) errors.companyName = 'Company name is required';
    if (!companyFields.registrationNumber.trim()) errors.registrationNumber = 'Registration number is required';
    if (!companyFields.vatId.trim()) errors.vatId = 'VAT number is required';
    if (!companyFields.billingCountry.trim()) errors.billingCountry = 'Billing country is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /** Convert a gross price for display based on current mode */
  const dp = (gross: number): number =>
    displayMode === 'excl' ? grossToNet(gross) : gross;

  /** Format price display with VAT mode awareness */
  const fmtPrice = (planKey: PlanKey, cycle: BillingCycle): {
    mainPrice: string; period: string; subtext?: string;
  } => {
    if (planKey === 'ENTERPRISE') {
      if (cycle === 'yearly') return { mainPrice: 'Custom', period: '', subtext: 'Contact us for a tailored quote' };
      return { mainPrice: formatEuro(dp(BASE_PRICES.ENTERPRISE)), period: '/month', subtext: 'Custom billing available' };
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
        "SLA guarantee",
        "Dedicated account manager",
        `${ENTITLEMENTS.ENTERPRISE.historyMonths}-month history`,
        "Custom billing",
      ],
      limitations: [],
      ctaVariant: "default",
    },
  ];

  const handleUpgrade = async (planKey: string) => {
    if (planKey === "ENTERPRISE") {
      window.location.href = "/contact?subject=enterprise";
      return;
    }

    // Open confirmation dialog and fetch tax quote
    setConfirmPlan(planKey);
    setQuoteLoading(true);
    setTaxQuote(null);
    setError(null);
    setFieldErrors({});
    // Default purchaseAs to 'company' when in excl mode
    if (displayMode === 'excl') setPurchaseAs('company');

    try {
      const res = await fetch('/api/checkout/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey, billingCycle }),
      });
      if (res.ok) {
        const data = await res.json();
        setTaxQuote(data);
      }
    } catch {
      // Non-fatal: dialog still shows, just without tax breakdown
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmCheckout = async () => {
    if (!confirmPlan) return;
    // Validate company fields if required
    if (!validateCompanyFields()) return;

    setLoading(confirmPlan);
    setError(null);

    try {
      // Save company details to billing profile if provided
      if (requiresCompanyDetails) {
        await fetch('/api/billing/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            billingType: purchaseAs === 'company' ? 'business' : 'individual',
            companyName: companyFields.companyName || undefined,
            countryCode: companyFields.billingCountry,
            vatId: companyFields.vatId || undefined,
            registrationNumber: companyFields.registrationNumber || undefined,
          }),
        });
      }

      const response = await fetch("/api/mollie/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: confirmPlan, billingCycle }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create checkout");
      window.location.href = data.url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(null);
      setConfirmPlan(null);
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

        {/* Billing Cycle Toggle + VAT Mode Toggle */}
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
                  Save up to 17%
                </Badge>
              </button>
            </div>
            <PriceModeToggle />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {displayMode === 'excl'
              ? 'Prices shown excl. VAT. Company details required at checkout.'
              : 'Save more with annual billing. All prices incl. VAT.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const priceDisplay = fmtPrice(plan.key, billingCycle);
            const discountBadge = getDiscountBadge(billingCycle, plan.key);
            const ctaText = getCTAText(billingCycle, plan.key);

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
                    <span className="text-3xl font-bold font-display">{priceDisplay.mainPrice}</span>
                    <span className="text-muted-foreground text-sm">{priceDisplay.period}</span>
                    {priceDisplay.subtext && (
                      <p className="text-xs text-muted-foreground mt-1">
                        (≈ {priceDisplay.subtext})
                      </p>
                    )}
                    {displayMode === 'excl' && plan.key !== 'ENTERPRISE' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">excl. VAT</p>
                    )}
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

        {/* Checkout Confirmation Dialog */}
        <Dialog open={!!confirmPlan} onOpenChange={(open) => { if (!open) { setConfirmPlan(null); setTaxQuote(null); setFieldErrors({}); } }}>
          <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Checkout Summary
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Plan</span>
                <span className="font-medium">VexNexa {confirmPlan}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <span className="text-sm text-muted-foreground">Billing</span>
                <span className="font-medium">{billingCycle === 'monthly' ? 'Monthly' : 'Annual'}</span>
              </div>

              {quoteLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Calculating tax...</span>
                </div>
              ) : taxQuote ? (
                <>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Subtotal (ex. VAT)</span>
                    <span className="font-medium">{formatEuro(taxQuote.baseAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">{taxQuote.tax.label}</span>
                    <span className="font-medium">
                      {taxQuote.vatAmount === 0 ? '—' : formatEuro(taxQuote.vatAmount)}
                    </span>
                  </div>
                  {taxQuote.tax.mode === 'reverse_charge' && (
                    <p className="text-xs text-muted-foreground italic">
                      VAT reverse charge applies — you account for VAT
                    </p>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-xl font-bold">{formatEuro(taxQuote.totalAmount)}</span>
                  </div>
                </>
              ) : confirmPlan ? (
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold">Price</span>
                  <span className="text-xl font-bold">
                    {fmtPrice(confirmPlan as PlanKey, billingCycle).mainPrice}
                    <span className="text-sm font-normal text-muted-foreground">
                      {fmtPrice(confirmPlan as PlanKey, billingCycle).period}
                    </span>
                  </span>
                </div>
              ) : null}
            </div>

            {/* Purchase As selector */}
            <div className="border-t border-border pt-4 space-y-4">
              <div>
                <Label className="text-sm font-medium">Purchase as</Label>
                <div className="inline-flex items-center rounded-md bg-muted p-0.5 text-xs mt-1.5 w-full">
                  {(['individual', 'company'] as const).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setPurchaseAs(opt)}
                      className={cn(
                        "flex-1 px-3 py-1.5 rounded-[5px] font-medium transition-all duration-150 capitalize",
                        purchaseAs === opt
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Company details form — shown when required */}
              {requiresCompanyDetails && (
                <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Company details</p>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="ck-company" className="text-xs">Company name *</Label>
                      <Input
                        id="ck-company"
                        value={companyFields.companyName}
                        onChange={(e) => { setCompanyFields(f => ({ ...f, companyName: e.target.value })); setFieldErrors(e2 => ({ ...e2, companyName: '' })); }}
                        placeholder="Acme B.V."
                        className={cn("h-9 text-sm", fieldErrors.companyName && "border-destructive")}
                      />
                      {fieldErrors.companyName && <p className="text-xs text-destructive mt-0.5">{fieldErrors.companyName}</p>}
                    </div>
                    <div>
                      <Label htmlFor="ck-reg" className="text-xs">
                        {companyFields.billingCountry === 'NL' ? 'KvK-nummer' : 'Chamber of Commerce number'} *
                      </Label>
                      <Input
                        id="ck-reg"
                        value={companyFields.registrationNumber}
                        onChange={(e) => { setCompanyFields(f => ({ ...f, registrationNumber: e.target.value })); setFieldErrors(e2 => ({ ...e2, registrationNumber: '' })); }}
                        placeholder={companyFields.billingCountry === 'NL' ? '12345678' : 'Registration number'}
                        className={cn("h-9 text-sm", fieldErrors.registrationNumber && "border-destructive")}
                      />
                      {fieldErrors.registrationNumber && <p className="text-xs text-destructive mt-0.5">{fieldErrors.registrationNumber}</p>}
                    </div>
                    <div>
                      <Label htmlFor="ck-vat" className="text-xs">VAT number *</Label>
                      <Input
                        id="ck-vat"
                        value={companyFields.vatId}
                        onChange={(e) => { setCompanyFields(f => ({ ...f, vatId: e.target.value })); setFieldErrors(e2 => ({ ...e2, vatId: '' })); }}
                        placeholder="NL123456789B01"
                        className={cn("h-9 text-sm", fieldErrors.vatId && "border-destructive")}
                      />
                      {fieldErrors.vatId && <p className="text-xs text-destructive mt-0.5">{fieldErrors.vatId}</p>}
                    </div>
                    <div>
                      <Label htmlFor="ck-country" className="text-xs">Billing country *</Label>
                      <Input
                        id="ck-country"
                        value={companyFields.billingCountry}
                        onChange={(e) => { setCompanyFields(f => ({ ...f, billingCountry: e.target.value.toUpperCase().slice(0, 2) })); setFieldErrors(e2 => ({ ...e2, billingCountry: '' })); }}
                        placeholder="NL"
                        maxLength={2}
                        className={cn("h-9 text-sm w-20", fieldErrors.billingCountry && "border-destructive")}
                      />
                      {fieldErrors.billingCountry && <p className="text-xs text-destructive mt-0.5">{fieldErrors.billingCountry}</p>}
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">Details saved to your billing profile for future invoices.</p>
                </div>
              )}
            </div>

            <DialogFooter className="flex gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => { setConfirmPlan(null); setTaxQuote(null); setFieldErrors({}); }}
                disabled={!!loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmCheckout}
                disabled={!!loading || quoteLoading}
                className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                ) : (
                  <>Proceed to Payment<ArrowRight className="ml-2 h-4 w-4" /></>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}

function AddOnsSection() {
  const [displayMode] = usePriceDisplayMode();
  const dp = (gross: number): number =>
    displayMode === 'excl' ? grossToNet(gross) : gross;

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
                    <span className="font-bold">{formatEuro(dp(pack.price))}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
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
                      <span className="font-bold">{formatEuro(displayPrice)}<span className="text-xs text-muted-foreground font-normal">/mo</span></span>
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
                  <span className="font-bold text-sm">+{formatEuro(dp(ASSURANCE_ADDON_PRICES.STARTER ?? 0))}/mo</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm">Pro</span>
                  <span className="font-bold text-sm">+{formatEuro(dp(ASSURANCE_ADDON_PRICES.PRO ?? 0))}/mo</span>
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
      <AddOnsSection />
      <ComplianceDisclaimerSection />
      <ToolComparisonSection />
      <CTASection />
    </>
  );
}
