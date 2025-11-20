import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { ENTITLEMENTS } from "@/lib/billing/plans";
import { AlertTriangle, Clock, TrendingDown, XCircle, Zap } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }
  return user;
}

async function getHealthData() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [allUsers, recentScans, failedScans] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        sites: {
          select: {
            id: true,
            scans: {
              where: {
                createdAt: { gte: thirtyDaysAgo }
              },
              select: {
                id: true,
                status: true,
                createdAt: true,
                elementsScanned: true
              },
              orderBy: { createdAt: 'desc' }
            }
          }
        }
      }
    }),
    prisma.scan.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        siteId: true,
        site: {
          select: {
            userId: true
          }
        }
      }
    }),
    prisma.scan.findMany({
      where: {
        status: 'failed',
        createdAt: { gte: sevenDaysAgo }
      },
      select: {
        siteId: true,
        site: {
          select: {
            userId: true,
            url: true
          }
        }
      }
    })
  ]);

  // Calculate health metrics for each user
  const usersWithHealth = allUsers.map(user => {
    const plan = user.plan as keyof typeof ENTITLEMENTS;
    const entitlements = ENTITLEMENTS[plan] || ENTITLEMENTS.TRIAL;

    // Calculate days since last scan
    const allScans = user.sites.flatMap(site => site.scans);
    const lastScan = allScans.length > 0 ? allScans[0] : null;
    const daysSinceLastScan = lastScan
      ? Math.floor((now.getTime() - new Date(lastScan.createdAt).getTime()) / (24 * 60 * 60 * 1000))
      : 999;

    // Check if trial is ending soon
    const isTrial = user.plan === 'TRIAL';
    const accountAge = Math.floor((now.getTime() - new Date(user.createdAt).getTime()) / (24 * 60 * 60 * 1000));
    const trialEndingSoon = isTrial && accountAge > 10 && accountAge < 14;

    // Calculate usage for current month
    const currentMonthScans = user.sites.flatMap(site =>
      site.scans.filter(scan => new Date(scan.createdAt) >= firstDayOfMonth)
    );
    const currentMonthPages = currentMonthScans.reduce((sum, scan) => sum + (scan.elementsScanned || 0), 0);
    const sitesCount = user.sites.length;

    const siteUsagePercent = (sitesCount / entitlements.sites) * 100;
    const pageUsagePercent = (currentMonthPages / entitlements.pagesPerMonth) * 100;
    const isNearLimit = siteUsagePercent >= 80 || pageUsagePercent >= 80;

    // Check for failed scans
    const userFailedScans = failedScans.filter(scan => scan.site.userId === user.id);
    const highErrorRate = userFailedScans.length >= 3;

    // Check payment status
    const paymentIssue = user.subscriptionStatus === 'past_due' || user.subscriptionStatus === 'canceled';

    // Calculate risk score
    let riskScore = 0;
    let riskFactors: string[] = [];

    if (daysSinceLastScan > 30) {
      riskScore += 40;
      riskFactors.push('Inactive for 30+ days');
    } else if (daysSinceLastScan > 14) {
      riskScore += 20;
      riskFactors.push('No activity for 2+ weeks');
    }

    if (trialEndingSoon) {
      riskScore += 30;
      riskFactors.push('Trial ending soon');
    }

    if (isNearLimit) {
      riskScore += 15;
      riskFactors.push('Approaching plan limits');
    }

    if (highErrorRate) {
      riskScore += 25;
      riskFactors.push('High scan failure rate');
    }

    if (paymentIssue) {
      riskScore += 50;
      riskFactors.push('Payment issue');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email,
      plan,
      daysSinceLastScan,
      trialEndingSoon,
      isNearLimit,
      highErrorRate,
      paymentIssue,
      failedScansCount: userFailedScans.length,
      riskScore,
      riskFactors,
      lastScanDate: lastScan ? new Date(lastScan.createdAt) : null
    };
  });

  // Filter at-risk users
  const atRiskUsers = usersWithHealth
    .filter(u => u.riskScore >= 20)
    .sort((a, b) => b.riskScore - a.riskScore);

  const stats = {
    totalAtRisk: atRiskUsers.length,
    inactive30Days: usersWithHealth.filter(u => u.daysSinceLastScan > 30).length,
    trialsEnding: usersWithHealth.filter(u => u.trialEndingSoon).length,
    paymentIssues: usersWithHealth.filter(u => u.paymentIssue).length,
    highErrorRates: usersWithHealth.filter(u => u.highErrorRate).length
  };

  return {
    atRiskUsers,
    stats
  };
}

export default async function AdminHealthPage() {
  const admin = await requireAdmin();
  const { atRiskUsers, stats } = await getHealthData();

  const getRiskBadge = (score: number) => {
    if (score >= 50) return <Badge variant="destructive">Critical</Badge>;
    if (score >= 30) return <Badge className="bg-orange-500">High</Badge>;
    return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Medium</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={admin} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Health Monitoring</h1>
          <p className="text-gray-600 mt-2">Proactive monitoring of at-risk customers requiring attention</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total At-Risk</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{stats.totalAtRisk}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Inactive 30+ Days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.inactive30Days}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Trials Ending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-yellow-600" />
                <div className="text-3xl font-bold text-yellow-600">{stats.trialsEnding}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Payment Issues</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{stats.paymentIssues}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>High Error Rates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.highErrorRates}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* At-Risk Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>At-Risk Customers</CardTitle>
            <CardDescription>Sorted by risk score (highest first) - Requires proactive outreach</CardDescription>
          </CardHeader>
          <CardContent>
            {atRiskUsers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-green-500" />
                <div className="font-medium">All customers healthy!</div>
                <div className="text-sm">No customers currently at risk</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Plan</th>
                      <th className="pb-3 font-medium">Risk Level</th>
                      <th className="pb-3 font-medium">Risk Factors</th>
                      <th className="pb-3 font-medium">Last Activity</th>
                      <th className="pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {atRiskUsers.map((user) => (
                      <tr key={user.id} className="text-sm">
                        <td className="py-3">
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </td>
                        <td className="py-3">
                          <Badge variant="outline">{user.plan}</Badge>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {getRiskBadge(user.riskScore)}
                            <span className="text-xs text-gray-500">({user.riskScore})</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="space-y-1">
                            {user.riskFactors.map((factor, idx) => (
                              <div key={idx} className="text-xs text-gray-600 flex items-center gap-1">
                                <div className="w-1 h-1 bg-red-500 rounded-full"></div>
                                {factor}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="py-3">
                          {user.lastScanDate ? (
                            <div>
                              <div className="text-xs text-gray-900">
                                {user.daysSinceLastScan === 0 ? 'Today' : `${user.daysSinceLastScan}d ago`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {user.lastScanDate.toLocaleDateString()}
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">Never</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/users/${user.id}`}>
                              <Button variant="outline" size="sm">
                                View User
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
