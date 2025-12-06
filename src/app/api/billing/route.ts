import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCurrentUsage, getTotalEntitlements } from "@/lib/billing/entitlements";
import { getUserAddOns } from "@/lib/billing/addon-flows";

export async function GET() {
  try {
    const user = await requireAuth();

    // Get current usage
    const usage = await getCurrentUsage(user.id);

    // Get total entitlements (including add-ons)
    const entitlements = await getTotalEntitlements(user.id);

    // Get active add-ons
    const addOns = await getUserAddOns(user.id);

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
    });
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}
