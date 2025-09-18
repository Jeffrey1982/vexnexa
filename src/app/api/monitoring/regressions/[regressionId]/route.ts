import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: {
    regressionId: string;
  };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { regressionId } = params;
    const { status, notes } = await req.json();

    // For now, we'll just log the status change since regressions are calculated dynamically
    // In a production system, you might want to store regression acknowledgments/resolutions
    // in a separate table for audit purposes

    console.log(`Regression ${regressionId} status updated to ${status} by user ${user.id}`);
    if (notes) {
      console.log(`Investigation notes: ${notes}`);
    }

    // Log with timestamp for audit trail
    const auditLog = {
      regressionId,
      userId: user.id,
      action: 'status_update',
      previousStatus: 'unknown', // Could be tracked if stored in DB
      newStatus: status,
      notes,
      timestamp: new Date().toISOString()
    };

    console.log('Regression audit log:', auditLog);

    return NextResponse.json({
      success: true,
      message: `Regression ${status}`,
      auditLog
    });

  } catch (error) {
    console.error("Regression update error:", error);
    return NextResponse.json(
      { error: "Failed to update regression status" },
      { status: 500 }
    );
  }
}