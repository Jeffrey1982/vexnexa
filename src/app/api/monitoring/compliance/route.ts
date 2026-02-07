import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface ComplianceData {
  siteId: string;
  siteUrl: string;
  wcagAA: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
    criticalIssues: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };
  wcagAAA: {
    score: number;
    trend: 'improving' | 'declining' | 'stable';
    lastUpdated: Date;
  };
  legalRisk: {
    level: 'low' | 'medium' | 'high' | 'critical';
    score: number;
    factors: string[];
    recommendation: string;
  };
  timeline: Array<{
    date: Date;
    wcagAA: number;
    wcagAAA: number;
    event?: string;
  }>;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    // Get user's sites (including team sites)
    const sites = await prisma.site.findMany({
      where: {
        OR: [
          { userId: user.id },
          {
            teams: {
              some: {
                members: {
                  some: {
                    userId: user.id
                  }
                }
              }
            }
          }
        ]
      },
      include: {
        scans: {
          where: {
            status: 'done',
            wcagAACompliance: { not: null }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Get recent scans for trend analysis
        }
      }
    });

    const siteCompliance: ComplianceData[] = [];
    let totalWcagAA = 0;
    let totalWcagAAA = 0;
    let compliantSites = 0;
    let atRiskSites = 0;
    const legalRiskDistribution = { low: 0, medium: 0, high: 0, critical: 0 };

    for (const site of sites) {
      if (site.scans.length === 0) continue;

      const latestScan = site.scans[0];
      const wcagAAScore = latestScan.wcagAACompliance || 0;
      const wcagAAAScore = latestScan.wcagAAACompliance || 0;

      // Calculate trend
      let wcagAATrend: 'improving' | 'declining' | 'stable' = 'stable';
      let wcagAAATrend: 'improving' | 'declining' | 'stable' = 'stable';

      if (site.scans.length >= 2) {
        const prevScan = site.scans[1];
        if (prevScan.wcagAACompliance) {
          const aaDiff = wcagAAScore - prevScan.wcagAACompliance;
          wcagAATrend = aaDiff > 5 ? 'improving' : aaDiff < -5 ? 'declining' : 'stable';
        }
        if (prevScan.wcagAAACompliance) {
          const aaaDiff = wcagAAAScore - (prevScan.wcagAAACompliance || 0);
          wcagAAATrend = aaaDiff > 5 ? 'improving' : aaaDiff < -5 ? 'declining' : 'stable';
        }
      }

      // Calculate legal risk
      let legalRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
      let legalRiskScore = Math.max(0, 100 - wcagAAScore);
      const riskFactors: string[] = [];

      if (wcagAAScore < 40) {
        legalRiskLevel = 'critical';
        legalRiskScore = 90;
        riskFactors.push('Severe WCAG violations', 'High lawsuit risk', 'Immediate remediation required');
      } else if (wcagAAScore < 55) {
        legalRiskLevel = 'high';
        legalRiskScore = 75;
        riskFactors.push('Multiple accessibility barriers', 'Legal compliance concerns', 'Priority remediation needed');
      } else if (wcagAAScore < 70) {
        legalRiskLevel = 'medium';
        legalRiskScore = 50;
        riskFactors.push('Moderate accessibility issues', 'Compliance gaps', 'Regular monitoring required');
      } else {
        legalRiskLevel = 'low';
        legalRiskScore = 25;
        riskFactors.push('Good accessibility practices', 'Low legal exposure', 'Maintain current standards');
      }

      // Add performance-related risk factors
      if (latestScan.performanceScore && latestScan.performanceScore < 50) {
        riskFactors.push('Poor performance affects accessibility');
        legalRiskScore += 10;
      }

      // Count critical issues
      let criticalIssues = latestScan.impactCritical || 0;

      if (criticalIssues > 10) {
        riskFactors.push(`${criticalIssues} critical violations`);
        if (legalRiskLevel === 'low') legalRiskLevel = 'medium';
        else if (legalRiskLevel === 'medium') legalRiskLevel = 'high';
      }

      // Generate recommendation
      let recommendation = '';
      switch (legalRiskLevel) {
        case 'critical':
          recommendation = 'Immediate professional accessibility audit and remediation required to avoid legal action.';
          break;
        case 'high':
          recommendation = 'Priority accessibility improvements needed to reduce legal risk exposure.';
          break;
        case 'medium':
          recommendation = 'Implement systematic accessibility improvements and regular monitoring.';
          break;
        case 'low':
          recommendation = 'Continue maintaining good accessibility practices with periodic reviews.';
          break;
      }

      // Build timeline from scans
      const timeline = site.scans.reverse().map(scan => ({
        date: scan.createdAt,
        wcagAA: scan.wcagAACompliance || 0,
        wcagAAA: scan.wcagAAACompliance || 0
      }));

      const siteComplianceData: ComplianceData = {
        siteId: site.id,
        siteUrl: site.url,
        wcagAA: {
          score: wcagAAScore,
          trend: wcagAATrend,
          lastUpdated: latestScan.createdAt,
          criticalIssues,
          riskLevel: legalRiskLevel
        },
        wcagAAA: {
          score: wcagAAAScore,
          trend: wcagAAATrend,
          lastUpdated: latestScan.createdAt
        },
        legalRisk: {
          level: legalRiskLevel,
          score: Math.min(100, legalRiskScore),
          factors: riskFactors,
          recommendation
        },
        timeline
      };

      siteCompliance.push(siteComplianceData);

      // Update aggregate stats
      totalWcagAA += wcagAAScore;
      totalWcagAAA += wcagAAAScore;

      if (wcagAAScore >= 70) compliantSites++;
      if (legalRiskLevel === 'high' || legalRiskLevel === 'critical') atRiskSites++;

      legalRiskDistribution[legalRiskLevel]++;
    }

    const totalSites = siteCompliance.length;
    const avgWcagAA = totalSites > 0 ? totalWcagAA / totalSites : 0;
    const avgWcagAAA = totalSites > 0 ? totalWcagAAA / totalSites : 0;

    // Generate upcoming deadlines (mock data - in reality would come from compliance calendar)
    const upcomingDeadlines = [];
    if (legalRiskDistribution.critical > 0) {
      upcomingDeadlines.push({
        site: siteCompliance.find(s => s.legalRisk.level === 'critical')?.siteUrl || 'Critical site',
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        requirement: 'Critical accessibility issues must be resolved'
      });
    }

    if (legalRiskDistribution.high > 0) {
      upcomingDeadlines.push({
        site: 'All high-risk sites',
        deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
        requirement: 'WCAG 2.1 AA compliance certification due'
      });
    }

    const overview = {
      totalSites,
      compliantSites,
      atRiskSites,
      avgWcagAA: Math.round(avgWcagAA * 10) / 10,
      avgWcagAAA: Math.round(avgWcagAAA * 10) / 10,
      legalRiskDistribution,
      upcomingDeadlines
    };

    // Sort sites by risk level (critical first)
    const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    siteCompliance.sort((a, b) =>
      riskOrder[b.legalRisk.level] - riskOrder[a.legalRisk.level] ||
      b.wcagAA.score - a.wcagAA.score
    );

    return NextResponse.json({
      overview,
      sites: siteCompliance
    });

  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Compliance tracking error:", error);
    return NextResponse.json(
      { error: "Failed to fetch compliance data" },
      { status: 500 }
    );
  }
}