/**
 * Alert Engine
 * Monitors metrics and generates alerts based on rules
 */

import { prisma } from '@/lib/prisma';

export async function runAlerts(date: string): Promise<void> {
  console.log(`[Alert Engine] Running alerts for ${date}`);

  const siteUrl = process.env.GSC_SITE_URL!;
  const propertyId = process.env.GA4_PROPERTY_ID!;

  // Get active alert rules
  const rules = await prisma.$queryRaw<any[]>`
    SELECT * FROM alert_rules WHERE enabled = true
  `;

  for (const rule of rules) {
    try {
      await processAlertRule(date, siteUrl, propertyId, rule);
    } catch (error) {
      console.error(`[Alert Engine] Error processing rule ${rule.type}:`, error);
    }
  }
}

async function processAlertRule(
  date: string,
  siteUrl: string,
  propertyId: string,
  rule: any
): Promise<void> {
  const { type, thresholds, lookback_days, severity } = rule;

  switch (type) {
    case 'SCORE_DROP_7D':
      await checkScoreDrop(date, thresholds, lookback_days, severity);
      break;
    case 'PILLAR_DROP':
      await checkPillarDrop(date, thresholds, lookback_days, severity);
      break;
    case 'VISIBILITY_IMPRESSIONS_DROP':
      await checkImpressionsDrop(date, siteUrl, thresholds, lookback_days, severity);
      break;
    case 'CTR_ANOMALY':
      await checkCTRAnomaly(date, siteUrl, thresholds, severity);
      break;
    case 'FUNNEL_CONV_DROP':
      await checkConversionDrop(date, propertyId, thresholds, lookback_days, severity);
      break;
    default:
      console.log(`[Alert Engine] Unknown rule type: ${type}`);
  }
}

async function checkScoreDrop(
  date: string,
  thresholds: any,
  lookbackDays: number,
  severity: string
): Promise<void> {
  const current = await prisma.$queryRaw<any[]>`
    SELECT total_score FROM score_daily WHERE date = ${date}::date LIMIT 1
  `;

  const prev = await prisma.$queryRaw<any[]>`
    SELECT AVG(total_score) as avg_score
    FROM score_daily
    WHERE date >= ${date}::date - INTERVAL '${lookbackDays} days'
      AND date < ${date}::date
  `;

  const currentScore = current[0]?.total_score || 0;
  const prevAvg = prev[0]?.avg_score || currentScore;
  const drop = prevAvg - currentScore;

  if (drop >= thresholds.min_drop) {
    await createAlert({
      severity,
      type: 'SCORE_DROP_7D',
      entityType: 'score',
      entityKey: 'total',
      message: `Total score dropped by ${Math.round(drop)} points`,
      details: {
        current: currentScore,
        previous: Math.round(prevAvg),
        drop: Math.round(drop),
      },
    });
  }
}

