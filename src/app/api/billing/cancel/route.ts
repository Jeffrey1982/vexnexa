import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { cancelSubscription } from "@/lib/billing/mollie-flows"

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()
    
    // Cancel the subscription
    await cancelSubscription(user.id)
    
    return NextResponse.json({
      success: true,
      message: "Subscription cancelled successfully"
    })
    
  } catch (error) {
    console.error("Cancel subscription error:", error)
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    if (error instanceof Error && error.message === "No active subscription found") {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    )
  }
}