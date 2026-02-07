import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCurrentUsage, getTotalEntitlements } from "@/lib/billing/entitlements";
import { getUserAddOns } from "@/lib/billing/addon-flows";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireAuth();

    // Get current usage (monthly increment counters)
    const usage = await getCurrentUsage(user.id);

    // Get total entitlements (including add-ons)
    const entitlements = await getTotalEntitlements(user.id);

    // Get active add-ons
    const addOns = await getUserAddOns(user.id);

    // Get real counts from database (what enforcement actually checks)
    const now = new Date();
    const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

    const [totalSites, totalScansThisMonth, teamMembers] = await Promise.all([
      prisma.site.count({ where: { userId: user.id } }),
      prisma.scan.count({
        where: {
          site: { userId: user.id },
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.teamMember.count({
        where: { team: { ownerId: user.id } },
      }),
    ]);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        plan: user.plan,
        subscriptionStatus: user.subscriptionStatus,
        trialEndsAt: user.trialEndsAt,
      },
      usage,
      entitlements,
      addOns,
      actualUsage: {
        sites: totalSites,
        scansThisMonth: totalScansThisMonth,
        teamMembers: teamMembers + 1, // +1 for owner
      },
    });
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}
