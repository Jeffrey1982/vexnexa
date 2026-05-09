import { getTranslations } from "next-intl/server";
import { Database, FileCheck2, Lock, ShieldCheck, Code2, CreditCard, BadgeCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Item = {
  icon: LucideIcon;
  name: string;
  detail: string;
};

export async function EnterpriseTrustBar() {
  const t = await getTranslations("home.enterprise.trustBar");

  const items: Item[] = [
    { icon: Code2, name: "axe-core", detail: t("items.wcag") },
    { icon: CreditCard, name: "Mollie", detail: t("items.pci") },
    { icon: BadgeCheck, name: "WCAG / EAA", detail: t("items.eaa") },
    { icon: Database, name: "AWS EU", detail: t("items.eu") },
    { icon: FileCheck2, name: "PDF / DOCX", detail: t("items.audit") },
  ];

  return (
    <section
      className="relative border-y border-border bg-muted/40"
      aria-labelledby="enterprise-trustbar-heading"
    >
      <div className="container mx-auto px-6 py-12">
        <p
          id="enterprise-trustbar-heading"
          className="text-center font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground"
        >
          {t("eyebrow")}
        </p>

        <ul className="mt-8 grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {items.map(({ icon: Icon, name, detail }) => (
            <li key={name} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2.5 text-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="text-sm font-semibold leading-none">{name}</span>
              </div>
              <p className="text-[13px] leading-relaxed text-muted-foreground">{detail}</p>
            </li>
          ))}
        </ul>

        <div
          className="mt-10 flex flex-col items-center justify-center gap-x-6 gap-y-2 border-t border-border/60 pt-6 text-[13px] text-muted-foreground sm:flex-row"
          role="note"
        >
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("security")}
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-border sm:block" aria-hidden />
          <span className="inline-flex items-center gap-2">
            <Lock className="h-3.5 w-3.5 text-primary" aria-hidden />
            {t("disclaimer")}
          </span>
        </div>
      </div>
    </section>
  );
}
