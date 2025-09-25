import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { changePlan, createUpgradePayment as createPayment } from "@/lib/billing/mollie-flows"
import { PRICES } from "@/lib/billing/plans"

const ChangePlanSchema = z.object({
  plan: z.enum(["STARTER", "PRO", "BUSINESS"])
})

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()
    
    // Parse and validate request body
    const body = await request.json()
    const validation = ChangePlanSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.issues },
        { status: 400 }
      )
    }
    
    const { plan } = validation.data
    
    // Check if it's the same plan
    if (user.plan as string === plan) {
      return NextResponse.json(
        { error: "Already on this plan" },
        { status: 400 }
      )
    }
    
    // Validate plan exists in pricing
    if (!PRICES[plan]) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      )
    }
    
    // Create checkout payment for plan change
    const molliePayment = await createPayment({
      userId: user.id,
      email: user.email,
      plan
    })
    
    // Type assertion workaround for compiler issue
    const paymentObj = molliePayment as any
    
    return NextResponse.json({
      url: paymentObj.getCheckoutUrl(),
      paymentId: paymentObj.id
    })
    
  } catch (error) {
    console.error("Change plan error:", error)
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to change plan" },
      { status: 500 }
    )
  }
}