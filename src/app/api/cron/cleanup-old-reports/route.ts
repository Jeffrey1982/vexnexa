import { NextRequest, NextResponse } from 'next/server';
import { deleteOldReports } from '@/lib/assurance/report-generator';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/cleanup-old-reports
 * Cleanup reports and scans older than 12 months
 *
 * Triggered by Vercel Cron (monthly)
 * Authentication: Bearer token (CRON_SECRET)
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Cleanup Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Cleanup Cron] Invalid authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Cleanup Cron] Starting 12-month retention cleanup...');

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // 1. Delete old reports (including Blob PDFs)
    console.log('[Cleanup Cron] Deleting old reports...');
    const reportsResult = await deleteOldReports();

    // 2. Delete old scans
    console.log('[Cleanup Cron] Deleting old scans...');
    const scansDeleted = await prisma.assuranceScan.deleteMany({
      where: {
        createdAt: {
          lt: twelveMonthsAgo,
        },
      },
    });

    // 3. Delete old resolved alerts
    console.log('[Cleanup Cron] Deleting old resolved alerts...');
    const alertsDeleted = await prisma.assuranceAlert.deleteMany({
      where: {
        resolved: true,
        resolvedAt: {
          lt: twelveMonthsAgo,
        },
      },
    });

    console.log('[Cleanup Cron] Cleanup complete:', {
      reportsDeleted: reportsResult.deleted,
      reportsErrors: reportsResult.errors,
      scansDeleted: scansDeleted.count,
      alertsDeleted: alertsDeleted.count,
    });

    return NextResponse.json({
      success: true,
      summary: {
        reportsDeleted: reportsResult.deleted,
        reportsErrors: reportsResult.errors,
        scansDeleted: scansDeleted.count,
        alertsDeleted: alertsDeleted.count,
        cutoffDate: twelveMonthsAgo.toISOString(),
      },
    });
  } catch (error) {
    console.error('[Cleanup Cron] Error during cleanup:', error);
    return NextResponse.json(
      {
        error: 'Cleanup failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
