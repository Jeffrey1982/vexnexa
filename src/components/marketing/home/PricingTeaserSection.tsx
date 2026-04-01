"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

export function PricingTeaserSection() {
  const t = useTranslations("home.pricingTeaser");

  return (
    <section
      className="border-y border-border/40 bg-muted/40 py-16"
      aria-labelledby="pricing-teaser-heading"
    >
      <div className="container mx-auto px-4">
        <div
          className="mx-auto max-w-3xl rounded-3xl border border-border/50 bg-white/90 p-8 text-center shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-card/80 sm:p-10"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {t("eyebrow")}
          </p>
          <h2
            id="pricing-teaser-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl"
          >
            {t("title")}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">{t("subtitle")}</p>
          <p className="mt-2 text-sm font-medium text-foreground/80">
            {t("hint")}
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:justify-center">
            <Button
              size="lg"
              className="h-12 rounded-xl bg-primary px-8 font-semibold text-white hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              asChild
            >
              <Link
                href="/pricing"
                onClick={() =>
                  trackEvent("pricing_cta_click", { location: "home_teaser_primary" })
                }
              >
                {t("ctaPrimary")}
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 rounded-xl px-8" asChild>
              <Link
                href="/contact"
                onClick={() =>
                  trackEvent("contact_cta_click", { location: "home_teaser_sales" })
                }
              >
                {t("ctaSecondary")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
