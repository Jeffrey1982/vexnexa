import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const siteId = searchParams.get("siteId");
    const timeRange = searchParams.get("timeRange") || "30d"; // 7d, 30d, 90d, 1y
    const metrics = searchParams.get("metrics")?.split(",") || ["overview"];

    // Verify site ownership if siteId provided
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: user.id },
      });
      if (!site) {
        return NextResponse.json(
          { ok: false, error: "Site not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case "7d":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Base where voor ALLE queries (zonder mock-filter)
    const baseWhere: any = {
      status: "done",
      createdAt: { gte: startDate, lte: endDate },
      ...(siteId ? { siteId } : { site: { userId: user.id } }),
    };

    // 1) Haal minimale set op om MOCK scans te filteren
    const candidateScans = await prisma.scan.findMany({
      where: baseWhere,
      select: { id: true, raw: true },
      orderBy: { createdAt: "desc" },
      // geen take/skip hier, want we willen compleet filteren binnen de timerange
    });

    const realScanIds = candidateScans
      .filter((s) => {
        try {
          const raw: any = s.raw ?? null;
          if (!raw) return true; // geen raw = aannemen echt
          if (raw.__demo === true) return false;
          if (raw.mock === true) return false;
          if (raw.engineName === "fallback-mock") return false;
          return true;
        } catch {
          return true;
        }
      })
      .map((s) => s.id);

    if (realScanIds.length === 0) {
      // Geen echte scans binnen range → nette lege payload
      return NextResponse.json({
        ok: true,
        analytics: buildEmptyAnalytics(metrics),
        timeRange,
        generatedAt: new Date().toISOString(),
        hasData: false,
      });
    }

    // Vanaf hier ALLE queries filteren op "id in realScanIds"
    const filteredWhere = { ...baseWhere, id: { in: realScanIds } };

    const analyticsData: any = {};

    if (metrics.includes("overview")) {
      analyticsData.overview = await getOverviewMetrics(filteredWhere);
    }
    if (metrics.includes("trends")) {
      analyticsData.trends = await getHistoricalTrends(filteredWhere, startDate, endDate);
    }
    if (metrics.includes("issues")) {
      analyticsData.issues = await getIssueAnalysis(filteredWhere);
    }
    if (metrics.includes("performance")) {
      analyticsData.performance = await getPerformanceCorrelation(filteredWhere);
    }
    if (metrics.includes("compliance")) {
      analyticsData.compliance = await getComplianceTracking(filteredWhere);
    }
    if (metrics.includes("risk")) {
      analyticsData.risk = await getRiskAssessment(filteredWhere);
    }
    if (metrics.includes("benchmarks")) {
      analyticsData.benchmarks = await getBenchmarkComparison(user.id, siteId);
    }

    return NextResponse.json({
      ok: true,
      analytics: analyticsData,
      timeRange,
      generatedAt: new Date().toISOString(),
      hasData: true,
      filteredCount: realScanIds.length,
    });
  } catch (e: any) {
    console.error("Analytics failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Analytics failed" },
      { status: 500 }
    );
  }
}

// ---- helpers ----

function buildEmptyAnalytics(metrics: string[]) {
  const out: any = {};
  if (metrics.includes("overview")) {
    out.overview = {
      totalScans: 0,
      averageScore: 0,
      totalIssues: 0,
      recentScans: [],
      impactDistribution: { critical: 0, serious: 0, moderate: 0, minor: 0 },
    };
  }
  if (metrics.includes("trends")) {
    out.trends = { trends: [], groupBy: "day" };
  }
  if (metrics.includes("issues")) {
    out.issues = { topIssues: [], totalUniqueRules: 0, issueFrequency: {} };
  }
  if (metrics.includes("performance")) {
    out.performance = { correlation: null, message: "No performance data available" };
  }
  if (metrics.includes("compliance")) {
    out.compliance = {
      wcagCompliance: { aa: 0, aaa: 0, wcag21: 0, wcag22: 0 },
      riskDistribution: {},
    };
  }
  if (metrics.includes("risk")) {
    out.risk = { highRiskScans: 0, criticalIssues: 0, riskTrend: 0, riskLevel: "LOW" };
  }
  if (metrics.includes("benchmarks")) {
    out.benchmarks = {
      userStats: { avgScore: 0, avgWcag: 0, avgPerformance: 0 },
      // industryBenchmarks blijft statisch (geen "demo", maar referentie)
      industryBenchmarks: {
        ecommerce: { avgScore: 75, avgWcag: 68, avgPerformance: 72 },
        healthcare: { avgScore: 82, avgWcag: 78, avgPerformance: 68 },
        education: { avgScore: 79, avgWcag: 74, avgPerformance: 71 },
        government: { avgScore: 88, avgWcag: 85, avgPerformance: 66 },
        general: { avgScore: 77, avgWcag: 71, avgPerformance: 70 },
      },
    };
  }
  return out;
}

