"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPartnerApplication, type PartnerApplyState } from "@/app/actions/partner-application";
import { PartnerHero } from "@/components/partner-apply/PartnerHero";
import { PartnerApplicationForm } from "@/components/partner-apply/PartnerApplicationForm";
import { StandardsTrustBar } from "@/components/marketing/StandardsTrustBar";

const initialState: PartnerApplyState = { ok: false };

const VALUE_KEYS = ["v1", "v2", "v3", "v4", "v5"] as const;

function PartnerApplySuccess() {
  const t = useTranslations("partnerApply.success");
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary ring-2 ring-primary/20">
            <CheckCircle2 className="h-14 w-14" aria-hidden />
          </div>
        </div>
        <div className="space-y-4">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            {t("title")}
          </h1>
          <p className="text-lg leading-relaxed text-muted-foreground">{t("body")}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gradient-primary" asChild>
            <Link href="/sample-report">{t("ctaSample")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/white-label-accessibility-reports">{t("ctaWhiteLabel")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function PartnerApplyWaitlist() {
  const t = useTranslations("partnerApply.waitlist");
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-border/60 bg-card px-6 py-10 text-center shadow-sm">
      <h2 className="font-display text-xl font-bold md:text-2xl">{t("title")}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground md:text-base">
        {t("body")}
      </p>
      <Button className="mt-6 gradient-primary" size="lg" asChild>
        <Link href="/contact?from=pilot-waitlist">{t("cta")}</Link>
      </Button>
      <p className="mt-4 text-xs text-muted-foreground">
        {t("orEmail")}{" "}
        <a href="mailto:info@vexnexa.com" className="text-primary underline-offset-4 hover:underline">
          info@vexnexa.com
        </a>
      </p>
    </div>
  );
}

export function PartnerApplyView({ remaining }: { remaining: number }) {
  const t = useTranslations("partnerApply");
  const [state, formAction, pending] = useActionState(submitPartnerApplication, initialState);
  const isFull = remaining <= 0;

  if (state.ok) {
    return <PartnerApplySuccess />;
  }

  return (
    <>
      <PartnerHero remaining={remaining} />

      <section className="border-b border-border/40 bg-muted py-12 md:py-16" aria-labelledby="partner-value-heading">
        <div className="container mx-auto px-4">
          <h2 id="partner-value-heading" className="sr-only">
            Pilot partner benefits
          </h2>
          <ul className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2 md:gap-x-10 md:gap-y-4">
            {VALUE_KEYS.map((key) => (
              <li key={key} className="flex gap-3 text-left text-sm leading-relaxed md:text-base">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>{t(`value.${key}`)}</span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            {t("value.reviewNote")}
          </p>
        </div>
      </section>

      <StandardsTrustBar
        variant="full"
        showHeading
        omitGdpr
        headingOverride={t("standards.heading")}
        subheadingOverride={t("standards.subheading")}
      />

      <section
        id="partner-apply-form"
        className="scroll-mt-24 border-b border-border/40 py-14 md:py-20"
        aria-labelledby="partner-form-heading"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 id="partner-form-heading" className="font-display text-2xl font-bold md:text-3xl">
              {isFull ? t("formSection.titleFull") : t("formSection.title", { remaining })}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              {isFull ? t("formSection.subtitleFull") : t("formSection.subtitle")}
            </p>
          </div>
          {isFull ? (
            <PartnerApplyWaitlist />
          ) : (
            <PartnerApplicationForm
              formAction={formAction}
              state={state}
              pending={pending}
              remaining={remaining}
            />
          )}
        </div>
      </section>
    </>
  );
}
