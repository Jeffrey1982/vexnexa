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
  const scan = await getScanDetails(params.id);

  if (!scan) {
    notFound();
  }

  // Extract violations from raw data
  let violations: Violation[] = [];
  if (scan.raw && typeof scan.raw === 'object' && 'violations' in scan.raw) {
    violations = (scan.raw as any).violations || [];
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

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
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
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <SiteImage
                src={getFaviconFromUrl(siteUrl)}
                alt=""
                width={64}
                height={64}
                className="rounded-xl"
              />
              <div>
                <CardTitle className="flex items-center gap-3 font-display text-2xl">
                  <span>{new URL(siteUrl).hostname}</span>
                  {scan.score !== null && <ScoreBadge score={scan.score} size="lg" />}
                </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-3 text-base">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={siteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    {siteUrl}
                  </a>
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {getStatusBadge(scan.status)}
              <CopyButton text={shareUrl} size="sm">
                <Share className="w-4 h-4 mr-2" />
                Share
              </CopyButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="violations">Violations</TabsTrigger>
              <TabsTrigger value="raw">Raw JSON</TabsTrigger>
            </TabsList>

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
  );
}