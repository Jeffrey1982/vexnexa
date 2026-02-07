import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);

    const industry = searchParams.get("industry") || "general";
    const siteId = searchParams.get("siteId");
    const includeUserStats = searchParams.get("includeUserStats") === "true";

    // Get industry benchmarks
    const industryBenchmark = await prisma.benchmark.findFirst({
      where: {
        industry: industry,
        category: null
      }
    });

    if (!industryBenchmark) {
      return NextResponse.json({
        ok: false,
        error: "Industry benchmark not found",
        availableIndustries: await getAvailableIndustries()
      }, { status: 404 });
    }

    let userStats = null;
    let comparison = null;

    if (includeUserStats) {
      // Get user's statistics
      const whereCondition: any = {
        site: { userId: user.id },
        status: "done"
      };

      if (siteId) {
        // Verify site ownership
        const site = await prisma.site.findFirst({
          where: { id: siteId, userId: user.id }
        });
        if (!site) {
          return NextResponse.json({ ok: false, error: "Site not found or access denied" }, { status: 404 });
        }
        whereCondition.siteId = siteId;
      }

      userStats = await getUserStatistics(whereCondition);
      comparison = calculateComparison(userStats, industryBenchmark);
    }

    return NextResponse.json({
      ok: true,
      industry,
      benchmark: {
        industry: industryBenchmark.industry,
        averageScore: industryBenchmark.avgScore,
        averageCritical: industryBenchmark.avgCritical,
        averageSerious: industryBenchmark.avgSerious,
        averageModerate: industryBenchmark.avgModerate,
        averageMinor: industryBenchmark.avgMinor,
        averageWcagAA: industryBenchmark.avgWcagAA,
        averageWcagAAA: industryBenchmark.avgWcagAAA,
        sampleSize: industryBenchmark.sampleSize,
        lastUpdated: industryBenchmark.lastUpdated
      },
      userStats,
      comparison,
      recommendations: comparison ? generateRecommendations(comparison) : null
    });

  } catch (e: any) {
    if (e?.message === "Authentication required") {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    console.error("Benchmarks failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Benchmarks failed"
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Check if user has admin privileges (for now, only allow specific users)
    // In production, you'd have a proper admin role system
    if (!["admin@vexnexa.com"].includes(user.email)) {
      return NextResponse.json({ ok: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const {
      industry,
      category = null,
      benchmarkData
    } = await req.json();

    if (!industry || !benchmarkData) {
      return NextResponse.json({ ok: false, error: "Industry and benchmark data required" }, { status: 400 });
    }

    // Update or create benchmark
    const benchmark = await prisma.benchmark.upsert({
      where: {
        industry_category: {
          industry,
          category
        }
      },
      update: {
        avgScore: benchmarkData.avgScore,
        avgCritical: benchmarkData.avgCritical,
        avgSerious: benchmarkData.avgSerious,
        avgModerate: benchmarkData.avgModerate,
        avgMinor: benchmarkData.avgMinor,
        avgWcagAA: benchmarkData.avgWcagAA,
        avgWcagAAA: benchmarkData.avgWcagAAA,
        sampleSize: benchmarkData.sampleSize,
        lastUpdated: new Date()
      },
      create: {
        industry,
        category,
        avgScore: benchmarkData.avgScore,
        avgCritical: benchmarkData.avgCritical,
        avgSerious: benchmarkData.avgSerious,
        avgModerate: benchmarkData.avgModerate,
        avgMinor: benchmarkData.avgMinor,
        avgWcagAA: benchmarkData.avgWcagAA,
        avgWcagAAA: benchmarkData.avgWcagAAA,
        sampleSize: benchmarkData.sampleSize
      }
    });

    return NextResponse.json({
      ok: true,
      benchmark,
      message: "Benchmark updated successfully"
    });

  } catch (e: any) {
    console.error("Update benchmark failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Update benchmark failed"
    }, { status: 500 });
  }
}

async function getAvailableIndustries() {
  const industries = await prisma.benchmark.findMany({
    select: {
      industry: true,
      category: true
    },
    distinct: ['industry']
  });

  return industries.map(b => ({
    industry: b.industry,
    category: b.category
  }));
}

async function getUserStatistics(whereCondition: any) {
  const [stats, wcagStats] = await Promise.all([
    prisma.scan.aggregate({
      where: whereCondition,
      _avg: {
        score: true,
        impactCritical: true,
        impactSerious: true,
        impactModerate: true,
        impactMinor: true
      },
      _count: true
    }),

    prisma.scan.aggregate({
      where: {
        ...whereCondition,
        wcagAACompliance: { not: null }
      },
      _avg: {
        wcagAACompliance: true,
        wcagAAACompliance: true
      }
    })
  ]);

  return {
    averageScore: Math.round(stats._avg.score || 0),
    averageCritical: Math.round(stats._avg.impactCritical || 0),
    averageSerious: Math.round(stats._avg.impactSerious || 0),
    averageModerate: Math.round(stats._avg.impactModerate || 0),
    averageMinor: Math.round(stats._avg.impactMinor || 0),
    averageWcagAA: Math.round(wcagStats._avg.wcagAACompliance || 0),
    averageWcagAAA: Math.round(wcagStats._avg.wcagAAACompliance || 0),
    sampleSize: stats._count
  };
}

function calculateComparison(userStats: any, industryBenchmark: any) {
  return {
    score: {
      user: userStats.averageScore,
      industry: Math.round(industryBenchmark.avgScore),
      difference: userStats.averageScore - Math.round(industryBenchmark.avgScore),
      percentile: calculatePercentile(userStats.averageScore, industryBenchmark.avgScore)
    },
    critical: {
      user: userStats.averageCritical,
      industry: Math.round(industryBenchmark.avgCritical),
      difference: userStats.averageCritical - Math.round(industryBenchmark.avgCritical)
    },
    serious: {
      user: userStats.averageSerious,
      industry: Math.round(industryBenchmark.avgSerious),
      difference: userStats.averageSerious - Math.round(industryBenchmark.avgSerious)
    },
    wcagAA: {
      user: userStats.averageWcagAA,
      industry: Math.round(industryBenchmark.avgWcagAA),
      difference: userStats.averageWcagAA - Math.round(industryBenchmark.avgWcagAA)
    },
    overallRanking: calculateOverallRanking(userStats, industryBenchmark)
  };
}

function calculatePercentile(userScore: number, industryAverage: number): string {
  // Simplified percentile calculation
  // In production, you'd use actual distribution data
  const difference = userScore - industryAverage;

  if (difference >= 20) return "95th percentile";
  if (difference >= 15) return "90th percentile";
  if (difference >= 10) return "80th percentile";
  if (difference >= 5) return "70th percentile";
  if (difference >= 0) return "60th percentile";
  if (difference >= -5) return "40th percentile";
  if (difference >= -10) return "30th percentile";
  if (difference >= -15) return "20th percentile";
  if (difference >= -20) return "10th percentile";
  return "5th percentile";
}

function calculateOverallRanking(userStats: any, industryBenchmark: any): string {
  let score = 0;

  // Score comparison (30% weight)
  if (userStats.averageScore > industryBenchmark.avgScore) {
    score += 30;
  } else if (userStats.averageScore >= industryBenchmark.avgScore * 0.9) {
    score += 20;
  } else if (userStats.averageScore >= industryBenchmark.avgScore * 0.8) {
    score += 10;
  }

  // WCAG compliance (30% weight)
  if (userStats.averageWcagAA > industryBenchmark.avgWcagAA) {
    score += 30;
  } else if (userStats.averageWcagAA >= industryBenchmark.avgWcagAA * 0.9) {
    score += 20;
  } else if (userStats.averageWcagAA >= industryBenchmark.avgWcagAA * 0.8) {
    score += 10;
  }

  // Critical issues (40% weight - fewer is better)
  if (userStats.averageCritical < industryBenchmark.avgCritical) {
    score += 40;
  } else if (userStats.averageCritical <= industryBenchmark.avgCritical * 1.1) {
    score += 30;
  } else if (userStats.averageCritical <= industryBenchmark.avgCritical * 1.2) {
    score += 20;
  } else if (userStats.averageCritical <= industryBenchmark.avgCritical * 1.5) {
    score += 10;
  }

  if (score >= 80) return "Excellent - Top 10%";
  if (score >= 60) return "Good - Above Average";
  if (score >= 40) return "Average - Industry Standard";
  if (score >= 20) return "Below Average";
  return "Needs Improvement";
}

function generateRecommendations(comparison: any): string[] {
  const recommendations: string[] = [];

  if (comparison.score.difference < 0) {
    recommendations.push("Focus on improving overall accessibility score through systematic issue resolution");
  }

  if (comparison.critical.difference > 0) {
    recommendations.push("Prioritize reducing critical accessibility issues to match industry standards");
  }

  if (comparison.wcagAA.difference < 0) {
    recommendations.push("Improve WCAG 2.1 AA compliance to exceed industry benchmarks");
  }

  if (comparison.score.user < 80) {
    recommendations.push("Implement comprehensive accessibility testing in your development workflow");
  }

  if (comparison.critical.user > 2) {
    recommendations.push("Address critical issues immediately as they pose significant barriers to users");
  }

  if (recommendations.length === 0) {
    recommendations.push("Excellent work! Continue monitoring and maintaining high accessibility standards");
    recommendations.push("Consider becoming an accessibility leader by sharing best practices");
  }

  return recommendations;
}