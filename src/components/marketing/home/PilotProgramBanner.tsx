"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight, Handshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/lib/analytics-events";

/**
 * PilotProgramBanner — the hero offer while VexNexa is recruiting its
 * first pilot agencies. Sits directly below the hero so it is the first
 * thing a visitor sees after the scan form.
 */
export function PilotProgramBanner() {
  const t = useTranslations("home.pilotProgram");

  return (
    <section
      aria-labelledby="pilot-program-heading"
      className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-warm)]"
    >
      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center lg:flex-row lg:justify-between lg:text-left">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-[var(--color-hero-border)] bg-[var(--color-hero-accent-bg)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-hero-accent-fg)]">
              <Handshake className="h-3.5 w-3.5" aria-hidden="true" />
              {t("badge")}
            </p>
            <h2
              id="pilot-program-heading"
              className="mt-3 font-sans text-2xl font-semibold tracking-tight text-[var(--color-ink-900)] sm:text-3xl"
            >
              {t("title")}
            </h2>
            <p className="mt-2 text-base leading-7 text-[var(--color-ink-500)]">
              {t("subtitle")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <Button size="lg" asChild className="rounded-lg">
              <Link
                href="/partner-apply"
                onClick={() => trackEvent("pilot_banner_click", { location: "home_banner_primary" })}
              >
                {t("cta")}
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="rounded-lg">
              <Link
                href="/pilot-partner-program"
                onClick={() => trackEvent("pilot_banner_click", { location: "home_banner_secondary" })}
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
