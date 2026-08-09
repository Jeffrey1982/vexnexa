/**
 * Server-side kill switches for public scan reports.
 *
 * Both capabilities are fail-closed: only the exact string "true" enables
 * them. Indexing can never be enabled while publication is disabled.
 */
export interface PublicReportPolicy {
  publicationEnabled: boolean;
  indexingEnabled: boolean;
}

type PublicReportEnvironment = {
  PUBLIC_REPORTS_ENABLED?: string;
  PUBLIC_REPORT_INDEXING_ENABLED?: string;
};

function isExplicitlyEnabled(value: string | undefined): boolean {
  return value === "true";
}

export function getPublicReportPolicy(
  env: PublicReportEnvironment = {
    PUBLIC_REPORTS_ENABLED: process.env.PUBLIC_REPORTS_ENABLED,
    PUBLIC_REPORT_INDEXING_ENABLED: process.env.PUBLIC_REPORT_INDEXING_ENABLED,
  }
): PublicReportPolicy {
  const publicationEnabled = isExplicitlyEnabled(env.PUBLIC_REPORTS_ENABLED);

  return {
    publicationEnabled,
    indexingEnabled:
      publicationEnabled && isExplicitlyEnabled(env.PUBLIC_REPORT_INDEXING_ENABLED),
  };
}

export function arePublicReportsEnabled(): boolean {
  return getPublicReportPolicy().publicationEnabled;
}

export function isPublicReportIndexingEnabled(): boolean {
  return getPublicReportPolicy().indexingEnabled;
}
