import { NextRequest, NextResponse } from "next/server"
import { mollie } from "@/lib/mollie"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const user = await requireAuth()

    console.log('Checking available payment methods...')

    // Get profile info
    const profile = await mollie.profiles.getCurrent()
    console.log('Profile:', {
      id: profile.id,
      name: profile.name,
      mode: profile.mode,
      status: profile.status
    })

    // Try to get payment methods
    let allMethods: any[] = []
    let enabledMethods: any[] = []

    try {
      allMethods = await mollie.methods.list()
      console.log('All available methods:', allMethods.map(m => ({ id: m.id, description: m.description })))
    } catch (methodError) {
      console.log('Error getting all methods:', methodError)
    }

    try {
      enabledMethods = await mollie.methods.list({ resource: 'payments' })
      console.log('Enabled methods:', enabledMethods.map(m => ({ id: m.id, description: m.description })))
    } catch (enabledError) {
      console.log('Error getting enabled methods:', enabledError)
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        name: profile.name,
        mode: profile.mode,
        status: profile.status,
        website: profile.website
      },
      allMethods: allMethods.map(m => ({
        id: m.id,
        description: m.description,
        minimumAmount: m.minimumAmount,
        maximumAmount: m.maximumAmount
      })),
      enabledMethods: enabledMethods.map(m => ({
        id: m.id,
        description: m.description,
        minimumAmount: m.minimumAmount,
        maximumAmount: m.maximumAmount
      }))
    })

  } catch (error) {
    console.error("Payment methods check error:", error)

    return NextResponse.json(
      {
        error: "Failed to check payment methods",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}