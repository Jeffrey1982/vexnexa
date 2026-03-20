/**
 * Centralized route constants for SEO landing pages.
 * Import from here instead of hardcoding paths to prevent link drift.
 */

export const SEO_ROUTES = {
  wcagScan: '/wcag-scan',
  accessibilityChecker: '/website-accessibility-checker',
  whiteLabelReports: '/white-label-accessibility-reports',
  monitoringAgencies: '/accessibility-monitoring-agencies',
  complianceReport: '/wcag-compliance-report',
} as const;

export type SeoRouteKey = keyof typeof SEO_ROUTES;
