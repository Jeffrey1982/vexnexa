import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withCronAuth } from '@/lib/cron-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { runEnhancedAccessibilityScan } from '@/lib/scanner-enhanced';
import {
  calculateNextRunAt,
  generateWindowKey,
  buildReportSubject,
  buildReportEmailHtml,
  buildReportEmailText,
  type Frequency,
} from '@/lib/schedule-utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min max for Vercel

const MAX_PER_RUN = 10; // Process up to 10 schedules per cron invocation
const MAX_CONSECUTIVE_FAILURES = 5;

/**
 * POST /api/cron/assurance-schedules
 *
 * Finds due ScanSchedules (isEnabled + nextRunAt <= now),
 * runs scans, generates PDF, emails recipients, updates nextRunAt.
 * Idempotent via ScheduleRun.windowKey unique constraint.
 */
async function handler(_request: NextRequest) {
  try {
    const now = new Date();

    // 1. Find due schedules
    const dueSchedules = await (prisma as any).scanSchedule.findMany({
      where: {
        isEnabled: true,
        nextRunAt: { lte: now },
        OR: [
          { endsAt: null },
          { endsAt: { gt: now } },
        ],
      },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
        site: { select: { id: true, url: true } },
      },
      orderBy: { nextRunAt: 'asc' },
      take: MAX_PER_RUN,
    });

    if (dueSchedules.length === 0) {
      return successResponse({ message: 'No due schedules', processed: 0 });
    }

    const results: Array<{
      scheduleId: string;
      siteUrl: string;
      status: string;
      score?: number;
      error?: string;
    }> = [];

    for (const schedule of dueSchedules) {
      const windowKey = generateWindowKey(schedule.nextRunAt, schedule.timezone);

      try {
        // 2. Idempotency check — try to create a ScheduleRun
        let run;
        try {
          run = await (prisma as any).scheduleRun.create({
            data: {
              scheduleId: schedule.id,
              windowKey,
              status: 'running',
            },
          });
        } catch (e: unknown) {
          // Unique constraint violation = already processed this window
          if (e && typeof e === 'object' && 'code' in e && (e as any).code === 'P2002') {
            console.log(`[assurance-schedules] Skipping ${schedule.id} — already processed window ${windowKey}`);
            // Still advance nextRunAt so we don't re-query this schedule
            await advanceNextRunAt(schedule);
            results.push({ scheduleId: schedule.id, siteUrl: schedule.site.url, status: 'skipped_idempotent' });
            continue;
          }
          throw e;
        }

        // 3. Run scan
        console.log(`[assurance-schedules] Running scan for ${schedule.site.url} (schedule ${schedule.id})`);
        const scanResult = await runEnhancedAccessibilityScan(schedule.site.url) as any;
        const score: number = scanResult?.score ?? 0;
        const scanId: string | undefined = scanResult?.id ?? scanResult?.scanId;

        // 4. Generate PDF report
        let pdfBuffer: Buffer | null = null;
        try {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com';
          // Fetch the PDF from our own export endpoint if a scanId is available
          if (scanId) {
            const pdfRes = await fetch(`${appUrl}/api/reports/${scanId}/pdf`, {
              headers: { 'Cookie': '' }, // Server-to-server, no auth needed for internal
            });
            if (pdfRes.ok) {
              const arrayBuf = await pdfRes.arrayBuffer();
              pdfBuffer = Buffer.from(arrayBuf);
            }
          }
        } catch (pdfErr) {
          console.error(`[assurance-schedules] PDF generation failed for ${schedule.id}:`, pdfErr);
          // Continue without PDF — still send email
        }

        // 5. Email recipients
        let emailId: string | null = null;
        if (schedule.recipients.length > 0) {
          try {
            // Use Resend (existing email.ts) for attachments support
            const { sendAssuranceReport } = await import('@/lib/email');
            const domain = new URL(schedule.site.url).hostname;
            const manageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'}/dashboard/assurance/schedule`;

            // Get previous score for comparison
            const previousRun = await (prisma as any).scheduleRun.findFirst({
              where: {
                scheduleId: schedule.id,
                status: 'success',
                id: { not: run.id },
              },
              orderBy: { startedAt: 'desc' },
              select: { scanScore: true },
            });

            const subject = buildReportSubject(domain, now);
            const html = buildReportEmailHtml({
              domain,
              score,
              previousScore: previousRun?.scanScore ?? null,
              reportDate: now,
              manageUrl,
            });
            const text = buildReportEmailText({
              domain,
              score,
              previousScore: previousRun?.scanScore ?? null,
              reportDate: now,
              manageUrl,
            });

            // Try Resend with attachment
            const result = await sendAssuranceReport({
              recipients: schedule.recipients,
              domain,
              score,
              threshold: 70,
              language: 'en',
              pdfBuffer: pdfBuffer ?? undefined,
            });

            emailId = result?.data?.id ?? null;
          } catch (emailErr) {
            console.error(`[assurance-schedules] Email failed for ${schedule.id}:`, emailErr);
          }
        }

        // 6. Update run as success
        await (prisma as any).scheduleRun.update({
          where: { id: run.id },
          data: {
            status: 'success',
            scanScore: score,
            emailSentAt: emailId ? now : null,
            emailId,
            completedAt: new Date(),
          },
        });

        // 7. Reset failure count + advance nextRunAt
        await advanceNextRunAt(schedule, true);

        results.push({ scheduleId: schedule.id, siteUrl: schedule.site.url, status: 'success', score });
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : 'Unknown error';
        console.error(`[assurance-schedules] Error processing ${schedule.id}:`, errMsg);

        // Mark run as failed if it exists
        try {
          await (prisma as any).scheduleRun.updateMany({
            where: { scheduleId: schedule.id, windowKey, status: 'running' },
            data: { status: 'failed', error: errMsg.substring(0, 500), completedAt: new Date() },
          });
        } catch { /* ignore */ }

        // Increment failure count, disable if too many
        const newFailures = (schedule.consecutiveFailures || 0) + 1;
        const shouldDisable = newFailures >= MAX_CONSECUTIVE_FAILURES;

        await (prisma as any).scanSchedule.update({
          where: { id: schedule.id },
          data: {
            consecutiveFailures: newFailures,
            isEnabled: shouldDisable ? false : undefined,
          },
        });

        // Still advance nextRunAt
        await advanceNextRunAt(schedule);

        results.push({ scheduleId: schedule.id, siteUrl: schedule.site.url, status: 'failed', error: errMsg });
      }
    }

    return successResponse({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('[assurance-schedules] Cron job failed:', error);
    return errorResponse('Cron job failed', 500);
  }
}

async function advanceNextRunAt(schedule: any, resetFailures: boolean = false): Promise<void> {
  const nextRunAt = calculateNextRunAt(
    {
      frequency: schedule.frequency as Frequency,
      daysOfWeek: schedule.daysOfWeek,
      dayOfMonth: schedule.dayOfMonth,
      timeOfDay: schedule.timeOfDay,
      timezone: schedule.timezone,
      startsAt: schedule.startsAt,
      endsAt: schedule.endsAt,
    },
    new Date()
  );

  const data: Record<string, unknown> = {
    lastRunAt: new Date(),
    nextRunAt,
  };

  if (resetFailures) {
    data.consecutiveFailures = 0;
  }

  // If nextRunAt is past endsAt, disable
  if (schedule.endsAt && nextRunAt.getTime() >= new Date(schedule.endsAt).getTime()) {
    data.isEnabled = false;
  }

  await (prisma as any).scanSchedule.update({
    where: { id: schedule.id },
    data,
  });
}

export const POST = withCronAuth(handler);
