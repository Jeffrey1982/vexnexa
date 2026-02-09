import type {
  ReportData,
  ReportIssue,
  IssueBreakdown,
  Severity,
  RiskLevel,
  MaturityLevel,
  ReportThemeConfig,
  WhiteLabelConfig,
  CTAConfig,
  ReportStyle,
} from "./types";
import { DEFAULT_THEME, DEFAULT_WHITE_LABEL, DEFAULT_CTA } from "./types";

/** Human-readable explanations for common axe rule IDs */
const RULE_EXPLANATIONS: Record<string, { title: string; explanation: string; impact: string; recommendation: string }> = {
  "color-contrast": {
    title: "Insufficient Color Contrast",
    explanation: "Text elements on the page do not have enough contrast against their background, making them difficult to read for users with low vision or color blindness.",
    impact: "Users with visual impairments may be unable to read content, leading to information loss and potential legal non-compliance.",
    recommendation: "Increase the contrast ratio between text and background colors to meet WCAG AA minimum of 4.5:1 for normal text and 3:1 for large text.",
  },
  "image-alt": {
    title: "Images Missing Alternative Text",
    explanation: "Images on the page lack descriptive alt text, making them invisible to screen reader users and search engines.",
    impact: "Blind and visually impaired users cannot understand the content or purpose of images. This also affects SEO rankings.",
    recommendation: "Add descriptive alt attributes to all meaningful images. Use empty alt=\"\" for decorative images.",
  },
  "label": {
    title: "Form Inputs Missing Labels",
    explanation: "Form fields do not have associated labels, making it unclear what information users should enter.",
    impact: "Screen reader users cannot identify form fields. All users may struggle to understand what data is expected.",
    recommendation: "Associate a <label> element with each form input using the 'for' attribute matching the input's 'id'.",
  },
  "link-name": {
    title: "Links Without Accessible Names",
    explanation: "Links on the page do not have discernible text that describes their destination or purpose.",
    impact: "Screen reader users hear 'link' without context, making navigation impossible. This creates a frustrating user experience.",
    recommendation: "Ensure all links have descriptive text content, aria-label, or aria-labelledby attributes.",
  },
  "button-name": {
    title: "Buttons Without Accessible Names",
    explanation: "Interactive buttons lack text or labels that describe their action.",
    impact: "Users relying on assistive technology cannot determine what a button does, preventing them from completing tasks.",
    recommendation: "Add visible text content, aria-label, or aria-labelledby to all button elements.",
  },
  "html-has-lang": {
    title: "Page Missing Language Declaration",
    explanation: "The HTML document does not declare its primary language, preventing assistive technologies from using correct pronunciation.",
    impact: "Screen readers may mispronounce content, making the page difficult or impossible to understand for blind users.",
    recommendation: "Add a lang attribute to the <html> element (e.g., lang=\"en\" for English).",
  },
  "document-title": {
    title: "Page Missing Title",
    explanation: "The page does not have a <title> element, making it difficult to identify in browser tabs and bookmarks.",
    impact: "Users cannot identify the page purpose from their browser tab. Screen reader users lose important context about the current page.",
    recommendation: "Add a descriptive <title> element to the <head> of the document.",
  },
  "heading-order": {
    title: "Incorrect Heading Hierarchy",
    explanation: "Headings on the page skip levels (e.g., jumping from h1 to h3), breaking the document's logical structure.",
    impact: "Screen reader users who navigate by headings will miss content sections. The page structure becomes confusing.",
    recommendation: "Ensure headings follow a logical order without skipping levels (h1 → h2 → h3).",
  },
  "landmark-one-main": {
    title: "Missing Main Landmark",
    explanation: "The page does not have a <main> landmark region, making it difficult for assistive technology users to find primary content.",
    impact: "Screen reader users cannot quickly jump to the main content area, forcing them to navigate through all page elements.",
    recommendation: "Wrap the primary content area in a <main> element or add role=\"main\" to the appropriate container.",
  },
  "region": {
    title: "Content Outside Landmarks",
    explanation: "Some page content exists outside of defined landmark regions (header, nav, main, footer).",
    impact: "Assistive technology users may miss content that falls outside navigable landmark regions.",
    recommendation: "Ensure all visible content is contained within appropriate landmark regions.",
  },
};

