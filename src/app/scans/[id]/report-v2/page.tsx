import { notFound, redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transformScanToReport, renderReportHTML } from "@/lib/report";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Download, FileDown } from "lucide-react";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ReportV2Page({ params }: PageProps) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/scans");
  }

  const { id } = await params;

  const scan = await prisma.scan.findUnique({
    where: { id },
    include: { site: true, page: true },
  });

  if (!scan || scan.site.userId !== user.id) {
    notFound();
  }

  const reportData = transformScanToReport({
    id: scan.id,
    score: scan.score,
    issues: scan.issues,
    impactCritical: scan.impactCritical,
    impactSerious: scan.impactSerious,
    impactModerate: scan.impactModerate,
    impactMinor: scan.impactMinor,
    wcagAACompliance: (scan as Record<string, unknown>).wcagAACompliance as number | null | undefined,
    wcagAAACompliance: (scan as Record<string, unknown>).wcagAAACompliance as number | null | undefined,
    createdAt: scan.createdAt.toISOString(),
    raw: scan.raw,
    site: { url: scan.site.url },
    page: scan.page ? { url: scan.page.url, title: scan.page.title ?? undefined } : null,
  });

  const reportHtml: string = renderReportHTML(reportData);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div className="flex items-center gap-3">
                <FileText className="h-7 w-7 text-[var(--vn-primary)]" />
                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    Premium Compliance Report
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    {scan.site.url} · {new Date(scan.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <a
                  href={`/api/reports/${id}/pdf`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--vn-primary)] text-white px-5 py-2.5 text-sm font-medium hover:bg-[var(--vn-primary-hover)] transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                <a
                  href={`/api/reports/${id}/docx`}
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--vn-border)] bg-background px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
                >
                  <FileDown className="w-4 h-4" />
                  Download DOCX
                </a>
              </div>
            </div>

            {/* Report Preview */}
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  srcDoc={reportHtml}
                  title="Accessibility Compliance Report"
                  className="w-full border-0"
                  style={{ minHeight: "1200px", height: "100%" }}
                  sandbox="allow-same-origin"
                />
              </CardContent>
            </Card>

            {/* Print hint */}
            <p className="text-center text-xs text-muted-foreground mt-4">
              You can also open the{" "}
              <a
                href={`/api/reports/${id}/html`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--vn-primary)] hover:underline"
              >
                full HTML report
              </a>{" "}
              in a new tab and use Ctrl+P / Cmd+P to print.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
