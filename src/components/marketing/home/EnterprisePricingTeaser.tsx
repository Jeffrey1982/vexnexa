"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

/**
 * EnterprisePricingTeaser — replaces the legacy PricingTeaserSection on the
 * landing page (the standalone /pricing page is unchanged).
 *
 * Adds three things on top of the legacy teaser:
 *   1. An "Incl. / Excl. 21% BTW" toggle so finance and procurement
 *      stakeholders see numbers in the form they expect.
 *   2. A transparent "where your money goes" line: 20% of every subscription
 *      is allocated to continuous AI-model training and real-time
 *      legislation research. Trust signal for enterprise buyers.
 *   3. A short bullet list of what's included (audit-ready reports,
 *      portfolio view, AI-Vision context analysis).
 *
 * Theme: dark mode, scoped to landing.
 */
export function EnterprisePricingTeaser() {
  const t = useTranslations("home.enterprise.pricingTeaser");
  const [vatInclusive, setVatInclusive] = useState<boolean>(true);

  // Sample anchor price (matches /pricing page Pro plan); the ratio
  // 1.21 reflects the 21% Dutch VAT rate.
  const PRO_INC_VAT = 99; // EUR/month, incl. 21% BTW (display anchor)
  const PRO_EX_VAT = Math.round((PRO_INC_VAT / 1.21) * 100) / 100;

  const displayPrice = vatInclusive ? PRO_INC_VAT : PRO_EX_VAT;
  const fmt = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return (
    <section
      className="relative bg-white dark:bg-[#0A0F1E] py-20 sm:py-24"
      aria-labelledby="enterprise-pricing-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] p-8 text-center shadow-2xl sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            {t("eyebrow")}
          </p>
          <h2
            id="enterprise-pricing-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-white/70 sm:text-lg">{t("subtitle")}</p>

          {/* VAT toggle */}
          <div
            className="mt-7 inline-flex items-center gap-1 rounded-full border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] p-1"
            role="tablist"
            aria-label={t("vatToggleLabel")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={vatInclusive}
              onClick={() => {
                setVatInclusive(true);
                trackEvent("pricing_vat_toggle", { mode: "incl" });
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                vatInclusive
                  ? "bg-[#D4AF37] text-[#0A0F1E]"
                  : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:text-white"
              }`}
            >
              {t("vatIncl")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!vatInclusive}
              onClick={() => {
                setVatInclusive(false);
                trackEvent("pricing_vat_toggle", { mode: "excl" });
              }}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                !vatInclusive
                  ? "bg-[#D4AF37] text-[#0A0F1E]"
                  : "text-slate-600 dark:text-white/70 hover:text-slate-900 dark:text-white"
              }`}
            >
              {t("vatExcl")}
            </button>
          </div>

          {/* Anchor price */}
          <div className="mt-6 flex items-baseline justify-center gap-2">
            <span className="font-display text-5xl font-bold text-slate-900 dark:text-white tabular-nums">
              {fmt.format(displayPrice)}
            </span>
            <span className="text-sm text-slate-500 dark:text-white/60">{t("perMonth")}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-white/50">
            {vatInclusive ? t("vatNoticeIncl") : t("vatNoticeExcl")}
          </p>

          {/* What's included */}
          <ul className="mx-auto mt-7 grid max-w-md gap-2 text-left text-sm text-slate-700 dark:text-white/75 sm:grid-cols-2">
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              <span>{t("included.audit")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              <span>{t("included.portfolio")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              <span>{t("included.aiVision")}</span>
            </li>
            <li className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              <span>{t("included.history")}</span>
            </li>
          </ul>

          {/* CTAs */}
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-xl bg-[#D4AF37] px-7 font-semibold text-[#0A0F1E] hover:bg-[#E5C158] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E]"
            >
              <Link
                href="/pricing"
                onClick={() =>
                  trackEvent("pricing_cta_click", { location: "home_teaser_primary" })
                }
              >
                {t("ctaPrimary")} <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-xl border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04] px-7 font-semibold text-slate-900 dark:text-white hover:bg-white/[0.08]"
            >
              <Link
                href="/contact?intent=enterprise"
                onClick={() =>
                  trackEvent("contact_cta_click", { location: "home_teaser_sales" })
                }
              >
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>

          {/* 20% allocation transparency line */}
          <div className="mt-8 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/[0.05] px-5 py-4 text-left">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-slate-700 dark:text-white/80">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#D4AF37]" aria-hidden />
              <span>{t("allocation")}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
