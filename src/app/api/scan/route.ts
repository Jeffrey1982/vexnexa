// src/app/api/scan/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runEnhancedAccessibilityScan } from "@/lib/scanner-enhanced";
import { requireAuth } from "@/lib/auth";
import { assertWithinLimits, addPageUsage } from "@/lib/billing/entitlements";
import { calculateWCAGCompliance } from "@/lib/analytics";
import {
  getPerformanceMetrics,
  analyzeSEOMetrics,
  calculateComplianceRisk,
} from "@/lib/performance-analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
// (optioneel, helpt cold starts wennen in EU)
// export const preferredRegion = ["fra1"];

// === Service bypass headers ===
const SERVICE_TOKEN_HEADER = "x-service-token";
const SERVICE_USER_HEADER = "x-scan-user-id";

export async function POST(req: Request) {
  try {
    // ----- 0) Auth: user of service-token -----
    const incomingSvcToken = req.headers.get(SERVICE_TOKEN_HEADER);
    const svcToken = process.env.SCAN_SERVICE_TOKEN;
    const isServiceCall = Boolean(
      incomingSvcToken && svcToken && incomingSvcToken === svcToken
    );

    // Bepaal "user" context
    let user: { id: string };

    if (isServiceCall) {
      // In automation-mode mag je (optioneel) de user-id meegeven in header,
      // of zet SCAN_SERVICE_USER_ID in env.
      const forcedUserId =
        req.headers.get(SERVICE_USER_HEADER) || process.env.SCAN_SERVICE_USER_ID || "";

      if (!forcedUserId) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "Service scan vereist een user-id. Stuur header 'x-scan-user-id' of zet SCAN_SERVICE_USER_ID.",
          },
          { status: 400 }
        );
      }

      // Veiligheid: controleer dat de user bestaat
      const userExists = await prisma.user.findUnique({
        where: { id: forcedUserId },
        select: { id: true },
      });
      if (!userExists) {
        return NextResponse.json(
          { ok: false, error: `Onbekende user-id: ${forcedUserId}` },
          { status: 400 }
        );
      }

      user = { id: forcedUserId };
    } else {
      // Normale app: ingelogde gebruiker via NextAuth
      user = await requireAuth();

      // Limits alleen toepassen op normale user-scans
      await assertWithinLimits({
        userId: user.id,
        action: "scan",
        pages: 1,
      });
    }

    // ----- 1) Body & URL validatie -----
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json(
        { ok: false, error: "URL is required" },
        { status: 400 }
      );
    }

    let siteUrl: string;
    let fullPageUrl: string;
    try {
      const urlObj = new URL(url);
      siteUrl = urlObj.origin;
      fullPageUrl = url;
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid URL" },
        { status: 400 }
      );
    }

    // ----- 2) Site/Page op user vastleggen -----
    let site = await prisma.site.findUnique({
      where: {
        userId_url: { userId: user.id, url: siteUrl },
      },
    });

    if (!site) {
      site = await prisma.site.create({
        data: { userId: user.id, url: siteUrl },
      });
    }

    let page = await prisma.page.findUnique({
      where: { siteId_url: { siteId: site.id, url: fullPageUrl } },
    });

    if (!page) {
      page = await prisma.page.create({
        data: { siteId: site.id, url: fullPageUrl },
      });
    }

    // ----- 3) Scan record 'running' -----
    const runningScan = await prisma.scan.create({
      data: {
        siteId: site.id,
        pageId: page.id,
        status: "running",
        score: 0,
        issues: 0,
      },
    });

    // ----- 4) Uitvoeren scan -----
    let result: any;
    try {
      console.log("[scan] Start enhanced a11y scan:", fullPageUrl);
      result = await runEnhancedAccessibilityScan(fullPageUrl);
      console.log("[scan] Scan klaar, score:", result?.score);
    } catch (scanError: any) {
      console.error("[scan] Fout tijdens scan:", scanError);

      await prisma.scan.update({
        where: { id: runningScan.id },
        data: {
          status: "failed",
          raw: { error: scanError?.message, stack: scanError?.stack },
        },
      });

      return NextResponse.json(
        {
          ok: false,
          error: `Accessibility scan failed: ${scanError?.message}`,
          scanId: runningScan.id,
          details: scanError?.stack,
        },
        { status: 500 }
      );
    }

    // ----- 5) Mock/demo resultaten blokkeren -----
    const looksMock =
      result?.__demo === true ||
      result?.mock === true ||
      result?.engineName === "fallback-mock" ||
      !Array.isArray(result?.violations);

    if (looksMock) {
      console.warn("[a11y] Mock/invalid scan blocked", {
        engineName: result?.engineName,
        __demo: result?.__demo,
        mock: result?.mock,
        hasViolationsArray: Array.isArray(result?.violations),
      });

      await prisma.scan.update({
        where: { id: runningScan.id },
        data: { status: "failed", raw: { error: "Mock/demo scan blocked", meta: result ?? null } },
      });

      return NextResponse.json(
        {
          ok: false,
          error: "Accessibility scan unavailable (no browser).",
          code: "SCANNER_NO_BROWSER",
        },
        { status: 503 }
      );
    }

    // ----- 6) Analytics/finaliseren -----
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
        siteId: site.id,
        pageId: page.id,
        status: "done",
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

    const completedScan = await prisma.scan.update({
      where: { id: runningScan.id },
      data: {
        status: "done",
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

        raw: JSON.parse(JSON.stringify(result)),
      },
      include: {
        site: true,
        page: true,
      },
    });

    // Alleen normale user-scans tellen we mee in billing/usage
    if (!isServiceCall) {
      await addPageUsage(user.id, 1);
    }

    return NextResponse.json({
      ok: true,
      scan: completedScan,
      scanId: completedScan.id,
      score: completedScan.score,
      issues: completedScan.issues,
      site: completedScan.site?.url,
      page: completedScan.page?.url,
      createdAt: completedScan.createdAt,
    });
  } catch (e: any) {
    console.error("Scan failed:", e);

    if (e instanceof Error) {
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
      if ((e as any).code === "TRIAL_EXPIRED") {
        return NextResponse.json(
          { ok: false, error: e.message, code: "TRIAL_EXPIRED" },
          { status: 402 }
        );
      }
    }

    return NextResponse.json(
      { ok: false, error: e?.message ?? "Scan failed" },
      { status: 500 }
    );
  }
}
