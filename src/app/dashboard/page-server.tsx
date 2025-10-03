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
import { Search, Plus, Activity, AlertTriangle, TrendingUp, Users, Shield, FileText } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { NewScanForm } from "./NewScanForm";
import { cn } from "@/lib/utils";
import { redirect } from "next/navigation";
import BrandedHeader from "@/components/white-label/BrandedHeader";
import BrandedFooter from "@/components/white-label/BrandedFooter";
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
        site: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });

    return scans;
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
    hasScans: false
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
    <div className="min-h-screen bg-gray-50">
      <BrandedHeader />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">


      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mt-1 sm:mt-2">
            Monitor your website accessibility scans and improvements
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
            New Accessibility Scan
          </CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Voer een URL in voor een 100% uitgebreide toegankelijkheidsscan met 8 extra categorieën
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
            <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
            <TabsTrigger value="monitoring" className="text-xs sm:text-sm">Monitoring</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs sm:text-sm">Teams</TabsTrigger>
            <TabsTrigger value="reports" className="text-xs sm:text-sm">Reports</TabsTrigger>
            <TabsTrigger value="tools" className="text-xs sm:text-sm">Tools</TabsTrigger>
            {hasWhiteLabelAccess && (
              <TabsTrigger value="white-label" className="text-xs sm:text-sm">White Label</TabsTrigger>
            )}
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          {/* Animated Stats Cards */}
          <ProgressAnimations
            score={stats.avgScore}
            issues={stats.impactStats}
          />

          {/* Interactive Heatmap - Featured on Overview */}
          {scans.length > 0 ? (
            <InteractiveHeatmap
              violations={(scans[0].raw as any)?.violations || []}
              websiteUrl={scans[0].site.url}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🗺️ Interactive Accessibility Heatmap
                </CardTitle>
                <CardDescription>
                  Visualize accessibility issues directly on your website screenshots
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-8">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📸</div>
                  <h3 className="text-lg font-semibold mb-2">Real Website Heatmaps</h3>
                  <p className="text-muted-foreground mb-4">
                    See exactly where accessibility issues are located on your actual website with interactive heatmap overlays.
                  </p>
                  <div className="text-sm text-blue-600 mb-6">
                    ✨ Features real screenshots + precise DOM element mapping
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Run your first accessibility scan above to see the interactive heatmap in action!
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Drag and Drop Dashboard */}
          <DragDropDashboard />
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          {/* Team Collaboration Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <Users className="w-5 h-5 text-primary" />
                Team Collaboration
              </CardTitle>
              <CardDescription className="text-base">
                Collaborate with your team on accessibility projects and share insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Team Features Available</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Invite team members, assign roles, track issues, and collaborate on accessibility improvements.
                </p>
                <Link href="/teams">
                  <Button className="mb-4">
                    <Plus className="w-4 h-4 mr-2" />
                    Go to Teams
                  </Button>
                </Link>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 max-w-2xl mx-auto">
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">Role-Based Access</h4>
                    <p className="text-xs text-muted-foreground">Admin, Editor, Viewer permissions</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">Issue Tracking</h4>
                    <p className="text-xs text-muted-foreground">Assign and track accessibility issues</p>
                  </div>
                  <div className="text-center p-3 sm:p-4 border rounded-lg">
                    <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-xs sm:text-sm">Shared Workspaces</h4>
                    <p className="text-xs text-muted-foreground">Collaborate on multiple sites</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Interactive Heatmap for latest scan */}
          <InteractiveHeatmap
            violations={(scans.length > 0 && scans[0].raw) ? (scans[0].raw as any)?.violations || [] : []}
            websiteUrl={scans[0]?.site?.url || 'https://example.com'}
          />

          {/* Issues by Impact Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <AlertTriangle className="w-5 h-5 text-primary" />
                Issues by Impact Level
              </CardTitle>
              <CardDescription>
                Distribution of accessibility issues across severity levels
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <IssuesByImpactChart stats={stats.impactStats} className="h-64" />
            </CardContent>
          </Card>

          {/* Competitor Benchmark */}
          <CompetitorBenchmark currentScore={stats.avgScore} websiteUrl={scans[0]?.site?.url || ''} />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Real-time Monitoring Dashboard */}
          <MonitoringDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          {/* Recent Scan Reports */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-xl">
                <FileText className="w-5 h-5 text-primary" />
                Scan Reports
              </CardTitle>
              <CardDescription className="text-base">
                Download detailed accessibility reports for your scans
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scans.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Run your first accessibility scan to generate downloadable reports.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground mb-4">
                    Select a scan to download its detailed accessibility report:
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
                              {formatDate(scan.createdAt)} • {scan.issues || 0} issues
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
          {/* AI-Powered Insights */}
          {scans.length > 0 && scans[0].raw && (
            <AIInsights
              violations={(scans[0].raw as any)?.violations || []}
              currentScore={stats.avgScore}
              trend={stats.trendData.length >= 2 ?
                stats.trendData[stats.trendData.length - 1]?.score - stats.trendData[stats.trendData.length - 2]?.score :
                undefined
              }
            />
          )}

          {/* ROI Calculator */}
          <ROICalculator />

          {/* Interactive Heatmap for latest scan */}
          {scans.length > 0 && scans[0].raw && (
            <InteractiveHeatmap
              violations={(scans[0].raw as any)?.violations || []}
              websiteUrl={scans[0].site.url}
            />
          )}
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
                  White Label Management
                </CardTitle>
                <CardDescription className="text-base">
                  Customize your brand appearance, logo, colors, and contact information for your Business plan.
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
                          <h3 className="font-semibold text-sm sm:text-base text-gray-900 group-hover:text-blue-600">Full Settings</h3>
                          <p className="text-xs sm:text-sm text-gray-500">Complete white-label configuration</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">Logo, colors, contact info, domain settings</p>
                    </div>
                  </Link>

                  <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-semibold text-sm sm:text-base">📱</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Live Preview</h3>
                        <p className="text-xs sm:text-sm text-gray-500">See your customizations</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Your site already shows your branding!</p>
                  </div>

                  <div className="border rounded-lg p-3 sm:p-4 bg-gray-50">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm sm:text-base">📈</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900">Custom Reports</h3>
                        <p className="text-xs sm:text-sm text-gray-500">Branded PDF exports</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400">Available - Generate reports with your branding</p>
                  </div>
                </div>

                {/* White Label Features Overview */}
                <div className="border rounded-lg p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-50">
                  <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🎨 Your White Label Features</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Custom company logo & favicon</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Brand colors (primary, secondary, accent)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Custom contact information</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Remove &quot;Powered by TutusPorta&quot;</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Custom footer text</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Subdomain (yourcompany.tutusporta.com)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📞</span>
                        <span>Custom domain (contact support)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        <span>Branded PDF reports</span>
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
                    🎨 Customize Your Brand
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
          <CardTitle className="font-display text-lg sm:text-xl">Recent Scans</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Your latest accessibility scans and their results
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
                            {scan.issues || 0} issues
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
                      <TableHead>Site</TableHead>
                      <TableHead className="hidden lg:table-cell">URL</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Issues</TableHead>
                      <TableHead>Date</TableHead>
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
      <BrandedFooter />
    </div>
  );
}// Force deployment Wed, Sep 24, 2025  6:21:38 PM
