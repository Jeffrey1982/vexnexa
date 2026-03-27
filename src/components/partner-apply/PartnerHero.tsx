"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PartnerStandardsBar } from "@/components/marketing/PartnerStandardsBar";
import { ScarcityCounter } from "@/components/partner-apply/ScarcityCounter";
import { trackEvent } from "@/lib/analytics-events";

export function PartnerHero({ remaining }: { remaining: number }) {
  const isFull = remaining <= 0;

  function scrollToForm() {
    document.getElementById("partner-apply-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
    trackEvent("pilot_partner_apply_click", { location: "partner_apply_hero" });
  }

  return (
    <section className="relative overflow-hidden border-b border-border/40 bg-background py-14 md:py-20">
      <div className="container relative mx-auto max-w-4xl px-4 text-center">
        <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary dark:bg-primary/10">
          Members-only pilot
        </p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground md:text-4xl lg:text-5xl">
          Join the Exclusive Pilot Partner Program
        </h1>
        {isFull ? (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            All pilot seats are currently filled. Join the waitlist to be first in line when capacity opens.
          </p>
        ) : (
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            Only <span className="font-semibold text-foreground">{remaining}</span> spots remaining • Get full
            Business access, white-label reports under your brand, and direct influence on our roadmap
          </p>
        )}
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
                Join the waitlist
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              className="gradient-primary h-14 min-h-[3.5rem] px-8 text-lg font-semibold shadow-lg shadow-primary/25 md:h-16 md:min-h-[4rem] md:text-xl"
              onClick={scrollToForm}
            >
              Claim My Spot Now
            </Button>
          )}
        </div>
        <PartnerStandardsBar
          className="mt-10 border-t-0 pt-2"
          introOverride="You'll deliver professional white-label accessibility reports powered by axe-core® and aligned with WCAG 2.2 & EN 301 549"
          footnoteOverride="For reference only. VexNexa is not endorsed by W3C or Deque."
        />
      </div>
    </section>
  );
}
