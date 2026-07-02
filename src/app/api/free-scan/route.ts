import { NextRequest, NextResponse } from "next/server";
import { EnhancedAccessibilityScanner } from "@/lib/scanner-enhanced";
import { freeScanLimiter } from "@/lib/rate-limit";
import { normalizeUrl } from "@/lib/url";
import { validatePublicUrl } from "@/lib/scan-url-validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const SCAN_TIMEOUT_MS = 75_000;
const MAX_EXAMPLE_FINDINGS = 3;

const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  serious: 1,
  moderate: 2,
  minor: 3,
};

/**
 * Anonymous single-page scan for the marketing funnel.
 * No account, no persistence — returns a partial result (score, severity
 * counts, a few example findings). The full report is gated behind signup.
 * Rate limited per IP via freeScanLimiter (3 scans / 24h).
 */
export async function POST(req: NextRequest) {
  const limit = freeScanLimiter(req);
  if (!limit.success) {
    return NextResponse.json(
      {
        ok: false,
        code: "RATE_LIMITED",
        error: "You have reached the daily limit of free anonymous scans. Create a free account to keep scanning.",
        resetTime: limit.resetTime,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((limit.resetTime - Date.now()) / 1000))),
        },
      }
    );
  }

  let fullPageUrl: string;
  try {
    const body = await req.json();
    const normalized = normalizeUrl(body?.url);
    if (!normalized) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid website URL." },
        { status: 400 }
      );
    }
    ({ fullPageUrl } = validatePublicUrl(normalized));
  } catch (urlError: any) {
    return NextResponse.json(
      { ok: false, error: urlError?.message || "Invalid request" },
      { status: urlError?.statusCode || 400 }
    );
  }

  const scanner = new EnhancedAccessibilityScanner();
  try {
    const result = await Promise.race([
      scanner.scanUrl(fullPageUrl, { enableAiImageAnalysis: false, includeVNI: false }),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(Object.assign(new Error("Scan timed out"), { code: "SCAN_TIMEOUT" })),
          SCAN_TIMEOUT_MS
        )
      ),
    ]);

    const looksMock =
      result?.__demo === true ||
      result?.mock === true ||
      result?.engineName === "fallback-mock" ||
      !Array.isArray(result?.violations);

    if (looksMock) {
      return NextResponse.json(
        {
          ok: false,
          code: "SCANNER_UNAVAILABLE",
          error: "The scanner is temporarily unavailable. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    const violations = result.violations || [];
    const examples = [...violations]
      .sort(
        (a: any, b: any) =>
          (SEVERITY_ORDER[a.impact] ?? 4) - (SEVERITY_ORDER[b.impact] ?? 4)
      )
      .slice(0, MAX_EXAMPLE_FINDINGS)
      .map((v: any) => ({
        id: v.id,
        impact: v.impact || "moderate",
        help: v.help,
        description: v.description,
        helpUrl: v.helpUrl || `https://dequeuniversity.com/rules/axe/4.10/${v.id}`,
      }));

    return NextResponse.json({
      ok: true,
      remaining: limit.remaining,
      result: {
        url: fullPageUrl,
        title: result.title || null,
        standard: "WCAG 2.2 AA",
        score: Math.round(result.score || 0),
        totalIssues: violations.length,
        impactCritical: result.impactCritical || 0,
        impactSerious: result.impactSerious || 0,
        impactModerate: result.impactModerate || 0,
        impactMinor: result.impactMinor || 0,
        examples,
      },
    });
  } catch (error: any) {
    console.error("[free-scan] Anonymous scan failed:", error?.message || error);
    const timedOut = error?.code === "SCAN_TIMEOUT";
    return NextResponse.json(
      {
        ok: false,
        code: timedOut ? "SCAN_TIMEOUT" : "SCAN_FAILED",
        error: timedOut
          ? "The scan took too long. The site may be slow or blocking automated access — try again or create a free account for a full scan."
          : "We could not scan this page. Check the URL, or try again in a few minutes.",
      },
      { status: 502 }
    );
  } finally {
    await scanner.close();
  }
}
