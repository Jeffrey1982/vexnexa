import { NextRequest, NextResponse } from "next/server"
import { mollie } from "@/lib/mollie"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth()

    console.log('Testing Mollie API connection...')

    // Test basic API connection by fetching profile
    const profile = await mollie.profiles.get('me')
    console.log('Mollie profile:', profile)

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        website: profile.website,
        email: profile.email,
        mode: profile.mode
      }
    })

  } catch (error) {
    console.error("Mollie test error:", error)
    console.error("Error details:", {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    })

    return NextResponse.json(
      {
        error: "Mollie API test failed",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}