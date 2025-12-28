import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { runEnhancedAccessibilityScan } from '@/lib/scanner-enhanced'
import { withCronAuth } from '@/lib/cron-auth'

/**
 * POST /api/cron/scheduled-scans - Execute due scheduled scans
 *
 * This endpoint is called by Vercel Cron to execute scheduled scans.
 * Secured by X-CRON-TOKEN header via withCronAuth.
 *
 * Configure in vercel.json with appropriate cron schedule.
 */
async function handler(request: NextRequest) {
  try {
    const now = new Date()

    // Find all active scheduled scans that are due
    const dueScans = await prisma.scheduledScan.findMany({
      where: {
        active: true,
        nextRunAt: {
          lte: now
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            plan: true
          }
        },
        site: {
          select: {
            id: true,
            url: true
          }
        }
      },
      take: 50 // Process up to 50 scans per cron run
    })

    const results = []

    for (const scheduledScan of dueScans) {
      try {
        console.log(`Executing scheduled scan ${scheduledScan.id} for site ${scheduledScan.site.url}`)

        // Run the scan using the scan API
        const scanResult = await runEnhancedAccessibilityScan(scheduledScan.site.url)

        // Update scheduled scan
        const nextRunAt = calculateNextRunTime(
          scheduledScan.frequency,
          scheduledScan.dayOfWeek,
          scheduledScan.dayOfMonth,
          scheduledScan.timeOfDay
        )

        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: {
            lastRunAt: now,
            nextRunAt
          }
        })

        // Send webhook notification
        if (scheduledScan.webhookUrl && scanResult) {
          await sendWebhookNotification(scheduledScan.webhookUrl, scheduledScan, scanResult)
        }

        results.push({
          scheduledScanId: scheduledScan.id,
          siteUrl: scheduledScan.site.url,
          status: 'success',
          score: scanResult.score,
          issues: scanResult.issues
        })
      } catch (error) {
        console.error(`Error executing scheduled scan ${scheduledScan.id}:`, error)

        results.push({
          scheduledScanId: scheduledScan.id,
          siteUrl: scheduledScan.site.url,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })

        // Still update nextRunAt even on error
        const nextRunAt = calculateNextRunTime(
          scheduledScan.frequency,
          scheduledScan.dayOfWeek,
          scheduledScan.dayOfMonth,
          scheduledScan.timeOfDay
        )

        await prisma.scheduledScan.update({
          where: { id: scheduledScan.id },
          data: { nextRunAt }
        })
      }
    }

    return successResponse({
      executedCount: results.length,
      results
    })
  } catch (error) {
    console.error('Error in scheduled scans cron:', error)
    return errorResponse('Cron job failed', 500)
  }
}

function calculateNextRunTime(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null, timeOfDay: string = '00:00'): Date {
  const now = new Date()
  const [hours, minutes] = timeOfDay.split(':').map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (frequency === 'daily') {
    nextRun.setDate(nextRun.getDate() + 1)
  } else if (frequency === 'weekly' && dayOfWeek !== null && dayOfWeek !== undefined) {
    const currentDay = now.getDay()
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7
    nextRun.setDate(nextRun.getDate() + daysUntilNext)
  } else if (frequency === 'monthly' && dayOfMonth !== null && dayOfMonth !== undefined) {
    nextRun.setMonth(nextRun.getMonth() + 1)
    nextRun.setDate(dayOfMonth)
  }

  return nextRun
}

async function sendWebhookNotification(webhookUrl: string, scheduledScan: any, scanResult: any) {
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'scheduled_scan_completed',
        timestamp: new Date().toISOString(),
        scheduledScanId: scheduledScan.id,
        siteUrl: scheduledScan.site.url,
        scanResult: {
          score: scanResult.score,
          issues: scanResult.issues,
          violations: scanResult.violations?.length || 0
        }
      })
    })
  } catch (error) {
    console.error('Error sending webhook notification:', error)
  }
}

export const POST = withCronAuth(handler);
export const dynamic = 'force-dynamic';
