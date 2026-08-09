import { afterEach, describe, expect, it } from 'vitest';
import {
  getIndexablePublicDomains,
  getLatestPublicReport,
  getPublicReportByScanId,
  getPublicReportHistory,
  isPublicReportIndexable,
  PUBLIC_REPORT_PUBLICATION_GRANT_VERSION,
  publishScanReport,
  type PublishableScan,
} from './public-reports';

const originalReportsEnabled = process.env.PUBLIC_REPORTS_ENABLED;
const originalIndexingEnabled = process.env.PUBLIC_REPORT_INDEXING_ENABLED;

const eligibleScan: PublishableScan = {
  id: 'scan-1',
  score: 70,
  issues: 3,
  impactCritical: 0,
  impactSerious: 1,
  impactModerate: 2,
  impactMinor: 0,
  wcagAACompliance: 70,
  wcagAAACompliance: 50,
  performanceScore: 80,
  seoScore: 80,
  raw: {
    violations: [
      { id: 'a', impact: 'serious' },
      { id: 'b', impact: 'moderate' },
      { id: 'c', impact: 'moderate' },
    ],
  },
  status: 'COMPLETED',
  site: { url: 'https://example.com' },
  createdAt: new Date('2026-08-09T09:00:00.000Z'),
};

afterEach(() => {
  if (originalReportsEnabled === undefined) {
    delete process.env.PUBLIC_REPORTS_ENABLED;
  } else {
    process.env.PUBLIC_REPORTS_ENABLED = originalReportsEnabled;
  }

  if (originalIndexingEnabled === undefined) {
    delete process.env.PUBLIC_REPORT_INDEXING_ENABLED;
  } else {
    process.env.PUBLIC_REPORT_INDEXING_ENABLED = originalIndexingEnabled;
  }
});

describe('public report freeze', () => {
  it('closes all public query helpers while publication is disabled', async () => {
    process.env.PUBLIC_REPORTS_ENABLED = 'false';
    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'true';

    await expect(getLatestPublicReport('example.com')).resolves.toBeNull();
    await expect(getPublicReportByScanId('example.com', 'scan-1')).resolves.toBeNull();
    await expect(getPublicReportHistory('example.com')).resolves.toEqual([]);
    await expect(getIndexablePublicDomains()).resolves.toEqual([]);
  });

  it('does not publish without an explicit valid grant, even when the env flag is enabled', async () => {
    process.env.PUBLIC_REPORTS_ENABLED = 'true';

    await expect(
      (publishScanReport as unknown as (scan: PublishableScan) => Promise<unknown>)(eligibleScan)
    ).resolves.toBeNull();
  });

  it('does not publish with a valid grant while the server policy is disabled', async () => {
    process.env.PUBLIC_REPORTS_ENABLED = 'false';

    await expect(
      publishScanReport(eligibleScan, {
        explicitlyAuthorized: true,
        authorizationVersion: PUBLIC_REPORT_PUBLICATION_GRANT_VERSION,
        authorizationReference: 'consent-record-1',
        authorizedByUserId: 'user-1',
        authorizedAt: new Date('2026-08-09T09:00:00.000Z'),
        allowIndexing: true,
      })
    ).resolves.toBeNull();
  });

  it('requires both publication and indexing flags before a report is indexable', () => {
    const report = {
      allow_indexing: true,
      issues_total: 3,
      impact_critical: 0,
      impact_serious: 1,
      impact_moderate: 2,
      top_violations: [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
    };

    process.env.PUBLIC_REPORTS_ENABLED = 'true';
    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'false';
    expect(isPublicReportIndexable(report)).toBe(false);

    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'true';
    expect(isPublicReportIndexable(report)).toBe(true);
  });
});
