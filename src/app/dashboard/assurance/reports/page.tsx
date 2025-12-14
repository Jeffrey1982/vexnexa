import { requireAuth } from '@/lib/auth';
import { getActiveAssuranceSubscription } from '@/lib/assurance/billing';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Download, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function AssuranceReportsPage() {
  const user = await requireAuth();
  const subscription = await getActiveAssuranceSubscription(user.id);

  if (!subscription) {
    return null;
  }

  const reports = await prisma.assuranceReport.findMany({
    where: {
      domain: {
        subscriptionId: subscription.id,
      },
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
    take: 50,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
        <p className="text-muted-foreground">
          Generated accessibility compliance reports
        </p>
      </div>

      {/* Reports List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reports</CardTitle>
          <CardDescription>
            {reports.length} report{reports.length !== 1 ? 's' : ''} available for download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">No reports yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Reports will be generated automatically after each scheduled scan
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const sentStatus = report.sentAt
                  ? `Sent to ${report.emailSentTo.length} recipient${report.emailSentTo.length !== 1 ? 's' : ''}`
                  : 'Not emailed';

                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/dashboard/assurance/domains/${report.domain.id}`}
                          className="font-medium hover:text-primary"
                        >
                          {report.domain.label || report.domain.domain}
                        </Link>
                        <Badge variant="outline" className="text-xs">
                          {report.language.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {new Date(report.createdAt).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Score: {report.score}/100</span>
                        <span>Threshold: {report.threshold}</span>
                        {report.wcagAACompliance !== null && (
                          <span>WCAG AA: {Math.round(report.wcagAACompliance)}%</span>
                        )}
                        <span>{sentStatus}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`text-3xl font-bold ${
                          report.score >= report.threshold
                            ? 'text-green-600'
                            : 'text-amber-600'
                        }`}
                      >
                        {report.score}
                      </div>
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          PDF
                        </Button>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