/** Estimate fix time based on severity and element count */
function estimateFixTime(severity: Severity, elementCount: number): string {
  const baseMinutes: Record<Severity, number> = {
    critical: 30,
    serious: 20,
    moderate: 15,
    minor: 5,
  };
  const totalMinutes: number = baseMinutes[severity] + Math.ceil(elementCount * 2);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours: number = Math.round(totalMinutes / 60);
  return hours === 1 ? "~1 hour" : `~${hours} hours`;
}

/** Estimate total remediation time */
function estimateTotalFixTime(breakdown: IssueBreakdown): string {
  const totalHours: number = Math.ceil(
    (breakdown.critical * 2 + breakdown.serious * 1.5 + breakdown.moderate * 0.5 + breakdown.minor * 0.15)
  );
  if (totalHours <= 1) return "< 1 hour";
  if (totalHours <= 8) return `${totalHours} hours`;
  const days: number = Math.ceil(totalHours / 8);
  return days === 1 ? "~1 day" : `~${days} days`;
}

/** Determine risk level from score */
function determineRiskLevel(score: number, breakdown: IssueBreakdown): RiskLevel {
  if (score >= 90 && breakdown.critical === 0) return "LOW";
  if (score >= 70 && breakdown.critical <= 1) return "MEDIUM";
  if (score >= 50) return "HIGH";
  return "CRITICAL";
}

/** Determine maturity level */
function determineMaturityLevel(score: number): MaturityLevel {
  if (score >= 90) return "Proactive";
  if (score >= 75) return "Structured";
  if (score >= 50) return "Basic";
  return "Basic";
}

/** Determine WCAG status */
function determineWcagStatus(compliancePercentage: number): "pass" | "partial" | "fail" {
  if (compliancePercentage >= 95) return "pass";
  if (compliancePercentage >= 70) return "partial";
  return "fail";
}

/** Determine legal risk text */
function determineLegalRisk(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "LOW":
      return "Low legal exposure. Your site demonstrates strong accessibility compliance. Continue monitoring to maintain this standard.";
    case "MEDIUM":
      return "Moderate legal exposure. Some accessibility gaps exist that could result in complaints or regulatory attention. Remediation recommended within 30 days.";
    case "HIGH":
      return "High legal exposure. Significant accessibility barriers exist that may violate ADA, EAA, or equivalent regulations. Immediate remediation strongly recommended.";
    case "CRITICAL":
      return "Critical legal exposure. Your site has severe accessibility barriers affecting core functionality. Urgent remediation required to avoid potential legal action.";
  }
}

/** Extract WCAG criteria from axe tags */
function extractWcagCriteria(tags: string[]): string[] {
  return tags
    .filter((t: string) => t.startsWith("wcag") && /\d/.test(t))
    .map((t: string) => t.replace("wcag", "WCAG ").replace(/(\d)(\d)(\d+)/, "$1.$2.$3"))
    .slice(0, 3);
}

