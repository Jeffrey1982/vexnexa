import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: {
    ruleId: string;
  };
}

// This would import from the shared storage in production
// For demo purposes, we'll access the same in-memory array
let alertRules: any[] = [];

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { ruleId } = params;
    const updates = await req.json();

    // Find and update the rule (in production, update in database)
    const ruleIndex = alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { error: "Alert rule not found" },
        { status: 404 }
      );
    }

    alertRules[ruleIndex] = { ...alertRules[ruleIndex], ...updates };

    console.log(`Alert rule ${ruleId} updated by user ${user.id}`);

    return NextResponse.json({
      success: true,
      rule: alertRules[ruleIndex]
    });

  } catch (error) {
    console.error("Alert rule update error:", error);
    return NextResponse.json(
      { error: "Failed to update alert rule" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { ruleId } = params;

    // Find and remove the rule (in production, delete from database)
    const ruleIndex = alertRules.findIndex(rule => rule.id === ruleId);
    if (ruleIndex === -1) {
      return NextResponse.json(
        { error: "Alert rule not found" },
        { status: 404 }
      );
    }

    const deletedRule = alertRules.splice(ruleIndex, 1)[0];

    console.log(`Alert rule ${ruleId} deleted by user ${user.id}`);

    return NextResponse.json({
      success: true,
      message: "Alert rule deleted"
    });

  } catch (error) {
    console.error("Alert rule deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete alert rule" },
      { status: 500 }
    );
  }
}