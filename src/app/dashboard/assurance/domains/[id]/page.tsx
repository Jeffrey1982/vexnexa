import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Settings, Download, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAuth();
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    return null;
  }

  const domain = await prisma.assuranceDomain.findFirst({
    where: {
      id,
      subscriptionId: subscription.id,
    },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      alerts: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
      reports: {
        orderBy: { createdAt: 'desc' },
        take: 5,
      },
    },
  });

  if (!domain) {
    notFound();
  }

  const latestScan = domain.scans[0];
  const score = latestScan?.score ?? null;
  const isAboveThreshold = score !== null && score >= domain.scoreThreshold;

  // Calculate trend
  const trend = domain.scans.length >= 2
    ? domain.scans[0].score - domain.scans[1].score
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/dashboard/assurance/domains"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Domains
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {domain.label || domain.domain}
            </h2>
            <p className="text-muted-foreground">{domain.domain}</p>
          </div>
          <Link href={`/dashboard/assurance/domains/${domain.id}/settings`}>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Current Score Card */}
      <Card>
        <CardHeader>
          <CardTitle>Current Accessibility Score</CardTitle>
          <CardDescription>
            Latest scan completed {latestScan ? new Date(latestScan.createdAt).toLocaleString() : 'Never'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              {score !== null ? (
                <>
                  <div className={`text-6xl font-bold ${isAboveThreshold ? 'text-green-600' : 'text-amber-600'}`}>
                    {score}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Threshold: {domain.scoreThreshold}</span>
                    {trend !== 0 && (
                      <span className={trend > 0 ? 'text-green-600' : 'text-red-600'}>
                        {trend > 0 ? <TrendingUp className="w-4 h-4 inline" /> : <TrendingDown className="w-4 h-4 inline" />}
                        {Math.abs(trend)} points
                      </span>
                    )}
                  </div>
                  <div className="mt-3">
                    {isAboveThreshold ? (
                      <Badge className="bg-green-100 text-green-800">Above Threshold</Badge>
                    ) : (
                      <Badge variant="destructive">Below Threshold</Badge>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">No scans yet</div>
              )}
            </div>
            {latestScan && (
              <div className="grid grid-cols-2 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold">{latestScan.issuesCount}</div>
                  <div className="text-xs text-muted-foreground">Total Issues</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-600">{latestScan.impactCritical}</div>
                  <div className="text-xs text-muted-foreground">Critical</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-600">{latestScan.impactSerious}</div>
                  <div className="text-xs text-muted-foreground">Serious</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{latestScan.impactModerate}</div>
                  <div className="text-xs text-muted-foreground">Moderate</div>
                </div>
              </div>
            )}
          </div>

          {latestScan?.wcagAACompliance !== null && (
            <div className="mt-6 pt-6 border-t">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">WCAG AA: </span>
                  <span className="font-semibold">{Math.round(latestScan.wcagAACompliance || 0)}%</span>
                </div>
                {latestScan.wcagAAACompliance !== null && (
                  <div>
                    <span className="text-muted-foreground">WCAG AAA: </span>
                    <span className="font-semibold">{Math.round(latestScan.wcagAAACompliance || 0)}%</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scan History */}
      <Card>
        <CardHeader>
          <CardTitle>Scan History</CardTitle>
          <CardDescription>Last 10 scans</CardDescription>
        </CardHeader>
        <CardContent>
          {domain.scans.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No scans yet. First scan will run according to schedule.
            </div>
          ) : (
            <div className="space-y-3">
              {domain.scans.map((scan, index) => {
                const prevScore = domain.scans[index + 1]?.score;
                const change = prevScore ? scan.score - prevScore : null;

                return (
                  <div
                    key={scan.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {new Date(scan.createdAt).toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {scan.issuesCount} issues found
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {change !== null && (
                        <span className={`text-sm ${change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-muted-foreground'}`}>
                          {change > 0 ? '+' : ''}{change}
                        </span>
                      )}
                      <div className={`text-2xl font-bold ${scan.score >= domain.scoreThreshold ? 'text-green-600' : 'text-amber-600'}`}>
                        {scan.score}
                      </div>
                      {scan.isRegression && (
                        <Badge variant="destructive">Regression</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {domain.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Alerts</CardTitle>
            <CardDescription>Latest accessibility issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {domain.alerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`mt-0.5 p-1.5 rounded ${
                    alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                    alert.severity === 'HIGH' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm text-muted-foreground mt-1">{alert.message}</div>
                    <div className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.createdAt).toLocaleString()}
                    </div>
                  </div>
                  {!alert.resolved && (
                    <Badge variant="destructive">Active</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Reports */}
      {domain.reports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Generated PDF reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {domain.reports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Score: {report.score} • Language: {report.language.toUpperCase()}
                    </div>
                  </div>
                  <a href={report.pdfUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
