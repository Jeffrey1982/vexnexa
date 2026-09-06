"use client";

import Link from "@/components/marketing/MarketingLink";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";
import {
  FOUNDING_DISCOUNT_PERCENT,
  FOUNDING_FREE_MONTHS,
  FOUNDING_MAX_SPOTS,
  PLAN_PRICES,
  getFoundingAgencyPrice,
} from "@/lib/billing/pricing-config";
import { ENTITLEMENTS } from "@/lib/billing/plans";

/**
 * FoundingProgramBanner — the hero offer while VexNexa is recruiting its
 * founding agencies. Sits directly below the hero so it is the first
 * thing a visitor sees after the scan form.
 */
export function FoundingProgramBanner() {
  const t = useTranslations("home.foundingProgram");
  const locale = useLocale();
  const fmt = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const offerParams = {
    spots: FOUNDING_MAX_SPOTS,
    freeMonths: FOUNDING_FREE_MONTHS,
    discountPercent: FOUNDING_DISCOUNT_PERCENT,
    sites: ENTITLEMENTS.BUSINESS.sites,
    agencyPrice: fmt.format(PLAN_PRICES.BUSINESS.monthly),
    foundingPrice: fmt.format(getFoundingAgencyPrice("monthly")),
  };

  return (
    <section
      aria-labelledby="founding-program-heading"
      className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]"
    >
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-hero-border)] bg-[var(--color-hero-accent-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-hero-accent-fg)]">
              <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
              {t("badge")}
            </p>
            <h2
              id="founding-program-heading"
              className="mt-3 font-sans text-2xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-3xl"
            >
              {t("title", offerParams)}
            </h2>
            <p className="mt-2 text-base leading-7 text-[var(--color-ink-500)]">
              {t("subtitle", offerParams)}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button size="lg" asChild className="rounded-lg">
              <Link
                href="/partner-apply"
                onClick={() => trackEvent("founding_banner_click", { location: "home_banner_primary" })}
              >
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-lg">
              <Link
                href="/founding-agencies"
                onClick={() => trackEvent("founding_banner_click", { location: "home_banner_secondary" })}
              >
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
