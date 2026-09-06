import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { getUserAddOns, purchaseAddOn } from "@/lib/billing/addon-flows"
import { AddOnType } from "@prisma/client"

export const maxDuration = 60

const PURCHASABLE_ADD_ONS = new Set<AddOnType>([
  AddOnType.EXTRA_SEAT,
  AddOnType.EXTRA_WEBSITE_1,
  AddOnType.EXTRA_WEBSITE_5,
  AddOnType.EXTRA_WEBSITE_10,
  AddOnType.PAGE_PACK_25K,
  AddOnType.PAGE_PACK_100K,
  AddOnType.PAGE_PACK_250K,
])

/**
 * GET /api/billing/addons
 * Get all add-ons for current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const addOns = await getUserAddOns(user.id)

    return NextResponse.json({ addOns })
  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Get add-ons error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch add-ons" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/billing/addons
 * Purchase a new add-on
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { type, quantity } = await req.json()

    // Validate type
    if (!type || !PURCHASABLE_ADD_ONS.has(type as AddOnType)) {
      return NextResponse.json(
        { error: "Invalid add-on type" },
        { status: 400 }
      )
    }

    // Purchase add-on
    const result = await purchaseAddOn({
      userId: user.id,
      type: type as AddOnType,
      quantity: quantity || 1
    })

    return NextResponse.json({
      success: true,
      addOn: 'addOn' in result ? result.addOn : result,
      message: "Add-on activated! Payment will be processed automatically each month."
    })
  } catch (error: any) {
    console.error("Purchase add-on error:", error)

    // Return error code for frontend translation
    const errorCode = error?.code || "UNKNOWN_ERROR"
    const redirectUrl = error?.redirectUrl
    const action = error?.action

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to purchase add-on",
        code: errorCode,
        redirectUrl,
        action
      },
      { status: error?.code === "TRIAL_USER" ? 403 : ["EXISTING_SEAT_BUNDLE", "ADDON_RECONCILIATION_REQUIRED"].includes(errorCode) ? 409 : 500 }
    )
  }
}
