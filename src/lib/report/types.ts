/** Report visual style */
export type ReportStyle = "premium" | "corporate";

/** Theme configuration for the report */
export interface ReportThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  darkColor: string;
}

/** CTA configuration for white-label partners */
export interface CTAConfig {
  ctaUrl: string;
  ctaText: string;
  supportEmail: string;
}

/** White-label configuration */
export interface WhiteLabelConfig {
  showVexNexaBranding: boolean;
  logoUrl: string;
  primaryColor: string;
  footerText: string;
  companyNameOverride: string;
}

/** Severity level */
export type Severity = "critical" | "serious" | "moderate" | "minor";

/** Risk level */
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

/** Maturity level */
export type MaturityLevel = "Basic" | "Structured" | "Proactive" | "Continuous";

/** Detail about a single affected DOM element */
export interface AffectedElementDetail {
  selector: string;
  html: string;
  pageUrl?: string;
}

/**
 * Accessibility Health Score — normalized exponential decay model.
 *
 * Formula:
 *   Step A: weightedPenalty = (critical × 10) + (serious × 6) + (moderate × 3) + (minor × 1)
 *   Step B: normalizedPenalty = weightedPenalty / max(1, pagesAnalyzed)
 *   Step C: healthScore = round(100 × exp(−k × normalizedPenalty)), k = 0.05
 *   Step D: clamp to [0, 100]
 *
 * Properties: deterministic, monotonic, bounded 0–100
 * Weights: Critical=10, Serious=6, Moderate=3, Minor=1
 */
export interface HealthScore {
  value: number;
  grade: string;
  label: string;
  weightedPenalty: number;
  normalizedPenalty: number;
}

/** A single row in the WCAG Compliance Matrix */
export interface WcagMatrixRow {
  criterion: string;
  level: "A" | "AA" | "AAA";
  status: "Pass" | "Fail" | "Needs Manual Review" | "Not Tested";
  relatedFindings: number;
}

/** Scan configuration / methodology metadata */
export interface ScanConfiguration {
  domain: string;
  pagesAnalyzed: number;
  crawlDepth: string;
  scanDateTime: string;
  userAgent: string;
  viewport: string;
  standardsTested: string[];
  engineName: string;
  engineVersion: string;
}

/** Top priority fix item for executive summary */
export interface TopPriorityFix {
  rank: number;
  title: string;
  severity: Severity;
  affectedElements: number;
  weightedImpact: number;
}

/** A single priority issue for the report */
export interface ReportIssue {
  id: string;
  severity: Severity;
  title: string;
  explanation: string;
  impact: string;
  recommendation: string;
  affectedElements: number;
  estimatedFixTime: string;
  wcagCriteria: string[];
  affectedElementDetails: AffectedElementDetail[];
}

/** Issue breakdown counts */
export interface IssueBreakdown {
  total: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

/** The full report data model */
export interface ReportData {
  companyName: string;
  domain: string;
  scanDate: string;
  scanId: string;
  score: number;
  complianceLevel: string;
  compliancePercentage: number;
  wcagAAStatus: "pass" | "partial" | "fail";
  wcagAAAStatus: "pass" | "partial" | "fail";
  eaaReady: boolean;
  riskLevel: RiskLevel;
  maturityLevel: MaturityLevel;
  issueBreakdown: IssueBreakdown;
  priorityIssues: ReportIssue[];
  /** @deprecated Use riskSummary. Kept for backward compatibility. */
  legalRisk: string;
  riskSummary: string;
  estimatedFixTime: string;
  engineName: string;
  engineVersion: string;
  themeConfig: ReportThemeConfig;
  whiteLabelConfig: WhiteLabelConfig;
  ctaConfig: CTAConfig;
  reportStyle: ReportStyle;
  pageTitle?: string;
  pagesScanned?: number;
  faviconUrl?: string;
  healthScore: HealthScore;
  wcagMatrix: WcagMatrixRow[];
  scanConfig: ScanConfiguration;
  topPriorityFixes: TopPriorityFix[];
}

/** Default theme */
export const DEFAULT_THEME: ReportThemeConfig = {
  primaryColor: "#D45A00",
  secondaryColor: "#0F5C5C",
  accentColor: "#FFD166",
  backgroundColor: "#F8F9FA",
  darkColor: "#1E1E1E",
};

/** Default CTA config */
export const DEFAULT_CTA: CTAConfig = {
  ctaUrl: "",
  ctaText: "Get Started",
  supportEmail: "",
};

/** Default white-label config */
export const DEFAULT_WHITE_LABEL: WhiteLabelConfig = {
  showVexNexaBranding: false,
  logoUrl: "",
  primaryColor: "#D45A00",
  footerText: "",
  companyNameOverride: "",
};
