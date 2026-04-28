// src/app/api/scan/route.ts
import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EnhancedAccessibilityScanner, type EnhancedScanResult } from "@/lib/scanner-enhanced";
import { discoverInternalLinksFromPage } from "@/lib/crawler";
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
} from "@/lib/performance-analytics";
import { publishScanReport } from "@/lib/public-reports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SERVICE_TOKEN_HEADER = "x-service-token";
const SERVICE_USER_HEADER = "x-scan-user-id";
const BACKGROUND_SCAN_TIMEOUT_MS = 90_000;
const MAX_DEEP_SCAN_PAGES = 10;
const MAX_AI_PAGES = 3;
const PAGE_COOLDOWN_MS = 1_500;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getVniTier(score: number): EnhancedScanResult["vni"]["tier"] {
  if (score >= 2301) return "Apex";
  if (score >= 1901) return "Authority";
  if (score >= 1301) return "Elite";
  if (score >= 701) return "Standard";
  return "Insolvent";
}

async function updateScanProgress(
  scanId: string,
  progress: {
    message: string;
    currentPage: number;
    totalPages: number;
    currentUrl?: string;
    scannedUrls?: string[];
  }
) {
  await prisma.scan.update({
    where: { id: scanId },
    data: {
      status: "PROCESSING",
      resultJson: {
        scanProgress: {
          ...progress,
          percent: progress.totalPages > 0 ? Math.round((progress.currentPage / progress.totalPages) * 100) : 0,
          updatedAt: new Date().toISOString(),
        },
      },
    },
  });
}

async function scanWithDeadline(
  scanner: EnhancedAccessibilityScanner,
  url: string,
  deadlineMs: number,
  enableAiImageAnalysis: boolean
) {
  const remainingMs = Math.max(1, deadlineMs - Date.now());

  return Promise.race([
    scanner.scanUrl(url, { enableAiImageAnalysis }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Deep scan reached the 90s safety limit")), remainingMs)
    ),
  ]);
}

