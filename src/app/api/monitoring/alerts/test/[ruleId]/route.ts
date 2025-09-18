import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";

interface RouteParams {
  params: {
    ruleId: string;
  };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { ruleId } = params;

    // Simulate sending a test alert
    console.log(`Testing alert rule ${ruleId} for user ${user.id}`);

    // In production, this would:
    // 1. Load the alert rule configuration
    // 2. Send test notifications to configured channels
    // 3. Log the test attempt
    // 4. Return success/failure status

    // Simulate some delay for realistic experience
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock test results
    const testResults = {
      email: Math.random() > 0.1, // 90% success rate
      inApp: true, // Always succeeds
      webhook: Math.random() > 0.2, // 80% success rate
      slack: Math.random() > 0.15 // 85% success rate
    };

    const successful = Object.values(testResults).every(result => result);

    // Add to alert history (in production, save to database)
    const testAlert = {
      id: `test-${Date.now()}`,
      ruleId,
      ruleName: `Test Alert for Rule ${ruleId}`,
      triggeredAt: new Date(),
      message: 'This is a test alert to verify your notification channels are working correctly.',
      channels: Object.keys(testResults).filter(channel => testResults[channel as keyof typeof testResults]),
      successful,
      errorMessage: successful ? undefined : 'Some notification channels failed during testing'
    };

    console.log('Test alert results:', testAlert);

    return NextResponse.json({
      success: true,
      testResults,
      message: successful
        ? 'Test alert sent successfully to all configured channels'
        : 'Test alert completed with some failures'
    });

  } catch (error) {
    console.error("Alert test error:", error);
    return NextResponse.json(
      { error: "Failed to test alert rule" },
      { status: 500 }
    );
  }
}