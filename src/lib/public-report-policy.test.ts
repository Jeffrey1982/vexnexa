import { afterEach, describe, expect, it } from 'vitest';
import {
  arePublicReportsEnabled,
  getPublicReportPolicy,
  isPublicReportIndexingEnabled,
} from './public-report-policy';

const originalReportsEnabled = process.env.PUBLIC_REPORTS_ENABLED;
const originalIndexingEnabled = process.env.PUBLIC_REPORT_INDEXING_ENABLED;

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

describe('public report policy', () => {
  it('defaults publication and indexing to disabled', () => {
    expect(getPublicReportPolicy({
      PUBLIC_REPORTS_ENABLED: undefined,
      PUBLIC_REPORT_INDEXING_ENABLED: undefined,
    })).toEqual({ publicationEnabled: false, indexingEnabled: false });
  });

  it('accepts only the exact value true', () => {
    expect(getPublicReportPolicy({
      PUBLIC_REPORTS_ENABLED: 'TRUE',
      PUBLIC_REPORT_INDEXING_ENABLED: 'true',
    })).toEqual({ publicationEnabled: false, indexingEnabled: false });

    expect(getPublicReportPolicy({
      PUBLIC_REPORTS_ENABLED: 'true',
      PUBLIC_REPORT_INDEXING_ENABLED: 'false',
    })).toEqual({ publicationEnabled: true, indexingEnabled: false });
  });

  it('never enables indexing without publication', () => {
    process.env.PUBLIC_REPORTS_ENABLED = 'false';
    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'true';

    expect(arePublicReportsEnabled()).toBe(false);
    expect(isPublicReportIndexingEnabled()).toBe(false);

    process.env.PUBLIC_REPORTS_ENABLED = 'true';
    expect(arePublicReportsEnabled()).toBe(true);
    expect(isPublicReportIndexingEnabled()).toBe(true);
  });
});
