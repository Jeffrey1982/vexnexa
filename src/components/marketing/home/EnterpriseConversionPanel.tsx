"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownToLine, ArrowRight, Calculator, Check, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

const MANUAL_MIN_PER_PAGE = 30;
const VEXNEXA_MIN_PER_PAGE = 6;

export function EnterpriseConversionPanel() {
  const locale = useLocale();
  const calculator = useTranslations("home.enterprise.calculator");
  const pricing = useTranslations("home.enterprise.pricingTeaser");
  const [pages, setPages] = useState<number>(1000);
  const [rate, setRate] = useState<number>(85);
  const [vatInclusive, setVatInclusive] = useState<boolean>(true);

  const result = useMemo(() => {
    const safePages = Math.max(0, Math.min(100000, Number.isFinite(pages) ? pages : 0));
    const safeRate = Math.max(0, Math.min(500, Number.isFinite(rate) ? rate : 0));
    const manualHours = (safePages * MANUAL_MIN_PER_PAGE) / 60;
    const vnHours = (safePages * VEXNEXA_MIN_PER_PAGE) / 60;
    const hoursSaved = manualHours - vnHours;
    const pctSaved = manualHours > 0 ? Math.round((hoursSaved / manualHours) * 100) : 0;
    const costSaved = hoursSaved * safeRate;
    return { manualHours, vnHours, hoursSaved, pctSaved, costSaved };
  }, [pages, rate]);

  const fmtHours = useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }), [locale]);
  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const PRO_INC_VAT = 99;
  const PRO_EX_VAT = Math.round((PRO_INC_VAT / 1.21) * 100) / 100;
  const displayPrice = vatInclusive ? PRO_INC_VAT : PRO_EX_VAT;
  const fmtPrice = new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });

  return (
    <section className="relative bg-white py-14 dark:bg-[#0A0F1E] sm:py-18" aria-labelledby="enterprise-conversion-heading">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              {calculator("eyebrow")} · {pricing("eyebrow")}
            </p>
            <h2 id="enterprise-conversion-heading" className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Minder auditwerk, duidelijkere prijzen.
            </h2>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-stretch">
            <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-xl dark:border-white/10 dark:from-white/[0.04] dark:to-white/[0.01] sm:p-7">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                <Calculator className="h-3.5 w-3.5" aria-hidden />
                {calculator("eyebrow")}
              </span>
              <h3 className="mt-4 font-display text-2xl font-bold leading-tight text-slate-900 dark:text-white sm:text-3xl">
                {calculator("title")}
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/70">{calculator("subtitle")}</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700 dark:text-white/80">{calculator("pagesLabel")}</span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value, 10) || 0)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-base font-semibold text-slate-900 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30 dark:border-white/15 dark:bg-white/[0.04] dark:text-white"
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-white/50">{calculator("pagesHint")}</span>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700 dark:text-white/80">{calculator("rateLabel")}</span>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/30 dark:border-white/15 dark:bg-white/[0.04]">
                    <span className="text-base font-semibold text-slate-500 dark:text-white/60">€</span>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      inputMode="numeric"
                      value={rate}
                      onChange={(e) => setRate(parseInt(e.target.value, 10) || 0)}
                      className="block w-full bg-transparent text-base font-semibold text-slate-900 outline-none dark:text-white"
                    />
                  </div>
                  <span className="mt-1 block text-xs text-slate-500 dark:text-white/50">{calculator("rateHint")}</span>
                </label>
              </div>

              <div className="mt-6 rounded-xl border border-primary/25 bg-primary/[0.05] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{calculator("resultEyebrow")}</p>
                    <div className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-bold text-primary tabular-nums">{result.pctSaved}%</span>
                      <span className="max-w-44 text-xs font-medium leading-5 text-slate-600 dark:text-white/70">{calculator("timeSaved")}</span>
                    </div>
                  </div>
                  <div className="grid gap-2 text-sm sm:min-w-64">
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 dark:bg-white/[0.04]">
                      <span className="flex items-center gap-2 text-slate-600 dark:text-white/65">
                        <Clock className="h-4 w-4" aria-hidden /> {calculator("manualLabel")}
                      </span>
                      <span className="font-mono tabular-nums">{fmtHours.format(Math.round(result.manualHours))} {calculator("hoursShort")}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 dark:bg-white/[0.04]">
                      <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                        <ArrowDownToLine className="h-4 w-4 text-primary" aria-hidden /> {calculator("savedLabel")}
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-primary">{fmtHours.format(Math.round(result.hoursSaved))} {calculator("hoursShort")} · {fmtMoney.format(Math.round(result.costSaved))}</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 text-center shadow-xl dark:border-white/10 dark:from-white/[0.04] dark:to-white/[0.01] sm:p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">{pricing("eyebrow")}</p>
              <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{pricing("title")}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-white/70">{pricing("subtitle")}</p>

              <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-white/15 dark:bg-white/[0.04]" role="tablist" aria-label={pricing("vatToggleLabel")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={vatInclusive}
                  onClick={() => setVatInclusive(true)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${vatInclusive ? "bg-primary text-primary-foreground" : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"}`}
                >
                  {pricing("vatIncl")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={!vatInclusive}
                  onClick={() => setVatInclusive(false)}
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${!vatInclusive ? "bg-primary text-primary-foreground" : "text-slate-600 hover:text-slate-900 dark:text-white/70 dark:hover:text-white"}`}
                >
                  {pricing("vatExcl")}
                </button>
              </div>

              <div className="mt-5 flex items-baseline justify-center gap-2">
                <span className="font-display text-5xl font-bold text-slate-900 tabular-nums dark:text-white">{fmtPrice.format(displayPrice)}</span>
                <span className="text-sm text-slate-500 dark:text-white/60">{pricing("perMonth")}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500 dark:text-white/50">{vatInclusive ? pricing("vatNoticeIncl") : pricing("vatNoticeExcl")}</p>

              <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm text-slate-700 dark:text-white/75 sm:grid-cols-2">
                {["audit", "portfolio", "aiVision", "history"].map((key) => (
                  <li key={key} className="flex items-start gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    <span>{pricing(`included.${key}`)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="h-12 rounded-xl bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90">
                  <Link href="/pricing" onClick={() => trackEvent("pricing_cta_click", { location: "home_teaser_primary" })}>
                    {pricing("ctaPrimary")} <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="h-12 rounded-xl border-slate-200 bg-white px-6 font-semibold text-slate-900 hover:bg-slate-50 dark:border-white/20 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]">
                  <Link href="/contact?intent=walkthrough" onClick={() => trackEvent("contact_cta_click", { location: "home_teaser_sales" })}>
                    {pricing("ctaSecondary")}
                  </Link>
                </Button>
              </div>

              <div className="mt-6 rounded-xl border border-primary/25 bg-primary/[0.05] px-4 py-3 text-left">
                <p className="flex items-start gap-2 text-xs leading-6 text-slate-700 dark:text-white/80">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                  <span>{pricing("allocation")}</span>
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
