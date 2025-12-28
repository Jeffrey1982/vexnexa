import { NextRequest, NextResponse } from 'next/server';
import { deleteOldReports } from '@/lib/assurance/report-generator';
import { prisma } from '@/lib/prisma';
import { withCronAuth } from '@/lib/cron-auth';

/**
 * POST /api/cron/cleanup-old-reports
 * Cleanup reports and scans older than 12 months
 *
 * Triggered by Vercel Cron (monthly)
 * Secured by X-CRON-TOKEN header via withCronAuth
 */
async function handler(req: NextRequest) {
  try {
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

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
