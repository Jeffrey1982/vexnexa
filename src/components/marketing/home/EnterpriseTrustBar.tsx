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
      className="relative border-y border-[#D9DED6] bg-[#F8F7F2]"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-6 py-14">
        <p
          id="enterprise-trustbar-heading"
          className="text-center font-mono text-xs uppercase tracking-[0.2em] text-[#657068]"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-8 grid grid-cols-1 overflow-hidden rounded-xl border border-[#CBD3C9] bg-[#FDFCF8] shadow-[0_18px_48px_-36px_rgba(15,20,18,0.45)] sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, name, detail }) => (
            <li
              key={name}
              className="border-b border-[#E2E4DD] p-5 last:border-b-0 sm:[&:nth-child(2n)]:border-l sm:[&:nth-child(2n)]:border-l-[#E2E4DD] lg:border-b-0 lg:border-l lg:border-l-[#E2E4DD] lg:first:border-l-0"
            >
              <div className="flex items-center gap-2.5 text-[#0D1210]">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#D8C890] bg-[#FFF7D7] text-[#8A5A06]">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                </span>
                <span className="text-sm font-semibold leading-none">{name}</span>
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-[#657068]">{detail}</p>
            </li>
          ))}
        </ul>

        <div
          className="mt-8 flex flex-col items-center justify-center gap-x-6 gap-y-2 text-[13px] text-[#657068] sm:flex-row"
          role="note"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-[#1F4A2D]" aria-hidden />
            {t("security")}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-[#CBD3C9] sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-[#1F4A2D]" aria-hidden />
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </section>
  );
}
