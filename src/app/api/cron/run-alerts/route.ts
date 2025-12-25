/**
 * Cron Job: Run Alert Rules
 * Checks alert rules and creates alerts when thresholds are violated
 * Secured by X-CRON-TOKEN header
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCronAuth } from '@/lib/cron-auth';
import { runAlerts } from '@/lib/alerts/engine';
import { getYesterday } from '@/lib/google/search-console';

async function handler(request: NextRequest) {
  const startTime = Date.now();

  try {
    const yesterday = getYesterday();

    console.log(`[Run Alerts] Starting for ${yesterday}`);

    await runAlerts(yesterday);

    const duration = Date.now() - startTime;

    console.log(`[Run Alerts] Completed in ${duration}ms`);

    return NextResponse.json({
      success: true,
      date: yesterday,
      duration,
    });
  } catch (error) {
    console.error('[Run Alerts] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to run alerts',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
