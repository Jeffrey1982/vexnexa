import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getCurrentUsage, getEntitlements } from "@/lib/billing/entitlements";

export async function GET() {
  try {
    const user = await requireAuth();

    // Get current usage
    const usage = await getCurrentUsage(user.id);

    // Get plan entitlements
    const entitlements = getEntitlements(user.plan as any);

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
    });
  } catch (error) {
    console.error("Failed to fetch billing data:", error);
    return NextResponse.json(
      { error: "Failed to fetch billing data" },
      { status: 500 }
    );
  }
}
