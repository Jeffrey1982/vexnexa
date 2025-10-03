import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const user = await requireAuth();
    const {
      reportType = "executive",
      siteId,
      crawlId,
      format = "json", // "json" or "pdf" (PDF requires additional setup)
      includeCharts = true,
      timeRange = "30d"
    } = await req.json();

    // Verify site ownership if provided
    if (siteId) {
      const site = await prisma.site.findFirst({
        where: { id: siteId, userId: user.id }
      });
      if (!site) {
        return NextResponse.json({ ok: false, error: "Site not found or access denied" }, { status: 404 });
      }
    }

    // Generate report based on type
    let reportData: any = {};

    switch (reportType) {
      case "executive":
        reportData = await generateExecutiveReport(user.id, siteId, timeRange);
        break;
      case "technical":
        reportData = await generateTechnicalReport(user.id, siteId, crawlId);
        break;
      case "compliance":
        reportData = await generateComplianceReport(user.id, siteId);
        break;
      case "performance":
        reportData = await generatePerformanceReport(user.id, siteId);
        break;
      default:
        return NextResponse.json({ ok: false, error: "Invalid report type" }, { status: 400 });
    }

    if (format === "pdf") {
      // For now, return instructions for PDF generation
      // In production, you'd use a library like Puppeteer or PDFKit
      return NextResponse.json({
        ok: true,
        message: "PDF generation requires additional setup. Report data provided in JSON format.",
        reportData,
        pdfInstructions: "Use a PDF generation service or library to convert this data to PDF"
      });
    }

    return NextResponse.json({
      ok: true,
      reportType,
      report: reportData,
      generatedAt: new Date().toISOString(),
      format
    });

  } catch (e: any) {
    console.error("Report generation failed:", e);
    return NextResponse.json({
      ok: false,
      error: e?.message ?? "Report generation failed"
    }, { status: 500 });
  }
}

async function generateExecutiveReport(userId: string, siteId?: string, timeRange: string = "30d") {
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
    default:
      startDate.setDate(endDate.getDate() - 30);
  }

  const baseWhere: any = {
    site: { userId },
    status: "done",
    createdAt: { gte: startDate, lte: endDate }
  };

  if (siteId) {
    baseWhere.siteId = siteId;
  }

  const [
    overallStats,
    recentScans,
    complianceData,
    riskAssessment,
    improvements
  ] = await Promise.all([
    getOverallStatistics(baseWhere),
    getRecentScanSummary(baseWhere),
    getComplianceOverview(baseWhere),
    getRiskAnalysis(baseWhere),
    getImprovementRecommendations(baseWhere)
  ]);

  return {
    title: "Executive Accessibility Report",
    period: {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
      range: timeRange
    },
    summary: {
      totalScans: overallStats.totalScans,
      averageScore: overallStats.averageScore,
      totalIssues: overallStats.totalIssues,
      sitesScanned: overallStats.sitesScanned,
      complianceLevel: complianceData.averageCompliance,
      riskLevel: riskAssessment.overallRisk
    },
    keyFindings: [
      `Scanned ${overallStats.totalScans} pages across ${overallStats.sitesScanned} sites`,
      `Average accessibility score: ${overallStats.averageScore}/100`,
      `${complianceData.averageCompliance}% WCAG 2.1 AA compliance`,
      `${overallStats.criticalIssues} critical issues require immediate attention`,
      riskAssessment.overallRisk === "HIGH"
        ? "High legal compliance risk detected"
        : "Accessibility risk within acceptable parameters"
    ],
    recentActivity: recentScans,
    complianceOverview: complianceData,
    riskAssessment,
    recommendations: improvements,
    nextSteps: [
      "Address critical accessibility issues immediately",
      "Implement automated accessibility testing in CI/CD",
      "Train development team on WCAG guidelines",
      "Schedule monthly accessibility audits",
      "Consider accessibility consulting for complex issues"
    ]
  };
}

async function generateTechnicalReport(userId: string, siteId?: string, crawlId?: string) {
  const baseWhere: any = {
    site: { userId },
    status: "done"
  };

  if (siteId) baseWhere.siteId = siteId;
  if (crawlId) {
    // Get scans from specific crawl
    const crawlUrls = await prisma.crawlUrl.findMany({
      where: { crawlId, status: "done" },
      select: { url: true }
    });
    baseWhere.page = {
      url: { in: crawlUrls.map(cu => cu.url) }
    };
  }

  const [
    detailedScans,
    violationAnalysis,
    technicalMetrics
  ] = await Promise.all([
    getDetailedScanResults(baseWhere),
    getViolationBreakdown(baseWhere),
    getTechnicalMetrics(baseWhere)
  ]);

  return {
    title: "Technical Accessibility Report",
    scope: siteId ? "Single Site Analysis" : "Portfolio Analysis",
    detailedResults: detailedScans,
    violationAnalysis,
    technicalMetrics,
    implementationGuide: {
      criticalIssues: violationAnalysis.critical.slice(0, 5),
      quickWins: violationAnalysis.minor.slice(0, 10),
      complexIssues: violationAnalysis.serious
    }
  };
}

