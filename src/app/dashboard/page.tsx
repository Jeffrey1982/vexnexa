// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { IssuesByImpactChart } from "@/components/IssuesByImpactChart";
import { TrendMini } from "@/components/TrendMini";
import { formatDate, formatDateShort, getFaviconFromUrl } from "@/lib/format";
import { computeIssueStats, Violation } from "@/lib/axe-types";
import { Search, Plus, Activity, AlertTriangle, TrendingUp, Users, Shield, FileText, Clock } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { NewScanForm } from "./NewScanForm";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { ProgressAnimations } from "@/components/enhanced/ProgressAnimations";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { InteractiveHeatmap } from "@/components/enhanced/InteractiveHeatmap";
import { BeforeAfterComparison } from "@/components/enhanced/BeforeAfterComparison";
import { DragDropDashboard } from "@/components/enhanced/DragDropDashboard";
import { TrendAnalysis } from "@/components/enhanced/TrendAnalysis";
import { CompetitorBenchmark } from "@/components/enhanced/CompetitorBenchmark";
import { MonitoringDashboard } from "@/components/monitoring/MonitoringDashboard";
import { ROICalculator } from "@/components/enhanced/ROICalculator";
import { ExecutiveSummary } from "@/components/enhanced/ExecutiveSummary";
import { RemediationMatrix } from "@/components/enhanced/RemediationMatrix";
import { MultiFormatExporter } from "@/components/enhanced/MultiFormatExporter";
import { ExportButtons } from "@/components/ExportButtons";
import { AIInsights } from "@/components/enhanced/AIInsights";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getEntitlements } from "@/lib/billing/entitlements";
import { ENTITLEMENTS } from "@/lib/billing/plans";

