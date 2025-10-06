import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreBadge } from "@/components/ScoreBadge";
import { IssuesByImpactChart } from "@/components/IssuesByImpactChart";
import { TopIssues } from "@/components/TopIssues";
import { ViolationsTable } from "@/components/ViolationsTable";
import { ExportBar } from "@/components/ExportBar";
import { StatCard } from "@/components/StatCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { DrawerDetails } from "@/components/DrawerDetails";
import { CopyButton } from "@/components/CopyButton";
import { KeyValue } from "@/components/KeyValue";
import { formatDate, getFaviconFromUrl, calculateDuration } from "@/lib/format";
import { computeIssueStats, Violation, getTopViolations } from "@/lib/axe-types";
import { Clock, Globe, Share, AlertTriangle, CheckCircle, Target, TrendingUp, Zap } from "lucide-react";
import { SiteImage } from "@/components/SiteImage";
import Link from "next/link";
import { cn } from "@/lib/utils";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { InteractiveHeatmap } from "@/components/enhanced/InteractiveHeatmap";
import { requireAuth } from "@/lib/auth";
import { EnhancedScanResults } from "@/components/EnhancedScanResults";
import {
  getScanTrendData,
  getBenchmarkComparison,
  getScanComparison,
  getViolationTrends,
  calculateWCAGCompliance
} from "@/lib/analytics";
import {
  ScoreTrendChart,
  IssuesTrendChart,
  BenchmarkChart,
  ViolationDistributionChart,
  ViolationTrendChart,
  ComparisonCard
} from "@/components/charts";

interface PageProps {
  params: {
    id: string;
  };
}

async function getScanDetails(id: string) {
  try {
    const scan = await prisma.scan.findUnique({
      where: { id },
      include: {
        site: {
          include: {
            user: true,
          },
        },
        page: true,
      },
    });

    return scan;
  } catch (error) {
    console.error("Failed to fetch scan:", error);
    return null;
  }
}

async function getEnhancedAnalytics(scan: any) {
  try {
    // Get trend data for the last 30 days
    const trendData = await getScanTrendData(
      scan.siteId,
      scan.pageId,
      30
    );

    // Get benchmark comparison
    const benchmarkComparison = await getBenchmarkComparison({
      score: scan.score || 0,
      impactCritical: scan.impactCritical,
      impactSerious: scan.impactSerious,
      impactModerate: scan.impactModerate,
      impactMinor: scan.impactMinor,
    });

    // Get scan comparison
    const scanComparison = await getScanComparison(scan.id);

    // Get violation trends
    const violationTrends = await getViolationTrends(
      scan.siteId,
      scan.pageId,
      30
    );

    return {
      trendData,
      benchmarkComparison,
      scanComparison,
      violationTrends,
    };
  } catch (error) {
    console.error("Failed to get enhanced analytics:", error);
    return {
      trendData: [],
      benchmarkComparison: null,
      scanComparison: {
        current: {
          score: scan.score || 0,
          issues: scan.issues || 0,
          critical: scan.impactCritical,
          serious: scan.impactSerious,
          moderate: scan.impactModerate,
          minor: scan.impactMinor
        }
      },
      violationTrends: [],
    };
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "done":
      return <Badge className="bg-success text-success-foreground border-success">{status}</Badge>;
    case "running":
      return <Badge className="bg-primary text-primary-foreground border-primary">{status}</Badge>;
    case "failed":
      return <Badge className="bg-critical text-critical-foreground border-critical">{status}</Badge>;
    case "queued":
    default:
      return <Badge className="bg-warning text-warning-foreground border-warning">{status}</Badge>;
  }
}

