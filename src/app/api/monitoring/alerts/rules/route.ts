import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: {
    scoreDropThreshold: number;
    newViolationsThreshold: number;
    complianceThreshold: number;
    severityLevels: string[];
  };
  channels: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
    slack: boolean;
  };
  recipients: {
    emails: string[];
    webhookUrl?: string;
    slackWebhook?: string;
  };
  cooldownMinutes: number;
  lastTriggered?: Date;
  totalAlertsSent: number;
}

// In-memory storage for demo purposes
// In production, this would be stored in the database
let alertRules: AlertRule[] = [
  {
    id: 'default-critical',
    name: 'Critical Accessibility Regressions',
    description: 'Alert when critical accessibility regressions are detected',
    enabled: true,
    triggers: {
      scoreDropThreshold: 20,
      newViolationsThreshold: 15,
      complianceThreshold: 60,
      severityLevels: ['critical', 'major']
    },
    channels: {
      email: true,
      inApp: true,
      webhook: false,
      slack: false
    },
    recipients: {
      emails: ['admin@tutusporta.com']
    },
    cooldownMinutes: 60,
    totalAlertsSent: 3
  },
  {
    id: 'default-moderate',
    name: 'Moderate Issues Monitoring',
    description: 'Monitor for moderate accessibility issues and trends',
    enabled: true,
    triggers: {
      scoreDropThreshold: 10,
      newViolationsThreshold: 5,
      complianceThreshold: 80,
      severityLevels: ['moderate', 'major', 'critical']
    },
    channels: {
      email: false,
      inApp: true,
      webhook: false,
      slack: false
    },
    recipients: {
      emails: []
    },
    cooldownMinutes: 240,
    totalAlertsSent: 7
  }
];

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Filter rules for the user (in production, filter by userId)
    return NextResponse.json({
      rules: alertRules
    });

  } catch (error) {
    console.error("Alert rules fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch alert rules" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const ruleData = await req.json();

    const newRule: AlertRule = {
      id: `rule-${Date.now()}`,
      ...ruleData,
      totalAlertsSent: 0
    };

    alertRules.push(newRule);

    console.log(`New alert rule created by user ${user.id}:`, newRule);

    return NextResponse.json({
      success: true,
      rule: newRule
    });

  } catch (error) {
    console.error("Alert rule creation error:", error);
    return NextResponse.json(
      { error: "Failed to create alert rule" },
      { status: 500 }
    );
  }
}