async function checkPillarDrop(
  date: string,
  thresholds: any,
  lookbackDays: number,
  severity: string
): Promise<void> {
  const current = await prisma.$queryRaw<any[]>`
    SELECT
      p1_index_crawl_health,
      p2_search_visibility,
      p3_engagement_intent,
      p4_content_performance,
      p5_technical_experience
    FROM score_daily
    WHERE date = ${date}::date
    LIMIT 1
  `;

  if (!current[0]) return;

  const prev = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(p1_index_crawl_health) as avg_p1,
      AVG(p2_search_visibility) as avg_p2,
      AVG(p3_engagement_intent) as avg_p3,
      AVG(p4_content_performance) as avg_p4,
      AVG(p5_technical_experience) as avg_p5
    FROM score_daily
    WHERE date >= ${date}::date - INTERVAL '${lookbackDays} days'
      AND date < ${date}::date
  `;

  if (!prev[0]) return;

  const pillars = [
    { name: 'P1', current: current[0].p1_index_crawl_health, prev: prev[0].avg_p1 },
    { name: 'P2', current: current[0].p2_search_visibility, prev: prev[0].avg_p2 },
    { name: 'P3', current: current[0].p3_engagement_intent, prev: prev[0].avg_p3 },
    { name: 'P4', current: current[0].p4_content_performance, prev: prev[0].avg_p4 },
    { name: 'P5', current: current[0].p5_technical_experience, prev: prev[0].avg_p5 },
  ];

  for (const pillar of pillars) {
    if (pillar.prev > 0) {
      const pctDrop = (pillar.prev - pillar.current) / pillar.prev;
      if (pctDrop >= thresholds.min_pct_drop) {
        await createAlert({
          severity,
          type: 'PILLAR_DROP',
          entityType: 'pillar',
          entityKey: pillar.name,
          message: `${pillar.name} score dropped by ${Math.round(pctDrop * 100)}%`,
          details: {
            pillar: pillar.name,
            current: Math.round(pillar.current),
            previous: Math.round(pillar.prev),
            pctDrop: Math.round(pctDrop * 100),
          },
        });
      }
    }
  }
}

async function checkImpressionsDrop(
  date: string,
  siteUrl: string,
  thresholds: any,
  lookbackDays: number,
  severity: string
): Promise<void> {
  const current = await prisma.$queryRaw<any[]>`
    SELECT impressions FROM gsc_daily_site_metrics
    WHERE date = ${date}::date AND site_url = ${siteUrl}
    LIMIT 1
  `;

  const prev = await prisma.$queryRaw<any[]>`
    SELECT AVG(impressions) as avg_impressions
    FROM gsc_daily_site_metrics
    WHERE date >= ${date}::date - INTERVAL '${lookbackDays} days'
      AND date < ${date}::date
      AND site_url = ${siteUrl}
  `;

  const currentImpr = current[0]?.impressions || 0;
  const prevAvg = prev[0]?.avg_impressions || currentImpr;

  if (prevAvg > 0) {
    const pctDrop = (prevAvg - currentImpr) / prevAvg;
    if (pctDrop >= thresholds.min_pct_drop) {
      await createAlert({
        severity,
        type: 'VISIBILITY_IMPRESSIONS_DROP',
        entityType: 'site',
        entityKey: siteUrl,
        message: `Search impressions dropped by ${Math.round(pctDrop * 100)}%`,
        details: {
          current: currentImpr,
          previous: Math.round(prevAvg),
          pctDrop: Math.round(pctDrop * 100),
        },
      });
    }
  }
}

async function checkCTRAnomaly(
  date: string,
  siteUrl: string,
  thresholds: any,
  severity: string
): Promise<void> {
  const pages = await prisma.$queryRaw<any[]>`
    SELECT page, impressions, ctr
    FROM gsc_daily_page_metrics
    WHERE date = ${date}::date
      AND site_url = ${siteUrl}
      AND impressions >= ${thresholds.min_impressions}
  `;

  // Get 7-day average CTR for comparison
  const avgCTR = await prisma.$queryRaw<any[]>`
    SELECT AVG(ctr) as avg_ctr
    FROM gsc_daily_site_metrics
    WHERE date >= ${date}::date - INTERVAL '7 days'
      AND date < ${date}::date
      AND site_url = ${siteUrl}
  `;

  const expectedCTR = avgCTR[0]?.avg_ctr || 0.03;

  for (const page of pages) {
    if (expectedCTR > 0) {
      const ctrRatio = page.ctr / expectedCTR;
      if (ctrRatio < thresholds.ctr_ratio) {
        await createAlert({
          severity,
          type: 'CTR_ANOMALY',
          entityType: 'page',
          entityKey: page.page,
          message: `Low CTR on high-impression page: ${page.page}`,
          details: {
            page: page.page,
            impressions: page.impressions,
            ctr: page.ctr,
            expectedCTR,
            ratio: Math.round(ctrRatio * 100) / 100,
          },
        });
      }
    }
  }
}

async function checkConversionDrop(
  date: string,
  propertyId: string,
  thresholds: any,
  lookbackDays: number,
  severity: string
): Promise<void> {
  const current = await prisma.$queryRaw<any[]>`
    SELECT
      SUM((conversions->>'total')::numeric) as total_conv,
      SUM(organic_sessions) as total_sessions
    FROM ga4_daily_landing_metrics
    WHERE date = ${date}::date AND property_id = ${propertyId}
  `;

  const prev = await prisma.$queryRaw<any[]>`
    SELECT
      AVG(conv_rate) as avg_conv_rate
    FROM (
      SELECT
        date,
        SUM((conversions->>'total')::numeric) / NULLIF(SUM(organic_sessions), 0) as conv_rate
      FROM ga4_daily_landing_metrics
      WHERE date >= ${date}::date - INTERVAL '${lookbackDays} days'
        AND date < ${date}::date
        AND property_id = ${propertyId}
      GROUP BY date
    ) sub
  `;

  const currentSessions = current[0]?.total_sessions || 0;
  const currentConv = current[0]?.total_conv || 0;
  const currentRate = currentSessions > 0 ? currentConv / currentSessions : 0;
  const prevRate = prev[0]?.avg_conv_rate || currentRate;

  if (prevRate > 0) {
    const pctDrop = (prevRate - currentRate) / prevRate;
    if (pctDrop >= thresholds.min_pct_drop) {
      await createAlert({
        severity,
        type: 'FUNNEL_CONV_DROP',
        entityType: 'conversion',
        entityKey: 'organic',
        message: `Conversion rate dropped by ${Math.round(pctDrop * 100)}%`,
        details: {
          currentRate: Math.round(currentRate * 10000) / 10000,
          previousRate: Math.round(prevRate * 10000) / 10000,
          pctDrop: Math.round(pctDrop * 100),
        },
      });
    }
  }
}

async function createAlert(alert: {
  severity: string;
  type: string;
  entityType?: string;
  entityKey?: string;
  message: string;
  details: any;
}): Promise<void> {
  // Check if alert already exists (avoid duplicates)
  const existing = await prisma.$queryRaw<any[]>`
    SELECT id FROM alerts
    WHERE type = ${alert.type}
      AND entity_key = ${alert.entityKey}
      AND status = 'active'
      AND created_at >= NOW() - INTERVAL '24 hours'
    LIMIT 1
  `;

  if (existing.length > 0) {
    console.log(`[Alert Engine] Alert already exists: ${alert.type}`);
    return;
  }

  await prisma.$executeRaw`
    INSERT INTO alerts (severity, type, entity_type, entity_key, message, details, status)
    VALUES (
      ${alert.severity},
      ${alert.type},
      ${alert.entityType},
      ${alert.entityKey},
      ${alert.message},
      ${JSON.stringify(alert.details)}::jsonb,
      'active'
    )
  `;

  console.log(`[Alert Engine] Created alert: ${alert.type} - ${alert.message}`);
}