export default async function ScanDetailPage({ params }: PageProps) {
  // Get authenticated user
  const user = await requireAuth();

  const scan = await getScanDetails(params.id);

  if (!scan) {
    notFound();
  }

  // Extract violations from raw data
  let violations: Violation[] = [];
  let isEnhancedScan = false;
  let enhancedScanData = null;

  if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
    violations = (scan.raw as any).violations || [];

    // Check if this is an enhanced scan (has the additional categories)
    if ('keyboardNavigation' in (scan.raw as any) && 'screenReaderCompatibility' in (scan.raw as any)) {
      isEnhancedScan = true;
      enhancedScanData = scan.raw;
    }
  }

  const stats = computeIssueStats(violations);
  const topViolations = getTopViolations(violations, 5);
  const quickWins = violations.filter(v => {
    const isMinorOrModerate = !v.impact || ['minor', 'moderate'].includes(v.impact);
    const fewNodes = v.nodes.length <= 5;
    return isMinorOrModerate && fewNodes;
  }).slice(0, 5);

  const siteUrl = scan.page?.url || scan.site.url;
  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/scans/${scan.id}`;

  // Get enhanced analytics
  const analytics = await getEnhancedAnalytics(scan);

  // Calculate WCAG compliance
  const wcagAACompliance = (scan as any).wcagAACompliance || calculateWCAGCompliance(violations, "AA");
  const wcagAAACompliance = (scan as any).wcagAAACompliance || calculateWCAGCompliance(violations, "AAA");

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav user={user} />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground">
          Dashboard
        </Link>
        <span>/</span>
        <span>Scan Details</span>
      </div>

      {/* Header */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
              <SiteImage
                src={getFaviconFromUrl(siteUrl)}
                alt=""
                width={48}
                height={48}
                className="rounded-lg sm:rounded-xl sm:w-16 sm:h-16"
              />
              <div className="min-w-0 flex-1">
                <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 font-display text-lg sm:text-xl lg:text-2xl">
                  <span className="truncate">{new URL(siteUrl).hostname}</span>
                  {scan.score !== null && <ScoreBadge score={scan.score} size="lg" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 sm:mt-3 text-sm sm:text-base">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium truncate"
                  >
                    {siteUrl}
                  </a>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 self-start sm:self-auto">
              {getStatusBadge(scan.status)}
              <CopyButton text={shareUrl} size="sm">
                <Share className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Share</span>
              </CopyButton>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 sm:pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title="Total Issues"
              value={stats.total}
              subtitle="Found in this scan"
              iconName="AlertTriangle"
              variant={stats.critical > 0 ? "critical" : stats.serious > 0 ? "warning" : "default"}
            />
            
            <StatCard
              title="Critical Issues"
              value={stats.critical}
              subtitle="Require immediate fix"
              iconName="AlertTriangle"
              variant="critical"
            />
            
            <StatCard
              title="Quick Wins"
              value={quickWins.length}
              subtitle="Easy fixes available"
              iconName="Zap"
              variant="success"
            />
            
            <StatCard
              title="Scan Duration"
              value={calculateDuration(scan.createdAt)}
              subtitle={formatDate(scan.createdAt)}
              iconName="Clock"
              variant="default"
            />
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Tabs defaultValue={isEnhancedScan ? "enhanced" : "overview"} className="w-full">
            <div className="overflow-x-auto">
              <TabsList className={`grid w-full min-w-max ${isEnhancedScan ? 'grid-cols-6' : 'grid-cols-5'} md:min-w-0`}>
                {isEnhancedScan && (
                  <TabsTrigger value="enhanced" className="text-xs sm:text-sm">🚀 Enhanced</TabsTrigger>
                )}
                <TabsTrigger value="overview" className="text-xs sm:text-sm">Overview</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs sm:text-sm">🗺️ Heatmap</TabsTrigger>
                <TabsTrigger value="analytics" className="text-xs sm:text-sm">Analytics</TabsTrigger>
                <TabsTrigger value="violations" className="text-xs sm:text-sm">Violations</TabsTrigger>
                <TabsTrigger value="raw" className="text-xs sm:text-sm">Raw JSON</TabsTrigger>
              </TabsList>
            </div>

            {isEnhancedScan && enhancedScanData && (
              <TabsContent value="enhanced" className="mt-6">
                <EnhancedScanResults
                  result={enhancedScanData as any}
                  url={siteUrl}
                />
              </TabsContent>
            )}

            <TabsContent value="overview" className="space-y-6 mt-6">
              {/* Severity Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Severity Breakdown
                  </CardTitle>
                  <CardDescription>
                    Distribution of issues by severity level
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center space-y-2">
                      <SeverityBadge severity="critical" count={stats.critical} />
                      <p className="text-2xl font-bold font-display text-critical">{stats.critical}</p>
                    </div>
                    <div className="text-center space-y-2">
                      <SeverityBadge severity="serious" count={stats.serious} />
                      <p className="text-2xl font-bold font-display text-serious">{stats.serious}</p>
                    </div>
                    <div className="text-center space-y-2">
                      <SeverityBadge severity="moderate" count={stats.moderate} />
                      <p className="text-2xl font-bold font-display text-moderate">{stats.moderate}</p>
                    </div>
                    <div className="text-center space-y-2">
                      <SeverityBadge severity="minor" count={stats.minor} />
                      <p className="text-2xl font-bold font-display text-minor">{stats.minor}</p>
                    </div>
                  </div>
                  <IssuesByImpactChart stats={stats} className="h-48" />
                </CardContent>
              </Card>

              {/* Top Issues */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <Target className="w-5 h-5 text-primary" />
                    Top Priority Issues
                  </CardTitle>
                  <CardDescription>
                    Most critical accessibility violations that need immediate attention
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TopIssues 
                    violations={violations} 
                    limit={5}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="heatmap" className="mt-6">
              <InteractiveHeatmap
                violations={violations}
                websiteUrl={siteUrl}
                className="min-h-[600px]"
              />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6 mt-6">
              {/* WCAG Compliance */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <CheckCircle className="w-5 h-5 text-primary" />
                    WCAG Compliance
                  </CardTitle>
                  <CardDescription>
                    Compliance with Web Content Accessibility Guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{wcagAACompliance}%</div>
                      <div className="text-sm font-medium text-muted-foreground">WCAG 2.1 AA</div>
                    </div>
                    <div className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl font-bold text-purple-600 mb-1">{wcagAAACompliance}%</div>
                      <div className="text-sm font-medium text-muted-foreground">WCAG 2.1 AAA</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Scan Comparison */}
              <ComparisonCard comparison={analytics.scanComparison} />

              {/* Benchmark Comparison */}
              {analytics.benchmarkComparison && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <Target className="w-5 h-5 text-primary" />
                      Industry Benchmark
                    </CardTitle>
                    <CardDescription>
                      How your site compares to industry averages
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BenchmarkChart
                      comparison={analytics.benchmarkComparison}
                      height={250}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Violation Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 font-display">
                    <AlertTriangle className="w-5 h-5 text-primary" />
                    Issues Distribution
                  </CardTitle>
                  <CardDescription>
                    Visual breakdown of accessibility issues by severity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ViolationDistributionChart
                    data={{
                      critical: stats.critical,
                      serious: stats.serious,
                      moderate: stats.moderate,
                      minor: stats.minor
                    }}
                    height={300}
                  />
                </CardContent>
              </Card>

              {/* Historical Trends */}
              {analytics.trendData.length > 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display">
                        <TrendingUp className="w-5 h-5 text-primary" />
                        Score Trend
                      </CardTitle>
                      <CardDescription>
                        Accessibility score over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ScoreTrendChart
                        data={analytics.trendData}
                        height={250}
                        showLegend={false}
                      />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 font-display">
                        <Zap className="w-5 h-5 text-primary" />
                        Issues Trend
                      </CardTitle>
                      <CardDescription>
                        Issue counts by severity over time
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <IssuesTrendChart
                        data={analytics.trendData}
                        height={250}
                        showLegend={true}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Violation Trends */}
              {analytics.violationTrends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 font-display">
                      <AlertTriangle className="w-5 h-5 text-primary" />
                      Violation Trends
                    </CardTitle>
                    <CardDescription>
                      Track specific accessibility rule violations over time
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ViolationTrendChart
                      violations={analytics.violationTrends}
                      height={350}
                      maxRules={6}
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="violations" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="font-display">All Violations ({violations.length})</CardTitle>
                  <CardDescription>
                    Complete list of accessibility issues found during the scan
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ViolationsTable violations={violations} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="raw" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Raw JSON Data</CardTitle>
                  <CardDescription>
                    Complete axe-core scan results in JSON format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <CopyButton 
                      text={JSON.stringify(scan.raw, null, 2)}
                      className="absolute top-2 right-2 z-10"
                    />
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                      <code>{JSON.stringify(scan.raw, null, 2)}</code>
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Export Bar */}
          <ExportBar scanId={scan.id} />
          {/* Quick Wins */}
          {quickWins.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <CheckCircle className="w-5 h-5 text-success" />
                  Quick Wins
                </CardTitle>
                <CardDescription>
                  Easy fixes that can improve your score quickly
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickWins.map((violation) => (
                    <DrawerDetails 
                      key={violation.id}
                      violation={violation}
                      trigger={
                        <Button
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 text-left"
                        >
                          <div>
                            <div className="font-medium text-sm mb-1">
                              {violation.help}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {violation.nodes.length} element{violation.nodes.length !== 1 ? 's' : ''}
                            </div>
                          </div>
                        </Button>
                      }
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scan Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <Clock className="w-5 h-5 text-primary" />
                Scan Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <KeyValue
                items={[
                  {
                    key: "Scan ID",
                    value: (
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {scan.id.slice(-8)}
                      </code>
                    ),
                  },
                  {
                    key: "User",
                    value: scan.site.user?.email || "Anonymous",
                  },
                  {
                    key: "Created",
                    value: formatDate(scan.createdAt),
                  },
                  {
                    key: "Site URL",
                    value: (
                      <a
                        href={scan.site.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        {new URL(scan.site.url).hostname}
                      </a>
                    ),
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </div>
  );
}