/** Transform a raw scan result into ReportData */
export function transformScanToReport(
  scan: {
    id: string;
    score: number | null;
    issues: number | null;
    impactCritical: number | null;
    impactSerious: number | null;
    impactModerate: number | null;
    impactMinor: number | null;
    wcagAACompliance?: number | null;
    wcagAAACompliance?: number | null;
    createdAt: string | Date;
    raw?: unknown;
    site: { url: string; userId?: string };
    page?: { url?: string; title?: string | null } | null;
  },
  themeConfig?: Partial<ReportThemeConfig>,
  whiteLabelConfig?: Partial<WhiteLabelConfig>,
  ctaConfig?: Partial<CTAConfig>,
  reportStyle?: ReportStyle
): ReportData {
  const score: number = scan.score ?? 0;
  const breakdown: IssueBreakdown = {
    total: scan.issues ?? 0,
    critical: scan.impactCritical ?? 0,
    serious: scan.impactSerious ?? 0,
    moderate: scan.impactModerate ?? 0,
    minor: scan.impactMinor ?? 0,
  };

  const riskLevel: RiskLevel = determineRiskLevel(score, breakdown);
  const compliancePercentage: number = scan.wcagAACompliance ?? Math.round(score * 0.95);

  // Extract violations from raw scan data
  let rawViolations: Array<{
    id: string;
    impact?: Severity | null;
    help?: string;
    description?: string;
    helpUrl?: string;
    tags?: string[];
    nodes?: Array<{ target?: string[]; html?: string }>;
  }> = [];
  if (scan.raw && typeof scan.raw === "object" && "violations" in (scan.raw as Record<string, unknown>)) {
    rawViolations = ((scan.raw as Record<string, unknown>).violations as typeof rawViolations) ?? [];
  }

  // Transform violations into executive-friendly issues
  const priorityIssues: ReportIssue[] = rawViolations
    .sort((a, b) => {
      const severityOrder: Record<string, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };
      return (severityOrder[a.impact ?? "minor"] ?? 3) - (severityOrder[b.impact ?? "minor"] ?? 3);
    })
    .slice(0, 15)
    .map((v) => {
      const severity: Severity = (v.impact as Severity) ?? "minor";
      const known = RULE_EXPLANATIONS[v.id];
      const elementCount: number = v.nodes?.length ?? 1;
      return {
        id: v.id,
        severity,
        title: known?.title ?? v.help ?? v.id,
        explanation: known?.explanation ?? v.description ?? "An accessibility issue was detected on this page.",
        impact: known?.impact ?? "Users with disabilities may encounter barriers when interacting with affected elements.",
        recommendation: known?.recommendation ?? "Review the affected elements and apply the appropriate WCAG fix.",
        affectedElements: elementCount,
        estimatedFixTime: estimateFixTime(severity, elementCount),
        wcagCriteria: extractWcagCriteria(v.tags ?? []),
      };
    });

  const domain: string = scan.page?.url ?? scan.site.url;
  let hostname: string;
  try {
    hostname = new URL(domain).hostname;
  } catch {
    hostname = domain;
  }

  const theme: ReportThemeConfig = { ...DEFAULT_THEME, ...themeConfig };
  const wl: WhiteLabelConfig = { ...DEFAULT_WHITE_LABEL, ...whiteLabelConfig };
  const cta: CTAConfig = { ...DEFAULT_CTA, ...ctaConfig };
  const style: ReportStyle = reportStyle ?? "premium";
  if (wl.primaryColor) theme.primaryColor = wl.primaryColor;

  const scanDate: string = typeof scan.createdAt === "string"
    ? scan.createdAt
    : scan.createdAt.toISOString();

  return {
    companyName: wl.companyNameOverride || "VexNexa",
    domain: hostname,
    scanDate,
    scanId: scan.id,
    score,
    complianceLevel: "WCAG 2.1 AA",
    compliancePercentage,
    wcagAAStatus: determineWcagStatus(compliancePercentage),
    wcagAAAStatus: determineWcagStatus(scan.wcagAAACompliance ?? Math.round(score * 0.7)),
    eaaReady: score >= 80 && breakdown.critical === 0,
    riskLevel,
    maturityLevel: determineMaturityLevel(score),
    issueBreakdown: breakdown,
    priorityIssues,
    legalRisk: determineLegalRisk(riskLevel),
    estimatedFixTime: estimateTotalFixTime(breakdown),
    engineName: "axe-core",
    engineVersion: "4.10",
    themeConfig: theme,
    whiteLabelConfig: wl,
    ctaConfig: cta,
    reportStyle: style,
    pageTitle: scan.page?.title ?? undefined,
    pagesScanned: 1,
  };
}
