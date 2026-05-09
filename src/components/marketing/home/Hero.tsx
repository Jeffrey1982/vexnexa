import Link from "next/link";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const severities = [
  { key: "Critical", count: 3, token: "critical", label: "severityCritical" },
  { key: "Serious", count: 8, token: "serious", label: "severitySerious" },
  { key: "Moderate", count: 14, token: "moderate", label: "severityModerate" },
  { key: "Minor", count: 6, token: "minor", label: "severityMinor" },
] as const;

export async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section
      aria-labelledby="hero-heading"
      className="px-6 pb-20 pt-20 sm:pt-28 lg:pt-32"
      style={{
        background:
          "linear-gradient(180deg, var(--color-surface-warm) 0%, var(--color-surface-base) 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <Badge
          variant="trust"
          className="mb-7 inline-flex rounded-full px-3 py-1.5 text-xs font-medium"
        >
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          {t("badge")}
        </Badge>

        <h1
          id="hero-heading"
          className="mb-6 font-display font-semibold"
          style={{
            color: "var(--color-ink-900)",
            fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)",
            letterSpacing: "-0.025em",
            lineHeight: "1.05",
          }}
        >
          {t("headline")}
        </h1>

        <p
          className="mb-10 max-w-2xl text-lg leading-relaxed sm:text-xl"
          style={{
            color: "var(--color-ink-500)",
          }}
        >
          {t("subhead")}
        </p>

        <div className="mb-14 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild variant="rebrandPrimary" size="lg" className="min-h-12 rounded-lg px-7 text-base">
            <Link href="/auth/register">
              {t("ctaPrimary")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="rebrandSecondary" size="lg" className="min-h-12 rounded-lg px-7 text-base">
            <Link href="/sample-report">{t("ctaSecondary")}</Link>
          </Button>
        </div>

        <div className="w-full max-w-xl">
          <HeroScanCard
            scanCardScore={t("scanCardScore")}
            scanCardDelta={t("scanCardDelta")}
            scanCardLabel={t("scanCardLabel")}
            severityLabels={{
              severityCritical: t("severityCritical"),
              severitySerious: t("severitySerious"),
              severityModerate: t("severityModerate"),
              severityMinor: t("severityMinor"),
            }}
          />
        </div>

        <p
          className="mt-10 text-center font-mono text-xs uppercase"
          style={{
            color: "var(--color-ink-500)",
            letterSpacing: "0.12em",
          }}
        >
          {t("trustLabel")}
        </p>
      </div>
    </section>
  );
}

function HeroScanCard({
  scanCardScore,
  scanCardDelta,
  scanCardLabel,
  severityLabels,
}: {
  scanCardScore: string;
  scanCardDelta: string;
  scanCardLabel: string;
  severityLabels: Record<string, string>;
}) {
  return (
    <figure
      className="w-full overflow-hidden text-left"
      style={{
        background: "var(--color-surface-elevated)",
        border: "1px solid var(--color-border-subtle)",
        borderRadius: "12px",
        boxShadow: "0 24px 48px -16px rgba(15, 15, 15, 0.12), 0 4px 12px -2px rgba(15, 15, 15, 0.06)",
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
              {scanCardScore}
            </span>
          </div>
          <span
            className="rounded-full px-2.5 py-1 text-xs font-medium"
            style={{
              background: "var(--color-brand-primary-light)",
              color: "var(--color-brand-primary-dark)",
            }}
          >
            {scanCardDelta}
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

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label={scanCardLabel}>
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
              <p className="mt-1 text-xs font-medium leading-tight">{severityLabels[severity.label]}</p>
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
