import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Debug Auth Endpoint ===')
    console.log('Headers:', Object.fromEntries(request.headers.entries()))

    const user = await requireAuth()

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Auth debug error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown auth error',
      timestamp: new Date().toISOString()
    }, { status: 401 })
  }
}