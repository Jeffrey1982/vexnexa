"use client";

import Link from "next/link";
import { ArrowRight, ShieldAlert, FileCheck2, Eye } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

/**
 * EnterpriseHero — premium "Nasdaq-style" hero scoped to the landing.
 *
 * Positioning: Enterprise-grade AI-Vision accessibility for the EAA & ADA era.
 *
 * Avoids: "100% legal guarantee", "lawsuit counter".
 * Uses:   "Significant Risk Mitigation", "Audit-Ready Reporting".
 *
 * Visual hook: VexNexa Index (VNI) — a 1-to-5 star compliance rank.
 * The 1-star "Insolvent" state is rendered as a "High-Priority Action Required"
 * call-out (not a fear/lawsuit framing).
 *
 * Theme: this component assumes it lives inside a `vn-enterprise-theme`
 * wrapper that supplies Deep Navy background and Gold accent CSS vars
 * (see app/(marketing)/page.tsx).
 */
export function EnterpriseHero() {
  const t = useTranslations("home.enterprise.hero");

  return (
    <section
      className="relative overflow-hidden bg-white dark:bg-[#0A0F1E] text-slate-900 dark:text-white"
      aria-labelledby="enterprise-hero-heading"
    >
      {/* Ambient gold glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[120px]" />
        <div className="absolute -bottom-32 right-0 h-[28rem] w-[28rem] rounded-full bg-[#1E3A8A]/40 blur-[100px]" />
      </div>

      <div className="relative container mx-auto grid gap-12 px-4 py-20 sm:py-28 lg:grid-cols-[1.1fr_1fr] lg:items-center">
        {/* Copy column */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#D4AF37]">
            <FileCheck2 className="h-3.5 w-3.5" aria-hidden />
            {t("eyebrow")}
          </span>

          <h1
            id="enterprise-hero-heading"
            className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl"
          >
            {t("title")}
          </h1>

          <p className="mt-5 max-w-xl text-lg leading-relaxed text-slate-700 dark:text-white/75 sm:text-xl">
            {t("subtitle")}
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 max-w-lg">
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("pillar1Title")}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-white/60">{t("pillar1Body")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] p-4">
              <FileCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#D4AF37]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{t("pillar2Title")}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-white/60">{t("pillar2Body")}</p>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="h-12 rounded-xl bg-[#D4AF37] px-7 font-semibold text-[#0A0F1E] hover:bg-[#B8941F] dark:hover:bg-[#E5C158] focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1E]"
            >
              <Link
                href="/contact?intent=enterprise"
                onClick={() =>
                  trackEvent("hero_cta_click", { location: "enterprise_hero_primary" })
                }
              >
                {t("ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-12 rounded-xl border-slate-200 dark:border-white/20 bg-slate-50 dark:bg-white/[0.04] px-7 font-semibold text-slate-900 dark:text-white hover:bg-white/[0.08] focus-visible:ring-2 focus-visible:ring-white/40"
            >
              <Link
                href="/sample-report"
                onClick={() =>
                  trackEvent("hero_cta_click", { location: "enterprise_hero_sample" })
                }
              >
                <Eye className="mr-2 h-5 w-5" aria-hidden />
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-slate-500 dark:text-white/50">{t("noCard")}</p>
        </div>

        {/* VNI Rank visual */}
        <VNIRankVisual />
      </div>
    </section>
  );
}

/**
 * VNI Rank Visual — the "VexNexa Index" hook.
 *
 * Five-star scale: Insolvent (1) → Foundational (2) → Compliant (3) →
 * Audit-Ready (4) → Industry-Leading (5).
 *
 * The 1-star "Insolvent" state is rendered as a discovered-portfolio card
 * with a "High-Priority Action Required" badge, not a lawsuit threat.
 */
function VNIRankVisual() {
  const t = useTranslations("home.enterprise.vni");
  const ranks = [
    { stars: 1, key: "insolvent" as const, accent: "#FCA5A5", label: t("ranks.insolvent") },
    { stars: 2, key: "foundational" as const, accent: "#FDBA74", label: t("ranks.foundational") },
    { stars: 3, key: "compliant" as const, accent: "#FDE68A", label: t("ranks.compliant") },
    { stars: 4, key: "auditReady" as const, accent: "#86EFAC", label: t("ranks.auditReady") },
    { stars: 5, key: "leading" as const, accent: "#D4AF37", label: t("ranks.leading") },
  ];

  return (
    <div className="relative">
      {/* Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.05] dark:to-white/[0.02] p-6 shadow-sm dark:shadow-2xl backdrop-blur-sm sm:p-7">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4AF37]">
            {t("title")}
          </p>
          <span className="rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/40 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-white/60">
            {t("liveLabel")}
          </span>
        </div>

        <h3 className="mt-3 font-display text-xl font-semibold text-slate-900 dark:text-white">
          {t("subtitle")}
        </h3>

        {/* Highlighted example — matches dashboard scan result style */}
        <div className="mt-5 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/[0.12] dark:bg-[#D4AF37]/[0.07] p-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D4AF37]/20 text-[#B8860B] dark:text-[#D4AF37]">
              <FileCheck2 className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm text-slate-900 dark:text-white truncate">example-enterprise.com</p>
                <span className="rounded-md bg-[#D4AF37]/25 dark:bg-[#D4AF37]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-900 dark:text-[#D4AF37]">
                  {t("ranks.compliant")}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2">
                <Stars filled={3} />
                <span className="text-xs text-slate-700 dark:text-white/70">{t("ranks.compliant")} — 3 / 5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Other ranks */}
        <ul className="mt-4 space-y-1.5">
          {ranks.filter((r) => r.stars !== 3).map((r) => (
            <li
              key={r.key}
              className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02] px-3 py-2"
            >
              <div className="flex items-center gap-2.5">
                <Stars filled={r.stars} />
                <span className="text-xs font-medium text-slate-700 dark:text-white/70">{r.label}</span>
              </div>
              <span
                className="text-[10px] font-medium uppercase tracking-wider"
                style={{ color: r.accent }}
              >
                {r.stars === 5 ? t("targetLabel") : ""}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs leading-relaxed text-slate-500 dark:text-white/50">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
}

function Stars({ filled }: { filled: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${filled} of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-3.5 w-3.5 ${i <= filled ? "fill-[#D4AF37]" : "fill-white/10"}`}
          aria-hidden
        >
          <path d="M12 2l2.6 6.7H22l-5.7 4.4L18.5 22 12 17.6 5.5 22l2.2-8.9L2 8.7h7.4z" />
        </svg>
      ))}
    </span>
  );
}
