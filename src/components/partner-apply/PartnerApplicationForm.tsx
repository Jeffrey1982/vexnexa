"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PartnerApplyState } from "@/app/actions/partner-application";
import { FOUNDING_APPLICATIONS_OPEN } from "@/lib/founding-program";
import { FoundingProgramClosed } from "@/components/marketing/FoundingProgramClosed";

type PartnerApplicationFormProps = {
  formAction: (payload: FormData) => void;
  state: PartnerApplyState;
  pending: boolean;
  remaining: number;
};

export function PartnerApplicationForm({
  formAction,
  state,
  pending,
  remaining,
}: PartnerApplicationFormProps) {
  const t = useTranslations("partnerApply");
  if (!FOUNDING_APPLICATIONS_OPEN || (!state.ok && state.programClosed)) return <FoundingProgramClosed />;
  const fe = state.ok ? undefined : state.fieldErrors;

  // Field errors arrive as key names within partnerApply.errors so they
  // render in the visitor's language.
  const fieldError = (field: string): string | undefined => {
    const key = fe?.[field];
    return key ? t(`errors.${key}` as Parameters<typeof t>[0]) : undefined;
  };

  const errorFor = (field: string, id: string) => {
    const message = fieldError(field);
    if (!message) return null;
    return (
      <p id={id} className="mt-1 text-sm text-destructive" role="alert">
        {message}
      </p>
    );
  };

  const serverError =
    !state.ok && state.errorKey
      ? t(`errors.${state.errorKey}` as Parameters<typeof t>[0])
      : null;

  return (
    <form action={formAction} className="relative mx-auto max-w-xl space-y-6" noValidate>
      <input type="hidden" name="pilot_partner_application" value="1" />

      <div className="absolute -left-[9999px] h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="hp_website">Website</label>
        <input
          id="hp_website"
          name="hp_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
        />
      </div>

      {serverError ? (
        <div
          className={
            !state.ok && state.programFull
              ? "rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm text-orange-800 dark:text-orange-200"
              : "rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          }
          role="alert"
        >
          <p>{serverError}</p>
          {!state.ok && state.programFull ? (
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/contact?from=pilot-waitlist">{t("waitlist.cta")}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="companyName">{t("form.agencyName")}</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          autoComplete="organization"
          aria-invalid={!!fe?.companyName}
          aria-describedby={fe?.companyName ? "companyName-error" : undefined}
        />
        {errorFor("companyName", "companyName-error")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="agencyWebsite">{t("form.website")}</Label>
        <Input
          id="agencyWebsite"
          name="agencyWebsite"
          type="url"
          inputMode="url"
          placeholder="https://youragency.com"
          required
          autoComplete="url"
          aria-invalid={!!fe?.agencyWebsite}
          aria-describedby={fe?.agencyWebsite ? "agencyWebsite-error" : undefined}
        />
        {errorFor("agencyWebsite", "agencyWebsite-error")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("form.email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!fe?.email}
          aria-describedby={fe?.email ? "email-error" : undefined}
        />
        {errorFor("email", "email-error")}
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientSites">{t("form.clientSites")}</Label>
        <select
          id="clientSites"
          name="clientSites"
          required
          defaultValue=""
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
          aria-invalid={!!fe?.clientSites}
          aria-describedby={fe?.clientSites ? "clientSites-error" : undefined}
        >
          <option value="" disabled>
            {t("form.selectRange")}
          </option>
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="50+">50+</option>
        </select>
        {errorFor("clientSites", "clientSites-error")}
      </div>

      <div className="space-y-3 pt-2">
        <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <span className="select-none text-base leading-none" aria-hidden="true">
            ✅
          </span>
          <span>{t("form.reviewNotice")}</span>
        </p>
        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-base font-semibold gradient-primary md:text-lg"
          disabled={pending}
        >
          {pending ? t("form.sending") : t("form.submit", { remaining })}
        </Button>
        <p className="text-center text-xs text-muted-foreground">{t("form.privacy")}</p>
      </div>
    </form>
  );
}
