/**
 * Google Health & Visibility Score Engine
 * Calculates 0-1000 score based on Google Search Console, GA4, and PageSpeed data
 */

import { prisma } from '@/lib/prisma';

// Utility functions
export function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function normLinear(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

export function normLog(value: number, baseline: number, scale: number = 1): number {
  if (value <= 0) return 0;
  const ratio = value / baseline;
  return clamp01(Math.log(ratio * scale + 1) / Math.log(scale + 1));
}

export function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 1 : 0;
  return (current - previous) / previous;
}

export interface ScoreBreakdown {
  p1IndexCrawlHealth: {
    score: number;
    maxScore: number;
    components: {
      impressionsTrend: number;
      indexCoverage: number;
      crawlErrors: number;
    };
  };
  p2SearchVisibility: {
    score: number;
    maxScore: number;
    components: {
      clicksTrend: number;
      topQueriesPerformance: number;
      avgPosition: number;
    };
  };
  p3EngagementIntent: {
    score: number;
    maxScore: number;
    components: {
      ctrQuality: number;
      engagementRate: number;
      returningUsers: number;
    };
  };
  p4ContentPerformance: {
    score: number;
    maxScore: number;
    components: {
      topPagesGrowth: number;
      contentDepth: number;
      conversionQuality: number;
    };
  };
  p5TechnicalExperience: {
    score: number;
    maxScore: number;
    components: {
      coreWebVitals: number;
      mobileUsability: number;
    };
  };
}

/**
 * Calculate P1: Index & Crawl Health (0-250 points)
 */
export async function calculateP1(date: string): Promise<ScoreBreakdown['p1IndexCrawlHealth']> {
  const siteUrl = process.env.GSC_SITE_URL!;

  // Get current day metrics
  const current = await prisma.$queryRaw<any[]>`
    SELECT impressions, clicks, position
    FROM gsc_daily_site_metrics
    WHERE date = ${date}::date AND site_url = ${siteUrl}
    LIMIT 1
  `;

  // Get 7-day average for comparison
  const prev7d = await prisma.$queryRaw<any[]>`
    SELECT AVG(impressions) as avg_impressions
    FROM gsc_daily_site_metrics
    WHERE date >= ${date}::date - INTERVAL '7 days'
      AND date < ${date}::date
      AND site_url = ${siteUrl}
  `;

  const currentImpressions = current[0]?.impressions || 0;
  const prev7dImpressions = prev7d[0]?.avg_impressions || currentImpressions;

  // Component 1: Impressions Trend (0-100)
  const impressionGrowth = pctChange(currentImpressions, prev7dImpressions);
  const impressionsTrend = normLinear(impressionGrowth, -0.2, 0.2) * 100;

  // Component 2: Index Coverage (0-100) - assume 100% if we have data
  const indexCoverage = currentImpressions > 0 ? 100 : 0;

  // Component 3: Crawl Errors (0-50) - assume no errors if we have data
  const crawlErrors = currentImpressions > 0 ? 50 : 0;

  const score = impressionsTrend + indexCoverage + crawlErrors;

  return {
    score: Math.round(score),
    maxScore: 250,
    components: {
      impressionsTrend: Math.round(impressionsTrend),
      indexCoverage: Math.round(indexCoverage),
      crawlErrors: Math.round(crawlErrors),
    },
  };
}

/**
 * Calculate P2: Search Visibility (0-250 points)
 */
