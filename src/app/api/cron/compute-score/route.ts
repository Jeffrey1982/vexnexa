/**
 * Cron Job: Compute Google Health Score
 * Calculates score and generates action items
 * Secured by X-CRON-TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/cron-auth';
import { calculateAndStoreScore } from '@/lib/scoring/engine';
import { generateActions } from '@/lib/scoring/actions';
import { getYesterday } from '@/lib/google/search-console';

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const yesterday = getYesterday();

    console.log(`[Compute Score] Starting for ${yesterday}`);

    // Calculate score
    const { totalScore, breakdown } = await calculateAndStoreScore(yesterday);

    // Generate actions
    const actions = await generateActions(yesterday, breakdown);

    const duration = Date.now() - startTime;

    console.log(`[Compute Score] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      date: yesterday,
      score: {
        total: totalScore,
        pillars: {
          p1: breakdown.p1IndexCrawlHealth.score,
          p2: breakdown.p2SearchVisibility.score,
          p3: breakdown.p3EngagementIntent.score,
          p4: breakdown.p4ContentPerformance.score,
          p5: breakdown.p5TechnicalExperience.score,
        },
      },
      actions: {
        count: actions.length,
        critical: actions.filter((a) => a.severity === 'critical').length,
        high: actions.filter((a) => a.severity === 'high').length,
      },
      duration,
    });
  } catch (error) {
    console.error('[Compute Score] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to compute score',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
