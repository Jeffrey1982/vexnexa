import { NextRequest, NextResponse } from "next/server";
import { withCronAuth } from "@/lib/cron-auth";
import { EnhancedAccessibilityScanner } from "@/lib/scanner-enhanced";
import { sendScanHealthAlertEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const HEALTH_CHECK_URL = process.env.SCAN_HEALTH_URL || "https://vexnexa.com";
const SCAN_TIMEOUT_MS = 90_000;

/**
 * GET /api/cron/scan-health — daily canary scan.
 *
 * The scanner is the product: if headless Chromium stops booting on Vercel
 * (dependency bump, runtime change, cold-start regression), every free-scan
 * visitor silently hits "scanner temporarily unavailable" until someone
 * notices. This cron runs one real single-page scan and emails an alert to
 * the founder inbox when the result is missing, mocked, or errored.
 */
async function handler(_request: NextRequest) {
  const startedAt = Date.now();
  const scanner = new EnhancedAccessibilityScanner();
  let failure: string | null = null;
  let score: number | null = null;
  let issues: number | null = null;

  try {
    const result = await Promise.race([
      scanner.scanUrl(HEALTH_CHECK_URL, { enableAiImageAnalysis: false, includeVNI: false }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Scan exceeded ${SCAN_TIMEOUT_MS / 1000}s`)), SCAN_TIMEOUT_MS)
      ),
    ]);

    const looksMock =
      result?.__demo === true ||
      result?.mock === true ||
      result?.engineName === "fallback-mock" ||
      !Array.isArray(result?.violations);

    if (looksMock) {
      failure = `Scanner returned mock/demo data (engine: ${result?.engineName ?? "unknown"}) — headless browser likely failed to start.`;
    } else {
      score = Math.round(result.score || 0);
      issues = result.violations.length;
    }
  } catch (error: any) {
    failure = error?.message || "Scan crashed without a message.";
  } finally {
    await scanner.close().catch(() => undefined);
  }

  const durationMs = Date.now() - startedAt;

  if (failure) {
    console.error("[scan-health] FAILED:", failure);
    try {
      await sendScanHealthAlertEmail({
        url: HEALTH_CHECK_URL,
        error: failure,
        durationMs,
      });
    } catch (mailError) {
      console.error("[scan-health] Alert email failed:", mailError);
    }
    return NextResponse.json(
      { ok: false, url: HEALTH_CHECK_URL, error: failure, durationMs },
      { status: 500 }
    );
  }

  console.log("[scan-health] OK:", { url: HEALTH_CHECK_URL, score, issues, durationMs });
  return NextResponse.json({ ok: true, url: HEALTH_CHECK_URL, score, issues, durationMs });
}

export const GET = withCronAuth(handler);
export const POST = withCronAuth(handler);
