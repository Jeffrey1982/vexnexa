import Link from "next/link";
import { EAAAutomatedScanHint } from "./EAAAutomatedScanHint";

export interface EAAReadinessIssueCounts {
  critical?: number;
  serious?: number;
  moderate?: number;
  minor?: number;
  total?: number;
}

export interface EAAReadinessSectionProps {
  /** Latest scan score, for optional factual context only (not a compliance claim). */
  score?: number;
  issueCounts?: EAAReadinessIssueCounts;
  /** Hostname or domain label for light personalization. */
  scannedDomain?: string;
  /** Defaults to internal EAA overview page. */
  learnMoreHref?: string;
  /** Main section title level; keep document outline coherent with the page. */
  headingLevel?: 2 | 3;
}

export function EAAReadinessSection({
  score,
  issueCounts,
  scannedDomain,
  learnMoreHref = "/eaa-compliance-monitoring",
  headingLevel = 2,
}: EAAReadinessSectionProps) {
  const HeadingTag: "h2" | "h3" = headingLevel === 3 ? "h3" : "h2";
  const totalListed =
    issueCounts?.total ??
    (issueCounts
      ? (issueCounts.critical ?? 0) +
        (issueCounts.serious ?? 0) +
        (issueCounts.moderate ?? 0) +
        (issueCounts.minor ?? 0)
      : undefined);

  return (
    <section
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"
      aria-labelledby="eaa-readiness-heading"
    >
      <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-white to-gray-50/80 p-6 sm:p-8 dark:border-white/[0.06] dark:from-[var(--surface-1)] dark:to-[var(--surface-0)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <div>
            <HeadingTag
              id="eaa-readiness-heading"
              className="text-2xl font-bold tracking-tight text-gray-900 dark:text-foreground"
            >
              EAA Readiness
            </HeadingTag>
            {(scannedDomain ||
              score !== undefined ||
              (totalListed !== undefined && totalListed > 0)) && (
              <p className="mt-2 text-sm text-gray-600 dark:text-muted-foreground">
                {scannedDomain ? (
                  <>
                    Context for automated results for{" "}
                    <span className="font-medium text-gray-800 dark:text-foreground">{scannedDomain}</span>.
                  </>
                ) : null}
                {score !== undefined ? (
                  <>
                    {scannedDomain ? " " : null}
                    Latest reported score: {score}/100 (informational only).
                  </>
                ) : null}
                {totalListed !== undefined && totalListed > 0 ? (
                  <>
                    {" "}
                    This report lists {totalListed} detected issue{totalListed === 1 ? "" : "s"} from automation.
                  </>
                ) : null}
              </p>
            )}
          </div>
          <div className="shrink-0 sm:pt-0.5">
            <EAAAutomatedScanHint />
          </div>
        </div>

        <p className="mt-5 text-gray-700 dark:text-foreground/80 leading-relaxed">
          The European Accessibility Act (EAA) sets legal accessibility requirements for digital products and
          services in the EU, effective since June 2025. For web content, organizations typically align with the
          harmonised standard EN 301 549, which is based on WCAG 2.1 Level AA (with WCAG 2.2 expected in future
          updates).
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-white/80 p-5 dark:border-white/[0.06] dark:bg-[var(--surface-2)]/60">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
              Relevant standards
            </h3>
            <p className="mt-2 text-gray-800 dark:text-foreground leading-relaxed">
              WCAG 2.1 AA + EN 301 549
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white/80 p-5 dark:border-white/[0.06] dark:bg-[var(--surface-2)]/60">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
              What this scan covers
            </h3>
            <p className="mt-2 text-gray-700 dark:text-foreground/80 leading-relaxed">
              Automated detection of common issues in contrast, keyboard navigation, form labels, images/alt text,
              structure/headings, and more.
            </p>
          </div>
        </div>

        <div
          className="mt-4 rounded-xl border-l-4 border-l-primary/70 bg-primary/[0.04] p-5 dark:bg-primary/10"
          role="note"
          aria-label="Important limitation"
        >
          <p className="text-sm font-medium text-gray-900 dark:text-foreground">Important note</p>
          <p className="mt-2 text-sm text-gray-700 dark:text-foreground/80 leading-relaxed">
            This is an automated scan and provides indicators of potential accessibility barriers relevant to EAA
            readiness. It is not a full manual audit and does not constitute legal compliance certification or a
            complete conformity assessment.
          </p>
        </div>

        <p className="mt-6 text-gray-700 dark:text-foreground/80 leading-relaxed">
          Automated results are a strong starting point for remediation planning and ongoing monitoring. We
          recommend combining this with manual testing and expert review for full EAA alignment.
        </p>

        <p className="mt-5">
          <Link
            href={learnMoreHref}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm"
          >
            Learn more about the European Accessibility Act
          </Link>
        </p>
      </div>
    </section>
  );
}

/** Same component — alternate import name for layouts that prefer “context” wording. */
export const EAAComplianceContext = EAAReadinessSection;
