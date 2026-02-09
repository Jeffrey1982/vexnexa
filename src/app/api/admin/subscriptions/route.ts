import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createClient } from "@/lib/supabase/server-new"
import { syncMollieProducts, getActiveProducts } from "@/lib/billing/mollie-sync"

async function requireAdmin(req: NextRequest): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { isAdmin: true },
  })
  if (!dbUser?.isAdmin) return null
  return user.id
}

/**
 * GET /api/admin/subscriptions
 * View subscription breakdown: users grouped by plan, add-on counts, Mollie product IDs
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const adminId = await requireAdmin(req)
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Plan distribution
    const planCounts = await prisma.user.groupBy({
      by: ["plan"],
      _count: { id: true },
      where: { subscriptionStatus: { in: ["active", "trialing"] } },
    })

    // Active add-on counts by type
    const addonCounts = await prisma.addOn.groupBy({
      by: ["type"],
      _count: { id: true },
      where: { status: "active" },
    })

    // Billing interval distribution
    const intervalCounts = await prisma.user.groupBy({
      by: ["billingInterval"],
      _count: { id: true },
      where: { subscriptionStatus: "active" },
    })

    // Assurance subscribers
    const assuranceCount = await prisma.user.count({
      where: { hasAssurance: true },
    })

    // Mollie product catalog
    const mollieProducts = await getActiveProducts()

    // Recent subscriptions (last 20)
    const recentSubs = await prisma.user.findMany({
      where: { subscriptionStatus: "active" },
      select: {
        id: true,
        email: true,
        plan: true,
        billingInterval: true,
        hasAssurance: true,
        extraWebsiteCount: true,
        mollieCustomerId: true,
        mollieSubscriptionId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 20,
    })

    return NextResponse.json({
      ok: true,
      planDistribution: planCounts.map((p) => ({
        plan: p.plan,
        count: p._count.id,
      })),
      addonDistribution: addonCounts.map((a) => ({
        type: a.type,
        count: a._count.id,
      })),
      intervalDistribution: intervalCounts.map((i) => ({
        interval: i.billingInterval,
        count: i._count.id,
      })),
      assuranceSubscribers: assuranceCount,
      mollieProducts: mollieProducts.map((p) => ({
        productKey: p.productKey,
        interval: p.interval,
        amount: Number(p.amount),
        mollieProductId: p.mollieProductId,
        molliePriceId: p.molliePriceId,
        active: p.active,
      })),
      recentSubscriptions: recentSubs,
    })
  } catch (error) {
    console.error("[admin/subscriptions] Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscription data" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/subscriptions
 * Force resync Mollie products
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminId = await requireAdmin(req)
  if (!adminId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const result = await syncMollieProducts()
    return NextResponse.json({ ok: true, sync: result })
  } catch (error) {
    console.error("[admin/subscriptions] Sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync products" },
      { status: 500 }
    )
  }
}
