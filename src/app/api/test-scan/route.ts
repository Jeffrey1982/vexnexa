import { NextRequest, NextResponse } from "next/server";
import { runRobustAccessibilityScan } from "@/lib/scanner-headless";
import { requireDevelopment } from '@/lib/dev-only'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const devCheck = requireDevelopment()
  if (devCheck) return devCheck


  const { searchParams } = new URL(req.url);
  const testUrl = searchParams.get('url') || 'https://example.com';

  try {
    console.log('Testing scan for URL:', testUrl);
    console.log('Environment variables:', {
      VERCEL: process.env.VERCEL,
      NODE_VERSION: process.version,
      PLAYWRIGHT_SKIP: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
    });

    const result = await runRobustAccessibilityScan(testUrl);

    return NextResponse.json({
      success: true,
      url: testUrl,
      result: result,
      environment: {
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version,
        skipPlaywright: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
      }
    });
  } catch (error: any) {
    console.error('Test scan failed:', error);

    return NextResponse.json({
      success: false,
      url: testUrl,
      error: error.message,
      stack: error.stack,
      environment: {
        isVercel: !!process.env.VERCEL,
        nodeVersion: process.version,
        skipPlaywright: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
      }
    });
  }
}