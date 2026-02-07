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

    // Generate trend data from historical scans (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Get all scans from last 7 days for trend analysis
    const historicalScans = await prisma.scan.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo
        },
        site: {
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
        }
      },
      orderBy: {
        createdAt: 'asc'
      },
      include: {
        site: true
      }
    });

    // Group scans by date and calculate regressions/improvements
    const trendMap = new Map<string, { regressions: number; improvements: number }>();

    // Initialize all 7 days with zero values
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      trendMap.set(dateStr, { regressions: 0, improvements: 0 });
    }

    // Group scans by site and date to compare with previous scans
    const siteScansMap = new Map<string, any[]>();
    for (const scan of historicalScans) {
      const siteId = scan.siteId;
      if (!siteScansMap.has(siteId)) {
        siteScansMap.set(siteId, []);
      }
      siteScansMap.get(siteId)!.push(scan);
    }

    // Calculate daily regressions and improvements
    siteScansMap.forEach((siteScans, siteId) => {
      // Sort scans by date
      siteScans.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      for (let i = 1; i < siteScans.length; i++) {
        const currentScan = siteScans[i];
        const previousScan = siteScans[i - 1];
        const dateStr = new Date(currentScan.createdAt).toISOString().split('T')[0];

        if (trendMap.has(dateStr)) {
          const trend = trendMap.get(dateStr)!;

          // Check for score changes
          if (currentScan.score !== null && previousScan.score !== null) {
            const scoreChange = currentScan.score - previousScan.score;

            if (scoreChange < -5) {
              // Significant score drop = regression
              trend.regressions++;
            } else if (scoreChange > 5) {
              // Significant score improvement
              trend.improvements++;
            }
          }

          // Check for issue count changes
          if (currentScan.issues !== null && previousScan.issues !== null) {
            const issueChange = currentScan.issues - previousScan.issues;

            if (issueChange > 3) {
              // More issues = regression
              trend.regressions++;
            } else if (issueChange < -3) {
              // Fewer issues = improvement
              trend.improvements++;
            }
          }
        }
      }
    });

    // Convert map to array for response
    const regressionsTrend = Array.from(trendMap.entries()).map(([date, data]) => ({
      date,
      regressions: data.regressions,
      improvements: data.improvements
    }));

    const monitoringData = {
      totalSites,
      sitesAtRisk,
      avgScoreChange,
      alertsToday,
      regressionsTrend,
      recentAlerts: recentAlerts.slice(0, 10) // Limit to 10 most recent alerts
    };

    return NextResponse.json(monitoringData);

  } catch (error: any) {
    if (error?.message === "Authentication required") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Monitoring dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitoring data" },
      { status: 500 }
    );
  }
}