async function getRecentScans(userId: string) {
  try {
    const scans = await prisma.scan.findMany({
      where: {
        site: {
          userId: userId,
        },
      },
      include: {
        site: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    // Serialize dates to strings for client components
    return scans.map(scan => {
      const { site, ...scanData } = scan;
      return {
        ...scanData,
        createdAt: scan.createdAt.toISOString(),
        site: {
          id: site.id,
          url: site.url,
          userId: site.userId,
          portfolioId: site.portfolioId,
          createdAt: site.createdAt.toISOString(),
        }
      };
    });
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return [];
  }
}

async function getDashboardStats(userId: string) {
  try {
    const lastTenScans = await prisma.scan.findMany({
      where: {
        status: "done",
        score: { not: null },
        site: {
          userId: userId,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    const avgScore = lastTenScans.length > 0 
      ? Math.round(lastTenScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / lastTenScans.length)
      : 0;

    // Get trend data for mini chart
    const trendData = lastTenScans.slice().reverse().map((scan) => ({
      date: formatDateShort(scan.createdAt),
      score: scan.score || 0,
    }));

    // Aggregate impact statistics from recent scans
    const allViolations: Violation[] = [];
    lastTenScans.forEach((scan) => {
      if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
        const violations = (scan.raw as any).violations || [];
        allViolations.push(...violations);
      }
    });

    const impactStats = computeIssueStats(allViolations);

    return {
      avgScore,
      trendData,
      impactStats,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      avgScore: 0,
      trendData: [],
      impactStats: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
    };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "done":
      return "bg-green-100 text-green-800";
    case "running":
      return "bg-blue-100 text-blue-800";
    case "failed":
      return "bg-red-100 text-red-800";
    case "queued":
    default:
      return "bg-yellow-100 text-yellow-800";
  }
}

function EmptyState() {
  return (
    <Card className="text-center py-12">
      <CardContent>
        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
        <p className="text-muted-foreground mb-4">
          Get started by scanning your first website for accessibility issues.
        </p>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  // Get translations
  const t = await getTranslations('dashboard');
  const tCommon = await getTranslations('common');

  // Require authentication to access dashboard
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // Try to get data from database, fallback to empty data if user doesn't exist in DB
  let scans: any[] = [];
  let stats: any = {
    totalScans: 0,
    avgScore: 0,
    totalIssues: 0,
    criticalIssues: 0,
    totalSites: 0,
    hasScans: false,
    trendData: [],
    impactStats: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }
  };

  try {
    [scans, stats] = await Promise.all([
      getRecentScans(user.id),
      getDashboardStats(user.id),
    ]);
  } catch (error) {
    console.log("User not found in database, using empty data:", error);
    // Keep default empty data for new users who only exist in Supabase
  }

  // Check if user has white label access
  const userEntitlements = getEntitlements(user.plan as keyof typeof ENTITLEMENTS);
  const hasWhiteLabelAccess = userEntitlements.whiteLabel;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">


      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight">{t('title')}</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
            {t('subtitle')}
          </p>
        </div>
        <div className="self-end sm:self-auto">
          <ThemeToggle />
        </div>
      </div>

      {/* New Scan Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            {t('newScan.title')}
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('newScan.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <NewScanForm />
        </CardContent>
      </Card>

      {/* Enhanced Dashboard with Tabs */}
      <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto">
          <TabsList className={`grid w-full min-w-max ${hasWhiteLabelAccess ? 'grid-cols-7' : 'grid-cols-6'} md:min-w-0`}>
            <TabsTrigger value="overview" className="text-xs sm:text-sm">{t('tabs.overview')}</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">{t('tabs.analytics')}</TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm">{t('tabs.monitoring')}</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm">{t('tabs.teams')}</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">{t('tabs.reports')}</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs sm:text-sm">{t('tabs.tools')}</TabsTrigger>
            {hasWhiteLabelAccess && (
              <TabsTrigger value="white-label" className="text-xs sm:text-sm">{t('tabs.whiteLabel')}</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Animated Stats Cards */}
          <ProgressAnimations
            score={stats.avgScore || 0}
            issues={stats.impactStats || { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }}
          />

          {/* Simple Stats Card as fallback */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                {t('stats.title')}
              </CardTitle>
              <CardDescription>
                {t('stats.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('stats.averageScore')}</p>
                  <p className="text-3xl font-bold text-primary">{stats.avgScore}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('stats.totalIssues')}</p>
                  <p className="text-3xl font-bold text-foreground">{stats.impactStats.total}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('stats.critical')}</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">{stats.impactStats.critical}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">{t('stats.serious')}</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{stats.impactStats.serious}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* {t('teams.title')} Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Users className="w-5 h-5 text-primary" />
                Team Collaboration
              </CardTitle>
              <CardDescription className="text-base">
                {t('teams.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('teams.available')}</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {t('teams.availableDescription')}
                </p>
                <Link href="/teams">
                  <Button className="mb-4 bg-[#FF7A00] hover:bg-[#FF7A00]/90">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('teams.goToTeams')}
                  </Button>
                </Link>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 max-w-2xl mx-auto">
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">{t('teams.roleBasedAccess.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('teams.roleBasedAccess.description')}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">{t('teams.issueTracking.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('teams.issueTracking.description')}</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">{t('teams.sharedWorkspaces.title')}</h4>
                    <p className="text-xs text-muted-foreground">{t('teams.sharedWorkspaces.description')}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Issues by Impact Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <AlertTriangle className="w-5 h-5 text-primary" />
                {t('analytics.issuesByImpact.title')}
              </CardTitle>
              <CardDescription>
                {t('analytics.issuesByImpact.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <IssuesByImpactChart stats={stats.impactStats} className="h-64" />
            </CardContent>
          </Card>

          {/* Trend Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.trendAnalysis.title')}</CardTitle>
              <CardDescription>{t('analytics.trendAnalysis.description')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>{t('analytics.trendAnalysis.noData')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Monitoring Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {t('monitoring.title')}
              </CardTitle>
              <CardDescription>
                {t('monitoring.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Monitoring Status */}
                <div className="text-center py-8 border rounded-lg bg-muted/30">
                  <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('monitoring.comingSoon')}</h3>
                  <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                    {t('monitoring.comingSoonDescription')}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                    <Button asChild variant="outline" className="border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white">
                      <Link href="/settings/notifications">
                        <Activity className="w-4 h-4 mr-2" />
                        {t('monitoring.configureNotifications')}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="border-[#FF7A00] text-[#FF7A00] hover:bg-[#FF7A00] hover:text-white">
                      <Link href="/settings/billing">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        {t('monitoring.upgradePlan')}
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Monitoring Features Preview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold">{t('monitoring.scheduledScans.title')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('monitoring.scheduledScans.description')}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      <h4 className="font-semibold">{t('monitoring.instantAlerts.title')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('monitoring.instantAlerts.description')}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold">{t('monitoring.trendTracking.title')}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t('monitoring.trendTracking.description')}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Recent {t('reports.title')} */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <FileText className="w-5 h-5 text-primary" />
                Scan Reports
              </CardTitle>
              <CardDescription className="text-base">
                {t('reports.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('reports.noReports')}</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {t('reports.noReportsDescription')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('reports.selectScan')}
                  </p>
                  <div className="grid gap-3">
                    {scans.slice(0, 10).map((scan) => (
                      <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <SiteImage
                            src={getFaviconFromUrl(scan.site.url)}
                            alt=""
                            width={20}
                            height={20}
                            className="rounded flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {new URL(scan.site.url).hostname}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatDate(scan.createdAt)} • {scan.issues || 0} {tCommon('issues')}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {scan.score !== null && (
                            <ScoreBadge score={scan.score} size="sm" />
                          )}
                          {scan.status === 'done' ? (
                            <ExportButtons scanId={scan.id} className="flex-shrink-0" />
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              {scan.status}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-6">
          {/* ROI Calculator */}
          <ROICalculator />

          {/* Additional Tools */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {t('tools.title')}
              </CardTitle>
              <CardDescription>
                {t('tools.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <h4 className="font-semibold mb-2">{t('tools.wcagGuidelines.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('tools.wcagGuidelines.description')}
                  </p>
                </div>
                <div className="p-4 border rounded-lg hover:border-primary transition-colors">
                  <h4 className="font-semibold mb-2">{t('tools.quickFixes.title')}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('tools.quickFixes.description')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* White Label Tab - Only for Business Plan Users */}
        {hasWhiteLabelAccess && (
          <TabsContent value="white-label" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">WL</span>
                  </div>
                  {t('whiteLabel.title')}
                </CardTitle>
                <CardDescription className="text-base">
                  {t('whiteLabel.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Access Links */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  <Link href="/settings/white-label" className="group sm:col-span-2 lg:col-span-1">
                    <div className="border rounded-lg p-3 sm:p-4 hover:border-blue-500 transition-colors">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm sm:text-base">⚙️</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-blue-600">{t('whiteLabel.fullSettings')}</h3>
                          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">{t('whiteLabel.fullSettingsDescription')}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{t('whiteLabel.fullSettingsDetails')}</p>
                    </div>
                  </Link>

                  <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm sm:text-base">📱</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">{t('whiteLabel.livePreview')}</h3>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">{t('whiteLabel.livePreviewDescription')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('whiteLabel.livePreviewDetails')}</p>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm sm:text-base">📈</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">{t('whiteLabel.customReports')}</h3>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-600 dark:text-gray-400">{t('whiteLabel.customReportsDescription')}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{t('whiteLabel.customReportsDetails')}</p>
                  </div>
                </div>

                {/* White Label Features Overview */}
                <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">🎨 {t('whiteLabel.featuresTitle')}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.logo')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.colors')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.contact')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.removeBranding')}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.footerText')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.subdomain')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📞</span>
                        <span>{t('whiteLabel.features.customDomain')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>{t('whiteLabel.features.brandedReports')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Call to Action */}
                <div className="text-center">
                  <Link
                    href="/settings/white-label"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    🎨 {t('whiteLabel.customize')}
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
      

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg sm:text-xl">{t('recentScans.title')}</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {t('recentScans.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Mobile Card Layout */}
              <div className="block sm:hidden space-y-3">
                {scans.map((scan) => (
                  <Link key={scan.id} href={`/scans/${scan.id}`}>
                    <Card className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <SiteImage
                            src={getFaviconFromUrl(scan.site.url)}
                            alt=""
                            width={16}
                            height={16}
                            className="rounded flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-sm truncate">
                              {new URL(scan.site.url).hostname}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {scan.site.url}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          {scan.score !== null ? (
                            <ScoreBadge score={scan.score} size="sm" />
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={scan.status === 'done' ? 'default' : 'outline'}
                            className={cn(
                              "text-xs",
                              scan.status === 'done' && 'bg-success text-success-foreground',
                              scan.status === 'failed' && 'bg-critical text-critical-foreground',
                              scan.status === 'running' && 'bg-primary text-primary-foreground'
                            )}
                          >
                            {scan.status}
                          </Badge>
                          <span className="text-muted-foreground">
                            {scan.issues || 0} {tCommon('issues')}
                          </span>
                        </div>
                        <span className="text-muted-foreground">
                          {formatDateShort(scan.createdAt)}
                        </span>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>

              {/* Desktop Table Layout */}
              <div className="hidden sm:block rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('recentScans.tableHeaders.site')}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t('recentScans.tableHeaders.url')}</TableHead>
                      <TableHead>{t('recentScans.tableHeaders.score')}</TableHead>
                      <TableHead>{t('recentScans.tableHeaders.status')}</TableHead>
                      <TableHead>{t('recentScans.tableHeaders.issues')}</TableHead>
                      <TableHead>{t('recentScans.tableHeaders.date')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scans.map((scan) => (
                      <TableRow key={scan.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell>
                          <Link href={`/scans/${scan.id}`} className="flex items-center gap-2">
                            <SiteImage
                              src={getFaviconFromUrl(scan.site.url)}
                              alt=""
                              width={16}
                              height={16}
                              className="rounded"
                            />
                            <span className="font-medium truncate max-w-32">
                              {new URL(scan.site.url).hostname}
                            </span>
                          </Link>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <Link href={`/scans/${scan.id}`} className="text-blue-600 hover:text-blue-800 truncate max-w-48 block">
                            {scan.site.url}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/scans/${scan.id}`}>
                            {scan.score !== null ? (
                              <ScoreBadge score={scan.score} size="sm" />
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/scans/${scan.id}`}>
                            <Badge
                              variant={scan.status === 'done' ? 'default' : 'outline'}
                              className={cn(
                                scan.status === 'done' && 'bg-success text-success-foreground',
                                scan.status === 'failed' && 'bg-critical text-critical-foreground',
                                scan.status === 'running' && 'bg-primary text-primary-foreground'
                              )}
                            >
                              {scan.status}
                            </Badge>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/scans/${scan.id}`}>
                            <span className="font-medium">{scan.issues || 0}</span>
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Link href={`/scans/${scan.id}`} className="text-muted-foreground text-sm">
                            {formatDate(scan.createdAt)}
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}// Force deployment Wed, Sep 24, 2025  6:21:38 PM
