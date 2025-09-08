import { prisma } from "@/lib/prisma";
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
import { Search, Plus, Activity, AlertTriangle, TrendingUp, Users, Shield } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { NewScanForm } from "./NewScanForm";
import { cn } from "@/lib/utils";

async function getRecentScans() {
  try {
    const scans = await prisma.scan.findMany({
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
      take: 20,
    });

    return scans;
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return [];
  }
}

async function getDashboardStats() {
  try {
    const lastTenScans = await prisma.scan.findMany({
      where: {
        status: "done",
        score: { not: null },
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
  const [scans, stats] = await Promise.all([
    getRecentScans(),
    getDashboardStats(),
  ]);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold font-display tracking-tight">Dashboard</h1>
          <p className="text-lg text-muted-foreground mt-2">
            Monitor your website accessibility scans and improvements
          </p>
        </div>
      </div>

      {/* New Scan Card */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display text-xl">
            <Plus className="w-5 h-5 text-primary" />
            New Accessibility Scan
          </CardTitle>
          <CardDescription className="text-base">
            Enter a URL to run a comprehensive WCAG accessibility analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewScanForm />
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}/100`}
          subtitle="Based on last 10 scans"
          iconName="TrendingUp"
          variant={stats.avgScore >= 80 ? "success" : stats.avgScore >= 60 ? "warning" : "critical"}
          trend={stats.trendData.length >= 2 ? {
            value: Math.round(((stats.trendData[stats.trendData.length - 1]?.score || 0) - (stats.trendData[stats.trendData.length - 2]?.score || 0)) / (stats.trendData[stats.trendData.length - 2]?.score || 1) * 100),
            label: "from last scan"
          } : undefined}
        />
        
        <StatCard
          title="Total Issues"
          value={stats.impactStats.total}
          subtitle="Across all scans"
          iconName="AlertTriangle"
          variant={stats.impactStats.critical > 0 ? "critical" : stats.impactStats.serious > 0 ? "warning" : "default"}
        />
        
        <StatCard
          title="Critical Issues"
          value={stats.impactStats.critical}
          subtitle="Requiring immediate attention"
          iconName="Shield"
          variant="critical"
        />
        
        <StatCard
          title="Sites Scanned"
          value={scans.length}
          subtitle="Total accessibility checks"
          iconName="Users"
          variant="default"
        />
      </div>
      
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

      {/* Recent Scans */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Recent Scans</CardTitle>
          <CardDescription className="text-base">
            Your latest accessibility scans and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scans.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>URL</TableHead>
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
                      <TableCell>
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}