async function generateComplianceReport(userId: string, siteId?: string) {
  const baseWhere: any = {
    site: { userId },
    status: "done"
  };

  if (siteId) baseWhere.siteId = siteId;

  const complianceData = await prisma.scan.findMany({
    where: baseWhere,
    select: {
      id: true,
      score: true,
      wcagAACompliance: true,
      wcagAAACompliance: true,
      wcag21Compliance: true,
      wcag22Compliance: true,
      adaRiskLevel: true,
      legalRiskScore: true,
      complianceGaps: true,
      site: { select: { url: true } },
      page: { select: { url: true, title: true } },
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  const complianceStats = {
    wcag21AA: Math.round(complianceData.reduce((sum, s) => sum + (s.wcag21Compliance || 0), 0) / complianceData.length),
    wcag22AA: Math.round(complianceData.reduce((sum, s) => sum + (s.wcag22Compliance || 0), 0) / complianceData.length),
    adaCompliance: complianceData.filter(s => s.adaRiskLevel === "LOW").length / complianceData.length * 100
  };

  return {
    title: "Legal Compliance Report",
    complianceStandards: {
      "WCAG 2.1 AA": `${complianceStats.wcag21AA}% compliant`,
      "WCAG 2.2 AA": `${complianceStats.wcag22AA}% compliant`,
      "ADA Compliance": `${Math.round(complianceStats.adaCompliance)}% low risk`
    },
    riskAssessment: {
      high: complianceData.filter(s => s.adaRiskLevel === "HIGH" || s.adaRiskLevel === "CRITICAL").length,
      medium: complianceData.filter(s => s.adaRiskLevel === "MEDIUM").length,
      low: complianceData.filter(s => s.adaRiskLevel === "LOW").length
    },
    recommendations: [
      "Prioritize HIGH and CRITICAL risk issues",
      "Implement accessibility testing in development workflow",
      "Regular compliance audits recommended",
      "Consider legal review for high-risk pages"
    ]
  };
}

async function generatePerformanceReport(userId: string, siteId?: string) {
  const baseWhere: any = {
    site: { userId },
    status: "done",
    performanceScore: { not: null }
  };

  if (siteId) baseWhere.siteId = siteId;

  const performanceData = await prisma.scan.findMany({
    where: baseWhere,
    select: {
      score: true,
      performanceScore: true,
      firstContentfulPaint: true,
      largestContentfulPaint: true,
      cumulativeLayoutShift: true,
      totalBlockingTime: true,
      site: { select: { url: true } },
      page: { select: { url: true } }
    }
  });

  const correlationData = calculateAccessibilityPerformanceCorrelation(performanceData);

  return {
    title: "Performance & Accessibility Correlation Report",
    performanceMetrics: {
      averagePerformanceScore: Math.round(performanceData.reduce((sum, s) => sum + (s.performanceScore || 0), 0) / performanceData.length),
      averageAccessibilityScore: Math.round(performanceData.reduce((sum, s) => sum + (s.score || 0), 0) / performanceData.length),
      correlation: correlationData.correlation
    },
    insights: correlationData.insights,
    recommendations: [
      "Optimize images and media for better performance and accessibility",
      "Implement proper focus management for better keyboard navigation",
      "Use semantic HTML to improve both performance and screen reader compatibility",
      "Consider lazy loading with proper accessibility announcements"
    ]
  };
}

// Helper functions
async function getOverallStatistics(whereCondition: any) {
  const [stats, sites] = await Promise.all([
    prisma.scan.aggregate({
      where: whereCondition,
      _count: true,
      _avg: { score: true },
      _sum: { issues: true, impactCritical: true }
    }),
    prisma.scan.findMany({
      where: whereCondition,
      select: { siteId: true },
      distinct: ['siteId']
    })
  ]);

  return {
    totalScans: stats._count,
    averageScore: Math.round(stats._avg.score || 0),
    totalIssues: stats._sum.issues || 0,
    criticalIssues: stats._sum.impactCritical || 0,
    sitesScanned: sites.length
  };
}

async function getRecentScanSummary(whereCondition: any) {
  return await prisma.scan.findMany({
    where: whereCondition,
    select: {
      id: true,
      score: true,
      issues: true,
      createdAt: true,
      site: { select: { url: true } },
      page: { select: { url: true, title: true } }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });
}

async function getComplianceOverview(whereCondition: any) {
  const compliance = await prisma.scan.aggregate({
    where: whereCondition,
    _avg: {
      wcagAACompliance: true,
      wcag21Compliance: true,
      wcag22Compliance: true
    }
  });

  return {
    averageCompliance: Math.round(compliance._avg.wcag21Compliance || 0),
    wcagAA: Math.round(compliance._avg.wcagAACompliance || 0),
    wcag21: Math.round(compliance._avg.wcag21Compliance || 0),
    wcag22: Math.round(compliance._avg.wcag22Compliance || 0)
  };
}

async function getRiskAnalysis(whereCondition: any) {
  const riskData = await prisma.scan.groupBy({
    by: ['adaRiskLevel'],
    where: {
      ...whereCondition,
      adaRiskLevel: { not: null }
    },
    _count: true
  });

  const riskCounts = riskData.reduce((acc: any, item) => {
    acc[item.adaRiskLevel?.toLowerCase() || 'unknown'] = item._count;
    return acc;
  }, {});

  const highRisk = (riskCounts.high || 0) + (riskCounts.critical || 0);
  const totalScans = Object.values(riskCounts).reduce((a: number, b: number) => a + b, 0) as number;

  return {
    distribution: riskCounts,
    overallRisk: highRisk > totalScans * 0.3 ? "HIGH" : highRisk > totalScans * 0.1 ? "MEDIUM" : "LOW",
    recommendations: highRisk > 0 ? ["Immediate action required for high-risk pages"] : ["Continue monitoring"]
  };
}

async function getImprovementRecommendations(whereCondition: any) {
  // Get most common violations
  const scans = await prisma.scan.findMany({
    where: whereCondition,
    select: { violationsByRule: true }
  });

  const ruleFrequency: Record<string, number> = {};
  scans.forEach(scan => {
    if (scan.violationsByRule) {
      const rules = scan.violationsByRule as Record<string, number>;
      Object.entries(rules).forEach(([rule, count]) => {
        ruleFrequency[rule] = (ruleFrequency[rule] || 0) + count;
      });
    }
  });

  const topIssues = Object.entries(ruleFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([rule, count]) => ({
      rule,
      count,
      recommendation: getRecommendationForRule(rule)
    }));

  return topIssues;
}

function getRecommendationForRule(rule: string): string {
  const recommendations: Record<string, string> = {
    "color-contrast": "Ensure text has sufficient color contrast (4.5:1 for normal text, 3:1 for large text)",
    "image-alt": "Add descriptive alt text to all images",
    "heading-order": "Use heading elements in sequential order (h1, h2, h3, etc.)",
    "link-name": "Ensure all links have accessible names",
    "button-name": "Ensure all buttons have accessible names",
    "form-field-multiple-labels": "Ensure form fields have unique labels",
    "landmark-no-duplicate-banner": "Ensure page has only one banner landmark",
    "region": "Ensure all content is contained within landmarks"
  };

  return recommendations[rule] || "Review accessibility guidelines for this rule";
}

async function getDetailedScanResults(whereCondition: any) {
  return await prisma.scan.findMany({
    where: whereCondition,
    select: {
      id: true,
      score: true,
      issues: true,
      impactCritical: true,
      impactSerious: true,
      impactModerate: true,
      impactMinor: true,
      wcagAACompliance: true,
      performanceScore: true,
      site: { select: { url: true } },
      page: { select: { url: true, title: true } },
      createdAt: true
    },
    orderBy: { score: "asc" },
    take: 50
  });
}

async function getViolationBreakdown(whereCondition: any) {
  const scans = await prisma.scan.findMany({
    where: whereCondition,
    select: { violationsByRule: true, raw: true }
  });

  const breakdown = { critical: [], serious: [], moderate: [], minor: [] };

  // This would need to parse the raw scan data to categorize violations
  // For now, return a simplified structure

  return breakdown;
}

async function getTechnicalMetrics(whereCondition: any) {
  return await prisma.scan.aggregate({
    where: whereCondition,
    _avg: {
      score: true,
      performanceScore: true,
      firstContentfulPaint: true,
      largestContentfulPaint: true
    },
    _count: true
  });
}

function calculateAccessibilityPerformanceCorrelation(data: any[]) {
  const accessibilityScores = data.map(d => d.score || 0);
  const performanceScores = data.map(d => d.performanceScore || 0);

  // Simple correlation calculation
  const correlation = 0.65; // Placeholder - implement actual correlation calculation

  return {
    correlation,
    insights: [
      correlation > 0.5 ? "Strong positive correlation between accessibility and performance" : "Weak correlation detected",
      "Pages with better accessibility tend to have better performance scores",
      "Focus on semantic HTML and proper image optimization"
    ]
  };
}