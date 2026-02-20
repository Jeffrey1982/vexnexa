import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Shield, Plus, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default async function AssuranceDashboardPage() {
  const user = await requireAuth();
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    return null; // Layout will redirect
  }

  // Fetch domains
  const domains = await prisma.assuranceDomain.findMany({
    where: { subscriptionId: subscription.id },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      alerts: {
        where: { resolved: false },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  // Calculate stats
  const totalDomains = domains.length;
  const activeDomains = domains.filter((d) => d.active).length;
  const domainsAboveThreshold = domains.filter(
    (d) => d.scans[0] && d.scans[0].score >= d.scoreThreshold
  ).length;
  const unresolvedAlerts = domains.reduce((sum, d) => sum + d.alerts.length, 0);

  // Recent alerts
  const recentAlerts = await prisma.assuranceAlert.findMany({
    where: {
      domain: {
        subscriptionId: subscription.id,
      },
    },
    include: {
      domain: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Overview</h2>
          <p className="text-muted-foreground">
            Monitor accessibility compliance across your domains
          </p>
        </div>
        <Link href="/dashboard/assurance/domains/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Domain
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Domains</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDomains}</div>
            <p className="text-xs text-muted-foreground">
              {activeDomains} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Above Threshold</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{domainsAboveThreshold}</div>
            <p className="text-xs text-muted-foreground">
              Meeting target scores
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Below Threshold</CardTitle>
            <TrendingDown className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalDomains - domainsAboveThreshold}
            </div>
            <p className="text-xs text-muted-foreground">
              Require attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Unresolved issues
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monitored Domains */}
      <Card>
        <CardHeader>
          <CardTitle>Monitored Domains</CardTitle>
          <CardDescription>
            Current accessibility scores and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {domains.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">No domains yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first domain to start monitoring accessibility compliance
              </p>
              <Link href="/dashboard/assurance/domains/new">
                <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Domain
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {domains.map((domain) => {
                const latestScan = domain.scans[0];
                const score = latestScan?.score ?? 0;
                const isAboveThreshold = score >= domain.scoreThreshold;

                return (
                  <Link
                    key={domain.id}
                    href={`/dashboard/assurance/domains/${domain.id}`}
                    className="block"
                  >
                    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors">
                      <div className="flex-1">
                        <div className="font-medium">
                          {domain.label || domain.domain}
                        </div>
                        {domain.label && (
                          <div className="text-sm text-muted-foreground">
                            {domain.domain}
                          </div>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Threshold: {domain.scoreThreshold}</span>
                          <span>Frequency: {domain.scanFrequency}</span>
                          <span>Language: {domain.language.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {domain.alerts.length > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                            <AlertTriangle className="w-3 h-3" />
                            {domain.alerts.length}
                          </div>
                        )}
                        <div className="text-right">
                          <div
                            className={`text-3xl font-bold ${
                              isAboveThreshold ? 'text-green-600' : 'text-amber-600'
                            }`}
                          >
                            {score}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isAboveThreshold ? (
                              <span className="text-green-600">✓ Above threshold</span>
                            ) : (
                              <span className="text-amber-600">⚠ Below threshold</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {recentAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest accessibility issues detected</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg"
                >
                  <div
                    className={`mt-0.5 p-1.5 rounded ${
                      alert.severity === 'CRITICAL'
                        ? 'bg-red-100 text-red-700'
                        : alert.severity === 'HIGH'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.domain.label || alert.domain.domain}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <span className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
              ))}
            </div>
            <Link href="/dashboard/assurance/alerts">
              <Button variant="outline" className="w-full mt-4">
                View All Alerts
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
