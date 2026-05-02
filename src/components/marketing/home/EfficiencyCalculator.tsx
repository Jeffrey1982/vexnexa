"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Calculator, Clock, ArrowDownToLine, Sparkles } from "lucide-react";

/**
 * EfficiencyCalculator — subtle interactive proof-point.
 *
 * Premise (industry baseline; intentionally rounded down for credibility):
 *   • Manual WCAG audit: ~30 minutes per page (industry norm 25–45 min)
 *   • VexNexa AI-Vision automated: ~6 minutes per page (incl. human review)
 *   → ~80% time saved per page
 *
 * The user enters a pages/month volume and an optional internal hourly rate;
 * we render hours saved and an indicative cost reduction.
 *
 * Disclaimer: We do NOT promise a fixed % saving. The headline copy says
 * "up to ~80%", and the calculator footnote acknowledges variance by site
 * complexity. This keeps the page enterprise-credible without overpromising.
 */

const MANUAL_MIN_PER_PAGE = 30;
const VEXNEXA_MIN_PER_PAGE = 6; // incl. human review of AI-Vision findings

export function EfficiencyCalculator() {
  const locale = useLocale();
  const t = useTranslations("home.enterprise.calculator");
  const [pages, setPages] = useState<number>(1000);
  const [rate, setRate] = useState<number>(85);

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

  const fmtHours = useMemo(
    () => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    [locale],
  );
  const fmtMoney = useMemo(
    () =>
      new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  return (
    <section
      className="relative bg-white dark:bg-[#0A0F1E] py-20 sm:py-24"
      aria-labelledby="efficiency-calculator-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] p-8 shadow-2xl sm:p-10">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            {/* Copy + inputs */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                <Calculator className="h-3.5 w-3.5" aria-hidden />
                {t("eyebrow")}
              </span>

              <h2
                id="efficiency-calculator-heading"
                className="mt-4 font-display text-3xl font-bold leading-tight text-slate-900 dark:text-white sm:text-4xl"
              >
                {t("title")}
              </h2>
              <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-white/70">
                {t("subtitle")}
              </p>

              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700 dark:text-white/80">{t("pagesLabel")}</span>
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    inputMode="numeric"
                    value={pages}
                    onChange={(e) => setPages(parseInt(e.target.value, 10) || 0)}
                    className="mt-2 block w-full rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] px-3 py-2.5 text-base font-semibold text-slate-900 dark:text-white outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                    aria-describedby="pages-hint"
                  />
                  <span id="pages-hint" className="mt-1 block text-xs text-slate-500 dark:text-white/50">
                    {t("pagesHint")}
                  </span>
                </label>

                <label className="block text-sm">
                  <span className="font-medium text-slate-700 dark:text-white/80">{t("rateLabel")}</span>
                  <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-white/[0.04] px-3 py-2.5 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/30">
                    <span className="text-base font-semibold text-slate-500 dark:text-white/60">€</span>
                    <input
                      type="number"
                      min={0}
                      max={500}
                      inputMode="numeric"
                      value={rate}
                      onChange={(e) => setRate(parseInt(e.target.value, 10) || 0)}
                      className="block w-full bg-transparent text-base font-semibold text-slate-900 dark:text-white outline-none"
                      aria-describedby="rate-hint"
                    />
                  </div>
                  <span id="rate-hint" className="mt-1 block text-xs text-slate-500 dark:text-white/50">
                    {t("rateHint")}
                  </span>
                </label>
              </div>
            </div>

            {/* Output card */}
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/[0.06] to-transparent p-6">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                {t("resultEyebrow")}
              </p>

              <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold text-primary tabular-nums">
                  {result.pctSaved}%
                </span>
                <span className="text-sm font-medium text-slate-600 dark:text-white/70">{t("timeSaved")}</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm text-slate-700 dark:text-white/80">
                <li className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] px-3 py-2">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-white/65">
                    <Clock className="h-4 w-4 text-slate-500 dark:text-white/50" aria-hidden /> {t("manualLabel")}
                  </span>
                  <span className="font-mono tabular-nums">
                    {fmtHours.format(Math.round(result.manualHours))} {t("hoursShort")}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 dark:bg-white/[0.03] px-3 py-2">
                  <span className="flex items-center gap-2 text-slate-600 dark:text-white/65">
                    <Sparkles className="h-4 w-4 text-primary" aria-hidden /> {t("vnLabel")}
                  </span>
                  <span className="font-mono tabular-nums">
                    {fmtHours.format(Math.round(result.vnHours))} {t("hoursShort")}
                  </span>
                </li>
                <li className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/[0.07] px-3 py-2.5">
                  <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
                    <ArrowDownToLine className="h-4 w-4 text-primary" aria-hidden /> {t("savedLabel")}
                  </span>
                  <span className="font-mono font-semibold tabular-nums text-primary">
                    {fmtHours.format(Math.round(result.hoursSaved))} {t("hoursShort")} · {fmtMoney.format(Math.round(result.costSaved))}
                  </span>
                </li>
              </ul>

              <p className="mt-5 text-[11px] leading-relaxed text-slate-500 dark:text-white/45">
                {t("disclaimer")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
