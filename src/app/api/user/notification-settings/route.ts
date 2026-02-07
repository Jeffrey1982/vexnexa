import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const NotificationSettingsSchema = z.object({
  marketingEmails: z.boolean(),
  productUpdates: z.boolean(),
  securityAlerts: z.boolean(),
  teamInvitations: z.boolean(),
  scanNotifications: z.boolean(),
  weeklyReports: z.boolean(),
})

export async function GET() {
  try {
    const user = await requireAuth()

    return NextResponse.json({
      marketingEmails: user.marketingEmails,
      productUpdates: user.productUpdates,
      securityAlerts: true, // Always true for security
    })
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error('Failed to get notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to get notification settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()

    const validation = NotificationSettingsSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid notification settings', details: validation.error.issues },
        { status: 400 }
      )
    }

    const settings = validation.data

    // Update user settings (excluding securityAlerts which is always true)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        marketingEmails: settings.marketingEmails,
        productUpdates: settings.productUpdates,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Notification settings updated successfully'
    })
  } catch (error) {
    console.error('Failed to update notification settings:', error)
    return NextResponse.json(
      { error: 'Failed to update notification settings' },
      { status: 500 }
    )
  }
}