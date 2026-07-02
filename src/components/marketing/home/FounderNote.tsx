"use client";

import { useTranslations } from "next-intl";
import { PenLine } from "lucide-react";

/**
 * Short first-person note near the bottom of the homepage.
 */
export function FounderNote() {
  const t = useTranslations("home.founderNote");

  return (
    <section aria-labelledby="founder-note-heading" className="bg-background py-16 sm:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-muted/40 p-8 sm:p-10">
          <p
            id="founder-note-heading"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary"
          >
            <PenLine className="h-3.5 w-3.5" aria-hidden="true" />
            {t("eyebrow")}
          </p>
          <blockquote className="mt-4 text-lg leading-8 text-foreground">
            {t("body")}
          </blockquote>
          <p className="mt-5 text-sm font-semibold text-muted-foreground">
            {t("signature")}
          </p>
        </div>
      </div>
    </section>
  );
}
