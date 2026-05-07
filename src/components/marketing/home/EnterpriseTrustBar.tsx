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
    slate: "border-border bg-white text-muted-foreground dark:border-white/10 dark:bg-white/[0.04] dark:text-white/75",
  }[tone];

  return (
    <li className="min-w-0 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border text-lg font-black tracking-tight ${toneClass}`}
          aria-hidden
        >
          {mark}
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-bold text-foreground">{name}</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{detail}</p>
        </div>
      </div>
    </li>
  );
}

export function EnterpriseTrustBar() {
  const t = useTranslations("home.enterprise.trustBar");

  return (
    <section
      className="relative border-y border-border bg-muted py-14"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-4">
        <p
          id="enterprise-trustbar-heading"
          className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <BrandBadge mark="a" name="axe-core" detail={t("items.wcag")} tone="teal" />
          <BrandBadge mark="M" name="Mollie" detail={t("items.pci")} tone="blue" />
          <BrandBadge mark="AA" name="WCAG / EAA" detail={t("items.eaa")} tone="slate" />
          <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
                <Database className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-foreground">AWS EU</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("items.eu")}</p>
              </div>
            </div>
          </li>
          <li className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                <FileCheck2 className="h-6 w-6" aria-hidden />
              </span>
              <div>
                <p className="text-base font-bold text-foreground">PDF / DOCX</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{t("items.audit")}</p>
              </div>
            </div>
          </li>
        </ul>

        <div className="mx-auto mt-8 flex max-w-4xl flex-col items-center justify-center gap-3 text-center text-sm leading-relaxed text-muted-foreground sm:flex-row">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
            {t("security")}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" aria-hidden />
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </section>
  );
}
