import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { cancelAddOn, updateAddOnQuantity } from "@/lib/billing/addon-flows"
import { prisma } from "@/lib/prisma"

/**
 * PATCH /api/billing/addons/[addonId]
 * Update add-on (adjust seat quantity)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { addonId: string } }
) {
  try {
    const user = await requireAuth()
    const { addonId } = params
    const { quantity } = await req.json()

    // Verify ownership
    const addOn = await prisma.addOn.findUnique({
      where: { id: addonId }
    })

    if (!addOn || addOn.userId !== user.id) {
      return NextResponse.json(
        { error: "Add-on not found" },
        { status: 404 }
      )
    }

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: "Invalid quantity" },
        { status: 400 }
      )
    }

    // Update quantity
    const updated = await updateAddOnQuantity({
      addOnId: addonId,
      newQuantity: quantity
    })

    return NextResponse.json({
      success: true,
      addOn: updated,
      message: "Aantal seats bijgewerkt"
    })
  } catch (error) {
    console.error("Update add-on error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update add-on" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/billing/addons/[addonId]
 * Cancel an add-on
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { addonId: string } }
) {
  try {
    const user = await requireAuth()
    const { addonId } = params

    // Verify ownership
    const addOn = await prisma.addOn.findUnique({
      where: { id: addonId }
    })

    if (!addOn || addOn.userId !== user.id) {
      return NextResponse.json(
        { error: "Add-on not found" },
        { status: 404 }
      )
    }

    // Cancel add-on
    await cancelAddOn(addonId)

    return NextResponse.json({
      success: true,
      message: "Add-on geannuleerd. Toegang blijft tot einde van de betaalperiode."
    })
  } catch (error) {
    console.error("Cancel add-on error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to cancel add-on" },
      { status: 500 }
    )
  }
}
