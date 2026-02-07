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
import { Globe, Plus, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { SiteImage } from "@/components/SiteImage";
import { getFaviconFromUrl, formatDate } from "@/lib/format";
import { redirect } from "next/navigation";

async function getUserSites(userId: string) {
  try {
    const sites = await prisma.site.findMany({
      where: {
        userId: userId,
      },
      include: {
        _count: {
          select: {
            scans: true,
          },
        },
        scans: {
          where: {
            status: "done",
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return sites.map(site => ({
      ...site,
      createdAt: site.createdAt.toISOString(),
      scans: site.scans.map(scan => ({
        ...scan,
        createdAt: scan.createdAt.toISOString(),
      })),
    }));
  } catch (error) {
    console.error("Failed to fetch sites:", error);
    return [];
  }
}

export default async function SitesPage() {
  let user;
  try {
    user = await requireAuth();
  } catch (error) {
    redirect("/auth/login?redirect=/sites");
  }

  const sites = await getUserSites(user.id);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold font-display tracking-tight">Sites</h1>
              <p className="text-muted-foreground mt-2">
                Manage and monitor all your websites
              </p>
            </div>
            <Link href="/sites/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add New Site
              </Button>
            </Link>
          </div>

          {/* Sites List */}
          {sites.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Globe className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No sites yet</h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  Add your first website to start monitoring its accessibility.
                </p>
                <Link href="/sites/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Site
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sites.map((site) => {
                const latestScan = site.scans[0];
                const scanCount = site._count.scans;

                return (
                  <Link key={site.id} href={`/sites/${site.id}`}>
                    <Card className="h-full hover:border-primary transition-all hover:shadow-md">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <SiteImage
                            src={getFaviconFromUrl(site.url)}
                            alt=""
                            width={40}
                            height={40}
                            className="rounded"
                          />
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg truncate">
                              {new URL(site.url).hostname}
                            </CardTitle>
                            <CardDescription className="truncate">
                              {site.url}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Stats */}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Scans</p>
                            <p className="text-2xl font-bold">{scanCount}</p>
                          </div>
                          {latestScan && latestScan.score !== null && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Latest Score</p>
                              <p className="text-2xl font-bold text-primary">{latestScan.score}</p>
                            </div>
                          )}
                        </div>

                        {/* Latest Scan Info */}
                        {latestScan ? (
                          <div className="pt-4 border-t">
                            <p className="text-xs text-muted-foreground mb-2">Latest scan</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">{formatDate(latestScan.createdAt)}</span>
                              {latestScan.issues && latestScan.issues > 0 ? (
                                <Badge variant="outline" className="text-xs">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  {latestScan.issues} issues
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                  No issues
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="pt-4 border-t">
                            <p className="text-sm text-muted-foreground">No scans yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
