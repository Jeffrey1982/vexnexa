"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { PartnerApplyState } from "@/app/actions/partner-application";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1 text-sm text-destructive" role="alert">
      {message}
    </p>
  );
}

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
  const fe = state.ok ? undefined : state.fieldErrors;

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

      {!state.ok && state.error ? (
        <div
          className={
            state.programFull
              ? "rounded-lg border border-orange-500/30 bg-orange-500/5 px-4 py-3 text-sm text-orange-800 dark:text-orange-200"
              : "rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          }
          role="alert"
        >
          <p>{state.error}</p>
          {state.programFull ? (
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <Link href="/contact?from=pilot-waitlist">Join the waitlist</Link>
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="companyName">Agency name</Label>
        <Input
          id="companyName"
          name="companyName"
          required
          autoComplete="organization"
          aria-invalid={!!fe?.companyName}
          aria-describedby={fe?.companyName ? "companyName-error" : undefined}
        />
        <FieldError id="companyName-error" message={fe?.companyName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="agencyWebsite">Agency website</Label>
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
        <FieldError id="agencyWebsite-error" message={fe?.agencyWebsite} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          aria-invalid={!!fe?.email}
          aria-describedby={fe?.email ? "email-error" : undefined}
        />
        <FieldError id="email-error" message={fe?.email} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="clientSites">How many client websites do you currently manage?</Label>
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
            Select a range
          </option>
          <option value="1-5">1–5</option>
          <option value="6-20">6–20</option>
          <option value="21-50">21–50</option>
          <option value="50+">50+</option>
        </select>
        <FieldError id="clientSites-error" message={fe?.clientSites} />
      </div>

      <div className="space-y-3 pt-2">
        <p className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground">
          <span className="select-none text-base leading-none" aria-hidden="true">
            ✅
          </span>
          <span>
            Your application will be reviewed within{" "}
            <strong className="font-medium text-foreground">24 hours</strong>. We respect your inbox.
          </span>
        </p>
        <Button
          type="submit"
          size="lg"
          className="h-14 w-full text-base font-semibold gradient-primary md:text-lg"
          disabled={pending}
        >
          {pending
            ? "Sending…"
            : `Claim My Spot Now – Only ${remaining} Spot${remaining === 1 ? "" : "s"} Left`}
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Your data is safe. We hate spam as much as you do.
        </p>
      </div>
    </form>
  );
}
