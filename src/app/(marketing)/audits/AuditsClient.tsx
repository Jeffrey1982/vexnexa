"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Check, FileSearch, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { formatEuro, AUDIT_PRICES, AUDIT_BUNDLE_PRICES } from "@/lib/pricing";
import { DirectCheckoutButton } from "@/components/pricing/DirectCheckoutButton";

function AuditsHero() {
  const tp = useTranslations("pricing.page");

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <Badge variant="outline" className="border-primary/30 bg-card text-primary">
            <FileSearch className="w-3 h-3 mr-1" />
            {tp("audits.badge")}
          </Badge>
          <h1 className="font-sans text-4xl font-bold tracking-tight lg:text-6xl">
            {tp("audits.title")}{" "}
            <span className="text-primary">{tp("audits.titleHighlight")}</span>
          </h1>
          <p className="text-xl text-muted-foreground">{tp("audits.subtitle")}</p>
          <p className="text-sm text-muted-foreground">
            <Link href="/pricing" className="underline underline-offset-4 hover:text-foreground">
              {tp("audits.backToPricing")}
            </Link>
          </p>
        </div>
      </div>
    </section>
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
    <section id="audits" className="border-y border-border bg-muted/30 py-20">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto items-stretch">
          {audits.map((audit) => (
            <Card
              key={audit.productId}
              className="flex h-full flex-col border-border bg-card shadow-sm transition-colors hover:border-primary-500"
            >
              <CardHeader className="min-h-36">
                <CardTitle className="font-sans text-xl font-semibold leading-tight text-foreground">
                  {audit.label}
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  {audit.description}
                </p>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col justify-between">
                <div className="space-y-2">
                  {audit.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 space-y-4">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="font-sans text-3xl font-bold text-foreground">
                        {formatEuro(audit.price)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {tp("audits.oneTime")}
                      </span>
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
                      incl. VAT
                    </p>
                  </div>
                  <DirectCheckoutButton
                    variant="default"
                    buttonClassName="bg-primary-600 text-white hover:bg-primary-700"
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
          <h2 className="mb-4 font-sans text-3xl font-bold text-foreground lg:text-5xl">
            {tp("auditBundles.title")}{" "}
            <span className="text-primary">
              {tp("auditBundles.titleHighlight")}
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {tp("auditBundles.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {bundles.map((bundle) => (
            <Card
              key={bundle.productId}
              className="flex flex-col border-border bg-card shadow-sm transition-colors hover:border-primary-500"
            >
              <CardHeader>
                <CardTitle className="font-sans text-lg font-semibold text-foreground">
                  {bundle.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="mb-4">
                  <span className="font-sans text-2xl font-bold text-foreground">
                    {formatEuro(bundle.price)}
                  </span>
                  <span className="text-muted-foreground text-sm">
                    {tp("addons.perMonth")}
                  </span>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground mt-0.5">
                    incl. VAT
                  </p>
                </div>
                <div className="space-y-2 flex-1">
                  {bundle.features.map((feature, i) => (
                    <div key={i} className="flex items-start space-x-2">
                      <Check className="h-4 w-4 text-primary-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
                <DirectCheckoutButton
                  variant="default"
                  buttonClassName="bg-primary-600 text-white hover:bg-primary-700"
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

function AuditsCTASection() {
  const tp = useTranslations("pricing.page");

  return (
    <section className="border-t border-border bg-muted/30 py-16">
      <div className="container mx-auto px-4 text-center space-y-4">
        <p className="text-lg text-muted-foreground">{tp("audits.monitoringNote")}</p>
        <Button asChild size="lg" className="bg-primary-600 text-white hover:bg-primary-700">
          <Link href="/pricing">
            {tp("audits.viewPlans")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

export function AuditsClient() {
  return (
    <>
      <AuditsHero />
      <AuditServicesSection />
      <AuditBundlesSection />
      <AuditsCTASection />
    </>
  );
}
