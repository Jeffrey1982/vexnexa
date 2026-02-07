// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScoreBadge } from "@/components/ScoreBadge";
import { Search, Plus, Activity } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { getFaviconFromUrl, formatDate, formatDateShort } from "@/lib/format";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";

async function getAllScans(userId: string) {
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
    });

    return scans.map(scan => ({
      ...scan,
      createdAt: scan.createdAt.toISOString(),
      site: {
        ...scan.site,
        createdAt: scan.site.createdAt.toISOString(),
      }
    }));
  } catch (error) {
    console.error("Failed to fetch scans:", error);
    return [];
  }
}

export default async function ScansPage() {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/login?redirect=/scans");
  }

  const scans = await getAllScans(user.id);

  // Calculate stats
  const completedScans = scans.filter(s => s.status === 'done');
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((sum, s) => sum + (s.score || 0), 0) / completedScans.length)
    : 0;
  const totalIssues = scans.reduce((sum, s) => sum + (s.issues || 0), 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight">Scans</h1>
              <p className="text-muted-foreground mt-2">
                View and manage all your accessibility scans
              </p>
            </div>
            <Link href="/dashboard">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Scan
              </Button>
            </Link>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Scans</CardDescription>
                <CardTitle className="text-3xl">{scans.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Average Score</CardDescription>
                <CardTitle className="text-3xl text-primary">{avgScore}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Issues</CardDescription>
                <CardTitle className="text-3xl text-orange-600">{totalIssues}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Scans List */}
          {scans.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No scans yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Get started by scanning your first website for accessibility issues.
                </p>
                <Link href="/dashboard">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Run Your First Scan
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5 text-primary" />
                  All Scans
                </CardTitle>
                <CardDescription>
                  Complete history of accessibility scans
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
