import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

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

// Mock alert history data for demo purposes
const alertHistory: AlertHistory[] = [
  {
    id: 'alert-1',
    ruleId: 'default-critical',
    ruleName: 'Critical Accessibility Regressions',
    triggeredAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    message: 'Score dropped by 25 points on example.com (85 → 60)',
    channels: ['email', 'inApp'],
    successful: true
  },
  {
    id: 'alert-2',
    ruleId: 'default-moderate',
    ruleName: 'Moderate Issues Monitoring',
    triggeredAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    message: '12 new accessibility violations detected on shop.example.com',
    channels: ['inApp'],
    successful: true
  },
  {
    id: 'alert-3',
    ruleId: 'default-critical',
    ruleName: 'Critical Accessibility Regressions',
    triggeredAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    message: 'WCAG AA compliance dropped to 55% on portal.example.com',
    channels: ['email', 'inApp'],
    successful: false,
    errorMessage: 'SMTP server temporarily unavailable'
  },
  {
    id: 'alert-4',
    ruleId: 'default-moderate',
    ruleName: 'Moderate Issues Monitoring',
    triggeredAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    message: '8 new violations detected affecting form accessibility',
    channels: ['inApp'],
    successful: true
  },
  {
    id: 'alert-5',
    ruleId: 'default-critical',
    ruleName: 'Critical Accessibility Regressions',
    triggeredAt: new Date(Date.now() - 36 * 60 * 60 * 1000), // 1.5 days ago
    message: 'Critical regression: Navigation becomes inaccessible via keyboard',
    channels: ['email', 'inApp', 'webhook'],
    successful: true
  }
];

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // In production, filter by user's sites and alert rules
    return NextResponse.json({
      history: alertHistory.sort((a, b) =>
        new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
      )
    });

  } catch (error) {
    console.error("Alert history fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert history" },
      { status: 500 }
    );
  }
}