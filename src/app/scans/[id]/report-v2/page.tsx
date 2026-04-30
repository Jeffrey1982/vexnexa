import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { transformScanToReport, renderReportHTML, resolveReportLabels } from "@/lib/report";
import type { ReportStyle } from "@/lib/report";
import DashboardNav from "@/components/dashboard/DashboardNav";
import { Card, CardContent } from "@/components/ui/card";
import { FileText } from "lucide-react";
import { ReportV2Toolbar } from "@/components/report/ReportV2Toolbar";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ReportV2Page({ params, searchParams }: PageProps) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/scans");
  }

  const { id } = await params;
  const sp = await searchParams;
  const styleParam: ReportStyle = sp.reportStyle === "corporate" ? "corporate" : "premium";
  const cookieStore = await cookies();
  const locale = typeof sp.language === "string" ? sp.language : cookieStore.get("NEXT_LOCALE")?.value || "en";

  const scan = await prisma.scan.findUnique({
    where: { id },
    include: { site: true, page: true },
  });

  if (!scan || scan.site.userId !== user.id) {
    notFound();
  }

  const reportData = transformScanToReport(
    {
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
      raw: scan.resultJson || scan.raw,
      site: { url: scan.site.url },
      page: scan.page ? { url: scan.page.url, title: scan.page.title ?? undefined } : null,
    },
    undefined,
    undefined,
    undefined,
    styleParam,
    resolveReportLabels(undefined, locale)
  );

  const reportHtml: string = renderReportHTML(reportData);
  const query = new URLSearchParams({ language: locale });
  if (styleParam === "corporate") query.set("reportStyle", "corporate");
  const styleQs = `?${query.toString()}`;
  // The download/style buttons live in <ReportV2Toolbar />; the HTML-print
  // link below still uses `styleQs` so power users keep a print fallback.

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
                    {styleParam === "corporate" ? " · Corporate Style" : ""}
                  </p>
                </div>
              </div>
              <ReportV2Toolbar
                scanId={id}
                currentLocale={locale}
                currentStyle={styleParam}
              />
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
                href={`/api/reports/${id}/html${styleQs}`}
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
