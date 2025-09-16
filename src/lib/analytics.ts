import { prisma } from "@/lib/prisma";
import { Violation } from "@/lib/axe-types";

export interface TrendData {
  date: string;
  score: number;
  issues: number;
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
  wcagAA?: number;
  wcagAAA?: number;
}

export interface BenchmarkComparison {
  userScore: number;
  industryAvg: number;
  difference: number;
  percentile: number;
  category: "above_average" | "average" | "below_average";
}

export interface ScanComparison {
  current: {
    score: number;
    issues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  previous?: {
    score: number;
    issues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
  };
  changes?: {
    score: number;
    issues: number;
    critical: number;
    serious: number;
    moderate: number;
    minor: number;
    issuesFixed: number;
    newIssues: number;
  };
}

export interface ViolationTrend {
  ruleId: string;
  ruleName: string;
  trend: Array<{
    date: string;
    count: number;
  }>;
  currentCount: number;
  averageCount: number;
  isImproving: boolean;
}

/**
 * Get historical trend data for a site or page
 */
export async function getScanTrendData(
  siteId: string,
  pageId?: string,
  days: number = 30
): Promise<TrendData[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const scans = await prisma.scan.findMany({
    where: {
      siteId,
      ...(pageId && { pageId }),
      createdAt: {
        gte: startDate,
      },
      status: "completed",
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
      score: true,
      issues: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
      wcagAACompliance: true,
      wcagAAACompliance: true,
    },
  });

  return scans.map(scan => ({
    date: scan.createdAt.toISOString().split('T')[0], // YYYY-MM-DD format
    score: scan.score || 0,
    issues: scan.issues || 0,
    critical: scan.impactCritical,
    serious: scan.impactSerious,
    moderate: scan.impactModerate,
    minor: scan.impactMinor,
    wcagAA: scan.wcagAACompliance || undefined,
    wcagAAA: scan.wcagAAACompliance || undefined,
  }));
}

/**
 * Compare current scan with industry benchmarks
 */
export async function getBenchmarkComparison(
  currentScan: {
    score: number;
    impactCritical: number;
    impactSerious: number;
    impactModerate: number;
    impactMinor: number;
  },
  industry?: string
): Promise<BenchmarkComparison | null> {
  // Default to general web benchmark if no specific industry
  const benchmarkIndustry = industry || "general";

  const benchmark = await prisma.benchmark.findFirst({
    where: {
      industry: benchmarkIndustry,
    },
    orderBy: {
      lastUpdated: "desc",
    },
  });

  if (!benchmark) {
    return null;
  }

  const difference = currentScan.score - benchmark.avgScore;
  const percentile = calculatePercentile(currentScan.score, benchmark.avgScore);

  let category: "above_average" | "average" | "below_average";
  if (difference > 10) {
    category = "above_average";
  } else if (difference < -10) {
    category = "below_average";
  } else {
    category = "average";
  }

  return {
    userScore: currentScan.score,
    industryAvg: benchmark.avgScore,
    difference,
    percentile,
    category,
  };
}

/**
 * Compare current scan with previous scan
 */
export async function getScanComparison(
  currentScanId: string
): Promise<ScanComparison> {
  const currentScan = await prisma.scan.findUnique({
    where: { id: currentScanId },
    select: {
      score: true,
      issues: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
      issuesFixed: true,
      newIssues: true,
      siteId: true,
      pageId: true,
      createdAt: true,
    },
  });

  if (!currentScan) {
    throw new Error("Scan not found");
  }

  // Find the previous scan for the same site/page
  const previousScan = await prisma.scan.findFirst({
    where: {
      siteId: currentScan.siteId,
      ...(currentScan.pageId && { pageId: currentScan.pageId }),
      createdAt: {
        lt: currentScan.createdAt,
      },
      status: "completed",
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      score: true,
      issues: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
    },
  });

  const current = {
    score: currentScan.score || 0,
    issues: currentScan.issues || 0,
    critical: currentScan.impactCritical,
    serious: currentScan.impactSerious,
    moderate: currentScan.impactModerate,
    minor: currentScan.impactMinor,
  };

  if (!previousScan) {
    return { current };
  }

  const previous = {
    score: previousScan.score || 0,
    issues: previousScan.issues || 0,
    critical: previousScan.impactCritical,
    serious: previousScan.impactSerious,
    moderate: previousScan.impactModerate,
    minor: previousScan.impactMinor,
  };

  const changes = {
    score: current.score - previous.score,
    issues: current.issues - previous.issues,
    critical: current.critical - previous.critical,
    serious: current.serious - previous.serious,
    moderate: current.moderate - previous.moderate,
    minor: current.minor - previous.minor,
    issuesFixed: currentScan.issuesFixed,
    newIssues: currentScan.newIssues,
  };

  return {
    current,
    previous,
    changes,
  };
}

/**
 * Get violation trends for specific rules
 */
export async function getViolationTrends(
  siteId: string,
  pageId?: string,
  days: number = 30
): Promise<ViolationTrend[]> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const scans = await prisma.scan.findMany({
    where: {
      siteId,
      ...(pageId && { pageId }),
      createdAt: {
        gte: startDate,
      },
      status: "completed",
      violationsByRule: {
        not: { equals: null },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      createdAt: true,
      violationsByRule: true,
      raw: true,
    },
  });

  // Extract all unique rule IDs
  const allRules = new Set<string>();
  const ruleNames = new Map<string, string>();

  scans.forEach(scan => {
    if (scan.violationsByRule) {
      const violations = scan.violationsByRule as Record<string, number>;
      Object.keys(violations).forEach(ruleId => {
        allRules.add(ruleId);
      });
    }

    // Extract rule names from raw data
    if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
      const rawViolations = (scan.raw as any).violations as Violation[];
      rawViolations.forEach((violation: Violation) => {
        if (!ruleNames.has(violation.id)) {
          ruleNames.set(violation.id, violation.help);
        }
      });
    }
  });