function aggregateDeepScanResults(
  homepageUrl: string,
  pages: Array<{ url: string; result: EnhancedScanResult; aiAnalyzed: boolean }>
): EnhancedScanResult {
  const first = pages[0].result;
  const successfulResults = pages.map((page) => page.result);
  const average = (values: number[]) =>
    values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
  const averagePillar = (key: keyof EnhancedScanResult["vni"]["pillars"]) =>
    average(successfulResults.map((result) => result.vni?.pillars?.[key] || 0));

  const worstPage = pages.reduce((worst, page) => {
    const worstScore = worst.result.vni?.score ?? worst.result.score ?? 0;
    const pageScore = page.result.vni?.score ?? page.result.score ?? 0;
    return pageScore < worstScore ? page : worst;
  }, pages[0]);

  const vniScore = average(successfulResults.map((result) => result.vni?.score || 0));
  const violations = pages.flatMap((page) =>
    (page.result.violations || []).map((violation: any) => ({
      ...violation,
      pageUrl: page.url,
      pageTitle: page.result.title,
    }))
  );

  return {
    ...first,
    score: average(successfulResults.map((result) => result.score || 0)),
    issues: violations.length,
    impactCritical: successfulResults.reduce((sum, result) => sum + (result.impactCritical || 0), 0),
    impactSerious: successfulResults.reduce((sum, result) => sum + (result.impactSerious || 0), 0),
    impactModerate: successfulResults.reduce((sum, result) => sum + (result.impactModerate || 0), 0),
    impactMinor: successfulResults.reduce((sum, result) => sum + (result.impactMinor || 0), 0),
    violations,
    totalPageWeightBytes: average(successfulResults.map((result) => result.totalPageWeightBytes || 0)),
    largestContentfulPaintMs: average(successfulResults.map((result) => result.largestContentfulPaintMs || 0)),
    domNodeCount: average(successfulResults.map((result) => result.domNodeCount || 0)),
    qualityWarnings: pages.flatMap((page) =>
      (page.result.qualityWarnings || []).map((warning: any) => ({ ...warning, pageUrl: page.url }))
    ),
    deepScan: {
      startUrl: homepageUrl,
      scannedPages: pages.length,
      aiAnalyzedPages: pages.filter((page) => page.aiAnalyzed).length,
      worstPage: {
        url: worstPage.url,
        title: worstPage.result.title,
        score: worstPage.result.score,
        vniScore: worstPage.result.vni?.score,
        issues: worstPage.result.violations?.length || 0,
      },
      pages: pages.map((page) => ({
        url: page.url,
        title: page.result.title,
        score: page.result.score,
        vniScore: page.result.vni?.score,
        issues: page.result.violations?.length || 0,
        lcp: page.result.largestContentfulPaintMs,
        pageWeightBytes: page.result.totalPageWeightBytes,
        domNodeCount: page.result.domNodeCount,
        aiAnalyzed: page.aiAnalyzed,
      })),
    } as any,
    vni: {
      ...first.vni,
      score: vniScore,
      tier: getVniTier(vniScore),
      pillars: {
        wcagCompliance: averagePillar("wcagCompliance"),
        aiContentIntegrity: averagePillar("aiContentIntegrity"),
        performanceSpeed: averagePillar("performanceSpeed"),
        colorBlindnessContrast: averagePillar("colorBlindnessContrast"),
        designQualityUx: averagePillar("designQualityUx"),
      },
      internal: {
        ...first.vni.internal,
        deepScan: {
          startUrl: homepageUrl,
          scannedPages: pages.length,
          aiAnalyzedPages: pages.filter((page) => page.aiAnalyzed).length,
          worstPage: {
            url: worstPage.url,
            title: worstPage.result.title,
            score: worstPage.result.score,
            vniScore: worstPage.result.vni?.score,
            issues: worstPage.result.violations?.length || 0,
          },
          pages: pages.map((page) => ({
            url: page.url,
            title: page.result.title,
            score: page.result.score,
            vniScore: page.result.vni?.score,
            issues: page.result.violations?.length || 0,
            lcp: page.result.largestContentfulPaintMs,
            pageWeightBytes: page.result.totalPageWeightBytes,
            domNodeCount: page.result.domNodeCount,
            aiAnalyzed: page.aiAnalyzed,
          })),
        },
      } as any,
    },
    performanceImpact: {
      ...first.performanceImpact,
      loadTime: average(successfulResults.map((result) => result.performanceImpact?.loadTime || 0)),
      score: average(successfulResults.map((result) => result.performanceImpact?.score || 0)),
    },
    discoveredInternalLinks: pages.map((page) => page.url).filter((url) => url !== homepageUrl),
  };
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
  const startedAt = Date.now();
  const deadlineMs = startedAt + BACKGROUND_SCAN_TIMEOUT_MS;
  const scanner = new EnhancedAccessibilityScanner();

  try {
    console.log("[scan] Starting depth-1 enhanced accessibility scan:", fullPageUrl);
    await updateScanProgress(scanId, {
      message: "Preparing deep scan...",
      currentPage: 0,
      totalPages: MAX_DEEP_SCAN_PAGES,
      currentUrl: fullPageUrl,
    });

    const scannedPages: Array<{ url: string; result: EnhancedScanResult; aiAnalyzed: boolean }> = [];
    const attemptedUrls = new Set<string>();
    const queue: string[] = [fullPageUrl];
    let discovered = false;

    for (let index = 0; index < queue.length && scannedPages.length < MAX_DEEP_SCAN_PAGES; index++) {
      if (Date.now() >= deadlineMs - 2_500) {
        console.warn("[scan] Deep scan safety window reached before next page; aggregating partial results.");
        break;
      }

      const pageUrl = queue[index];
      if (attemptedUrls.has(pageUrl)) continue;

      attemptedUrls.add(pageUrl);
      const currentPageNumber = scannedPages.length + 1;
      const totalPages = Math.min(MAX_DEEP_SCAN_PAGES, Math.max(queue.length, currentPageNumber));
      const aiAnalyzed = currentPageNumber <= MAX_AI_PAGES;

      await updateScanProgress(scanId, {
        message: `Analyzing page ${currentPageNumber} of ${totalPages}...`,
        currentPage: currentPageNumber - 1,
        totalPages,
        currentUrl: pageUrl,
        scannedUrls: scannedPages.map((page) => page.url),
      });

      let pageResult: EnhancedScanResult;
      try {
        pageResult = await scanWithDeadline(scanner, pageUrl, deadlineMs, aiAnalyzed);
      } catch (pageError: any) {
        if (scannedPages.length > 0 && pageError?.message?.includes("90s safety limit")) {
          console.warn("[scan] Deep scan page stopped by safety limit; aggregating completed pages.");
          break;
        }
        throw pageError;
      }

      const looksMock =
        pageResult?.__demo === true ||
        pageResult?.mock === true ||
        pageResult?.engineName === "fallback-mock" ||
        !Array.isArray(pageResult?.violations);

      if (looksMock) {
        const error: any = new Error("Scanner temporarily unavailable. Browser initialization returned mock/demo data.");
        error.code = "SCANNER_NO_BROWSER";
        error.details = {
          __demo: pageResult?.__demo,
          mock: pageResult?.mock,
          engineName: pageResult?.engineName,
          hasViolations: Array.isArray(pageResult?.violations),
        };
        throw error;
      }

      scannedPages.push({ url: pageUrl, result: pageResult, aiAnalyzed });

      if (!discovered) {
        discovered = true;
        const page = scanner.getCurrentPage();
        if (page) {
          const internalLinks = await discoverInternalLinksFromPage(page, fullPageUrl, MAX_DEEP_SCAN_PAGES - 1);
          for (const discoveredUrl of internalLinks) {
            if (!attemptedUrls.has(discoveredUrl) && !queue.includes(discoveredUrl)) {
              queue.push(discoveredUrl);
            }
            if (queue.length >= MAX_DEEP_SCAN_PAGES) break;
          }
        }
      }

      await updateScanProgress(scanId, {
        message: `Analyzed page ${currentPageNumber} of ${Math.min(MAX_DEEP_SCAN_PAGES, queue.length)}.`,
        currentPage: currentPageNumber,
        totalPages: Math.min(MAX_DEEP_SCAN_PAGES, queue.length),
        currentUrl: pageUrl,
        scannedUrls: scannedPages.map((page) => page.url),
      });

      if (scannedPages.length < queue.length && scannedPages.length < MAX_DEEP_SCAN_PAGES) {
        await sleep(PAGE_COOLDOWN_MS);
      }
    }

    if (scannedPages.length === 0) {
      throw new Error("Deep scan finished without a scannable page.");
    }

    const result = aggregateDeepScanResults(fullPageUrl, scannedPages);

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

    const performanceMetrics = {
      performanceScore: result.performanceImpact?.score || 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: result.largestContentfulPaintMs || 0,
      cumulativeLayoutShift: result.vni?.internal?.designMetrics?.layoutStability?.cls || 0,
      firstInputDelay: 0,
      totalBlockingTime: 0,
    };
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
        largestContentfulPaint: result.largestContentfulPaintMs || performanceMetrics.largestContentfulPaint,
        cumulativeLayoutShift: performanceMetrics.cumulativeLayoutShift,
        firstInputDelay: performanceMetrics.firstInputDelay,
        totalBlockingTime: performanceMetrics.totalBlockingTime,
        pageLoadTime: result.performanceImpact?.loadTime,
        elementsScanned: result.domNodeCount,
        pageWeightBytes: result.totalPageWeightBytes,
        domNodeCount: result.domNodeCount,
        qualityWarnings: result.qualityWarnings as any,
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
  } finally {
    await scanner.close();
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
        BACKGROUND_SCAN_TIMEOUT_MS + 15_000
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
