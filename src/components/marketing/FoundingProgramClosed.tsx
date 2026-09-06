"use client";

import { useTranslations } from "next-intl";
import Link from "@/components/marketing/MarketingLink";
import { Button } from "@/components/ui/button";

/** Historical links remain useful without accepting new applications. */
export function FoundingProgramClosed() {
  const t = useTranslations("agencyOffer");

  return (
    <section className="container mx-auto px-4 py-16 sm:py-24" aria-labelledby="founding-closed-heading">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-[var(--color-hero-accent-fg)]">{t("closedBadge")}</p>
        <h1 id="founding-closed-heading" className="mt-4 font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">{t("closedTitle")}</h1>
        <p className="mt-6 max-w-prose text-lg leading-8 text-muted-foreground">{t("closedDescription")}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg"><Link href="/pricing#agency">{t("cta")}</Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/sample-report">{t("sampleCta")}</Link></Button>
        </div>
        <div className="mt-12 border-t border-border pt-8">
          <h2 className="font-sans text-xl font-semibold text-foreground">{t("existingTitle")}</h2>
          <p className="mt-3 max-w-prose leading-7 text-muted-foreground">{t("existingDescription")}</p>
          <Link href="/contact?from=existing-founding-agency" className="mt-4 inline-block rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{t("existingCta")}</Link>
        </div>
      </div>
    </section>
  );
}
