export { renderReportHTML } from "./render-html";
export { transformScanToReport } from "./transform";
export {
  resolveWhiteLabelConfig,
  extractQueryOverrides,
  validateHex,
  validateImageUrl,
} from "./resolve-white-label";
export type {
  QueryParamOverrides,
  StoredWhiteLabelSettings,
  ResolvedWhiteLabel,
} from "./resolve-white-label";
export { fetchImageAsDataUrl, fetchImageAsBuffer } from "./fetch-image";
export type {
  ReportData,
  ReportThemeConfig,
  WhiteLabelConfig,
  CTAConfig,
  ReportStyle,
  ReportIssue,
  IssueBreakdown,
  Severity,
  RiskLevel,
  MaturityLevel,
} from "./types";
export { DEFAULT_THEME, DEFAULT_WHITE_LABEL, DEFAULT_CTA } from "./types";
