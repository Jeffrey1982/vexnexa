import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAuth } from "@/lib/auth";
import { getScanTrendData, getViolationTrends } from "@/lib/analytics";
import { computeIssueStats, getTopViolations } from "@/lib/axe-types";
import { EnhancedScoreTrends } from "@/components/charts/EnhancedScoreTrends";
import { SeverityHeatmap } from "@/components/charts/SeverityHeatmap";
import { TopFailingRulesDashboard } from "@/components/charts/TopFailingRulesDashboard";
import { CompetitiveAnalysis } from "@/components/charts/CompetitiveAnalysis";
import { BarChart3, Calendar, AlertTriangle, Trophy, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default async function AnalyticsPage() {
  let user;
  try {
    user = await getCurrentUser();
  } catch {
    redirect("/auth/login?redirect=/analytics");
  }

  if (!user) {
    redirect("/auth/login");
  }

  let sites: any[] = [];
  let allScans: any[] = [];

  try {
    // Get user's sites and recent scans
    sites = await prisma.site.findMany({
      where: { userId: user.id },
      include: {
        scans: {
          where: { status: "done" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            score: true,
            impactCritical: true,
            impactSerious: true,
            impactModerate: true,
            impactMinor: true,
            issues: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // Get all scans for analytics
    allScans = await prisma.scan.findMany({
      where: {
        siteId: { in: sites.map(s => s.id) },
        status: "done"
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        site: {
          select: { url: true }
        }
      }
    });
  } catch (error) {
    console.error('Database connection failed for analytics:', error);
    // Return empty data if database is unavailable
    // Users will see "No data available" message instead of mock data
    sites = [];
    allScans = [];
  }

  // Prepare analytics data
  const trendData = allScans.map(scan => ({
    date: scan.createdAt.toISOString().split('T')[0],
    score: scan.score || 0,
    issues: scan.issues || 0,
    critical: scan.impactCritical,
    serious: scan.impactSerious,
    moderate: scan.impactModerate,
    minor: scan.impactMinor
  }));

  // Get all violations for analysis
  const allViolations: any[] = [];
  for (const scan of allScans) {
    if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
      const violations = (scan.raw as any).violations || [];
      allViolations.push(...violations);
    }
  }

  // Calculate overall statistics
  const totalScans = allScans.length;
  const avgScore = totalScans > 0 ? Math.round(allScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / totalScans) : 0;
  const totalIssues = allScans.reduce((sum, scan) => sum + (scan.issues || 0), 0);

  const recentScan = allScans[0];
  const userScore = recentScan?.score || 0;
  const userIssues = {
    critical: recentScan?.impactCritical || 0,
    serious: recentScan?.impactSerious || 0,
    moderate: recentScan?.impactModerate || 0,
    minor: recentScan?.impactMinor || 0
  };

  // Calculate month-over-month change
  const thisMonth = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  const thisMonthScans = allScans.filter(scan =>
    scan.createdAt >= lastMonth && scan.createdAt <= thisMonth
  );
  const lastMonthScans = allScans.filter(scan => {
    const twoMonthsAgo = new Date(lastMonth);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 1);
    return scan.createdAt >= twoMonthsAgo && scan.createdAt < lastMonth;
  });

  const thisMonthAvg = thisMonthScans.length > 0
    ? Math.round(thisMonthScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / thisMonthScans.length)
    : 0;
  const lastMonthAvg = lastMonthScans.length > 0
    ? Math.round(lastMonthScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / lastMonthScans.length)
    : 0;

  const monthlyChange = thisMonthAvg - lastMonthAvg;

  if (totalScans === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-600 dark:text-gray-400" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 mb-8">
            Run some accessibility scans to see detailed analytics and insights
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start Scanning
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive accessibility insights and competitive analysis
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Average Score</div>
              <div className="text-3xl font-bold text-blue-600">{avgScore}</div>
              <div className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">out of 100</div>
            </div>
            <TrendingUp className="w-10 h-10 text-blue-600" />
          </div>
          {monthlyChange !== 0 && (
            <div className="mt-3 text-sm">
              <span className={monthlyChange > 0 ? 'text-green-600' : 'text-red-600'}>
                {monthlyChange > 0 ? '+' : ''}{monthlyChange} points
              </span>
              <span className="text-gray-700 dark:text-gray-600 dark:text-gray-400 ml-1">vs last month</span>
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Total Scans</div>
              <div className="text-3xl font-bold text-green-600">{totalScans}</div>
              <div className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">accessibility scans</div>
            </div>
            <BarChart3 className="w-10 h-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Total Issues</div>
              <div className="text-3xl font-bold text-orange-600">{totalIssues}</div>
              <div className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">violations found</div>
            </div>
            <AlertTriangle className="w-10 h-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-600">Sites Tracked</div>
              <div className="text-3xl font-bold text-purple-600">{sites.length}</div>
              <div className="text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">websites monitored</div>
            </div>
            <Users className="w-10 h-10 text-purple-600" />
          </div>
        </div>
      </div>

      {/* High Impact Feature 1: Enhanced Score Trends */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Accessibility Score Trends</h2>
            <p className="text-gray-600">Track performance over time with predictive insights</p>
          </div>
        </div>
        <EnhancedScoreTrends data={trendData} />
      </div>

      {/* High Impact Feature 2: Issue Severity Heatmap */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Activity Heatmap</h2>
            <p className="text-gray-600">Visual calendar of scan activity and performance streaks</p>
          </div>
        </div>
        <SeverityHeatmap data={trendData} />
      </div>

      {/* High Impact Feature 3: Top Failing Rules */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Top Failing Rules</h2>
            <p className="text-gray-600">Most frequent violations with actionable fix recommendations</p>
          </div>
        </div>
        <TopFailingRulesDashboard violations={allViolations} />
      </div>

      {/* High Impact Feature 4: Competitive Analysis */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Trophy className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Competitive Analysis</h2>
            <p className="text-gray-600">Market positioning and competitive benchmarking</p>
          </div>
        </div>
        <CompetitiveAnalysis
          userScore={userScore}
          userIssues={userIssues}
          industry="ecommerce"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard"
            className="flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <BarChart3 className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-medium">Run New Scan</span>
          </Link>
          <Link
            href="/advanced-analytics"
            className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all transform hover:scale-105"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            <span className="font-medium">Advanced Analytics</span>
          </Link>
          <Link
            href="/settings/billing"
            className="flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <span className="font-medium">Upgrade Plan</span>
          </Link>
          <Link
            href="/settings/white-label"
            className="flex items-center justify-center px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow"
          >
            <Trophy className="w-5 h-5 text-purple-600 mr-2" />
            <span className="font-medium">White-label Settings</span>
          </Link>
        </div>
      </div>
    </div>
  );
}