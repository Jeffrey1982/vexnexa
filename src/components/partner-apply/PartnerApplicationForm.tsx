"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { PartnerApplyState } from "@/app/actions/partner-application";

const SERVICE_OPTIONS = [
  { value: "web_development", label: "Web Development" },
  { value: "digital_marketing", label: "Digital Marketing" },
  { value: "seo", label: "SEO" },
  { value: "accessibility_consulting", label: "Accessibility Consulting" },
  { value: "other", label: "Other" },
] as const;

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
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          autoComplete="name"
          aria-invalid={!!fe?.fullName}
          aria-describedby={fe?.fullName ? "fullName-error" : undefined}
        />
        <FieldError id="fullName-error" message={fe?.fullName} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="companyName">Agency / company name</Label>
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
        <Label htmlFor="phone">
          Phone number <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          aria-invalid={!!fe?.phone}
          aria-describedby={fe?.phone ? "phone-error" : undefined}
        />
        <FieldError id="phone-error" message={fe?.phone} />
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

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium leading-none">What services do you offer?</legend>
        <p id="services-hint" className="text-xs text-muted-foreground">
          Select all that apply.
        </p>
        <ul className="grid gap-3 sm:grid-cols-2" aria-describedby="services-hint">
          {SERVICE_OPTIONS.map((opt) => (
            <li key={opt.value} className="flex items-center gap-2">
              <input
                id={`service-${opt.value}`}
                name="services"
                type="checkbox"
                value={opt.value}
                className="h-4 w-4 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Label htmlFor={`service-${opt.value}`} className="font-normal">
                {opt.label}
              </Label>
            </li>
          ))}
        </ul>
        <FieldError id="services-error" message={fe?.services} />
      </fieldset>

      <div className="space-y-2">
        <Label htmlFor="motivation">Why do you want to join the Pilot Partner Program?</Label>
        <Textarea
          id="motivation"
          name="motivation"
          required
          rows={5}
          placeholder="2–3 sentences: your clients, goals, and what you hope to get from the pilot."
          className="min-h-[120px] resize-y"
          aria-invalid={!!fe?.motivation}
          aria-describedby={fe?.motivation ? "motivation-error" : undefined}
        />
        <FieldError id="motivation-error" message={fe?.motivation} />
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
