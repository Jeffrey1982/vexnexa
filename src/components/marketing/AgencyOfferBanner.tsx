"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import Link from "@/components/marketing/MarketingLink";
import { Button } from "@/components/ui/button";
import { PLAN_PRICES } from "@/lib/billing/pricing-config";
import { ENTITLEMENTS } from "@/lib/billing/plans";
import { trackEvent } from "@/lib/analytics-events";

/** The paid agency offer, shared across acquisition pages. */
export function AgencyOfferBanner({ location }: { location: string }) {
  const t = useTranslations("agencyOffer");
  const locale = useLocale();
  const headingId = useId();
  const price = new Intl.NumberFormat(locale, {
    style: "currency", currency: "EUR", minimumFractionDigits: 2,
  }).format(PLAN_PRICES.BUSINESS.monthly);

  return (
    <section aria-labelledby={headingId} className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]">
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-[var(--color-hero-accent-fg)]">{t("badge")}</p>
            <h2 id={headingId} className="mt-3 font-sans text-2xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-3xl">{t("title")}</h2>
            <p className="mt-2 max-w-prose text-base leading-7 text-[var(--color-ink-500)]">{t("description", { sites: ENTITLEMENTS.BUSINESS.sites })}</p>
            <p className="mt-3 font-semibold text-[var(--color-ink-900)]">{t("price", { price })}</p>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">{t("billingNote")}</p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto">
            <Button size="lg" asChild className="rounded-lg">
              <Link href="/pricing#agency" onClick={() => trackEvent("agency_offer_cta_click", { location })}>
                {t("cta")}<ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-lg">
              <Link href="/sample-report">{t("sampleCta")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
