import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/ScoreBadge";
import { StatCard } from "@/components/StatCard";
import { SeverityBadge } from "@/components/SeverityBadge";
import { formatDate, getFaviconFromUrl } from "@/lib/format";
import { computeIssueStats } from "@/lib/axe-types";
import { Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { redirect } from "next/navigation";

export default async function AppDashboardPage() {
  let user;

  try {
    user = await requireAuth();
  } catch (error) {
    // Clean redirect to login without any cached parameters
    redirect("/auth/login?redirect=/app-dashboard&v=" + Date.now());
  }

  // Get user's sites with recent scans
  const sites = await prisma.site.findMany({
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

  // Get recent scans across all sites
  const recentScans = await prisma.scan.findMany({
    where: {
      siteId: { in: sites.map(s => s.id) },
      status: "done"
    },
    include: {
      site: {
        select: {
          url: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  // Calculate stats
  const totalScans = recentScans.length;
  const avgScore = totalScans > 0 ? Math.round(recentScans.reduce((sum, scan) => sum + (scan.score || 0), 0) / totalScans) : 0;
  const totalIssues = recentScans.reduce((sum, scan) => sum + (scan.issues || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.firstName || user.email}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Websites"
            value={sites.length}
            iconName="Users"
          />
          <StatCard
            title="Total Scans"
            value={totalScans}
            iconName="TrendingUp"
          />
          <StatCard
            title="Average Score"
            value={avgScore}
            iconName="TrendingUp"
          />
          <StatCard
            title="Total Issues"
            value={totalIssues}
            iconName="AlertTriangle"
          />
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/sites/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Website
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/analytics">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sites List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Websites</CardTitle>
              <CardDescription>Manage and scan your websites</CardDescription>
            </CardHeader>
            <CardContent>
              {sites.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No websites added yet</p>
                  <Button asChild>
                    <Link href="/sites/new">Add Your First Website</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sites.slice(0, 5).map((site) => {
                    const latestScan = site.scans[0];
                    return (
                      <div key={site.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <SiteImage src={`https://www.google.com/s2/favicons?domain=${site.url}&sz=40`} width={40} height={40} />
                          <div>
                            <h3 className="font-medium">{site.url}</h3>
                            <p className="text-sm text-gray-500">{site.url}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {latestScan && (
                            <>
                              <ScoreBadge score={latestScan.score || 0} />
                              <Button variant="outline" size="sm" asChild>
                                <Link href={`/scans/${latestScan.id}/report`}>View</Link>
                              </Button>
                            </>
                          )}
                          <Button size="sm" asChild>
                            <Link href={`/dashboard?siteId=${site.id}`}>Scan</Link>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Scans */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Scans</CardTitle>
              <CardDescription>Latest accessibility scan results</CardDescription>
            </CardHeader>
            <CardContent>
              {recentScans.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No scans completed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentScans.slice(0, 5).map((scan) => (
                    <div key={scan.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <SiteImage src={`https://www.google.com/s2/favicons?domain=${scan.site.url}&sz=32`} width={32} height={32} />
                        <div>
                          <h4 className="font-medium">{scan.site.url}</h4>
                          <p className="text-sm text-gray-500">{formatDate(scan.createdAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <ScoreBadge score={scan.score || 0} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/scans/${scan.id}/report`}>View Report</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}