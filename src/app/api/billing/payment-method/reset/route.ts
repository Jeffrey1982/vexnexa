import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { createPaymentMethodResetPayment } from "@/lib/billing/mollie-flows"

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await requireAuth()
    
    // Create payment to reset payment method
    const payment = await createPaymentMethodResetPayment(user.id, user.email)
    
    // Type assertion workaround for compiler issue  
    const paymentObj = payment as any
    
    return NextResponse.json({
      url: paymentObj.getCheckoutUrl(),
      paymentId: paymentObj.id,
      message: "Payment method reset initiated"
    })
    
  } catch (error) {
    console.error("Payment method reset error:", error)
    
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { error: "Failed to reset payment method" },
      { status: 500 }
    )
  }
}