"use client";

import { useTranslations } from "next-intl";
import { Eye, History, Building2, ArrowRight } from "lucide-react";
import Link from "next/link";

/**
 * EnterpriseFeatures — three pillars in mitigation framing.
 *
 *   A. AI-Vision Context Analysis  — analyse logic, not just tags
 *   B. Historical Compliance Tracking — internal-audit trail
 *   C. Enterprise Portfolio View — manage hundreds of domains
 *
 * No "100% legal guarantee" copy; we use "Significant Risk Mitigation" and
 * "Audit-Ready Reporting" throughout.
 *
 * Theme: assumes a Deep Navy parent. Cards use a subtle elevated surface
 * with Gold accents on the icon + heading hairline.
 */
export function EnterpriseFeatures() {
  const t = useTranslations("home.enterprise.features");

  const items = [
    {
      key: "aiVision" as const,
      Icon: Eye,
      titleKey: "aiVision.title",
      bodyKey: "aiVision.body",
      bullets: ["aiVision.b1", "aiVision.b2", "aiVision.b3"] as const,
    },
    {
      key: "history" as const,
      Icon: History,
      titleKey: "history.title",
      bodyKey: "history.body",
      bullets: ["history.b1", "history.b2", "history.b3"] as const,
    },
    {
      key: "portfolio" as const,
      Icon: Building2,
      titleKey: "portfolio.title",
      bodyKey: "portfolio.body",
      bullets: ["portfolio.b1", "portfolio.b2", "portfolio.b3"] as const,
    },
  ];

  return (
    <section
      className="relative bg-white dark:bg-[#0A0F1E] py-20 sm:py-24"
      aria-labelledby="enterprise-features-heading"
    >
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          {/* Section header — heading on the left, supporting CTA on the right
              to balance the row instead of leaving empty space. */}
          <div className="grid items-end gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
                {t("eyebrow")}
              </p>
              <h2
                id="enterprise-features-heading"
                className="mt-3 font-display text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl"
              >
                {t("title")}
              </h2>
              <p className="mt-4 text-lg text-slate-600 dark:text-white/70">{t("subtitle")}</p>
            </div>
            <div className="flex lg:justify-end">
              <Link
                href="/features"
                className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10 dark:bg-primary/10 dark:hover:bg-primary/15"
              >
                {t("viewAll")} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {items.map(({ key, Icon, titleKey, bodyKey, bullets }) => (
            <article
              key={key}
              className="group relative flex flex-col rounded-2xl border border-slate-200 dark:border-white/10 bg-gradient-to-b from-slate-50 to-white dark:from-white/[0.04] dark:to-white/[0.01] p-7 transition-colors hover:border-primary/30"
            >
              {/* Top hairline in gold */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
              />

              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold text-slate-900 dark:text-white">
                {t(titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-white/70">{t(bodyKey)}</p>

              <ul className="mt-5 flex-1 space-y-2.5 text-sm text-slate-600 dark:text-white/65">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
                    <span>{t(b)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
        </div>
      </div>
    </section>
  );
}
