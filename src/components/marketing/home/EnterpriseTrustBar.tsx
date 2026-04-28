"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, Globe2, Lock, Database, FileCheck2 } from "lucide-react";

/**
 * EnterpriseTrustBar — replaces the academic-partner strip on the landing.
 *
 * No claims that aren't already true on day-one of launch:
 *   • WCAG 2.2 AA scan engine — verifiable in the public sample report
 *   • EAA & ADA-aligned reporting — describes report structure, not a legal guarantee
 *   • PCI-DSS via Mollie B.V. — Mollie is independently certified; we never store cards
 *   • Hosted in the EU (AWS Frankfurt) — matches our DPA / privacy policy
 *   • Audit-ready exports (PDF / DOCX) — matches the existing report skill
 *
 * Theme: dark mode, scoped to landing.
 */
export function EnterpriseTrustBar() {
  const t = useTranslations("home.enterprise.trustBar");

  const items = [
    { Icon: FileCheck2, key: "wcag" as const },
    { Icon: ShieldCheck, key: "eaa" as const },
    { Icon: Lock, key: "pci" as const },
    { Icon: Database, key: "eu" as const },
    { Icon: Globe2, key: "audit" as const },
  ];

  return (
    <section
      className="relative border-y border-slate-200 dark:border-white/[0.06] bg-white dark:bg-[#0A0F1E]/95 py-10"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-4">
        <p
          id="enterprise-trustbar-heading"
          className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          {items.map(({ Icon, key }) => (
            <li
              key={key}
              className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-white/65"
            >
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="text-center">{t(`items.${key}`)}</span>
            </li>
          ))}
        </ul>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-slate-400 dark:text-white/40">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
