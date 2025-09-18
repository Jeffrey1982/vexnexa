import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: {
    alertId: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { alertId } = params;

    // For now, we'll just return success since alerts are calculated dynamically
    // In a real implementation, you might store alert acknowledgments in the database

    // Log the alert resolution for audit purposes
    console.log(`Alert ${alertId} resolved by user ${user.id} at ${new Date().toISOString()}`);

    return NextResponse.json({
      success: true,
      message: "Alert marked as resolved"
    });

  } catch (error) {
    console.error("Alert resolution error:", error);
    return NextResponse.json(
      { error: "Failed to resolve alert" },
      { status: 500 }
    );
  }
}