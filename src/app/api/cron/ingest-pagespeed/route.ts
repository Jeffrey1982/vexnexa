/**
 * Cron Job: Ingest PageSpeed Insights Data (Optional)
 * Fetches Core Web Vitals for watched pages
 * Only runs if PAGESPEED_API_KEY is set
 * Secured by X-CRON-TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/cron-auth';
import {
  batchFetchPageSpeedMetrics,
  isPageSpeedEnabled,
} from '@/lib/google/pagespeed';
import { getYesterday } from '@/lib/google/search-console';
import { prisma } from '@/lib/prisma';

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Check if PageSpeed is enabled
    if (!isPageSpeedEnabled()) {
      console.log('[PageSpeed Ingest] Skipped - PAGESPEED_API_KEY not set');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'PAGESPEED_API_KEY not configured',
      });
    }

    const yesterday = getYesterday();
    const siteUrl = process.env.GSC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json(
        { error: 'GSC_SITE_URL not configured' },
        { status: 500 }
      );
    }

    console.log(`[PageSpeed Ingest] Starting for ${siteUrl}, date: ${yesterday}`);

    // Fetch watched pages from database
    const watchedPages = await prisma.$queryRaw<{ page_path: string }[]>`
      SELECT page_path FROM watched_pages WHERE enabled = true
    `;

    console.log(`[PageSpeed Ingest] Found ${watchedPages.length} watched pages`);

    if (watchedPages.length === 0) {
      // If no watched pages, test the homepage
      watchedPages.push({ page_path: '/' });
    }

    // Build full URLs
    const baseUrl = siteUrl.replace(/\/$/, ''); // Remove trailing slash
    const urls = watchedPages.map((p) => {
      const path = p.page_path.startsWith('/') ? p.page_path : `/${p.page_path}`;
      return `${baseUrl}${path}`;
    });

    // Fetch PageSpeed metrics for mobile and desktop
    const mobileMetrics = await batchFetchPageSpeedMetrics(urls, 'mobile', 3000);
    const desktopMetrics = await batchFetchPageSpeedMetrics(urls, 'desktop', 3000);

    const allMetrics = [...mobileMetrics, ...desktopMetrics];

    console.log(`[PageSpeed Ingest] Fetched ${allMetrics.length} PageSpeed results`);

    // Upsert PageSpeed metrics
    for (const metric of allMetrics) {
      await prisma.$executeRaw`
        INSERT INTO pagespeed_daily_metrics (
          date,
          url,
          strategy,
          performance_score,
          lcp,
          cls,
          inp
        )
        VALUES (
          ${yesterday}::date,
          ${metric.url},
          ${metric.strategy},
          ${metric.performanceScore},
          ${metric.lcp},
          ${metric.cls},
          ${metric.inp}
        )
        ON CONFLICT (date, url, strategy)
        DO UPDATE SET
          performance_score = EXCLUDED.performance_score,
          lcp = EXCLUDED.lcp,
          cls = EXCLUDED.cls,
          inp = EXCLUDED.inp,
          updated_at = NOW()
      `;
    }

    const duration = Date.now() - startTime;

    console.log(`[PageSpeed Ingest] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      date: yesterday,
      metrics: {
        urlsChecked: urls.length,
        resultsCount: allMetrics.length,
      },
      duration,
    });
  } catch (error) {
    console.error('[PageSpeed Ingest] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to ingest PageSpeed data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