export async function calculateP2(date: string): Promise<ScoreBreakdown['p2SearchVisibility']> {
  const siteUrl = process.env.GSC_SITE_URL!;

  // Get current day metrics
  const current = await prisma.$queryRaw<any[]>`
    SELECT clicks, impressions, position
    FROM gsc_daily_site_metrics
    WHERE date = ${date}::date AND site_url = ${siteUrl}
    LIMIT 1
  `;

  // Get 7-day average
  const prev7d = await prisma.$queryRaw<any[]>`
    SELECT AVG(clicks) as avg_clicks, AVG(position) as avg_position
    FROM gsc_daily_site_metrics
    WHERE date >= ${date}::date - INTERVAL '7 days'
      AND date < ${date}::date
      AND site_url = ${siteUrl}
  `;

  const currentClicks = current[0]?.clicks || 0;
  const currentPosition = current[0]?.position || 50;
  const prev7dClicks = prev7d[0]?.avg_clicks || currentClicks;

  // Component 1: Clicks Trend (0-100)
  const clicksGrowth = pctChange(currentClicks, prev7dClicks);
  const clicksTrend = normLinear(clicksGrowth, -0.2, 0.2) * 100;

  // Component 2: Top Queries Performance (0-100)
  const topQueries = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as count
    FROM gsc_daily_query_metrics
    WHERE date = ${date}::date
      AND site_url = ${siteUrl}
      AND position <= 10
  `;
  const topQueriesCount = topQueries[0]?.count || 0;
  const topQueriesPerformance = normLog(topQueriesCount, 10, 5) * 100;

  // Component 3: Average Position (0-50)
  const avgPosition = normLinear(50 - currentPosition, 0, 40) * 50;

  const score = clicksTrend + topQueriesPerformance + avgPosition;

  return {
    score: Math.round(score),
    maxScore: 250,
    components: {
      clicksTrend: Math.round(clicksTrend),
      topQueriesPerformance: Math.round(topQueriesPerformance),
      avgPosition: Math.round(avgPosition),
    },
  };
}

/**
 * Calculate P3: Engagement & Intent (0-200 points)
 */
export async function calculateP3(date: string): Promise<ScoreBreakdown['p3EngagementIntent']> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const propertyId = process.env.GA4_PROPERTY_ID!;

  // Get CTR from GSC
  const gscMetrics = await prisma.$queryRaw<any[]>`
    SELECT ctr FROM gsc_daily_site_metrics
    WHERE date = ${date}::date AND site_url = ${siteUrl}
    LIMIT 1
  `;

  // Get engagement metrics from GA4
  const ga4Metrics = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(engagement_rate) as avg_engagement_rate,
      SUM(returning_users) as total_returning,
      SUM(total_users) as total_users
    FROM ga4_daily_landing_metrics
    WHERE date = ${date}::date AND property_id = ${propertyId}
  `;

  const ctr = gscMetrics[0]?.ctr || 0;
  const engagementRate = ga4Metrics[0]?.avg_engagement_rate || 0;
  const returningRatio = ga4Metrics[0]?.total_returning && ga4Metrics[0]?.total_users
    ? ga4Metrics[0].total_returning / ga4Metrics[0].total_users
    : 0;

  // Component 1: CTR Quality (0-80)
  const ctrQuality = normLinear(ctr, 0.02, 0.08) * 80;

  // Component 2: Engagement Rate (0-80)
  const engagementScore = normLinear(engagementRate, 0.3, 0.7) * 80;

  // Component 3: Returning Users (0-40)
  const returningUsers = normLinear(returningRatio, 0.1, 0.4) * 40;

  const score = ctrQuality + engagementScore + returningUsers;

  return {
    score: Math.round(score),
    maxScore: 200,
    components: {
      ctrQuality: Math.round(ctrQuality),
      engagementRate: Math.round(engagementScore),
      returningUsers: Math.round(returningUsers),
    },
  };
}

/**
 * Calculate P4: Content Performance (0-200 points)
 */
export async function calculateP4(date: string): Promise<ScoreBreakdown['p4ContentPerformance']> {
  const siteUrl = process.env.GSC_SITE_URL!;
  const propertyId = process.env.GA4_PROPERTY_ID!;

  // Top pages growth
  const current = await prisma.$queryRaw<any[]>`
    SELECT COUNT(*) as page_count, SUM(clicks) as total_clicks
    FROM gsc_daily_page_metrics
    WHERE date = ${date}::date AND site_url = ${siteUrl}
  `;

  const prev7d = await prisma.$queryRaw<any[]>`
    SELECT AVG(cnt) as avg_page_count
    FROM (
      SELECT date, COUNT(*) as cnt
      FROM gsc_daily_page_metrics
      WHERE date >= ${date}::date - INTERVAL '7 days'
        AND date < ${date}::date
        AND site_url = ${siteUrl}
      GROUP BY date
    ) sub
  `;

  const currentPageCount = current[0]?.page_count || 0;
  const prev7dPageCount = prev7d[0]?.avg_page_count || currentPageCount;

  // Component 1: Top Pages Growth (0-80)
  const pagesGrowth = pctChange(currentPageCount, prev7dPageCount);
  const topPagesGrowth = normLinear(pagesGrowth, -0.1, 0.1) * 80;

  // Component 2: Content Depth (0-80) - based on engagement time
  const contentDepth = await prisma.$queryRaw<any[]>`
    SELECT AVG(avg_engagement_time_seconds) as avg_time
    FROM ga4_daily_landing_metrics
    WHERE date = ${date}::date AND property_id = ${propertyId}
  `;
  const avgTime = contentDepth[0]?.avg_time || 0;
  const contentDepthScore = normLinear(avgTime, 30, 120) * 80;

  // Component 3: Conversion Quality (0-40)
  const conversions = await prisma.$queryRaw<any[]>`
    SELECT SUM((conversions->>'total')::numeric) as total_conv,
           SUM(organic_sessions) as total_sessions
    FROM ga4_daily_landing_metrics
    WHERE date = ${date}::date AND property_id = ${propertyId}
  `;
  const convRate = conversions[0]?.total_sessions > 0
    ? conversions[0].total_conv / conversions[0].total_sessions
    : 0;
  const conversionQuality = normLinear(convRate, 0.01, 0.05) * 40;

  const score = topPagesGrowth + contentDepthScore + conversionQuality;

  return {
    score: Math.round(score),
    maxScore: 200,
    components: {
      topPagesGrowth: Math.round(topPagesGrowth),
      contentDepth: Math.round(contentDepthScore),
      conversionQuality: Math.round(conversionQuality),
    },
  };
}

