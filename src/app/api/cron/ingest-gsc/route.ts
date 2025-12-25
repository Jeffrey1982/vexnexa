/**
 * Cron Job: Ingest Google Search Console Data
 * Fetches GSC metrics and stores in database
 * Secured by X-CRON-TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/cron-auth';
import {
  fetchGSCSiteMetrics,
  fetchGSCTopQueries,
  fetchGSCTopPages,
  getYesterday,
} from '@/lib/google/search-console';
import { prisma } from '@/lib/prisma';

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const siteUrl = process.env.GSC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'GSC_SITE_URL not configured' },
        { status: 500 }
      );
    }

    // Get yesterday's date (GSC has ~2-3 day lag, but we'll fetch yesterday and it will be empty if not ready)
    const yesterday = getYesterday();
    const queryLimit = parseInt(process.env.GSC_QUERY_LIMIT || '500');
    const pageLimit = parseInt(process.env.GSC_PAGE_LIMIT || '500');

    console.log(`[GSC Ingest] Starting for ${siteUrl}, date: ${yesterday}`);

    // Fetch site-level metrics
    const siteMetrics = await fetchGSCSiteMetrics(
      siteUrl,
      yesterday,
      yesterday
    );

    // Upsert site metrics
    await prisma.$executeRaw`
      INSERT INTO gsc_daily_site_metrics (date, site_url, clicks, impressions, ctr, position)
      VALUES (${yesterday}::date, ${siteUrl}, ${siteMetrics.clicks}, ${siteMetrics.impressions}, ${siteMetrics.ctr}, ${siteMetrics.position})
      ON CONFLICT (date, site_url)
      DO UPDATE SET
        clicks = EXCLUDED.clicks,
        impressions = EXCLUDED.impressions,
        ctr = EXCLUDED.ctr,
        position = EXCLUDED.position,
        updated_at = NOW()
    `;

    // Fetch top queries
    const queries = await fetchGSCTopQueries(
      siteUrl,
      yesterday,
      yesterday,
      queryLimit
    );

    console.log(`[GSC Ingest] Fetched ${queries.length} queries`);

    // Batch upsert queries
    for (const query of queries) {
      await prisma.$executeRaw`
        INSERT INTO gsc_daily_query_metrics (date, site_url, query, clicks, impressions, ctr, position)
        VALUES (${yesterday}::date, ${siteUrl}, ${query.query}, ${query.clicks}, ${query.impressions}, ${query.ctr}, ${query.position})
        ON CONFLICT (date, site_url, query)
        DO UPDATE SET
          clicks = EXCLUDED.clicks,
          impressions = EXCLUDED.impressions,
          ctr = EXCLUDED.ctr,
          position = EXCLUDED.position,
          updated_at = NOW()
      `;
    }

    // Fetch top pages
    const pages = await fetchGSCTopPages(
      siteUrl,
      yesterday,
      yesterday,
      pageLimit
    );

    console.log(`[GSC Ingest] Fetched ${pages.length} pages`);

    // Batch upsert pages
    for (const page of pages) {
      await prisma.$executeRaw`
        INSERT INTO gsc_daily_page_metrics (date, site_url, page, clicks, impressions, ctr, position)
        VALUES (${yesterday}::date, ${siteUrl}, ${page.page}, ${page.clicks}, ${page.impressions}, ${page.ctr}, ${page.position})
        ON CONFLICT (date, site_url, page)
        DO UPDATE SET
          clicks = EXCLUDED.clicks,
          impressions = EXCLUDED.impressions,
          ctr = EXCLUDED.ctr,
          position = EXCLUDED.position,
          updated_at = NOW()
      `;
    }

    const duration = Date.now() - startTime;

    console.log(`[GSC Ingest] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      date: yesterday,
      metrics: {
        site: siteMetrics,
        queriesCount: queries.length,
        pagesCount: pages.length,
      },
      duration,
    });
  } catch (error) {
    console.error('[GSC Ingest] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to ingest GSC data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
