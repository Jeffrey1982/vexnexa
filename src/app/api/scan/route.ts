// src/app/api/scan/route.ts
import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runEnhancedAccessibilityScan } from "@/lib/scanner-enhanced";
import { requireAuth } from "@/lib/auth";
import {
  addPageUsage,
  addSiteUsage,
  assertWithinLimits,
  consumeWeeklyFreeScan,
  hasWeeklyFreeScanAvailable,
} from "@/lib/billing/entitlements";
import { calculateWCAGCompliance } from "@/lib/analytics";
import { ensureUserInDatabase } from "@/lib/user-sync";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
  analyzeSEOMetrics,
  calculateComplianceRisk,
  getPerformanceMetrics,
} from "@/lib/performance-analytics";
import { publishScanReport } from "@/lib/public-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SERVICE_TOKEN_HEADER = "x-service-token";
const SERVICE_USER_HEADER = "x-scan-user-id";
const BACKGROUND_SCAN_TIMEOUT_MS = 120_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Background scan exceeded ${Math.round(timeoutMs / 1000)}s timeout`));
    }, timeoutMs);

    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

async function processScanInBackground({
  scanId,
  siteId,
  pageId,
  siteUrl,
  fullPageUrl,
  userId,
  isServiceCall,
  useWeeklyFreeScan,
}: {
  scanId: string;
  siteId: string;
  pageId: string;
  siteUrl: string;
  fullPageUrl: string;
  userId: string;
  isServiceCall: boolean;
  useWeeklyFreeScan: boolean;
}) {
  await prisma.scan.update({
    where: { id: scanId },
    data: { status: "PROCESSING" },
  });

  try {
    console.log("[scan] Starting enhanced accessibility scan:", fullPageUrl);
    const result = await runEnhancedAccessibilityScan(fullPageUrl, BACKGROUND_SCAN_TIMEOUT_MS);

    const looksMock =
      result?.__demo === true ||
      result?.mock === true ||
      result?.engineName === "fallback-mock" ||
      !Array.isArray(result?.violations);

    if (looksMock) {
      const error: any = new Error("Scanner temporarily unavailable. Browser initialization returned mock/demo data.");
      error.code = "SCANNER_NO_BROWSER";
      error.details = {
        __demo: result?.__demo,
        mock: result?.mock,
        engineName: result?.engineName,
        hasViolations: Array.isArray(result?.violations),
      };
      throw error;
    }

    const violations = result.violations || [];
    const impactCounts = {
      critical: result.impactCritical || 0,
      serious: result.impactSerious || 0,
      moderate: result.impactModerate || 0,
      minor: result.impactMinor || 0,
    };

    const formattedViolations = violations.map((v: any) => ({
      ...v,
      helpUrl: v.helpUrl || `https://dequeuniversity.com/rules/axe/4.10/${v.id}`,
      tags: v.tags || ["wcag2a", "wcag21aa"],
    }));

    const wcagAACompliance = calculateWCAGCompliance(formattedViolations, "AA");
    const wcagAAACompliance = calculateWCAGCompliance(formattedViolations, "AAA");

    const violationsByRule: Record<string, number> = {};
    violations.forEach((violation: any) => {
      violationsByRule[violation.id] = (violationsByRule[violation.id] || 0) + 1;
    });

    const previousScan = await prisma.scan.findFirst({
      where: {
        siteId,
        pageId,
        status: "COMPLETED",
        createdAt: { lt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    const issuesFixed = previousScan
      ? Math.max(0, (previousScan.issues || 0) - violations.length)
      : 0;
    const newIssues = previousScan
      ? Math.max(0, violations.length - (previousScan.issues || 0))
      : violations.length;
    const scoreImprovement = previousScan
      ? Math.round(result.score) - (previousScan.score || 0)
      : null;

    const performanceMetrics = await getPerformanceMetrics(fullPageUrl);
    const seoMetrics = analyzeSEOMetrics(violations);
    const complianceRisk = calculateComplianceRisk(Math.round(result.score), violations);
    const serializedResult = JSON.parse(JSON.stringify(result));

    const completedScan = await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "COMPLETED",
        score: Math.round(result.score),
        issues: violations.length,
        impactCritical: impactCounts.critical,
        impactSerious: impactCounts.serious,
        impactModerate: impactCounts.moderate,
        impactMinor: impactCounts.minor,
        wcagAACompliance,
        wcagAAACompliance,
        violationsByRule,
        issuesFixed,
        newIssues,
        scoreImprovement,
        previousScanId: previousScan?.id,
        performanceScore: performanceMetrics.performanceScore,
        firstContentfulPaint: performanceMetrics.firstContentfulPaint,
        largestContentfulPaint: performanceMetrics.largestContentfulPaint,
        cumulativeLayoutShift: performanceMetrics.cumulativeLayoutShift,
        firstInputDelay: performanceMetrics.firstInputDelay,
        totalBlockingTime: performanceMetrics.totalBlockingTime,
        seoScore: seoMetrics.seoScore,
        metaDescription: seoMetrics.metaDescription,
        headingStructure: seoMetrics.headingStructure,
        altTextCoverage: seoMetrics.altTextCoverage,
        linkAccessibility: seoMetrics.linkAccessibility,
        adaRiskLevel: complianceRisk.adaRiskLevel,
        wcag21Compliance: complianceRisk.wcag21Compliance,
        wcag22Compliance: complianceRisk.wcag22Compliance,
        complianceGaps: complianceRisk.complianceGaps,
        legalRiskScore: complianceRisk.legalRiskScore,
        raw: serializedResult,
        resultJson: serializedResult,
      },
      include: {
        site: true,
        page: true,
      },
    });

    if (!isServiceCall) {
      if (useWeeklyFreeScan) {
        await consumeWeeklyFreeScan(userId);
      } else {
        await addPageUsage(userId, 1);
      }
    }

    try {
      await publishScanReport({
        id: completedScan.id,
        score: completedScan.score,
        issues: completedScan.issues,
        impactCritical: completedScan.impactCritical,
        impactSerious: completedScan.impactSerious,
        impactModerate: completedScan.impactModerate,
        impactMinor: completedScan.impactMinor,
        wcagAACompliance: completedScan.wcagAACompliance,
        wcagAAACompliance: completedScan.wcagAAACompliance,
        performanceScore: completedScan.performanceScore,
        seoScore: completedScan.seoScore,
        raw: completedScan.raw,
        status: completedScan.status,
        site: { url: completedScan.site?.url || siteUrl },
        page: completedScan.page ? { url: completedScan.page.url } : null,
        createdAt: completedScan.createdAt,
      });
    } catch (pubErr) {
      console.error("[scan] Public report publish failed (non-blocking):", pubErr instanceof Error ? pubErr.message : pubErr);
    }
  } catch (scanError: any) {
    console.error("[scan] Background scan failed:", scanError);

    await prisma.scan.update({
      where: { id: scanId },
      data: {
        status: "FAILED",
        raw: {
          error: scanError?.message,
          code: scanError?.code,
          stack: scanError?.stack,
          details: scanError?.details,
        },
        resultJson: {
          error: scanError?.message,
          code: scanError?.code || "SCAN_FAILED",
          details: scanError?.details,
        },
      },
    });
  }
}

