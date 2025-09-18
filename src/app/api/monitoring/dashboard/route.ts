import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface RegressionAlert {
  id: string;
  type: 'score_drop' | 'new_issues' | 'compliance_risk' | 'performance_impact';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  scanId: string;
  siteUrl: string;
  timestamp: Date;
  scoreChange?: number;
  issueCount?: number;
  resolved: boolean;
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
          orderBy: { createdAt: 'desc' },
          take: 2, // Latest and previous for comparison
          include: {
            site: true
          }
        }
      }
    });

    // Calculate monitoring stats
    const totalSites = sites.length;
    let sitesAtRisk = 0;
    let totalScoreChange = 0;
    let sitesWithScoreChange = 0;
    const recentAlerts: RegressionAlert[] = [];

    // Analyze each site for regressions
    for (const site of sites) {
      if (site.scans.length >= 2) {
        const [latestScan, previousScan] = site.scans;

        // Calculate score change
        if (latestScan.score !== null && previousScan.score !== null) {
          const scoreChange = latestScan.score - previousScan.score;
          totalScoreChange += scoreChange;
          sitesWithScoreChange++;

          // Check for significant score drops (regression)
          if (scoreChange <= -10) {
            sitesAtRisk++;

            const severity = scoreChange <= -30 ? 'critical' :
                           scoreChange <= -20 ? 'high' :
                           scoreChange <= -15 ? 'medium' : 'low';

            recentAlerts.push({
              id: `score_drop_${latestScan.id}`,
              type: 'score_drop',
              severity,
              message: `Score dropped by ${Math.abs(scoreChange)} points`,
              scanId: latestScan.id,
              siteUrl: site.url,
              timestamp: latestScan.createdAt,
              scoreChange,
              resolved: false
            });
          }
        }

        // Check for new issues
        if (latestScan.issues && previousScan.issues && latestScan.issues > previousScan.issues) {
          const newIssuesCount = latestScan.issues - previousScan.issues;

          if (newIssuesCount >= 5) {
            sitesAtRisk++;

            const severity = newIssuesCount >= 50 ? 'critical' :
                           newIssuesCount >= 20 ? 'high' :
                           newIssuesCount >= 10 ? 'medium' : 'low';

            recentAlerts.push({
              id: `new_issues_${latestScan.id}`,
              type: 'new_issues',
              severity,
              message: `${newIssuesCount} new accessibility issues detected`,
              scanId: latestScan.id,
              siteUrl: site.url,
              timestamp: latestScan.createdAt,
              issueCount: newIssuesCount,
              resolved: false
            });
          }
        }

        // Check for compliance risk
        if (latestScan.wcagAACompliance !== null && latestScan.wcagAACompliance < 70) {
          const severity = latestScan.wcagAACompliance < 40 ? 'critical' :
                         latestScan.wcagAACompliance < 55 ? 'high' :
                         latestScan.wcagAACompliance < 70 ? 'medium' : 'low';

          recentAlerts.push({
            id: `compliance_${latestScan.id}`,
            type: 'compliance_risk',
            severity,
            message: `WCAG AA compliance below threshold (${latestScan.wcagAACompliance?.toFixed(1)}%)`,
            scanId: latestScan.id,
            siteUrl: site.url,
            timestamp: latestScan.createdAt,
            resolved: false
          });
        }

        // Check for performance impact
        if (latestScan.performanceScore !== null && latestScan.performanceScore < 50) {
          recentAlerts.push({
            id: `performance_${latestScan.id}`,
            type: 'performance_impact',
            severity: 'medium',
            message: `Poor performance may impact accessibility (${latestScan.performanceScore?.toFixed(1)} score)`,
            scanId: latestScan.id,
            siteUrl: site.url,
            timestamp: latestScan.createdAt,
            resolved: false
          });
        }
      }
    }

    // Calculate average score change
    const avgScoreChange = sitesWithScoreChange > 0
      ? Math.round(totalScoreChange / sitesWithScoreChange)
      : 0;

    // Count alerts from today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const alertsToday = recentAlerts.filter(alert =>
      new Date(alert.timestamp) >= today
    ).length;

    // Sort alerts by severity and timestamp (most recent first)
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    recentAlerts.sort((a, b) => {
      const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
      if (severityDiff !== 0) return severityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Generate trend data (mock data for now - would be calculated from historical scans)
    const regressionsTrend = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        regressions: Math.floor(Math.random() * 5), // Mock data
        improvements: Math.floor(Math.random() * 8) // Mock data
      };
    });

    const monitoringData = {
      totalSites,
      sitesAtRisk,
      avgScoreChange,
      alertsToday,
      regressionsTrend,
      recentAlerts: recentAlerts.slice(0, 10) // Limit to 10 most recent alerts
    };

    return NextResponse.json(monitoringData);

  } catch (error) {
    console.error("Monitoring dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 }
    );
  }
}