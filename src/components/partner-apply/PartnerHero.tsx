"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { PartnerStandardsBar } from "@/components/marketing/PartnerStandardsBar";
import { ScarcityCounter } from "@/components/partner-apply/ScarcityCounter";
import { trackEvent } from "@/lib/analytics-events";

export function PartnerHero({ remaining }: { remaining: number }) {
  const t = useTranslations("partnerApply.hero");
  const isFull = remaining <= 0;

  function scrollToForm() {
    document.getElementById("partner-apply-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("pilot_partner_apply_click", { location: "partner_apply_hero" });
  }

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-background py-14 md:py-20">
      <div className="container relative mx-auto max-w-4xl px-4 text-center">
        <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary dark:bg-primary/10">
          {t("badge")}
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          {t("title")}
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
          {isFull ? t("subtitleFull") : t("subtitle", { remaining })}
        </p>
        <div className="mt-6 flex flex-col items-center gap-2">
          <ScarcityCounter remaining={remaining} />
        </div>
        <div className="mt-8 flex flex-col items-stretch gap-3 sm:mx-auto sm:max-w-lg sm:items-center">
          {isFull ? (
            <Button size="lg" className="h-14 min-h-[3.5rem] px-8 text-lg font-semibold" variant="outline" asChild>
              <Link
                href="/contact?from=pilot-waitlist"
                onClick={() => trackEvent("pilot_partner_apply_click", { location: "partner_apply_waitlist" })}
              >
                {t("ctaWaitlist")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="gradient-primary h-14 min-h-[3.5rem] px-8 text-lg font-semibold shadow-lg shadow-primary/25 md:h-16 md:min-h-[4rem] md:text-xl"
              onClick={scrollToForm}
            >
              {t("ctaClaim")}
            </Button>
          )}
        </div>
        <PartnerStandardsBar
          className="mt-10 border-t-0 pt-2"
          introOverride={t("standardsIntro")}
          footnoteOverride={t("standardsFootnote")}
        />
      </div>
    </section>
  );
}
