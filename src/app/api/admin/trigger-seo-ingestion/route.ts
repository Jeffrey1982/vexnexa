import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/admin/trigger-seo-ingestion
 *
 * Admin endpoint to manually trigger all SEO ingestion cron jobs
 * This endpoint:
 * 1. Checks admin authentication
 * 2. Triggers all SEO-related cron jobs internally
 * 3. Returns results
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const user = await requireAuth();
    const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];

    if (!adminEmails.includes(user.email)) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const cronToken = process.env.CRON_TOKEN;

    if (!cronToken) {
      return NextResponse.json(
        {
          error: 'CRON_TOKEN not configured',
          message: 'Please set CRON_TOKEN environment variable in Vercel'
        },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.vexnexa.com';
    const results: any = {
      success: false,
      jobs: [],
      timestamp: new Date().toISOString()
    };

    // Define cron jobs to trigger in order
    const cronJobs = [
      { name: 'Google Search Console Ingestion', path: '/api/cron/ingest-gsc' },
      { name: 'Google Analytics 4 Ingestion', path: '/api/cron/ingest-ga4' },
      { name: 'PageSpeed Insights Ingestion', path: '/api/cron/ingest-pagespeed' },
      { name: 'SEO Health Score Computation', path: '/api/cron/compute-score' },
      { name: 'Alerts Detection', path: '/api/cron/run-alerts' },
    ];

    // Trigger each cron job sequentially
    for (const job of cronJobs) {
      try {
        console.log(`[Admin SEO Trigger] Starting: ${job.name}`);

        const response = await fetch(`${baseUrl}${job.path}`, {
          method: 'POST',
          headers: {
            'X-CRON-TOKEN': cronToken,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();

        results.jobs.push({
          name: job.name,
          path: job.path,
          status: response.ok ? 'success' : 'failed',
          statusCode: response.status,
          result: data,
        });

        console.log(`[Admin SEO Trigger] ${job.name}: ${response.status}`);

        // Wait 2 seconds between jobs to avoid rate limiting
        if (cronJobs.indexOf(job) < cronJobs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.error(`[Admin SEO Trigger] Error in ${job.name}:`, error);
        results.jobs.push({
          name: job.name,
          path: job.path,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Check if all jobs succeeded
    const allSucceeded = results.jobs.every((job: any) => job.status === 'success');
    results.success = allSucceeded;

    return NextResponse.json(results);
  } catch (error) {
    console.error('[Admin SEO Trigger] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to trigger SEO ingestion',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
