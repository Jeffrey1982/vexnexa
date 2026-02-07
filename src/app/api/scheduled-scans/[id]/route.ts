import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server-new'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/api-response'

type RouteContext = {
  params: Promise<{ id: string }>
}

/**
 * GET /api/scheduled-scans/[id] - Get a specific scheduled scan
 */
export async function GET(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params

    const scheduledScan = await prisma.scheduledScan.findUnique({
      where: { id },
      include: {
        site: {
          select: {
            id: true,
            url: true
          }
        }
      }
    })

    if (!scheduledScan || scheduledScan.userId !== dbUser.id) {
      return errorResponse('Scheduled scan not found', 404)
    }

    return successResponse({ scheduledScan })
  } catch (error) {
    console.error('Error fetching scheduled scan:', error)
    return errorResponse('Failed to fetch scheduled scan', 500)
  }
}

/**
 * PATCH /api/scheduled-scans/[id] - Update a scheduled scan
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params
    const body = await request.json()

    const scheduledScan = await prisma.scheduledScan.findUnique({
      where: { id }
    })

    if (!scheduledScan || scheduledScan.userId !== dbUser.id) {
      return errorResponse('Scheduled scan not found', 404)
    }

    const { frequency, dayOfWeek, dayOfMonth, timeOfDay, active, emailOnComplete, emailOnIssues, webhookUrl } = body

    const updateData: any = {}

    if (frequency !== undefined) updateData.frequency = frequency
    if (dayOfWeek !== undefined) updateData.dayOfWeek = frequency === 'weekly' ? dayOfWeek : null
    if (dayOfMonth !== undefined) updateData.dayOfMonth = frequency === 'monthly' ? dayOfMonth : null
    if (timeOfDay !== undefined) updateData.timeOfDay = timeOfDay
    if (active !== undefined) updateData.active = active
    if (emailOnComplete !== undefined) updateData.emailOnComplete = emailOnComplete
    if (emailOnIssues !== undefined) updateData.emailOnIssues = emailOnIssues
    if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl

    // Recalculate nextRunAt if schedule changed
    if (frequency || dayOfWeek !== undefined || dayOfMonth !== undefined || timeOfDay) {
      updateData.nextRunAt = calculateNextRunTime(
        frequency || scheduledScan.frequency,
        dayOfWeek ?? scheduledScan.dayOfWeek,
        dayOfMonth ?? scheduledScan.dayOfMonth,
        timeOfDay || scheduledScan.timeOfDay
      )
    }

    const updated = await prisma.scheduledScan.update({
      where: { id },
      data: updateData,
      include: {
        site: {
          select: {
            id: true,
            url: true
          }
        }
      }
    })

    return successResponse({ scheduledScan: updated })
  } catch (error) {
    console.error('Error updating scheduled scan:', error)
    return errorResponse('Failed to update scheduled scan', 500)
  }
}

/**
 * DELETE /api/scheduled-scans/[id] - Delete a scheduled scan
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { id } = await context.params

    const scheduledScan = await prisma.scheduledScan.findUnique({
      where: { id }
    })

    if (!scheduledScan || scheduledScan.userId !== dbUser.id) {
      return errorResponse('Scheduled scan not found', 404)
    }

    await prisma.scheduledScan.delete({
      where: { id }
    })

    return successResponse({ message: 'Scheduled scan deleted successfully' })
  } catch (error) {
    console.error('Error deleting scheduled scan:', error)
    return errorResponse('Failed to delete scheduled scan', 500)
  }
}

function calculateNextRunTime(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null, timeOfDay: string = '00:00'): Date {
  const now = new Date()
  const [hours, minutes] = timeOfDay.split(':').map(Number)

  const nextRun = new Date(now)
  nextRun.setHours(hours, minutes, 0, 0)

  if (frequency === 'daily') {
    if (nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 1)
    }
  } else if (frequency === 'weekly' && dayOfWeek !== null && dayOfWeek !== undefined) {
    const currentDay = nextRun.getDay()
    const daysUntilNext = (dayOfWeek - currentDay + 7) % 7

    if (daysUntilNext === 0 && nextRun <= now) {
      nextRun.setDate(nextRun.getDate() + 7)
    } else {
      nextRun.setDate(nextRun.getDate() + daysUntilNext)
    }
  } else if (frequency === 'monthly' && dayOfMonth !== null && dayOfMonth !== undefined) {
    nextRun.setDate(dayOfMonth)

    if (nextRun <= now) {
      nextRun.setMonth(nextRun.getMonth() + 1)
      nextRun.setDate(dayOfMonth)
    }
  }

  return nextRun
}