function validatePublicUrl(url: string) {
  const urlObj = new URL(url);

  if (!["http:", "https:"].includes(urlObj.protocol)) {
    throw Object.assign(new Error("Only http and https URLs are allowed"), { statusCode: 400 });
  }

  const hostname = urlObj.hostname.toLowerCase();
  const isBlocked =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "0.0.0.0" ||
    hostname === "[::1]" ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    /^10\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^169\.254\./.test(hostname);

  if (isBlocked) {
    throw Object.assign(new Error("Scanning internal or private network addresses is not allowed"), { statusCode: 400 });
  }

  return {
    siteUrl: urlObj.origin,
    fullPageUrl: url,
  };
}

export async function POST(req: Request) {
  try {
    const incomingSvcToken = req.headers.get(SERVICE_TOKEN_HEADER);
    const svcToken = process.env.SCAN_SERVICE_TOKEN;
    const isServiceCall = Boolean(incomingSvcToken && svcToken && incomingSvcToken === svcToken);

    let user: { id: string; supabaseUser?: SupabaseUser };
    let useWeeklyFreeScan = false;

    if (isServiceCall) {
      const forcedUserId = req.headers.get(SERVICE_USER_HEADER) || process.env.SCAN_SERVICE_USER_ID || "";

      if (!forcedUserId) {
        return NextResponse.json(
          { ok: false, error: "Service scan requires a user ID. Send header 'x-scan-user-id' or set SCAN_SERVICE_USER_ID." },
          { status: 400 }
        );
      }

      const userExists = await prisma.user.findUnique({
        where: { id: forcedUserId },
        select: { id: true },
      });
      if (!userExists) {
        return NextResponse.json({ ok: false, error: `Unknown user ID: ${forcedUserId}` }, { status: 400 });
      }

      user = { id: forcedUserId };
    } else {
      const authUser: Awaited<ReturnType<typeof requireAuth>> = await requireAuth();
      user = { id: authUser.id, supabaseUser: authUser.supabaseUser };

      if (user.supabaseUser) {
        await ensureUserInDatabase(user.supabaseUser);
      }

      try {
        await assertWithinLimits({
          userId: user.id,
          action: "scan",
          pages: 1,
        });
      } catch (limitError: any) {
        const errorCode: string | undefined = limitError?.code;
        const isQuotaError = errorCode === "FREE_LIMIT_REACHED" || errorCode === "LIMIT_REACHED";

        if (!isQuotaError) {
          throw limitError;
        }

        const hasWeekly = await hasWeeklyFreeScanAvailable(user.id);
        if (!hasWeekly) {
          throw limitError;
        }

        useWeeklyFreeScan = true;
      }
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ ok: false, error: "URL is required" }, { status: 400 });
    }

    let siteUrl: string;
    let fullPageUrl: string;
    try {
      ({ siteUrl, fullPageUrl } = validatePublicUrl(url));
    } catch (urlError: any) {
      return NextResponse.json({ ok: false, error: urlError?.message || "Invalid URL" }, { status: urlError?.statusCode || 400 });
    }

    let site = await prisma.site.findUnique({
      where: {
        userId_url: { userId: user.id, url: siteUrl },
      },
    });

    if (!site) {
      const userWithPlan = await prisma.user.findUnique({
        where: { id: user.id },
        select: { plan: true },
      });

      const currentSiteCount = await prisma.site.count({
        where: { userId: user.id },
      });

      const { ENTITLEMENTS } = await import("@/lib/billing/plans");
      const plan = (userWithPlan?.plan || "FREE") as keyof typeof ENTITLEMENTS;
      const siteLimit = ENTITLEMENTS[plan].sites;

      if (currentSiteCount >= siteLimit && !useWeeklyFreeScan) {
        const hasWeekly = await hasWeeklyFreeScanAvailable(user.id);
        if (hasWeekly) {
          useWeeklyFreeScan = true;
        }
      }

      const maxSitesAllowed = useWeeklyFreeScan ? siteLimit + 1 : siteLimit;

      if (currentSiteCount >= maxSitesAllowed) {
        const e: any = new Error(`Site limit reached for ${plan} plan (${siteLimit} sites). Upgrade to add more websites.`);
        e.code = "SITE_LIMIT_REACHED";
        e.limit = siteLimit;
        e.current = currentSiteCount;
        throw e;
      }

      site = await prisma.site.create({
        data: { userId: user.id, url: siteUrl },
      });

      if (!isServiceCall && !useWeeklyFreeScan) {
        await addSiteUsage(user.id);
      }
    }

    let page = await prisma.page.findUnique({
      where: { siteId_url: { siteId: site.id, url: fullPageUrl } },
    });

    if (!page) {
      page = await prisma.page.create({
        data: { siteId: site.id, url: fullPageUrl },
      });
    }

    const pendingScan = await prisma.scan.create({
      data: {
        siteId: site.id,
        pageId: page.id,
        status: "PENDING",
        score: 0,
        issues: 0,
      },
    });

    after(() =>
      withTimeout(
        processScanInBackground({
          scanId: pendingScan.id,
          siteId: site.id,
          pageId: page.id,
          siteUrl,
          fullPageUrl,
          userId: user.id,
          isServiceCall,
          useWeeklyFreeScan,
        }),
        BACKGROUND_SCAN_TIMEOUT_MS
      ).catch((scanError) => {
        console.error("[scan] Background scan timed out or crashed:", scanError);
        return prisma.scan.update({
          where: { id: pendingScan.id },
          data: {
            status: "FAILED",
            raw: {
              error: scanError?.message || "Background scan failed",
              code: scanError?.code || "SCAN_FAILED",
              stack: scanError?.stack,
            },
            resultJson: {
              error: scanError?.message || "Background scan failed",
              code: scanError?.code || "SCAN_FAILED",
            },
          },
        }).catch((updateError) => {
          console.error("[scan] Failed to persist background failure:", updateError);
        });
      })
    );

    return NextResponse.json(
      {
        ok: true,
        accepted: true,
        scanId: pendingScan.id,
        status: pendingScan.status,
        pollUrl: `/api/scans/${pendingScan.id}`,
        message: "Scan accepted. Processing will continue in the background.",
      },
      { status: 202 }
    );
  } catch (e: any) {
    console.error("Scan request failed:", e);

    if (e instanceof Error) {
      if (e.message === "User not found") {
        return NextResponse.json(
          {
            ok: false,
            error: "User profile not initialized. Please log out and log back in, then try again.",
            code: "USER_NOT_INITIALIZED",
          },
          { status: 500 }
        );
      }
      if ((e as any).code === "UPGRADE_REQUIRED") {
        return NextResponse.json(
          { ok: false, error: e.message, code: "UPGRADE_REQUIRED", feature: (e as any).feature },
          { status: 402 }
        );
      }
      if ((e as any).code === "LIMIT_REACHED") {
        return NextResponse.json(
          {
            ok: false,
            error: e.message,
            code: "LIMIT_REACHED",
            limit: (e as any).limit,
            current: (e as any).current,
          },
          { status: 429 }
        );
      }
      if ((e as any).code === "SITE_LIMIT_REACHED") {
        return NextResponse.json(
          {
            ok: false,
            error: e.message,
            code: "SITE_LIMIT_REACHED",
            limit: (e as any).limit,
            current: (e as any).current,
          },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({ ok: false, error: e?.message ?? "Scan failed" }, { status: 500 });
  }
}
