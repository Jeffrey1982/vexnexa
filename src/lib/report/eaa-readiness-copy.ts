/**
 * Shared, legally cautious copy for EAA context in PDF/HTML and Word exports.
 * Do not use language that claims EAA certification or full compliance for the scanned site.
 */

export const EAA_READINESS_SECTION_TITLE = "EAA Readiness";

export const EAA_READINESS_INTRO =
  "The European Accessibility Act (EAA) sets legal accessibility requirements for digital products and services in the EU, effective since June 2025. For web content, organizations typically align with the harmonised standard EN 301 549, which is based on WCAG 2.1 Level AA (with WCAG 2.2 expected in future updates).";

export const EAA_STANDARDS_HEADING = "Relevant standards";
export const EAA_STANDARDS_BODY = "WCAG 2.1 AA + EN 301 549";

export const EAA_SCAN_COVERS_HEADING = "What this scan covers";
export const EAA_SCAN_COVERS_BODY =
  "Automated detection of common issues in contrast, keyboard navigation, form labels, images/alt text, structure/headings, and more.";

export const EAA_IMPORTANT_NOTE_TITLE = "Important note";
export const EAA_IMPORTANT_NOTE_BODY =
  "This is an automated scan and provides indicators of potential accessibility barriers relevant to EAA readiness. It is not a full manual audit and does not constitute legal compliance certification or a complete conformity assessment.";

export const EAA_RECOMMENDATION_CLOSING =
  "Automated results are a strong starting point for remediation planning and ongoing monitoring. We recommend combining this with manual testing and expert review for full EAA alignment.";

export const EAA_LEARN_MORE_LABEL = "Learn more about the European Accessibility Act";

/** Canonical marketing URL for exports (absolute for PDF/print). */
export const EAA_LEARN_MORE_URL = "https://vexnexa.com/eaa-compliance-monitoring";

export const EAA_LEGAL_NOTICE_SHORT =
  "Enforcement timelines and obligations vary by EU member state, sector, and product type. This report is not legal advice.";

export function formatEaaContextLine(params: {
  domain?: string;
  score?: number | null;
  totalIssues?: number | null;
}): string | null {
  const parts: string[] = [];
  if (params.domain) {
    parts.push(`Context for automated results for ${params.domain}.`);
  }
  if (params.score != null && Number.isFinite(params.score)) {
    parts.push(`Latest reported VexNexa Index: ${params.score}${params.score > 100 ? "/2500" : "/100"} (informational only).`);
  }
  if (params.totalIssues != null && params.totalIssues > 0) {
    parts.push(
      `This report lists ${params.totalIssues} detected issue${params.totalIssues === 1 ? "" : "s"} from automation.`
    );
  }
  if (parts.length === 0) return null;
  return parts.join(" ");
}
