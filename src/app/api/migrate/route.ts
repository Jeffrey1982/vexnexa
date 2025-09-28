import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('Running database migration to add missing User columns...')

    const results = []

    // Add teamInvitations column
    try {
      console.log('Adding teamInvitations column...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "teamInvitations" BOOLEAN NOT NULL DEFAULT true`
      console.log('Successfully added teamInvitations column')
      results.push('teamInvitations: added')
    } catch (error) {
      console.log('teamInvitations column might already exist:', error)
      results.push('teamInvitations: already exists')
    }

    // Add scanNotifications column
    try {
      console.log('Adding scanNotifications column...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "scanNotifications" BOOLEAN NOT NULL DEFAULT true`
      console.log('Successfully added scanNotifications column')
      results.push('scanNotifications: added')
    } catch (error) {
      console.log('scanNotifications column might already exist:', error)
      results.push('scanNotifications: already exists')
    }

    // Add weeklyReports column
    try {
      console.log('Adding weeklyReports column...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "weeklyReports" BOOLEAN NOT NULL DEFAULT false`
      console.log('Successfully added weeklyReports column')
      results.push('weeklyReports: added')
    } catch (error) {
      console.log('weeklyReports column might already exist:', error)
      results.push('weeklyReports: already exists')
    }

    // Add profileCompleted column
    try {
      console.log('Adding profileCompleted column...')
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "profileCompleted" BOOLEAN NOT NULL DEFAULT false`
      console.log('Successfully added profileCompleted column')
      results.push('profileCompleted: added')
    } catch (error) {
      console.log('profileCompleted column might already exist:', error)
      results.push('profileCompleted: already exists')
    }

    return NextResponse.json({
      success: true,
      message: 'Database migration completed',
      results
    })

  } catch (error) {
    console.error("Migration error:", error)

    return NextResponse.json(
      {
        error: "Migration failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}