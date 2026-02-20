import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const dynamic = 'force-dynamic';
async function getSitesData() {
  const sites = await prisma.site.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true
        }
      },
      _count: {
        select: {
          scans: true
        }
      },
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: {
          createdAt: true,
          score: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    totalSites: sites.length,
    activeSites: sites.filter(s => s.scans.length > 0).length,
    inactiveSites: sites.filter(s => s.scans.length === 0).length
  };

  return {
    sites,
    stats
  };
}

export default async function AdminSitesPage() {
  const { sites, stats } = await getSitesData();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-white/[0.03]">

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">Site Management</h1>
          <p className="text-muted-foreground mt-2">Manage all customer websites across the platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold">{stats.totalSites}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active Sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{stats.activeSites}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">With scan history</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Inactive Sites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <div className="text-3xl font-bold text-muted-foreground">{stats.inactiveSites}</div>
              </div>
              <div className="text-xs text-muted-foreground mt-1">Never scanned</div>
            </CardContent>
          </Card>
        </div>

        {/* Sites Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Sites</CardTitle>
            <CardDescription>Complete list of all registered websites</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Website</th>
                    <th className="pb-3 font-medium">Owner</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Scans</th>
                    <th className="pb-3 font-medium">Last Scan</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sites.map((site) => {
                    const hasScans = site._count.scans > 0;
                    const lastScan = site.scans[0];
                    const userName = site.user.firstName && site.user.lastName
                      ? `${site.user.firstName} ${site.user.lastName}`
                      : site.user.email;

                    return (
                      <tr key={site.id} className="text-sm">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <div className="font-medium text-gray-900 dark:text-foreground max-w-xs truncate">
                                {site.url}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Added {new Date(site.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-foreground">{userName}</div>
                            <div className="text-xs text-muted-foreground">{site.user.email}</div>
                          </div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">{site.user.plan}</Badge>
                        </td>
                        <td className="py-3">
                          <span className="font-medium">{site._count.scans}</span>
                        </td>
                        <td className="py-3">
                          {lastScan ? (
                            <div>
                              <div className="text-xs text-gray-900 dark:text-foreground">
                                {new Date(lastScan.createdAt).toLocaleDateString()}
                              </div>
                              {lastScan.score !== null && (
                                <div className="text-xs text-muted-foreground">
                                  Score: {lastScan.score}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Never</span>
                          )}
                        </td>
                        <td className="py-3">
                          {hasScans ? (
                            <Badge variant="outline" className="border-green-500 text-green-600">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-gray-300 dark:border-white/[0.08] text-muted-foreground">
                              Inactive
                            </Badge>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/users/${site.user.id}`}>
                              <Button variant="ghost" size="sm" title="View Owner">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link href={`/sites/${site.id}`}>
                              <Button variant="outline" size="sm">
                                View Site
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
