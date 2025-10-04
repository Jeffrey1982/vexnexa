import { prisma } from "./prisma";

interface CombinedReportData {
  site: {
    id: string;
    url: string;
    name: string | null;
  };
  scan: {
    id: string;
    score: number | null;
    issues: number | null;
    impactCritical: number;
    impactSerious: number;
    impactModerate: number;
    impactMinor: number;
    createdAt: Date;
  } | null;
  audit: {
    id: string;
    name: string;
    description: string | null;
    totalCriteria: number;
    completedCriteria: number;
    passedCriteria: number;
    failedCriteria: number;
    overallScore: number | null;
    compliant: boolean;
    createdAt: Date;
    completedAt: Date | null;
    template: {
      name: string;
      wcagLevel: string | null;
    } | null;
    items: {
      id: string;
      category: string;
      title: string;
      wcagCriterion: string | null;
      wcagLevel: string | null;
      result: string | null;
      notes: string | null;
      priority: string;
      pageUrl: string | null;
      elementSelector: string | null;
    }[];
  } | null;
  combined: {
    overallScore: number;
    automatedScore: number | null;
    manualScore: number | null;
    totalIssues: number;
    criticalIssues: number;
    seriousIssues: number;
    moderateIssues: number;
    minorIssues: number;
    manualFailures: number;
    wcagAACompliance: number | null;
    wcagAAACompliance: number | null;
    fullyCoveredWCAG: boolean;
    coveragePercentage: number;
  };
}

export async function generateCombinedReport(
  siteId: string,
  scanId?: string,
  auditId?: string
): Promise<CombinedReportData | null> {
  // Fetch site
  const siteData = await prisma.site.findUnique({
    where: { id: siteId },
    select: {
      id: true,
      url: true,
    }
  });

  if (!siteData) {
    return null;
  }

  const site = {
    ...siteData,
    name: null
  };

  // Fetch scan (either specific or most recent)
  let scan = null;
  if (scanId) {
    scan = await prisma.scan.findFirst({
      where: {
        id: scanId,
        siteId
      },
      select: {
        id: true,
        score: true,
        issues: true,
        impactCritical: true,
        impactSerious: true,
        impactModerate: true,
        impactMinor: true,
        
        createdAt: true
      }
    });
  } else {
    scan = await prisma.scan.findFirst({
      where: {
        siteId,
        status: "done"
      },
      select: {
        id: true,
        score: true,
        issues: true,
        impactCritical: true,
        impactSerious: true,
        impactModerate: true,
        impactMinor: true,
        
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });
  }

  // Fetch audit (either specific or most recent)
  let audit = null;
  if (auditId) {
    audit = await prisma.manualAudit.findFirst({
      where: {
        id: auditId,
        siteId
      },
      include: {
        template: {
          select: {
            name: true,
            wcagLevel: true
          }
        },
        items: {
          select: {
            id: true,
            category: true,
            title: true,
            wcagCriterion: true,
            wcagLevel: true,
            result: true,
            notes: true,
            priority: true,
            pageUrl: true,
            elementSelector: true
          },
          orderBy: [
            { priority: "desc" },
            { category: "asc" }
          ]
        }
      }
    });
  } else {
    audit = await prisma.manualAudit.findFirst({
      where: {
        siteId,
        status: { in: ["completed", "reviewed"] }
      },
      include: {
        template: {
          select: {
            name: true,
            wcagLevel: true
          }
        },
        items: {
          select: {
            id: true,
            category: true,
            title: true,
            wcagCriterion: true,
            wcagLevel: true,
            result: true,
            notes: true,
            priority: true,
            pageUrl: true,
            elementSelector: true
          },
          orderBy: [
            { priority: "desc" },
            { category: "asc" }
          ]
        }
      },
      orderBy: { completedAt: "desc" }
    });
  }

  // Calculate combined metrics
  const automatedScore = scan?.score || null;
  const manualScore = audit?.overallScore || null;

  // Calculate overall score (weighted: 50% automated, 50% manual)
  let overallScore = 0;
  if (automatedScore !== null && manualScore !== null) {
    overallScore = (automatedScore * 0.5 + manualScore * 0.5);
  } else if (automatedScore !== null) {
    overallScore = automatedScore;
  } else if (manualScore !== null) {
    overallScore = manualScore;
  }

  // Count total issues
  const automatedIssues = scan?.issues || 0;
  const manualFailures = audit?.failedCriteria || 0;
  const totalIssues = automatedIssues + manualFailures;

  // Breakdown by severity
  const criticalIssues = (scan?.impactCritical || 0) + (audit ? countBySeverity(audit.items, "critical") : 0);
  const seriousIssues = (scan?.impactSerious || 0) + (audit ? countBySeverity(audit.items, "high") : 0);
  const moderateIssues = (scan?.impactModerate || 0) + (audit ? countBySeverity(audit.items, "medium") : 0);
  const minorIssues = (scan?.impactMinor || 0) + (audit ? countBySeverity(audit.items, "low") : 0);

  // WCAG compliance (from manual audit only, automated scans don't track WCAG compliance)
  let wcagAACompliance = null;
  let wcagAAACompliance = null;

  if (audit && audit.overallScore !== null) {
    wcagAACompliance = audit.overallScore;
  }

  // Coverage calculation
  // Automated covers ~45%, manual covers ~55%, combined = 100%
  const hasAutomated = scan !== null;
  const hasManual = audit !== null && audit.completedCriteria === audit.totalCriteria;
  const coveragePercentage = (hasAutomated ? 45 : 0) + (hasManual ? 55 : 0);
  const fullyCoveredWCAG = hasAutomated && hasManual;

  return {
    site,
    scan: scan as any,
    audit: audit as any,
    combined: {
      overallScore: Math.round(overallScore * 10) / 10,
      automatedScore,
      manualScore,
      totalIssues,
      criticalIssues,
      seriousIssues,
      moderateIssues,
      minorIssues,
      manualFailures,
      wcagAACompliance: wcagAACompliance !== null ? Math.round(wcagAACompliance * 10) / 10 : null,
      wcagAAACompliance: wcagAAACompliance !== null ? Math.round(wcagAAACompliance * 10) / 10 : null,
      fullyCoveredWCAG,
      coveragePercentage
    }
  };
}

function countBySeverity(
  items: Array<{ result: string | null; priority: string }>,
  severity: string
): number {
  return items.filter(item => item.result === "fail" && item.priority === severity).length;
}

// Helper to get combined report for multiple sites
export async function generateCombinedReportBatch(
  siteIds: string[]
): Promise<CombinedReportData[]> {
  const reports = await Promise.all(
    siteIds.map(siteId => generateCombinedReport(siteId))
  );
  return reports.filter(r => r !== null) as CombinedReportData[];
}
