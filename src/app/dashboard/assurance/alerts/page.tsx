import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function AssuranceAlertsPage() {
  const user = await requireAuth();
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    return null;
  }

  const [unresolvedAlerts, resolvedAlerts] = await Promise.all([
    prisma.assuranceAlert.findMany({
      where: {
        domain: {
          subscriptionId: subscription.id,
        },
        resolved: false,
      },
      include: {
        domain: {
          select: {
            id: true,
            domain: true,
            label: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.assuranceAlert.findMany({
      where: {
        domain: {
          subscriptionId: subscription.id,
        },
        resolved: true,
      },
      include: {
        domain: {
          select: {
            id: true,
            domain: true,
            label: true,
          },
        },
      },
      orderBy: { resolvedAt: 'desc' },
      take: 20,
    }),
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'REGRESSION':
        return 'Regression';
      case 'SCORE_DROP':
        return 'Score Drop';
      case 'CRITICAL_ISSUES':
        return 'Critical Issues';
      case 'SCAN_FAILED':
        return 'Scan Failed';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Alerts</h2>
        <p className="text-muted-foreground">
          Accessibility compliance alerts and notifications
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">Last 20 resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>Unresolved accessibility issues</CardDescription>
        </CardHeader>
        <CardContent>
          {unresolvedAlerts.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600/50" />
              <h3 className="mt-4 text-lg font-semibold">No active alerts</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                All domains are performing as expected
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {unresolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 border rounded-lg ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          {getTypeLabel(alert.type)}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {alert.severity}
                        </Badge>
                      </div>
                      <Link
                        href={`/dashboard/assurance/domains/${alert.domain.id}`}
                        className="text-sm hover:underline mt-1 inline-block"
                      >
                        {alert.domain.label || alert.domain.domain}
                      </Link>
                      <p className="text-sm mt-2">{alert.message}</p>
                      <div className="flex items-center gap-4 mt-3 text-xs">
                        <span>Current Score: {alert.currentScore}</span>
                        {alert.threshold && (
                          <span>Threshold: {alert.threshold}</span>
                        )}
                        {alert.previousScore && (
                          <span>
                            Previous: {alert.previousScore} (
                            {alert.currentScore - alert.previousScore > 0 ? '+' : ''}
                            {alert.currentScore - alert.previousScore})
                          </span>
                        )}
                      </div>
                      <div className="text-xs mt-2 opacity-70">
                        {new Date(alert.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved Alerts */}
      {resolvedAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Resolved</CardTitle>
            <CardDescription>Last 20 resolved alerts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 border rounded-lg opacity-60"
                >
                  <div className="mt-0.5 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.domain.label || alert.domain.domain}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Resolved {new Date(alert.resolvedAt!).toLocaleString()}
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {alert.severity}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
