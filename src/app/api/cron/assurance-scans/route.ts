import { NextRequest, NextResponse } from 'next/server';
import { executeDueScans } from '@/lib/assurance/scanner';
import { detectRegression, createAlert } from '@/lib/assurance/trends';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/cron/assurance-scans
 * Execute scheduled Assurance scans (triggered by Vercel Cron)
 *
 * Authentication: Bearer token via CRON_SECRET environment variable
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate cron request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error('[Assurance Cron] CRON_SECRET not configured');
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error('[Assurance Cron] Unauthorized cron request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('[Assurance Cron] Starting scheduled scan execution...');

    // Execute due scans (max 50 per run)
    const results = await executeDueScans(50);

    console.log('[Assurance Cron] Scans completed:', results);

    // Process results for regression detection and alerting
    const processedDomains = await processScanResults(results);

    console.log('[Assurance Cron] Results processed:', processedDomains);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      scans: results,
      processed: processedDomains,
    });
  } catch (error) {
    console.error('[Assurance Cron] Error executing cron:', error);
    return NextResponse.json(
      {
        error: 'Failed to execute cron',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Process scan results to detect regressions and create alerts
 */
async function processScanResults(results: {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{ domainId: string; domain: string; error: string }>;
}) {
  const processed = {
    total: results.successful,
    regressions: 0,
    alerts: 0,
    reportsGenerated: 0,
    emailsSent: 0,
  };

  // Process failed scans - create SCAN_FAILED alerts
  for (const error of results.errors) {
    try {
      const domain = await prisma.assuranceDomain.findUnique({
        where: { id: error.domainId },
      });

      if (!domain) continue;

      await createAlert({
        domainId: error.domainId,
        type: 'SCAN_FAILED',
        severity: 'MEDIUM',
        title: 'Scheduled scan failed',
        message: `Automated scan failed: ${error.error}`,
        currentScore: 0,
      });

      processed.alerts++;
    } catch (err) {
      console.error('[Assurance Cron] Error creating SCAN_FAILED alert:', err);
    }
  }

  // Get all domains that were successfully scanned
  const scannedDomains = await prisma.assuranceDomain.findMany({
    where: {
      lastRunAt: {
        gte: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      },
    },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  // Process each domain
  for (const domain of scannedDomains) {
    try {
      const latestScan = domain.scans[0];
      if (!latestScan) continue;

      // Detect regression
      const regression = await detectRegression(domain, latestScan);

      if (regression.detected && regression.type) {
        // Create alert
        await createAlert({
          domainId: domain.id,
          type: regression.type,
          severity: regression.severity,
          title: regression.severity === 'CRITICAL'
            ? `CRITICAL: ${regression.message}`
            : regression.message,
          message: regression.message,
          currentScore: regression.currentScore,
          previousScore: regression.previousScore,
          threshold: regression.threshold,
          scanId: latestScan.scanId,
        });

        processed.regressions++;
        processed.alerts++;

        console.log('[Assurance Cron] Regression detected:', {
          domain: domain.domain,
          type: regression.type,
          severity: regression.severity,
          currentScore: regression.currentScore,
        });

        // TODO: Send alert email (Phase 5)
        // if (domain.emailRecipients.length > 0) {
        //   await sendAssuranceAlert({ ... });
        //   processed.emailsSent++;
        // }
      }

      // TODO: Generate and send report if configured (Phase 4)
      // if (domain.emailRecipients.length > 0) {
      //   await generateAndSendReport(domain.id, latestScan.id);
      //   processed.reportsGenerated++;
      //   processed.emailsSent++;
      // }
    } catch (err) {
      console.error(`[Assurance Cron] Error processing domain ${domain.id}:`, err);
    }
  }

  return processed;
}
