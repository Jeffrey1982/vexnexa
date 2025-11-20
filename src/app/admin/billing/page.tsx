import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { ENTITLEMENTS, OVERFLOW_PRICING } from "@/lib/billing/plans";
import { DollarSign, TrendingUp, AlertCircle } from "lucide-react";
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

async function getBillingData() {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const usersWithUsage = await prisma.user.findMany({
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
  });

  // Calculate overages and billing for each user
  const usersWithBilling = usersWithUsage.map(user => {
    const plan = user.plan as keyof typeof ENTITLEMENTS;
    const entitlements = ENTITLEMENTS[plan] || ENTITLEMENTS.TRIAL;

    const sitesCount = user.sites.length;
    const pagesThisMonth = user.sites.reduce(
      (sum, site) => sum + site.scans.reduce(
        (scanSum, scan) => scanSum + (scan.elementsScanned || 0),
        0
      ),
      0
    );

    const siteOverage = Math.max(0, sitesCount - entitlements.sites);
    const pageOverage = Math.max(0, pagesThisMonth - entitlements.pagesPerMonth);
    const userOverage = 0; // Would need team data

    const siteOverageCost = siteOverage * OVERFLOW_PRICING.extraSite.amount;
    const pageOverageCost = pageOverage * OVERFLOW_PRICING.extraPage.amount;
    const userOverageCost = userOverage * OVERFLOW_PRICING.extraUser.amount;
    const totalOverage = siteOverageCost + pageOverageCost + userOverageCost;

    return {
      id: user.id,
      email: user.email,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email,
      plan,
      siteOverage,
      pageOverage,
      siteOverageCost,
      pageOverageCost,
      totalOverage,
      hasOverage: totalOverage > 0
    };
  });

  // Filter and sort by overage amount
  const usersWithOverages = usersWithBilling
    .filter(u => u.hasOverage)
    .sort((a, b) => b.totalOverage - a.totalOverage);

  const allUsers = usersWithBilling.sort((a, b) => b.totalOverage - a.totalOverage);

  const stats = {
    totalOverageRevenue: usersWithOverages.reduce((sum, u) => sum + u.totalOverage, 0),
    usersWithOverages: usersWithOverages.length,
    averageOverage: usersWithOverages.length > 0
      ? usersWithOverages.reduce((sum, u) => sum + u.totalOverage, 0) / usersWithOverages.length
      : 0
  };

  return {
    usersWithOverages,
    allUsers,
    stats
  };
}

export default async function AdminBillingPage() {
  const admin = await requireAdmin();
  const { usersWithOverages, allUsers, stats } = await getBillingData();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={admin} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Billing & Overages</h1>
          <p className="text-gray-600 mt-2">Monitor overage charges and billing opportunities</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Overage Revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">
                  €{stats.totalOverageRevenue.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">This billing cycle</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Users with Overages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.usersWithOverages}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Require attention</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Average Overage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold text-blue-600">
                  €{stats.averageOverage.toFixed(2)}
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Per user with overage</div>
            </CardContent>
          </Card>
        </div>

        {/* Overages Alert */}
        {usersWithOverages.length > 0 && (
          <Card className="mb-8 border-orange-200 bg-orange-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                <CardTitle className="text-orange-900">Action Required</CardTitle>
              </div>
              <CardDescription className="text-orange-700">
                {usersWithOverages.length} customer{usersWithOverages.length !== 1 ? 's' : ''} currently have overage charges.
                Consider reaching out proactively to discuss plan upgrades or usage optimization.
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Users with Overages Table */}
        {usersWithOverages.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Users with Current Overages</CardTitle>
              <CardDescription>Sorted by total overage amount (highest first)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Site Overage</th>
                      <th className="pb-3 font-medium">Page Overage</th>
                      <th className="pb-3 font-medium">Total Cost</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usersWithOverages.map((user) => (
                      <tr key={user.id} className="text-sm">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">{user.plan}</Badge>
                        </td>
                        <td className="py-3">
                          {user.siteOverage > 0 ? (
                            <div>
                              <div className="text-red-600 font-medium">+{user.siteOverage} sites</div>
                              <div className="text-xs text-gray-500">€{user.siteOverageCost.toFixed(2)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          {user.pageOverage > 0 ? (
                            <div>
                              <div className="text-red-600 font-medium">
                                +{user.pageOverage.toLocaleString()} pages
                              </div>
                              <div className="text-xs text-gray-500">€{user.pageOverageCost.toFixed(2)}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="text-lg font-bold text-red-600">
                            €{user.totalOverage.toFixed(2)}
                          </div>
                        </td>
                        <td className="py-3">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            Manage
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users - Billing Overview</CardTitle>
            <CardDescription>Complete billing overview for all customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b">
                  <tr className="text-left text-sm text-gray-600">
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Plan</th>
                    <th className="pb-3 font-medium">Overage Charges</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUsers.map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="py-3">
                        <div className="font-medium text-gray-900">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{user.plan}</Badge>
                      </td>
                      <td className="py-3">
                        {user.totalOverage > 0 ? (
                          <span className="font-medium text-red-600">€{user.totalOverage.toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">€0.00</span>
                        )}
                      </td>
                      <td className="py-3">
                        {user.hasOverage ? (
                          <Badge variant="destructive">Has Overage</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-500 text-green-600">
                            No Overage
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
