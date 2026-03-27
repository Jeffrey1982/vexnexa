"use client";

import { useActionState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { submitPartnerApplication, type PartnerApplyState } from "@/app/actions/partner-application";
import { PartnerHero } from "@/components/partner-apply/PartnerHero";
import { PartnerApplicationForm } from "@/components/partner-apply/PartnerApplicationForm";
import { StandardsTrustBar } from "@/components/marketing/StandardsTrustBar";

const initialState: PartnerApplyState = { ok: false };

const VALUE_POINTS = [
  "Full Business Plan ($129/mo value) during the entire pilot",
  "White-label reports under your own brand",
  "Priority support + dedicated success manager",
  "Early access to new features & direct input on the product roadmap",
  "30% discount on all future audits and services",
] as const;

function PartnerApplySuccess() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-20 text-center">
      <div className="mx-auto max-w-lg space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary ring-2 ring-primary/20">
            <CheckCircle2 className="h-14 w-14" aria-hidden />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
            Application received – thank you!
          </h1>
          <p className="text-lg text-muted-foreground">
            We will contact you within <strong className="text-foreground">1 business day</strong>.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            While you wait, explore the white-label report examples to preview what you can deliver under your
            brand.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gradient-primary" asChild>
            <Link href="/sample-report">Explore sample report</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/white-label-accessibility-reports">White-label reporting</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export function PartnerApplyView({ spotsLeft }: { spotsLeft: number }) {
  const [state, formAction, pending] = useActionState(submitPartnerApplication, initialState);

  if (state.ok) {
    return <PartnerApplySuccess />;
  }

  return (
    <>
      <PartnerHero spotsLeft={spotsLeft} />

      <section className="border-b border-border/40 bg-muted/20 py-12 md:py-16" aria-labelledby="partner-value-heading">
        <div className="container mx-auto px-4">
          <h2 id="partner-value-heading" className="sr-only">
            Pilot partner benefits
          </h2>
          <ul className="mx-auto grid max-w-4xl gap-3 md:grid-cols-2 md:gap-x-10 md:gap-y-4">
            {VALUE_POINTS.map((text) => (
              <li key={text} className="flex gap-3 text-left text-sm leading-relaxed md:text-base">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span>{text}</span>
              </li>
            ))}
          </ul>
          <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-muted-foreground">
            Applications are reviewed within <strong className="text-foreground">1 business day</strong>.
          </p>
        </div>
      </section>

      <StandardsTrustBar
        variant="full"
        showHeading
        omitGdpr
        headingOverride="You will deliver reports built on the exact same industry standards used by the world's most respected accessibility teams"
      />

      <section
        id="partner-apply-form"
        className="scroll-mt-24 border-b border-border/40 py-14 md:py-20"
        aria-labelledby="partner-form-heading"
      >
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-10 max-w-xl text-center">
            <h2 id="partner-form-heading" className="font-display text-2xl font-bold md:text-3xl">
              Secure your spot in the Pilot Partner Program
            </h2>
            <p className="mt-2 text-sm text-muted-foreground md:text-base">
              Short qualifying form — we read every application personally.
            </p>
          </div>
          <PartnerApplicationForm
            formAction={formAction}
            state={state}
            pending={pending}
            spotsLeft={spotsLeft}
          />
        </div>
      </section>
    </>
  );
}
