"use client";

import { useTranslations } from "next-intl";
import { Database, FileCheck2, Lock, ShieldCheck } from "lucide-react";

function BrandBadge({
  mark,
  name,
  detail,
  tone = "teal",
}: {
  mark: string;
  name: string;
  detail: string;
  tone?: "teal" | "blue" | "slate";
}) {
  const toneClass = {
    teal: "border-primary/25 bg-primary/[0.06] text-primary",
    blue: "border-sky-300/45 bg-sky-50 text-sky-700 dark:border-sky-300/20 dark:bg-sky-400/10 dark:text-sky-200",
    slate: "border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75",
  }[tone];

  return (
    <li className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-sm font-black tracking-tight ${toneClass}`}
          aria-hidden
        >
          {mark}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{name}</p>
          <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-white/55">{detail}</p>
        </div>
      </div>
    </li>
  );
}

export function EnterpriseTrustBar() {
  const t = useTranslations("home.enterprise.trustBar");

  return (
    <section
      className="relative border-y border-slate-200 bg-slate-50/70 py-10 dark:border-white/[0.06] dark:bg-[#0A0F1E]/95"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-4">
        <p
          id="enterprise-trustbar-heading"
          className="text-center text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-white/45"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <BrandBadge mark="a" name="axe-core" detail={t("items.wcag")} tone="teal" />
          <BrandBadge mark="M" name="Mollie" detail={t("items.pci")} tone="blue" />
          <BrandBadge mark="AA" name="WCAG / EAA" detail={t("items.eaa")} tone="slate" />
          <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75">
                <Database className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">AWS EU</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-white/55">{t("items.eu")}</p>
              </div>
            </div>
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.035]">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/[0.06] text-primary">
                <FileCheck2 className="h-4 w-4" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">PDF / DOCX</p>
                <p className="mt-0.5 text-xs leading-5 text-slate-500 dark:text-white/55">{t("items.audit")}</p>
              </div>
            </div>
          </li>
        </ul>

        <div className="mx-auto mt-5 flex max-w-4xl flex-col items-center justify-center gap-3 text-center text-[11px] leading-relaxed text-slate-600 dark:text-white/60 sm:flex-row">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("security")}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" aria-hidden />
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </section>
  );
}
