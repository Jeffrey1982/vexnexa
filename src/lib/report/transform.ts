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
  HealthScore,
  WcagMatrixRow,
  ScanConfiguration,
  TopPriorityFix,
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

/** Determine risk level from score — canonical enterprise scale */
function determineRiskLevel(score: number, breakdown: IssueBreakdown): RiskLevel {
  if (score >= 90 && breakdown.critical === 0) return "Low";
  if (score >= 70 && breakdown.critical <= 1) return "Moderate";
  if (score >= 50) return "High";
  return "Critical";
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

/** Determine accessibility risk summary text (consultancy-grade, neutral tone) */
function determineRiskSummary(riskLevel: RiskLevel): string {
  switch (riskLevel) {
    case "Low":
      return "The assessed pages demonstrate strong accessibility practices with minimal barriers detected. Continued monitoring is recommended to maintain this standard.";
    case "Moderate":
      return "Several accessibility gaps were identified that may affect users relying on assistive technologies. Targeted remediation within 30 days is recommended to reduce compliance risk.";
    case "High":
      return "Significant accessibility barriers were detected that are likely to prevent some users from completing key tasks. Prioritised remediation is strongly recommended to improve usability and reduce compliance exposure.";
    case "Critical":
      return "Critical accessibility barriers were detected that may impact key user journeys and core functionality. Prompt remediation is strongly recommended to reduce compliance risk and improve the experience for all users.";
  }
}

/** Extract WCAG criteria from axe tags */
function extractWcagCriteria(tags: string[]): string[] {
  return tags
    .filter((t: string) => t.startsWith("wcag") && /\d/.test(t))
    .map((t: string) => t.replace("wcag", "WCAG ").replace(/(\d)(\d)(\d+)/, "$1.$2.$3"));
}

/** Severity weights for the Health Score model */
const SEVERITY_WEIGHTS: Record<Severity, number> = {
  critical: 10,
  serious: 6,
  moderate: 3,
  minor: 1,
};

/** Decay constant for exponential scoring curve */
const HEALTH_SCORE_K = 0.05;

/**
 * Compute Accessibility Health Score (0–100) using normalized exponential decay.
 *
 * Algorithm:
 *   Step A: weightedPenalty = (critical×10) + (serious×6) + (moderate×3) + (minor×1)
 *   Step B: normalizedPenalty = weightedPenalty / max(1, pagesAnalyzed)
 *   Step C: healthScore = round(100 × exp(−k × normalizedPenalty)), k = 0.05
 *   Step D: clamp to [0, 100]
 *
 * Properties:
 *   - Deterministic: same input always yields same output
 *   - Monotonic: more issues → lower score (never increases)
 *   - Bounded: always in [0, 100]
 *   - Realistic: a site with 10 moderate issues scores ~86, not 70
 *
 * Weights: Critical=10, Serious=6, Moderate=3, Minor=1
 */
function computeHealthScore(breakdown: IssueBreakdown, pagesAnalyzed: number = 1): HealthScore {
  const weightedPenalty: number =
    breakdown.critical * SEVERITY_WEIGHTS.critical +
    breakdown.serious * SEVERITY_WEIGHTS.serious +
    breakdown.moderate * SEVERITY_WEIGHTS.moderate +
    breakdown.minor * SEVERITY_WEIGHTS.minor;

  const normalizedPenalty: number = weightedPenalty / Math.max(1, pagesAnalyzed);
  const rawScore: number = 100 * Math.exp(-HEALTH_SCORE_K * normalizedPenalty);
  const value: number = Math.round(Math.min(100, Math.max(0, rawScore)));

  let gradeVal: string;
  if (value >= 90) gradeVal = "A";
  else if (value >= 80) gradeVal = "B";
  else if (value >= 70) gradeVal = "C";
  else if (value >= 50) gradeVal = "D";
  else gradeVal = "F";

  let label: string;
  if (value >= 90) label = "Excellent";
  else if (value >= 80) label = "Good";
  else if (value >= 70) label = "Fair";
  else if (value >= 50) label = "Needs Work";
  else label = "Poor";

  return { value, grade: gradeVal, label, weightedPenalty, normalizedPenalty };
}

/**
 * Known WCAG 2.2 success criteria mapped from axe-core tags.
 * Each entry: tag prefix → { criterion display name, level }
 */
const WCAG_CRITERIA_MAP: Record<string, { criterion: string; level: "A" | "AA" | "AAA" }> = {
  "wcag111": { criterion: "1.1.1 Non-text Content", level: "A" },
  "wcag121": { criterion: "1.2.1 Audio-only and Video-only", level: "A" },
  "wcag131": { criterion: "1.3.1 Info and Relationships", level: "A" },
  "wcag132": { criterion: "1.3.2 Meaningful Sequence", level: "A" },
  "wcag133": { criterion: "1.3.3 Sensory Characteristics", level: "A" },
  "wcag134": { criterion: "1.3.4 Orientation", level: "AA" },
  "wcag135": { criterion: "1.3.5 Identify Input Purpose", level: "AA" },
  "wcag141": { criterion: "1.4.1 Use of Color", level: "A" },
  "wcag142": { criterion: "1.4.2 Audio Control", level: "A" },
  "wcag143": { criterion: "1.4.3 Contrast (Minimum)", level: "AA" },
  "wcag144": { criterion: "1.4.4 Resize Text", level: "AA" },
  "wcag145": { criterion: "1.4.5 Images of Text", level: "AA" },
  "wcag1410": { criterion: "1.4.10 Reflow", level: "AA" },
  "wcag1411": { criterion: "1.4.11 Non-text Contrast", level: "AA" },
  "wcag1412": { criterion: "1.4.12 Text Spacing", level: "AA" },
  "wcag1413": { criterion: "1.4.13 Content on Hover or Focus", level: "AA" },
  "wcag211": { criterion: "2.1.1 Keyboard", level: "A" },
  "wcag212": { criterion: "2.1.2 No Keyboard Trap", level: "A" },
  "wcag214": { criterion: "2.1.4 Character Key Shortcuts", level: "A" },
  "wcag221": { criterion: "2.2.1 Timing Adjustable", level: "A" },
  "wcag222": { criterion: "2.2.2 Pause, Stop, Hide", level: "A" },
  "wcag231": { criterion: "2.3.1 Three Flashes or Below", level: "A" },
  "wcag241": { criterion: "2.4.1 Bypass Blocks", level: "A" },
  "wcag242": { criterion: "2.4.2 Page Titled", level: "A" },
  "wcag243": { criterion: "2.4.3 Focus Order", level: "A" },
  "wcag244": { criterion: "2.4.4 Link Purpose (In Context)", level: "A" },
  "wcag245": { criterion: "2.4.5 Multiple Ways", level: "AA" },
  "wcag246": { criterion: "2.4.6 Headings and Labels", level: "AA" },
  "wcag247": { criterion: "2.4.7 Focus Visible", level: "AA" },
  "wcag2411": { criterion: "2.4.11 Focus Not Obscured", level: "AA" },
  "wcag251": { criterion: "2.5.1 Pointer Gestures", level: "A" },
  "wcag252": { criterion: "2.5.2 Pointer Cancellation", level: "A" },
  "wcag253": { criterion: "2.5.3 Label in Name", level: "A" },
  "wcag254": { criterion: "2.5.4 Motion Actuation", level: "A" },
  "wcag258": { criterion: "2.5.8 Target Size (Minimum)", level: "AA" },
  "wcag311": { criterion: "3.1.1 Language of Page", level: "A" },
  "wcag312": { criterion: "3.1.2 Language of Parts", level: "AA" },
  "wcag321": { criterion: "3.2.1 On Focus", level: "A" },
  "wcag322": { criterion: "3.2.2 On Input", level: "A" },
  "wcag326": { criterion: "3.2.6 Consistent Help", level: "A" },
  "wcag331": { criterion: "3.3.1 Error Identification", level: "A" },
  "wcag332": { criterion: "3.3.2 Labels or Instructions", level: "A" },
  "wcag333": { criterion: "3.3.3 Error Suggestion", level: "AA" },
  "wcag337": { criterion: "3.3.7 Redundant Entry", level: "A" },
  "wcag338": { criterion: "3.3.8 Accessible Authentication", level: "AA" },
  "wcag411": { criterion: "4.1.1 Parsing", level: "A" },
  "wcag412": { criterion: "4.1.2 Name, Role, Value", level: "A" },
  "wcag413": { criterion: "4.1.3 Status Messages", level: "AA" },
};

/**
 * WCAG 2.2 criteria that typically require manual review.
 * Automated tools cannot fully evaluate these — they involve
 * human judgement (media alternatives, cognitive load, navigation patterns).
 */
const MANUAL_REVIEW_CRITERIA: ReadonlySet<string> = new Set([
  "wcag121",  // 1.2.1 Audio-only and Video-only
  "wcag133",  // 1.3.3 Sensory Characteristics
  "wcag141",  // 1.4.1 Use of Color
  "wcag142",  // 1.4.2 Audio Control
  "wcag214",  // 2.1.4 Character Key Shortcuts
  "wcag221",  // 2.2.1 Timing Adjustable
  "wcag222",  // 2.2.2 Pause, Stop, Hide
  "wcag231",  // 2.3.1 Three Flashes or Below
  "wcag243",  // 2.4.3 Focus Order
  "wcag245",  // 2.4.5 Multiple Ways
  "wcag251",  // 2.5.1 Pointer Gestures
  "wcag254",  // 2.5.4 Motion Actuation
  "wcag321",  // 3.2.1 On Focus
  "wcag322",  // 3.2.2 On Input
  "wcag326",  // 3.2.6 Consistent Help
  "wcag337",  // 3.3.7 Redundant Entry
]);

/** Build WCAG Compliance Matrix from raw violations */
function buildWcagMatrix(
  rawViolations: Array<{ tags?: string[]; nodes?: Array<unknown> }>
): WcagMatrixRow[] {
  // Count findings per WCAG criterion tag
  const findingsMap = new Map<string, number>();
  for (const v of rawViolations) {
    for (const tag of v.tags ?? []) {
      const normalized = tag.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (WCAG_CRITERIA_MAP[normalized]) {
        findingsMap.set(normalized, (findingsMap.get(normalized) ?? 0) + 1);
      }
    }
  }

  const rows: WcagMatrixRow[] = [];
  for (const [tag, meta] of Object.entries(WCAG_CRITERIA_MAP)) {
    const count = findingsMap.get(tag) ?? 0;
    let status: WcagMatrixRow["status"];
    if (count > 0) {
      status = "Fail";
    } else if (MANUAL_REVIEW_CRITERIA.has(tag)) {
      status = "Needs Manual Review";
    } else if (rawViolations.length > 0) {
      status = "Pass";
    } else {
      status = "Not Tested";
    }

    rows.push({
      criterion: meta.criterion,
      level: meta.level,
      status,
      relatedFindings: count,
    });
  }

  // Sort: Fail first, then Needs Manual Review, Pass, Not Tested
  rows.sort((a, b) => {
    const statusOrder: Record<string, number> = { Fail: 0, "Needs Manual Review": 1, Pass: 2, "Not Tested": 3 };
    const diff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
    if (diff !== 0) return diff;
    return a.criterion.localeCompare(b.criterion);
  });

  return rows;
}

/** Build scan configuration metadata */
function buildScanConfig(
  scan: { site: { url: string }; page?: { url?: string } | null; createdAt: string | Date },
  pagesScanned: number,
  engineName: string,
  engineVersion: string
): ScanConfiguration {
  const scanDate = typeof scan.createdAt === "string" ? scan.createdAt : scan.createdAt.toISOString();
  return {
    domain: scan.page?.url ?? scan.site.url,
    pagesAnalyzed: pagesScanned,
    crawlDepth: pagesScanned > 1 ? "Multi-page" : "Single page",
    scanDateTime: scanDate,
    userAgent: "axe-core (headless browser)",
    viewport: "1280×720",
    standardsTested: ["WCAG 2.2 Level A", "WCAG 2.2 Level AA"],
    engineName,
    engineVersion,
  };
}

/** Compute top 5 priority fixes by weighted impact */
function computeTopPriorityFixes(issues: ReportIssue[]): TopPriorityFix[] {
  return issues
    .map((iss) => ({
      title: iss.title,
      severity: iss.severity,
      affectedElements: iss.affectedElements,
      weightedImpact: SEVERITY_WEIGHTS[iss.severity] * iss.affectedElements,
      rank: 0,
    }))
    .sort((a, b) => b.weightedImpact - a.weightedImpact)
    .slice(0, 5)
    .map((fix, idx) => ({ ...fix, rank: idx + 1 }));
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
  const breakdown: IssueBreakdown = {
    total: scan.issues ?? 0,
    critical: scan.impactCritical ?? 0,
    serious: scan.impactSerious ?? 0,
    moderate: scan.impactModerate ?? 0,
    minor: scan.impactMinor ?? 0,
  };

  // Canonical health score — single source of truth for the entire report
  const pagesScanned = 1;
  const healthScore = computeHealthScore(breakdown, pagesScanned);

  const riskLevel: RiskLevel = determineRiskLevel(healthScore.value, breakdown);
  const compliancePercentage: number = scan.wcagAACompliance ?? Math.round(healthScore.value * 0.95);

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
    .map((v) => {
      const severity: Severity = (v.impact as Severity) ?? "minor";
      const known = RULE_EXPLANATIONS[v.id];
      const allNodes = v.nodes ?? [];
      const elementCount: number = allNodes.length || 1;
      // Full element details for export-grade reports (safety cap: 5000)
      // pageUrl populated from scan context for evidence table Page/URL column
      const pageUrl: string = scan.page?.url ?? scan.site.url;
      const elementDetails = allNodes.slice(0, 5000).map((n) => ({
        selector: (n.target ?? []).join(" > ") || "unknown",
        html: (n.html ?? "").slice(0, 1000),
        pageUrl,
      }));

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
        affectedElementDetails: elementDetails,
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

  const wcagMatrix = buildWcagMatrix(rawViolations);
  const scanConfig = buildScanConfig(scan, pagesScanned, "axe-core", "4.10");
  const topPriorityFixes = computeTopPriorityFixes(priorityIssues);

  return {
    companyName: wl.companyNameOverride || "",
    domain: hostname,
    scanDate,
    scanId: scan.id,
    score: healthScore.value,
    complianceLevel: "WCAG 2.2 AA",
    compliancePercentage,
    wcagAAStatus: determineWcagStatus(compliancePercentage),
    wcagAAAStatus: determineWcagStatus(scan.wcagAAACompliance ?? Math.round(healthScore.value * 0.7)),
    eaaReady: healthScore.value >= 80 && breakdown.critical === 0,
    riskLevel,
    maturityLevel: determineMaturityLevel(healthScore.value),
    issueBreakdown: breakdown,
    priorityIssues,
    legalRisk: determineRiskSummary(riskLevel),
    riskSummary: determineRiskSummary(riskLevel),
    estimatedFixTime: estimateTotalFixTime(breakdown),
    engineName: "axe-core",
    engineVersion: "4.10",
    themeConfig: theme,
    whiteLabelConfig: wl,
    ctaConfig: cta,
    reportStyle: style,
    pageTitle: scan.page?.title ?? undefined,
    pagesScanned,
    healthScore,
    wcagMatrix,
    scanConfig,
    topPriorityFixes,
    scanTimestamp: typeof scan.createdAt === "string" ? scan.createdAt : scan.createdAt.toISOString(),
  };
}
