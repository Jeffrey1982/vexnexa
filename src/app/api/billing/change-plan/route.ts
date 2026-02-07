import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireAuth } from "@/lib/auth"
import { changePlan, createUpgradePayment } from "@/lib/billing/mollie-flows"
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
    
    // Try direct plan change first (works if user has valid Mollie mandate)
    try {
      const result = await changePlan({
        userId: user.id,
        newPlan: plan
      })
      
      if (result.success) {
        // Plan changed directly via existing mandate — saved to DB
        return NextResponse.json({
          success: true,
          plan
        })
      }
      
      if (result.needCheckout) {
        // No valid mandate — need checkout flow to establish one
        const molliePayment = await createUpgradePayment({
          userId: user.id,
          email: user.email,
          plan
        })
        
        const paymentObj = molliePayment as any
        
        return NextResponse.json({
          needCheckout: true,
          checkoutUrl: paymentObj.getCheckoutUrl(),
          paymentId: paymentObj.id
        })
      }
    } catch (changePlanError) {
      // If changePlan fails (e.g. no Mollie customer yet), fall back to checkout
      console.log("changePlan failed, falling back to checkout:", changePlanError instanceof Error ? changePlanError.message : changePlanError)
      
      const molliePayment = await createUpgradePayment({
        userId: user.id,
        email: user.email,
        plan
      })
      
      const paymentObj = molliePayment as any
      
      return NextResponse.json({
        needCheckout: true,
        checkoutUrl: paymentObj.getCheckoutUrl(),
        paymentId: paymentObj.id
      })
    }
    
    return NextResponse.json(
      { error: "Unexpected state during plan change" },
      { status: 500 }
    )
    
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