  // Build trends for each rule
  const trends: ViolationTrend[] = [];

  for (const ruleId of Array.from(allRules)) {
    const trend = scans.map(scan => {
      const violations = scan.violationsByRule as Record<string, number> || {};
      return {
        date: scan.createdAt.toISOString().split('T')[0],
        count: violations[ruleId] || 0,
      };
    });

    const counts = trend.map(t => t.count);
    const currentCount = counts[counts.length - 1] || 0;
    const averageCount = counts.reduce((sum, count) => sum + count, 0) / counts.length;

    // Determine if trend is improving (decreasing over time)
    const firstHalf = counts.slice(0, Math.floor(counts.length / 2));
    const secondHalf = counts.slice(Math.floor(counts.length / 2));
    const firstAvg = firstHalf.reduce((sum, count) => sum + count, 0) / firstHalf.length || 0;
    const secondAvg = secondHalf.reduce((sum, count) => sum + count, 0) / secondHalf.length || 0;
    const isImproving = secondAvg < firstAvg;

    trends.push({
      ruleId,
      ruleName: ruleNames.get(ruleId) || ruleId,
      trend,
      currentCount,
      averageCount,
      isImproving,
    });
  }

  // Sort by current count (most problematic first)
  return trends.sort((a, b) => b.currentCount - a.currentCount);
}

/**
 * Calculate WCAG compliance percentage using comprehensive mapping
 */
export function calculateWCAGCompliance(
  violations: Violation[],
  level: "A" | "AA" | "AAA" = "AA"
): number {
  const { calculateWCAGComplianceDetailed } = require("@/lib/wcag-mapping");
  const result = calculateWCAGComplianceDetailed(violations, level);
  return result.percentage;
}

/**
 * Update benchmark data (typically run as a background job)
 */
export async function updateBenchmarkData(
  industry: string,
  category?: string
) {
  // Calculate benchmark from all completed scans
  const scans = await prisma.scan.findMany({
    where: {
      status: "completed",
      score: { not: null },
    },
    select: {
      score: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
      wcagAACompliance: true,
      wcagAAACompliance: true,
    },
  });

  if (scans.length === 0) return;

  const avgScore = scans.reduce((sum, scan) => sum + (scan.score || 0), 0) / scans.length;
  const avgCritical = scans.reduce((sum, scan) => sum + scan.impactCritical, 0) / scans.length;
  const avgSerious = scans.reduce((sum, scan) => sum + scan.impactSerious, 0) / scans.length;
  const avgModerate = scans.reduce((sum, scan) => sum + scan.impactModerate, 0) / scans.length;
  const avgMinor = scans.reduce((sum, scan) => sum + scan.impactMinor, 0) / scans.length;

  const scansWithWCAG = scans.filter(s => s.wcagAACompliance !== null);
  const avgWcagAA = scansWithWCAG.length > 0
    ? scansWithWCAG.reduce((sum, scan) => sum + (scan.wcagAACompliance || 0), 0) / scansWithWCAG.length
    : 0;

  const scansWithWCAGAAA = scans.filter(s => s.wcagAAACompliance !== null);
  const avgWcagAAA = scansWithWCAGAAA.length > 0
    ? scansWithWCAGAAA.reduce((sum, scan) => sum + (scan.wcagAAACompliance || 0), 0) / scansWithWCAGAAA.length
    : 0;

  // Check if benchmark already exists
  const existingBenchmark = await prisma.benchmark.findFirst({
    where: {
      industry,
      category: category || null,
    },
  });

  if (existingBenchmark) {
    await prisma.benchmark.update({
      where: { id: existingBenchmark.id },
      data: {
        avgScore,
        avgCritical,
        avgSerious,
        avgModerate,
        avgMinor,
        avgWcagAA,
        avgWcagAAA,
        sampleSize: scans.length,
        lastUpdated: new Date(),
      },
    });
  } else {
    await prisma.benchmark.create({
      data: {
        industry,
        category: category || null,
        avgScore,
        avgCritical,
        avgSerious,
        avgModerate,
        avgMinor,
        avgWcagAA,
        avgWcagAAA,
        sampleSize: scans.length,
      },
    });
  }
}

// Helper functions
function calculatePercentile(userScore: number, industryAvg: number): number {
  // Simplified percentile calculation
  // In practice, you'd calculate this based on the distribution of all scores
  const difference = userScore - industryAvg;
  if (difference > 20) return 90;
  if (difference > 10) return 75;
  if (difference > 0) return 60;
  if (difference > -10) return 40;
  if (difference > -20) return 25;
  return 10;
}

function getWCAGRules(level: "AA" | "AAA"): string[] {
  // This is a simplified mapping - in production you'd have a comprehensive
  // mapping of axe-core rules to WCAG success criteria
  const aaRules = [
    "color-contrast",
    "image-alt",
    "label",
    "link-name",
    "button-name",
    "heading-order",
    "landmark-one-main",
    "page-has-heading-one",
    "focus-order-semantics",
    "keyboard",
    "no-autoplay-audio",
    "video-captions",
  ];

  const aaaRules = [
    ...aaRules,
    "color-contrast-enhanced",
    "focus-order-semantics",
    "no-keyboard-trap",
    "timing-adjustable",
  ];

  return level === "AAA" ? aaaRules : aaRules;
}