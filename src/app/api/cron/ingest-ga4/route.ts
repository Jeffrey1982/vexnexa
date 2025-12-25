/**
 * Cron Job: Ingest GA4 Data
 * Fetches GA4 landing page metrics and stores in database
 * Secured by X-CRON-TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/cron-auth';
import { fetchGA4LandingPageMetrics } from '@/lib/google/analytics';
import { getYesterday } from '@/lib/google/search-console';
import { prisma } from '@/lib/prisma';

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const propertyId = process.env.GA4_PROPERTY_ID;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'GA4_PROPERTY_ID not configured' },
        { status: 500 }
      );
    }

    // Get yesterday's date
    const yesterday = getYesterday();
    const limit = parseInt(process.env.GA4_PAGE_LIMIT || '500');

    console.log(
      `[GA4 Ingest] Starting for property ${propertyId}, date: ${yesterday}`
    );

    // Fetch landing page metrics
    const landingPages = await fetchGA4LandingPageMetrics(
      propertyId,
      yesterday,
      yesterday,
      limit
    );

    console.log(`[GA4 Ingest] Fetched ${landingPages.length} landing pages`);

    // Batch upsert landing page metrics
    for (const page of landingPages) {
      await prisma.$executeRaw`
        INSERT INTO ga4_daily_landing_metrics (
          date,
          property_id,
          landing_page,
          organic_sessions,
          engaged_sessions,
          engagement_rate,
          avg_engagement_time_seconds,
          total_users,
          returning_users,
          events_per_session,
          conversions
        )
        VALUES (
          ${yesterday}::date,
          ${propertyId},
          ${page.landingPage},
          ${page.organicSessions},
          ${page.engagedSessions},
          ${page.engagementRate},
          ${page.avgEngagementTimeSeconds},
          ${page.totalUsers},
          ${page.returningUsers},
          ${page.eventsPerSession},
          ${JSON.stringify(page.conversions)}::jsonb
        )
        ON CONFLICT (date, property_id, landing_page)
        DO UPDATE SET
          organic_sessions = EXCLUDED.organic_sessions,
          engaged_sessions = EXCLUDED.engaged_sessions,
          engagement_rate = EXCLUDED.engagement_rate,
          avg_engagement_time_seconds = EXCLUDED.avg_engagement_time_seconds,
          total_users = EXCLUDED.total_users,
          returning_users = EXCLUDED.returning_users,
          events_per_session = EXCLUDED.events_per_session,
          conversions = EXCLUDED.conversions,
          updated_at = NOW()
      `;
    }

    const duration = Date.now() - startTime;

    console.log(`[GA4 Ingest] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      date: yesterday,
      metrics: {
        landingPagesCount: landingPages.length,
      },
      duration,
    });
  } catch (error) {
    console.error('[GA4 Ingest] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to ingest GA4 data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
