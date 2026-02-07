import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

/**
 * GET /api/scheduled-scans - Get user's scheduled scans
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    if (!dbUser) {
      return unauthorizedResponse()
    }

    const scheduledScans = await prisma.scheduledScan.findMany({
      where: { userId: dbUser.id },
      include: {
        site: {
          select: {
            id: true,
            url: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return successResponse({ scheduledScans })
  } catch (error) {
    console.error('Error fetching scheduled scans:', error)
    return errorResponse('Failed to fetch scheduled scans', 500)
  }
}

/**
 * POST /api/scheduled-scans - Create a new scheduled scan
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return unauthorizedResponse()
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! }
    })

    if (!dbUser) {
      return unauthorizedResponse()
    }

    const body = await request.json()
    const { siteId, frequency, dayOfWeek, dayOfMonth, timeOfDay, emailOnComplete, emailOnIssues, webhookUrl } = body

    // Validate site ownership
    const site = await prisma.site.findUnique({
      where: { id: siteId }
    })

    if (!site || site.userId !== dbUser.id) {
      return errorResponse('Site not found or access denied', 404)
    }

    // Calculate next run time
    const nextRunAt = calculateNextRunTime(frequency, dayOfWeek, dayOfMonth, timeOfDay)

    const scheduledScan = await prisma.scheduledScan.create({
      data: {
        userId: dbUser.id,
        siteId,
        frequency,
        dayOfWeek: frequency === 'weekly' ? dayOfWeek : null,
        dayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
        timeOfDay: timeOfDay || '00:00',
        nextRunAt,
        emailOnComplete: emailOnComplete ?? true,
        emailOnIssues: emailOnIssues ?? true,
        webhookUrl: webhookUrl || null
      },
      include: {
        site: {
          select: {
            id: true,
            url: true
          }
        }
      }
    })

    return successResponse({ scheduledScan }, 'Scheduled scan created successfully', 201)
  } catch (error) {
    console.error('Error creating scheduled scan:', error)
    return errorResponse('Failed to create scheduled scan', 500)
  }
}

function calculateNextRunTime(frequency: string, dayOfWeek?: number, dayOfMonth?: number, timeOfDay: string = '00:00'): Date {
  const now = new Date()
  const [hours, minutes] = timeOfDay.split(':').map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (frequency === 'daily') {
    // If time has passed today, schedule for tomorrow
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (frequency === 'weekly' && dayOfWeek !== undefined) {
    // Find next occurrence of dayOfWeek
    const currentDay = nextRun.getDay()
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7

    if (daysUntilNext === 0 && nextRun <= now) {
      // Same day but time passed, schedule for next week
      nextRun.setDate(nextRun.getDate() + 7)
    } else {
      nextRun.setDate(nextRun.getDate() + daysUntilNext)
    }
  } else if (frequency === 'monthly' && dayOfMonth !== undefined) {
    // Set to specified day of current or next month
    nextRun.setDate(dayOfMonth)

    if (nextRun <= now) {
      // Move to next month
      nextRun.setMonth(nextRun.getMonth() + 1)
      nextRun.setDate(dayOfMonth)
    }
  }

  return nextRun
}
