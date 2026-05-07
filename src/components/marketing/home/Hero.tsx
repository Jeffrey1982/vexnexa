"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const severities = [
  { key: "Critical", count: 3, token: "critical", label: "severityCritical" },
  { key: "Serious", count: 8, token: "serious", label: "severitySerious" },
  { key: "Moderate", count: 14, token: "moderate", label: "severityModerate" },
  { key: "Minor", count: 6, token: "minor", label: "severityMinor" },
] as const;

export function Hero() {
  const t = useTranslations("hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="px-6 pb-10 pt-12 sm:pt-14"
      style={{
        background:
          "linear-gradient(180deg, var(--color-surface-warm) 0%, var(--color-surface-base) 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-[var(--container-max)] flex-col items-center text-center">
        <Badge
          variant="trust"
          className="mb-5 inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t("badge")}
        </Badge>

        <h1
          id="hero-heading"
          className="mb-4 max-w-[540px] font-medium"
          style={{
            color: "var(--color-ink-900)",
            fontSize: "var(--font-size-hero)",
            letterSpacing: "var(--tracking-hero)",
            lineHeight: "var(--leading-tight)",
          }}
        >
          {t("headline")}
        </h1>

        <p
          className="mb-7 max-w-[460px] text-base font-normal"
          style={{
            color: "var(--color-ink-500)",
            lineHeight: "var(--leading-normal)",
          }}
        >
          {t("subhead")}
        </p>

        <div className="mb-8 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild variant="rebrandPrimary" size="lg" className="min-h-11 rounded-md px-5">
            <Link href="/auth/register">
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="rebrandSecondary" size="lg" className="min-h-11 rounded-md px-5">
            <Link href="/sample-report">{t("ctaSecondary")}</Link>
          </Button>
        </div>

        <HeroScanCard />

        <p
          className="mt-8 text-center font-mono text-xs"
          style={{
            color: "var(--color-ink-500)",
            letterSpacing: "var(--tracking-mono)",
          }}
        >
          {t("trustLabel")}
        </p>
      </div>
    </section>
  );
}

function HeroScanCard() {
  const t = useTranslations("hero");

  return (
    <figure
      className="w-full max-w-[540px] overflow-hidden text-left"
      style={{
        background: "var(--color-surface-elevated)",
        border: "0.5px solid var(--color-border-subtle)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <figcaption className="sr-only">Sample scan result preview</figcaption>

      <div
        className="flex items-center gap-3 px-4 py-2.5"
        style={{
          background: "var(--color-surface-warm)",
          borderBottom: "0.5px solid var(--color-border-subtle)",
        }}
      >
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-subtle)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-subtle)]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-border-subtle)]" />
        </div>
        <p
          className="min-w-0 flex-1 truncate font-mono text-xs"
          style={{ color: "var(--color-ink-500)" }}
        >
          vexnexa.com/scan
        </p>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium"
          style={{ color: "var(--color-brand-primary-dark)" }}
        >
          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
          Live
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium" style={{ color: "var(--color-ink-900)" }}>
            example-agency.nl
          </p>
          <p
            className="shrink-0 font-mono text-xs"
            style={{ color: "var(--color-ink-500)" }}
          >
            WCAG 2.2 AA
          </p>
        </div>

        <div className="mb-3 flex items-end justify-between gap-4">
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-medium"
              style={{ color: "var(--color-ink-900)" }}
            >
              72
            </span>
            <span className="text-sm" style={{ color: "var(--color-ink-500)" }}>
              {t("scanCardScore")}
            </span>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: "var(--color-brand-primary-light)",
              color: "var(--color-brand-primary-dark)",
            }}
          >
            {t("scanCardDelta")}
          </span>
        </div>

        <div
          className="mb-4 h-1 overflow-hidden rounded-full"
          style={{ background: "var(--color-surface-sunken)" }}
          aria-hidden="true"
        >
          <div
            className="h-full rounded-full"
            style={{ width: "72%", background: "var(--color-brand-primary)" }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={t("scanCardLabel")}>
          {severities.map((severity) => (
            <div
              key={severity.key}
              className="rounded-md px-3 py-2 text-center"
              style={{
                background: `var(--color-${severity.token}-bg)`,
                color: `var(--color-${severity.token}-fg)`,
              }}
            >
              <p className="text-lg font-medium leading-tight">{severity.count}</p>
              <p className="mt-1 text-xs font-medium leading-tight">{t(severity.label)}</p>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
