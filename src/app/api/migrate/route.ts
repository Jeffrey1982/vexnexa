import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    console.log('Running database migration to add teamInvitations column...')

    // Check if the column already exists by trying to select it
    try {
      await prisma.$queryRaw`SELECT "teamInvitations" FROM "User" LIMIT 1`
      console.log('Column teamInvitations already exists')
      return NextResponse.json({ success: true, message: 'Column already exists' })
    } catch (error) {
      console.log('Column teamInvitations does not exist, adding it...')
    }

    // Add the missing column
    await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "teamInvitations" BOOLEAN NOT NULL DEFAULT true`

    console.log('Successfully added teamInvitations column')

    return NextResponse.json({
      success: true,
      message: 'Database migration completed successfully'
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