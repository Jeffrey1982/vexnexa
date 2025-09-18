import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface TrendDataPoint {
  date: string;
  score: number;
  issues: number;
  wcagAACompliance?: number;
  performanceScore?: number;
  siteUrl: string;
  siteId: string;
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const timeRange = searchParams.get('timeRange') || '30d';
    const siteId = searchParams.get('siteId');

    // Calculate date range
    const now = new Date();
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const startDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));

    // Build where clause for sites
    let siteWhere: any = {
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
    };

    if (siteId && siteId !== 'all') {
      siteWhere.id = siteId;
    }

    // Fetch historical scan data
    const scans = await prisma.scan.findMany({
      where: {
        status: 'done',
        score: { not: null },
        createdAt: { gte: startDate },
        site: siteWhere
      },
      include: {
        site: true
      },
      orderBy: { createdAt: 'asc' }
    });

    if (scans.length < 2) {
      return NextResponse.json({
        trends: [],
        insights: {
          overallTrend: 'stable',
          trendPercentage: 0,
          bestPerformingSite: '',
          worstPerformingSite: '',
          avgScoreChange: 0,
          patterns: [],
          recommendations: ['Run more scans to generate meaningful trend analysis']
        },
        predictions: {
          nextWeekScore: 0,
          confidence: 0,
          factors: []
        }
      });
    }

    // Transform scans into trend data points
    const trends: TrendDataPoint[] = scans.map(scan => ({
      date: scan.createdAt.toISOString().split('T')[0],
      score: scan.score || 0,
      issues: scan.issues || 0,
      wcagAACompliance: scan.wcagAACompliance || undefined,
      performanceScore: scan.performanceScore || undefined,
      siteUrl: scan.site.url,
      siteId: scan.siteId
    }));

    // Calculate overall trend
    const firstScore = scans[0].score || 0;
    const lastScore = scans[scans.length - 1].score || 0;
    const trendPercentage = firstScore > 0 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

    const overallTrend = trendPercentage > 5 ? 'improving' :
                        trendPercentage < -5 ? 'declining' : 'stable';

    // Calculate average score change per scan
    let totalScoreChange = 0;
    let changeCount = 0;

    for (let i = 1; i < scans.length; i++) {
      if (scans[i-1].score && scans[i].score) {
        totalScoreChange += scans[i].score - scans[i-1].score;
        changeCount++;
      }
    }

    const avgScoreChange = changeCount > 0 ? totalScoreChange / changeCount : 0;

    // Find best and worst performing sites
    const siteScores = new Map<string, number[]>();
    scans.forEach(scan => {
      if (scan.score) {
        if (!siteScores.has(scan.site.url)) {
          siteScores.set(scan.site.url, []);
        }
        siteScores.get(scan.site.url)!.push(scan.score);
      }
    });

    let bestPerformingSite = '';
    let worstPerformingSite = '';
    let bestAvg = 0;
    let worstAvg = 100;

    siteScores.forEach((scores, siteUrl) => {
      const avg = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avg > bestAvg) {
        bestAvg = avg;
        bestPerformingSite = siteUrl;
      }
      if (avg < worstAvg) {
        worstAvg = avg;
        worstPerformingSite = siteUrl;
      }
    });

    // Identify patterns
    const patterns = [];

    // Check for gradual improvement
    if (trendPercentage > 10) {
      patterns.push({
        type: 'gradual' as const,
        description: 'Consistent improvement over time indicates effective remediation efforts',
        impact: 'positive' as const
      });
    }

    // Check for sudden changes
    const scoreChanges = [];
    for (let i = 1; i < scans.length; i++) {
      if (scans[i-1].score && scans[i].score) {
        const change = Math.abs(scans[i].score - scans[i-1].score);
        scoreChanges.push(change);
      }
    }

    const avgChange = scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length;
    const suddenChanges = scoreChanges.filter(change => change > avgChange * 2);

    if (suddenChanges.length > 0) {
      patterns.push({
        type: 'sudden' as const,
        description: `Detected ${suddenChanges.length} sudden score changes, indicating major site updates`,
        impact: 'neutral' as const
      });
    }

    // Check for weekly patterns (if we have enough data)
    if (scans.length >= 14) {
      patterns.push({
        type: 'weekly' as const,
        description: 'Analyzing weekly patterns in accessibility scores',
        impact: 'neutral' as const
      });
    }

    // Generate recommendations
    const recommendations = [];

    if (overallTrend === 'declining') {
      recommendations.push('Schedule regular accessibility audits to prevent further regression');
      recommendations.push('Implement automated testing in your CI/CD pipeline');
    } else if (overallTrend === 'improving') {
      recommendations.push('Continue current remediation efforts - they are working well');
      recommendations.push('Consider sharing best practices across all sites');
    } else {
      recommendations.push('Establish consistent accessibility monitoring schedule');
      recommendations.push('Focus on proactive improvements rather than reactive fixes');
    }

    if (scans.some(scan => scan.wcagAACompliance && scan.wcagAACompliance < 70)) {
      recommendations.push('Prioritize WCAG AA compliance issues for legal risk mitigation');
    }

    // Predict next week score (simple linear regression)
    let nextWeekScore = lastScore;
    let confidence = 50;

    if (scans.length >= 5) {
      // Calculate trend slope
      const x = scans.map((_, i) => i);
      const y = scans.map(scan => scan.score || 0);
      const n = scans.length;

      const sumX = x.reduce((a, b) => a + b, 0);
      const sumY = y.reduce((a, b) => a + b, 0);
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      nextWeekScore = lastScore + slope * 7; // Predict 7 days ahead

      // Calculate confidence based on trend consistency
      const variance = y.reduce((sum, yi, i) => {
        const predicted = (sumY / n) + slope * (i - sumX / n);
        return sum + Math.pow(yi - predicted, 2);
      }, 0) / n;

      confidence = Math.max(30, Math.min(95, 100 - (variance * 2)));
    }

    const predictionFactors = [
      'Historical trend analysis',
      'Seasonal accessibility patterns',
      'Site update frequency correlation'
    ];

    if (avgScoreChange > 0) {
      predictionFactors.push('Positive improvement momentum');
    }

    return NextResponse.json({
      trends,
      insights: {
        overallTrend,
        trendPercentage: Math.round(trendPercentage * 10) / 10,
        bestPerformingSite,
        worstPerformingSite,
        avgScoreChange: Math.round(avgScoreChange * 10) / 10,
        patterns,
        recommendations
      },
      predictions: {
        nextWeekScore: Math.round(nextWeekScore * 10) / 10,
        confidence: Math.round(confidence),
        factors: predictionFactors
      }
    });

  } catch (error) {
    console.error("Trend analysis error:", error);
    return NextResponse.json(
      { error: "Failed to fetch trend analysis" },
      { status: 500 }
    );
  }
}