import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { ENTITLEMENTS } from "@/lib/billing/plans";
import { AlertTriangle, TrendingUp, Users, Database } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }
  return user;
}

async function getAnalyticsData() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [usersWithUsage, totalScans] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        sites: {
          select: {
            id: true,
            scans: {
              where: {
                createdAt: { gte: firstDayOfMonth }
              },
              select: {
                elementsScanned: true
              }
            }
          }
        }
      }
    }),
    prisma.scan.count({
      where: {
        createdAt: { gte: firstDayOfMonth }
      }
    })
  ]);

  // Calculate usage for each user
  const usersWithMetrics = usersWithUsage.map(user => {
    const plan = user.plan as keyof typeof ENTITLEMENTS;
    const entitlements = ENTITLEMENTS[plan] || ENTITLEMENTS.TRIAL;

    const sitesCount = user.sites.length;
    const scansThisMonth = user.sites.reduce(
      (sum, site) => sum + site.scans.length,
      0
    );
    const pagesThisMonth = user.sites.reduce(
      (sum, site) => sum + site.scans.reduce(
        (scanSum, scan) => scanSum + (scan.elementsScanned || 0),
        0
      ),
      0
    );

    const siteOverage = Math.max(0, sitesCount - entitlements.sites);
    const pageOverage = Math.max(0, pagesThisMonth - entitlements.pagesPerMonth);

    const siteUsagePercent = (sitesCount / entitlements.sites) * 100;
    const pageUsagePercent = (pagesThisMonth / entitlements.pagesPerMonth) * 100;

    return {
      id: user.id,
      email: user.email,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email,
      plan,
      sitesCount,
      scansThisMonth,
      pagesThisMonth,
      siteOverage,
      pageOverage,
      siteUsagePercent,
      pageUsagePercent,
      hasOverage: siteOverage > 0 || pageOverage > 0,
      isNearLimit: siteUsagePercent >= 80 || pageUsagePercent >= 80
    };
  });

  // Sort by usage percentage (descending)
  usersWithMetrics.sort((a, b) =>
    Math.max(b.siteUsagePercent, b.pageUsagePercent) - Math.max(a.siteUsagePercent, a.pageUsagePercent)
  );

  const stats = {
    totalUsers: usersWithUsage.length,
    totalScans: totalScans,
    usersWithOverage: usersWithMetrics.filter(u => u.hasOverage).length,
    usersNearLimit: usersWithMetrics.filter(u => u.isNearLimit && !u.hasOverage).length
  };

  return {
    usersWithMetrics,
    stats
  };
}

export default async function AdminAnalyticsPage() {
  const admin = await requireAdmin();
  const { usersWithMetrics, stats } = await getAnalyticsData();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={admin} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Usage Analytics</h1>
          <p className="text-gray-600 mt-2">Monitor customer usage and identify support opportunities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold">{stats.totalUsers}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Scans This Month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold">{stats.totalScans}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Users with Overages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{stats.usersWithOverage}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Users Near Limits</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.usersNearLimit}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>User Usage Overview</CardTitle>
            <CardDescription>Sorted by usage percentage (highest first)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Sites</th>
                    <th className="pb-3 font-medium">Pages</th>
                    <th className="pb-3 font-medium">Scans</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usersWithMetrics.map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{user.plan}</Badge>
                      </td>
                      <td className="py-3">
                        <span className={user.siteOverage > 0 ? "text-red-600 font-medium" : ""}>
                          {user.sitesCount}
                        </span>
                        {user.siteOverage > 0 && (
                          <span className="text-xs text-red-600"> (+{user.siteOverage})</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className={user.pageOverage > 0 ? "text-red-600 font-medium" : ""}>
                          {user.pagesThisMonth.toLocaleString()}
                        </span>
                        {user.pageOverage > 0 && (
                          <span className="text-xs text-red-600"> (+{user.pageOverage.toLocaleString()})</span>
                        )}
                      </td>
                      <td className="py-3">{user.scansThisMonth}</td>
                      <td className="py-3">
                        {user.hasOverage ? (
                          <Badge variant="destructive">Over Limit</Badge>
                        ) : user.isNearLimit ? (
                          <Badge variant="outline" className="border-orange-500 text-orange-600">
                            Near Limit
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            Healthy
                          </Badge>
                        )}
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          View Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
