"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin } from "lucide-react";

/**
 * DutchMarketSection — surfaces the Dutch-language landing pages from the
 * homepage instead of burying them in the footer. The section title reads
 * "Voor Nederlandse bedrijven" (localised) and links the three NL pages.
 */
export function DutchMarketSection() {
  const t = useTranslations("home.dutchMarket");

  const links = [
    {
      href: "/digitale-toegankelijkheid-audit",
      title: t("audit.title"),
      description: t("audit.description"),
    },
    {
      href: "/website-toegankelijkheid-testen",
      title: t("testen.title"),
      description: t("testen.description"),
    },
    {
      href: "/toegankelijkheid-webshop-eaa",
      title: t("webshop.title"),
      description: t("webshop.description"),
    },
  ];

  return (
    <section aria-labelledby="dutch-market-heading" className="border-y border-border bg-muted/40 py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-6xl">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <h2
            id="dutch-market-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("subtitle")}</p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group block rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <h3 className="font-semibold text-foreground transition-colors group-hover:text-primary">
                  {link.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{link.description}</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {t("cta")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
