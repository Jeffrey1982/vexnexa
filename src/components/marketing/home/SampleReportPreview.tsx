"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

/**
 * HTML preview of a realistic mid-range report cover.
 * Keep this example aligned with the hero scan card.
 */

// Single source for the example data. Must match the hero scan card.
export const SAMPLE_REPORT = {
  domain: "example-agency.nl",
  standard: "WCAG 2.2 AA",
  score: 72,
  pages: 10,
  critical: 3,
  serious: 8,
  moderate: 14,
  minor: 6,
} as const;

const severityRows = [
  { token: "critical", count: SAMPLE_REPORT.critical, labelKey: "severityCritical" },
  { token: "serious", count: SAMPLE_REPORT.serious, labelKey: "severitySerious" },
  { token: "moderate", count: SAMPLE_REPORT.moderate, labelKey: "severityModerate" },
  { token: "minor", count: SAMPLE_REPORT.minor, labelKey: "severityMinor" },
] as const;

export function SampleReportPreview({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("home.reportPreview");
  const tHero = useTranslations("hero");

  const exampleIssues = [
    { label: t("issue1"), severityKey: "severitySerious", token: "serious" },
    { label: t("issue2"), severityKey: "severityCritical", token: "critical" },
    { label: t("issue3"), severityKey: "severityModerate", token: "moderate" },
  ] as const;

  return (
    <div
      role="img"
      aria-label={`VexNexa ${t("chip")} - ${SAMPLE_REPORT.domain}, ${SAMPLE_REPORT.standard}, ${t("scoreLabel")} ${SAMPLE_REPORT.score}/100, ${t("issuesSummary")}`}
      className={`flex h-full w-full flex-col bg-[var(--color-hero-panel)] ${compact ? "p-4" : "p-6 sm:p-8"}`}
    >
      {/* Report header */}
      <div className="flex items-center justify-between border-b border-[var(--color-hero-border)] pb-3">
        <span className="font-sans text-sm font-bold tracking-tight text-[var(--color-brand-primary)] dark:text-[var(--color-brand-primary-dark)]">
          VexNexa
        </span>
        <span className="rounded border border-[var(--color-hero-border)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-hero-accent-fg)]">
          {t("chip")}
        </span>
      </div>

      <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-hero-muted)]">
        {t("auditLabel")}
      </p>
      <p className={`mt-1 font-sans font-semibold text-[var(--color-hero-text)] ${compact ? "text-lg" : "text-2xl"}`}>
        {SAMPLE_REPORT.domain}
      </p>

      {/* Meta row */}
      <dl className={`mt-3 grid gap-x-4 gap-y-2 ${compact ? "grid-cols-2" : "grid-cols-3"}`}>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--color-hero-muted)]">{t("standardLabel")}</dt>
          <dd className="text-xs font-semibold text-[var(--color-hero-accent-fg)]">{SAMPLE_REPORT.standard}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--color-hero-muted)]">{t("riskLabel")}</dt>
          <dd className="text-xs font-semibold" style={{ color: "var(--color-serious-fg)" }}>
            {t("riskValue")}
          </dd>
        </div>
        <div className={compact ? "col-span-2" : ""}>
          <dt className="text-[10px] uppercase tracking-wider text-[var(--color-hero-muted)]">{t("pagesLabel")}</dt>
          <dd className="text-xs font-semibold text-[var(--color-hero-text)]">{SAMPLE_REPORT.pages}</dd>
        </div>
      </dl>

      {/* Score block */}
      <div className="mt-4 rounded-lg border border-[var(--color-hero-border)] bg-[var(--color-hero-panel-muted)] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-hero-muted)]">
          {t("scoreLabel")}
        </p>
        <div className="mt-1 flex items-end gap-2">
          <span className={`font-sans font-semibold leading-none text-[var(--color-hero-text)] ${compact ? "text-4xl" : "text-5xl"}`}>
            {SAMPLE_REPORT.score}
          </span>
          <span className="pb-0.5 text-sm text-[var(--color-hero-muted)]">/ 100</span>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--color-hero-panel-sunken)]" aria-hidden="true">
          <div
            className="h-full rounded-full bg-[var(--color-brand-primary)] dark:bg-[var(--color-brand-primary-dark)]"
            style={{ width: `${SAMPLE_REPORT.score}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-[var(--color-hero-muted)]">{t("issuesSummary")}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1" aria-hidden="true">
          {severityRows.map((row) => (
            <span key={row.token} className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-hero-muted)]">
              <strong style={{ color: `var(--color-${row.token}-fg)` }}>{row.count}</strong>
              {tHero(row.labelKey)}
            </span>
          ))}
        </div>
      </div>

      {/* Example findings */}
      {!compact && (
        <ul className="mt-4 space-y-2" aria-hidden="true">
          {exampleIssues.map((issue) => (
            <li
              key={issue.label}
              className="flex items-center justify-between rounded-md border border-[var(--color-hero-border)] px-3 py-2"
            >
              <span className="text-xs text-[var(--color-hero-text)]">{issue.label}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  background: `var(--color-${issue.token}-bg)`,
                  color: `var(--color-${issue.token}-fg)`,
                }}
              >
                {tHero(issue.severityKey)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex items-center justify-between pt-4 text-[10px] uppercase tracking-wider text-[var(--color-hero-muted)]">
        <span className="inline-flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
          {t("poweredBy")}
        </span>
        <span>{SAMPLE_REPORT.standard}</span>
      </div>
    </div>
  );
}
