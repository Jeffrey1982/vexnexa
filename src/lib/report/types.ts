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
  legalRisk: string;
  estimatedFixTime: string;
  engineName: string;
  engineVersion: string;
  themeConfig: ReportThemeConfig;
  whiteLabelConfig: WhiteLabelConfig;
  ctaConfig: CTAConfig;
  reportStyle: ReportStyle;
  pageTitle?: string;
  pagesScanned?: number;
}

/** Default theme */
export const DEFAULT_THEME: ReportThemeConfig = {
  primaryColor: "#FF6B35",
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
  primaryColor: "#FF6B35",
  footerText: "",
  companyNameOverride: "",
};