/**
 * Calculate P5: Technical Experience (0-100 points, optional)
 */
export async function calculateP5(date: string): Promise<ScoreBreakdown['p5TechnicalExperience']> {
  // Check if PageSpeed is enabled
  const isEnabled = !!process.env.PAGESPEED_API_KEY;

  if (!isEnabled) {
    return {
      score: 50, // Neutral score if disabled
      maxScore: 100,
      components: {
        coreWebVitals: 25,
        mobileUsability: 25,
      },
    };
  }

  // Get PageSpeed metrics
  const pageSpeedMetrics = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(performance_score) as avg_perf,
      AVG(lcp) as avg_lcp,
      AVG(cls) as avg_cls
    FROM pagespeed_daily_metrics
    WHERE date = ${date}::date
  `;

  const avgPerf = pageSpeedMetrics[0]?.avg_perf || 50;
  const avgLcp = pageSpeedMetrics[0]?.avg_lcp || 2500;
  const avgCls = pageSpeedMetrics[0]?.avg_cls || 0.1;

  // Component 1: Core Web Vitals (0-70)
  const lcpScore = normLinear(4000 - avgLcp, 0, 2000) * 30; // Good: <2.5s
  const clsScore = normLinear(0.25 - avgCls, 0, 0.15) * 40; // Good: <0.1
  const coreWebVitals = lcpScore + clsScore;

  // Component 2: Mobile Usability (0-30)
  const mobileUsability = normLinear(avgPerf, 50, 90) * 30;

  const score = coreWebVitals + mobileUsability;

  return {
    score: Math.round(score),
    maxScore: 100,
    components: {
      coreWebVitals: Math.round(coreWebVitals),
      mobileUsability: Math.round(mobileUsability),
    },
  };
}

/**
 * Calculate total score and store in database
 */
export async function calculateAndStoreScore(date: string): Promise<{
  totalScore: number;
  breakdown: ScoreBreakdown;
}> {
  console.log(`[Score Engine] Calculating score for ${date}`);

  const p1 = await calculateP1(date);
  const p2 = await calculateP2(date);
  const p3 = await calculateP3(date);
  const p4 = await calculateP4(date);
  const p5 = await calculateP5(date);

  const totalScore = p1.score + p2.score + p3.score + p4.score + p5.score;

  const breakdown: ScoreBreakdown = {
    p1IndexCrawlHealth: p1,
    p2SearchVisibility: p2,
    p3EngagementIntent: p3,
    p4ContentPerformance: p4,
    p5TechnicalExperience: p5,
  };

  // Store in database
  await prisma.$executeRaw`
    INSERT INTO score_daily (
      date,
      total_score,
      p1_index_crawl_health,
      p2_search_visibility,
      p3_engagement_intent,
      p4_content_performance,
      p5_technical_experience,
      breakdown
    )
    VALUES (
      ${date}::date,
      ${totalScore},
      ${p1.score},
      ${p2.score},
      ${p3.score},
      ${p4.score},
      ${p5.score},
      ${JSON.stringify(breakdown)}::jsonb
    )
    ON CONFLICT (date)
    DO UPDATE SET
      total_score = EXCLUDED.total_score,
      p1_index_crawl_health = EXCLUDED.p1_index_crawl_health,
      p2_search_visibility = EXCLUDED.p2_search_visibility,
      p3_engagement_intent = EXCLUDED.p3_engagement_intent,
      p4_content_performance = EXCLUDED.p4_content_performance,
      p5_technical_experience = EXCLUDED.p5_technical_experience,
      breakdown = EXCLUDED.breakdown,
      updated_at = NOW()
  `;

  console.log(`[Score Engine] Total score: ${totalScore}/1000`);

  return { totalScore, breakdown };
}
