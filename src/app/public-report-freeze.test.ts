import { afterEach, describe, expect, it } from 'vitest';
import robots from './robots';
import { GET as getSitemapIndex } from './sitemap.xml/route';
import { GET as getReportSitemap } from './sitemap_reports.xml/route';

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

describe('public report discovery freeze', () => {
  it('omits report discovery and returns an empty noindex report sitemap by default', async () => {
    delete process.env.PUBLIC_REPORTS_ENABLED;
    delete process.env.PUBLIC_REPORT_INDEXING_ENABLED;

    const sitemapIndex = await getSitemapIndex();
    expect(await sitemapIndex.text()).not.toContain('sitemap_reports.xml');
    expect(sitemapIndex.headers.get('cache-control')).toBe('no-store');

    const reportSitemap = await getReportSitemap();
    const reportXml = await reportSitemap.text();
    expect(reportXml).not.toContain('<url>');
    expect(reportSitemap.headers.get('x-robots-tag')).toBe('noindex, nofollow');
    expect(reportSitemap.headers.get('cache-control')).toBe('no-store');

    const rules = robots().rules;
    expect(JSON.stringify(rules)).not.toContain('/report/*');
  });

  it('adds the report sitemap only when publication and indexing are both enabled', async () => {
    process.env.PUBLIC_REPORTS_ENABLED = 'true';
    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'false';
    expect(await (await getSitemapIndex()).text()).not.toContain('sitemap_reports.xml');

    process.env.PUBLIC_REPORT_INDEXING_ENABLED = 'true';
    expect(await (await getSitemapIndex()).text()).toContain('sitemap_reports.xml');
    expect(JSON.stringify(robots().rules)).toContain('/report/*');
  });
});
