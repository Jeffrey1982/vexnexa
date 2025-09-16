import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    console.log('🧪 Simple scan test for:', url);

    // Just return a simple success response
    const mockResult = {
      score: 75,
      issues: 3,
      violations: [
        {
          id: "color-contrast",
          impact: "serious",
          nodes: [{ target: ['.header'], html: '<div class="header">Test</div>' }],
          help: "Elements must have sufficient color contrast",
          description: "Test violation for debugging"
        }
      ]
    };

    console.log('🧪 Returning mock result:', mockResult);

    return NextResponse.json({
      ok: true,
      scanId: "test-" + Date.now(),
      result: mockResult,
      message: "Simple scan test successful"
    });

  } catch (error: any) {
    console.error('🧪 Simple scan failed:', error);

    return NextResponse.json({
      ok: false,
      error: error.message,
      message: "Simple scan test failed"
    }, { status: 500 });
  }
}