async function getOverviewMetrics(whereCondition: any) {
  const [totalScans, avgScore, totalIssues, recentScans, impactDistribution] = await Promise.all([
    prisma.scan.count({ where: whereCondition }),

    prisma.scan.aggregate({
      where: whereCondition,
      _avg: { score: true },
    }),

    prisma.scan.aggregate({
      where: whereCondition,
      _sum: { issues: true },
    }),

    prisma.scan.findMany({
      where: whereCondition,
      select: {
        id: true,
        score: true,
        issues: true,
        createdAt: true,
        site: { select: { url: true } },
        page: { select: { url: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),

    prisma.scan.aggregate({
      where: whereCondition,
      _sum: {
        impactCritical: true,
        impactSerious: true,
        impactModerate: true,
        impactMinor: true,
      },
    }),
  ]);

  return {
    totalScans,
    averageScore: Math.round(avgScore._avg.score || 0),
    totalIssues: totalIssues._sum.issues || 0,
    recentScans,
    impactDistribution: {
      critical: impactDistribution._sum.impactCritical || 0,
      serious: impactDistribution._sum.impactSerious || 0,
      moderate: impactDistribution._sum.impactModerate || 0,
      minor: impactDistribution._sum.impactMinor || 0,
    },
  };
}

async function getHistoricalTrends(whereCondition: any, startDate: Date, endDate: Date) {
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
  const groupBy = daysDiff > 60 ? "week" : "day";

  const scans = await prisma.scan.findMany({
    where: whereCondition,
    select: {
      score: true,
      issues: true,
      wcagAACompliance: true,
      performanceScore: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const timeGroups: any = {};
  scans.forEach((scan) => {
    const date = new Date(scan.createdAt);
    let key: string;
    if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else {
      key = date.toISOString().split("T")[0];
    }

    if (!timeGroups[key]) {
      timeGroups[key] = {
        date: key,
        scores: [],
        issues: [],
        wcagCompliance: [],
        performance: [],
      };
    }

    timeGroups[key].scores.push(scan.score || 0);
    timeGroups[key].issues.push(scan.issues || 0);
    if (scan.wcagAACompliance) timeGroups[key].wcagCompliance.push(scan.wcagAACompliance);
    if (scan.performanceScore) timeGroups[key].performance.push(scan.performanceScore);
  });

  const trends = Object.values(timeGroups).map((group: any) => ({
    date: group.date,
    averageScore: Math.round(group.scores.reduce((a: number, b: number) => a + b, 0) / group.scores.length),
    totalIssues: group.issues.reduce((a: number, b: number) => a + b, 0),
    averageWcagCompliance:
      group.wcagCompliance.length > 0
        ? Math.round(group.wcagCompliance.reduce((a: number, b: number) => a + b, 0) / group.wcagCompliance.length)
        : null,
    averagePerformance:
      group.performance.length > 0
        ? Math.round(group.performance.reduce((a: number, b: number) => a + b, 0) / group.performance.length)
        : null,
    scanCount: group.scores.length,
  }));

  return { trends, groupBy };
}

async function getIssueAnalysis(whereCondition: any) {
  const scans = await prisma.scan.findMany({
    where: whereCondition,
    select: {
      violationsByRule: true,
      issues: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
    },
  });

  const ruleFrequency: Record<string, number> = {};
  scans.forEach((scan) => {
    if (scan.violationsByRule) {
      const rules = scan.violationsByRule as Record<string, number>;
      Object.entries(rules).forEach(([rule, count]) => {
        ruleFrequency[rule] = (ruleFrequency[rule] || 0) + count;
      });
    }
  });

  const topIssues = Object.entries(ruleFrequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([rule, count]) => ({ rule, count }));

  return {
    topIssues,
    totalUniqueRules: Object.keys(ruleFrequency).length,
    issueFrequency: ruleFrequency,
  };
}

async function getPerformanceCorrelation(whereCondition: any) {
  const scans = await prisma.scan.findMany({
    where: { ...whereCondition, performanceScore: { not: null } },
    select: {
      score: true,
      performanceScore: true,
      firstContentfulPaint: true,
      largestContentfulPaint: true,
      cumulativeLayoutShift: true,
    },
  });

  if (scans.length === 0) {
    return { correlation: null, message: "No performance data available" };
  }

  const accessibilityScores = scans.map((s) => s.score || 0);
  const performanceScores = scans.map((s) => s.performanceScore || 0);
  const correlation = calculateCorrelation(accessibilityScores, performanceScores);

  return {
    correlation: Math.round(correlation * 100) / 100,
    sampleSize: scans.length,
    averagePerformance: Math.round(performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length),
    performanceMetrics: {
      avgFCP:
        scans.filter((s) => s.firstContentfulPaint).length > 0
          ? Math.round(
              scans.reduce((sum, s) => sum + (s.firstContentfulPaint || 0), 0) /
                scans.filter((s) => s.firstContentfulPaint).length
            )
          : null,
      avgLCP:
        scans.filter((s) => s.largestContentfulPaint).length > 0
          ? Math.round(
              scans.reduce((sum, s) => sum + (s.largestContentfulPaint || 0), 0) /
                scans.filter((s) => s.largestContentfulPaint).length
            )
          : null,
    },
  };
}

async function getComplianceTracking(whereCondition: any) {
  const compliance = await prisma.scan.aggregate({
    where: whereCondition,
    _avg: {
      wcagAACompliance: true,
      wcagAAACompliance: true,
      wcag21Compliance: true,
      wcag22Compliance: true,
    },
  });

  const riskDistribution = await prisma.scan.groupBy({
    by: ["adaRiskLevel"],
    where: { ...whereCondition, adaRiskLevel: { not: null } },
    _count: true,
  });

  return {
    wcagCompliance: {
      aa: Math.round(compliance._avg.wcagAACompliance || 0),
      aaa: Math.round(compliance._avg.wcagAAACompliance || 0),
      wcag21: Math.round(compliance._avg.wcag21Compliance || 0),
      wcag22: Math.round(compliance._avg.wcag22Compliance || 0),
    },
    riskDistribution: riskDistribution.reduce((acc: any, item) => {
      acc[item.adaRiskLevel?.toLowerCase() || "unknown"] = item._count;
      return acc;
    }, {}),
  };
}

async function getRiskAssessment(whereCondition: any) {
  const [highRiskScans, criticalIssues, trends] = await Promise.all([
    prisma.scan.count({
      where: {
        ...whereCondition,
        OR: [{ adaRiskLevel: "HIGH" }, { adaRiskLevel: "CRITICAL" }, { score: { lt: 70 } }],
      },
    }),

    prisma.scan.aggregate({
      where: whereCondition,
      _sum: { impactCritical: true },
    }),

    prisma.scan.findMany({
      where: whereCondition,
      select: { score: true, issues: true, adaRiskLevel: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const recentScores = trends.slice(0, 10).map((s) => s.score || 0);
  const olderScores = trends.slice(-10).map((s) => s.score || 0);

  const recentAvg = recentScores.length
    ? recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    : 0;
  const olderAvg = olderScores.length
    ? olderScores.reduce((a, b) => a + b, 0) / olderScores.length
    : 0;

  const riskTrend = recentAvg - olderAvg;

  return {
    highRiskScans,
    criticalIssues: (criticalIssues._sum as any).impactCritical || 0,
    riskTrend: Math.round(riskTrend),
    riskLevel: highRiskScans > 5 ? "HIGH" : highRiskScans > 2 ? "MEDIUM" : "LOW",
  };
}

async function getBenchmarkComparison(userId: string, siteId?: string | null) {
  const userStats = await prisma.scan.aggregate({
    where: { site: { userId }, ...(siteId ? { siteId } : {}), status: "done" },
    _avg: { score: true, wcagAACompliance: true, performanceScore: true },
  });

  const industryBenchmarks = {
    ecommerce: { avgScore: 75, avgWcag: 68, avgPerformance: 72 },
    healthcare: { avgScore: 82, avgWcag: 78, avgPerformance: 68 },
    education: { avgScore: 79, avgWcag: 74, avgPerformance: 71 },
    government: { avgScore: 88, avgWcag: 85, avgPerformance: 66 },
    general: { avgScore: 77, avgWcag: 71, avgPerformance: 70 },
  };

  return {
    userStats: {
      avgScore: Math.round(userStats._avg.score || 0),
      avgWcag: Math.round(userStats._avg.wcagAACompliance || 0),
      avgPerformance: Math.round(userStats._avg.performanceScore || 0),
    },
    industryBenchmarks,
  };
}

function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;

  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  return denominator === 0 ? 0 : numerator / denominator;
}
