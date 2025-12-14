import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { ASSURANCE_PLAN_LIMITS } from '@/lib/assurance/pricing';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus, Settings, Play } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AssuranceDomainsPage() {
  const user = await requireAuth();
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    return null;
  }

  const domains = await prisma.assuranceDomain.findMany({
    where: { subscriptionId: subscription.id },
    include: {
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      _count: {
        select: {
          scans: true,
          alerts: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const limits = ASSURANCE_PLAN_LIMITS[subscription.tier];
  const canAddMore = domains.length < limits.domains;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Domains</h2>
          <p className="text-muted-foreground">
            {domains.length} of {limits.domains} domains used
          </p>
        </div>
        {canAddMore && (
          <Link href="/dashboard/assurance/domains/new">
            <Button className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </Link>
        )}
      </div>

      {/* Domain List */}
      <div className="grid gap-4">
        {domains.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <h3 className="text-lg font-semibold">No domains configured</h3>
                <p className="mt-2 text-sm text-muted-foreground max-w-sm">
                  Add your first domain to start automated accessibility monitoring
                </p>
                <Link href="/dashboard/assurance/domains/new">
                  <Button className="mt-4 bg-teal-600 hover:bg-teal-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          domains.map((domain) => {
            const latestScan = domain.scans[0];
            const score = latestScan?.score ?? null;
            const isAboveThreshold = score !== null && score >= domain.scoreThreshold;
            const nextRun = domain.nextRunAt
              ? new Date(domain.nextRunAt).toLocaleString()
              : 'Not scheduled';

            return (
              <Card key={domain.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        {domain.label || domain.domain}
                        {!domain.active && (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {domain.label ? domain.domain : `Threshold: ${domain.scoreThreshold}`}
                      </CardDescription>
                    </div>
                    {score !== null && (
                      <div
                        className={`text-4xl font-bold ${
                          isAboveThreshold ? 'text-green-600' : 'text-amber-600'
                        }`}
                      >
                        {score}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Threshold</div>
                        <div className="font-medium">{domain.scoreThreshold}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Frequency</div>
                        <div className="font-medium capitalize">
                          {domain.scanFrequency.toLowerCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Total Scans</div>
                        <div className="font-medium">{domain._count.scans}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Active Alerts</div>
                        <div className="font-medium">{domain._count.alerts}</div>
                      </div>
                    </div>

                    {/* Recipients */}
                    {domain.emailRecipients.length > 0 && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Recipients: </span>
                        <span className="font-medium">
                          {domain.emailRecipients.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Next Run */}
                    {domain.active && (
                      <div className="text-sm">
                        <span className="text-muted-foreground">Next scan: </span>
                        <span className="font-medium">{nextRun}</span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/dashboard/assurance/domains/${domain.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/assurance/domains/${domain.id}/settings`}>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                      </Link>
                      <form action={`/api/assurance/domains/${domain.id}/scan`} method="POST">
                        <Button
                          variant="outline"
                          size="sm"
                          type="submit"
                          className="bg-teal-50 hover:bg-teal-100 text-teal-700"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Scan Now
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Limit Warning */}
      {!canAddMore && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="text-amber-600">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-amber-900">Domain limit reached</h3>
                <p className="mt-1 text-sm text-amber-800">
                  You've reached the maximum of {limits.domains} domains for your {subscription.tier} plan.
                  Upgrade to monitor more domains.
                </p>
                <Link href="/settings/billing">
                  <Button variant="outline" size="sm" className="mt-3">
                    Upgrade Plan
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
