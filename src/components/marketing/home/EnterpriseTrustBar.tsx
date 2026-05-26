"use client";

import { useTranslations } from "next-intl";
import { Database, FileCheck2, Lock, ShieldCheck, Code2, CreditCard, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  icon: LucideIcon;
  name: string;
  detail: string;
};

export function EnterpriseTrustBar() {
  const t = useTranslations("home.enterprise.trustBar");

  const items: Item[] = [
    { icon: Code2, name: "axe-core", detail: t("items.wcag") },
    { icon: CreditCard, name: "Mollie", detail: t("items.pci") },
    { icon: BadgeCheck, name: "WCAG / EAA", detail: t("items.eaa") },
    { icon: Database, name: "AWS EU", detail: t("items.eu") },
    { icon: FileCheck2, name: "PDF / DOCX", detail: t("items.audit") },
  ];

  return (
    <section
      className="relative border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-6 py-14">
        <p
          id="enterprise-trustbar-heading"
          className="text-center font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-ink-500)]"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-8 grid grid-cols-1 overflow-hidden rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-[0_18px_48px_-36px_rgba(15,20,18,0.45)] dark:shadow-[0_18px_48px_-26px_rgba(0,0,0,0.7)] sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, name, detail }) => (
            <li
              key={name}
              className="border-b border-[var(--color-border-subtle)] p-5 last:border-b-0 sm:[&:nth-child(2n)]:border-l sm:[&:nth-child(2n)]:border-l-[var(--color-border-subtle)] lg:border-b-0 lg:border-l lg:border-l-[var(--color-border-subtle)] lg:first:border-l-0"
            >
              <div className="flex items-center gap-2.5 text-[var(--color-ink-900)]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-hero-border)] bg-[var(--color-hero-note-bg)] text-[var(--color-hero-note-fg)]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-none">{name}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[var(--color-ink-500)]">{detail}</p>
            </li>
          ))}
        </ul>

        <div
          className="mt-8 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[var(--color-ink-500)] sm:flex-row"
          role="note"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-primary-dark)]" aria-hidden />
            {t("security")}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-[var(--color-border-default)] sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[var(--color-brand-primary-dark)]" aria-hidden />
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </section>
  );
}
