/**
 * Action Generator
 * Generates recommended actions based on score breakdown
 */

import { ScoreBreakdown } from './engine';
import { prisma } from '@/lib/prisma';

export interface Action {
  pillar: string;
  key: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impactPoints: number;
  metadata: Record<string, any>;
}

export async function generateActions(
  date: string,
  breakdown: ScoreBreakdown
): Promise<Action[]> {
  const actions: Action[] = [];

  // P1: Index & Crawl Health
  if (breakdown.p1IndexCrawlHealth.components.impressionsTrend < 40) {
    actions.push({
      pillar: 'P1',
      key: 'low_impressions_trend',
      severity: 'high',
      title: 'Impressions Declining',
      description: 'Your search impressions are trending downward. Review recent content changes and check for indexing issues.',
      impactPoints: 50,
      metadata: { score: breakdown.p1IndexCrawlHealth.components.impressionsTrend },
    });
  }

  if (breakdown.p1IndexCrawlHealth.components.indexCoverage < 80) {
    actions.push({
      pillar: 'P1',
      key: 'low_index_coverage',
      severity: 'critical',
      title: 'Low Index Coverage',
      description: 'Some pages may not be indexed. Check Search Console for crawl errors and submit sitemaps.',
      impactPoints: 80,
      metadata: { score: breakdown.p1IndexCrawlHealth.components.indexCoverage },
    });
  }

  // P2: Search Visibility
  if (breakdown.p2SearchVisibility.components.clicksTrend < 40) {
    actions.push({
      pillar: 'P2',
      key: 'clicks_declining',
      severity: 'high',
      title: 'Clicks Declining',
      description: 'Organic clicks are decreasing. Review title tags, meta descriptions, and rankings for key queries.',
      impactPoints: 60,
      metadata: { score: breakdown.p2SearchVisibility.components.clicksTrend },
    });
  }

  if (breakdown.p2SearchVisibility.components.avgPosition > 35) {
    actions.push({
      pillar: 'P2',
      key: 'poor_avg_position',
      severity: 'medium',
      title: 'Average Position Too Low',
      description: 'Your average search position is beyond page 3. Focus on improving content quality and building authority.',
      impactPoints: 40,
      metadata: { score: breakdown.p2SearchVisibility.components.avgPosition },
    });
  }

  // P3: Engagement & Intent
  if (breakdown.p3EngagementIntent.components.ctrQuality < 40) {
    actions.push({
      pillar: 'P3',
      key: 'low_ctr',
      severity: 'high',
      title: 'Low Click-Through Rate',
      description: 'CTR is below expectations. Optimize title tags and meta descriptions to be more compelling.',
      impactPoints: 50,
      metadata: { score: breakdown.p3EngagementIntent.components.ctrQuality },
    });
  }

  if (breakdown.p3EngagementIntent.components.engagementRate < 40) {
    actions.push({
      pillar: 'P3',
      key: 'low_engagement',
      severity: 'medium',
      title: 'Low User Engagement',
      description: 'Users are not engaging with your content. Improve content quality, readability, and call-to-actions.',
      impactPoints: 45,
      metadata: { score: breakdown.p3EngagementIntent.components.engagementRate },
    });
  }

  // P4: Content Performance
  if (breakdown.p4ContentPerformance.components.topPagesGrowth < 35) {
    actions.push({
      pillar: 'P4',
      key: 'stagnant_content',
      severity: 'medium',
      title: 'Content Growth Stagnant',
      description: 'Top-performing pages are not growing. Create new content targeting underserved keywords.',
      impactPoints: 40,
      metadata: { score: breakdown.p4ContentPerformance.components.topPagesGrowth },
    });
  }

  if (breakdown.p4ContentPerformance.components.conversionQuality < 20) {
    actions.push({
      pillar: 'P4',
      key: 'low_conversions',
      severity: 'high',
      title: 'Low Conversion Rate',
      description: 'Organic traffic is not converting. Optimize landing pages, CTAs, and user flows.',
      impactPoints: 35,
      metadata: { score: breakdown.p4ContentPerformance.components.conversionQuality },
    });
  }

  // P5: Technical Experience
  if (breakdown.p5TechnicalExperience.components.coreWebVitals < 40) {
    actions.push({
      pillar: 'P5',
      key: 'poor_core_web_vitals',
      severity: 'high',
      title: 'Poor Core Web Vitals',
      description: 'LCP and CLS scores are below Google recommended thresholds. Optimize images, fonts, and layout shifts.',
      impactPoints: 30,
      metadata: { score: breakdown.p5TechnicalExperience.components.coreWebVitals },
    });
  }

  // Store actions in database
  for (const action of actions) {
    await prisma.$executeRaw`
      INSERT INTO score_actions_daily (
        date, pillar, key, severity, title, description, impact_points, metadata
      )
      VALUES (
        ${date}::date,
        ${action.pillar},
        ${action.key},
        ${action.severity},
        ${action.title},
        ${action.description},
        ${action.impactPoints},
        ${JSON.stringify(action.metadata)}::jsonb
      )
      ON CONFLICT (date, pillar, key) DO UPDATE SET
        severity = EXCLUDED.severity,
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        impact_points = EXCLUDED.impact_points,
        metadata = EXCLUDED.metadata
    `;
  }

  return actions;
}
