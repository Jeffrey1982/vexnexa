import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-response'
import { runEnhancedAccessibilityScan } from '@/lib/scan-engine'
import { sendEmail } from '@/lib/email'

/**
 * GET /api/cron/scheduled-scans - Execute due scheduled scans
 *
 * This endpoint should be called by a cron job (e.g., Vercel Cron, GitHub Actions)
 * every 5-15 minutes to check for and execute scheduled scans.
 *
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/scheduled-scans",
 *     "schedule": "*/15 * * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return errorResponse('Unauthorized', 401)
    }

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

        // Run the scan
        const scanResult = await runEnhancedAccessibilityScan(
          scheduledScan.site.url,
          scheduledScan.user.id,
          scheduledScan.siteId
        )

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

        // Send notifications
        if (scheduledScan.emailOnComplete || (scheduledScan.emailOnIssues && scanResult.totalIssues > 0)) {
          await sendScanCompletionEmail(scheduledScan, scanResult)
        }

        if (scheduledScan.webhookUrl && scanResult) {
          await sendWebhookNotification(scheduledScan.webhookUrl, scheduledScan, scanResult)
        }

        results.push({
          scheduledScanId: scheduledScan.id,
          siteUrl: scheduledScan.site.url,
          status: 'success',
          scanId: scanResult.scanId,
          score: scanResult.score
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

async function sendScanCompletionEmail(scheduledScan: any, scanResult: any) {
  try {
    const userName = scheduledScan.user.firstName || scheduledScan.user.email

    await sendEmail({
      to: scheduledScan.user.email,
      subject: `Scheduled Scan Completed - ${scheduledScan.site.url}`,
      html: `
        <h2>Scheduled Scan Results</h2>
        <p>Hello ${userName},</p>
        <p>Your scheduled scan for <strong>${scheduledScan.site.url}</strong> has been completed.</p>

        <h3>Summary:</h3>
        <ul>
          <li><strong>Accessibility Score:</strong> ${scanResult.score}/100</li>
          <li><strong>Total Issues:</strong> ${scanResult.totalIssues}</li>
          <li><strong>Critical Issues:</strong> ${scanResult.critical || 0}</li>
          <li><strong>Serious Issues:</strong> ${scanResult.serious || 0}</li>
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/scans/${scanResult.scanId}">View Full Report</a></p>

        <p>Next scheduled scan: ${new Date(scheduledScan.nextRunAt).toLocaleString()}</p>
      `
    })
  } catch (error) {
    console.error('Error sending scan completion email:', error)
  }
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
          scanId: scanResult.scanId,
          score: scanResult.score,
          totalIssues: scanResult.totalIssues,
          critical: scanResult.critical || 0,
          serious: scanResult.serious || 0,
          moderate: scanResult.moderate || 0,
          minor: scanResult.minor || 0
        }
      })
    })
  } catch (error) {
    console.error('Error sending webhook notification:', error)
  }
}
