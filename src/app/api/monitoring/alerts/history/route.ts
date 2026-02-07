import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  message: string;
  channels: string[];
  successful: boolean;
  errorMessage?: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // TODO: Implement real alert history from database
    // For now, return empty array until alert history table is created
    // This will be populated when monitoring alerts are triggered and logged

    // Future implementation:
    // const alertHistory = await prisma.alertHistory.findMany({
    //   where: {
    //     site: {
    //       userId: user.id
    //     }
    //   },
    //   orderBy: {
    //     triggeredAt: 'desc'
    //   },
    //   take: 50
    // });

    return NextResponse.json({
      history: []
    });

  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Alert history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert history" },
      { status: 500 }
    );
  }
}