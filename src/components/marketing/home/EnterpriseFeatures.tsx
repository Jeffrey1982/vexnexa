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
      className="relative bg-[#0A0F1E] py-20 sm:py-24"
      aria-labelledby="enterprise-features-heading"
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#3b82f6]">
            {t("eyebrow")}
          </p>
          <h2
            id="enterprise-features-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-white/70">{t("subtitle")}</p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {items.map(({ key, Icon, titleKey, bodyKey, bullets }) => (
            <article
              key={key}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-7 transition-colors hover:border-[#3b82f6]/30"
            >
              {/* Top hairline in gold */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3b82f6]/40 to-transparent"
              />

              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]">
                <Icon className="h-5 w-5" aria-hidden />
              </div>

              <h3 className="mt-5 font-display text-xl font-semibold text-white">
                {t(titleKey)}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/70">{t(bodyKey)}</p>

              <ul className="mt-5 space-y-2.5 text-sm text-white/65">
                {bullets.map((b) => (
                  <li key={b} className="flex gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-[#3b82f6]" aria-hidden />
                    <span>{t(b)}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="mt-10 flex justify-start">
          <Link
            href="/features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#3b82f6] hover:text-[#60a5fa]"
          >
            {t("viewAll")} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
