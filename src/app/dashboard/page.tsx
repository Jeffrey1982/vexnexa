// Force dynamic rendering to prevent caching issues
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { ScoreBadge } from "@/components/ScoreBadge";
import { IssuesByImpactChart } from "@/components/IssuesByImpactChart";
import { ScoreTrendChart } from "@/components/dashboard/ScoreTrendChart";
import { ExportButtons } from "@/components/ExportButtons";
import { SiteImage } from "@/components/SiteImage";
import { NewScanForm } from "./NewScanForm";
import { formatDate, formatDateShort, getFaviconFromUrl } from "@/lib/format";
import { getCurrentUsage, getTotalEntitlements } from "@/lib/billing/entitlements";
import { ENTITLEMENTS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Globe,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

interface OverviewData {
  recentScans: Awaited<ReturnType<typeof getRecentScans>>;
  trendData: Array<{ date: string; score: number }>;
  avgScore: number;
  scoreDelta: number;
  openIssues: { total: number; critical: number; serious: number; moderate: number; minor: number };
  siteCount: number;
  usage: { pages: number; sites: number; period: string };
  entitlements: Awaited<ReturnType<typeof getTotalEntitlements>>;
}

async function getRecentScans(userId: string) {
  const scans = await prisma.scan.findMany({
    where: { site: { userId } },
    include: { site: { select: { id: true, url: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  return scans.map((scan) => ({
    id: scan.id,
    status: scan.status,
    score: scan.score,
    issues: scan.issues,
    createdAt: scan.createdAt.toISOString(),
    hasVni: Boolean(
      (scan.resultJson as any)?.vni || (scan.raw as any)?.vni
    ),
    site: { id: scan.site.id, url: scan.site.url },
  }));
}

async function getOverviewData(userId: string): Promise<OverviewData> {
  const [recentScans, completedScans, latestPerSite, siteCount, usage, entitlements] = await Promise.all([
    getRecentScans(userId),
    prisma.scan.findMany({
      where: { status: "COMPLETED", score: { not: null }, site: { userId } },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { score: true, createdAt: true },
    }),
    // Most recent completed scan per site — the issues that are open *right now*
    prisma.scan.findMany({
      where: { status: "COMPLETED", site: { userId } },
      orderBy: { createdAt: "desc" },
      distinct: ["siteId"],
      select: {
        impactCritical: true,
        impactSerious: true,
        impactModerate: true,
        impactMinor: true,
      },
    }),
    prisma.site.count({ where: { userId } }),
    getCurrentUsage(userId),
    getTotalEntitlements(userId),
  ]);

  const trendData = completedScans
    .slice()
    .reverse()
    .map((scan) => ({ date: formatDateShort(scan.createdAt), score: scan.score ?? 0 }));

  const avgScore =
    completedScans.length > 0
      ? Math.round(completedScans.reduce((sum, s) => sum + (s.score ?? 0), 0) / completedScans.length)
      : 0;

  const scoreDelta =
    completedScans.length >= 2
      ? (completedScans[0].score ?? 0) - (completedScans[1].score ?? 0)
      : 0;

  const openIssues = latestPerSite.reduce(
    (acc, s) => {
      acc.critical += s.impactCritical;
      acc.serious += s.impactSerious;
      acc.moderate += s.impactModerate;
      acc.minor += s.impactMinor;
      acc.total += s.impactCritical + s.impactSerious + s.impactModerate + s.impactMinor;
      return acc;
    },
    { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 }
  );

  return { recentScans, trendData, avgScore, scoreDelta, openIssues, siteCount, usage, entitlements };
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge
      variant={status === "COMPLETED" ? "default" : "outline"}
      className={cn(
        "text-xs",
        status === "COMPLETED" && "bg-success text-success-foreground",
        status === "FAILED" && "bg-critical text-critical-foreground border-transparent",
        status === "PROCESSING" && "bg-primary text-primary-foreground border-transparent animate-pulse"
      )}
    >
      {label}
    </Badge>
  );
}

function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "default",
  delta,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "critical" | "success";
  delta?: number;
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        tone === "critical" && "border-critical/25 bg-critical/5",
        tone === "success" && "border-success/25 bg-success/5"
      )}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              tone === "critical" ? "bg-critical/10 text-critical" : "bg-primary/10 text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold font-display tracking-tight text-foreground">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {delta !== undefined && delta !== 0 && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 text-xs font-semibold",
                delta > 0 ? "text-success" : "text-critical"
              )}
            >
              {delta > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {delta > 0 ? "+" : ""}
              {delta}
            </span>
          )}
        </div>
        {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const tCommon = await getTranslations("common");

  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard");
  }

  const baseEntitlements =
    ENTITLEMENTS[(user.plan ?? "FREE") as keyof typeof ENTITLEMENTS] ?? ENTITLEMENTS.FREE;
  let data: OverviewData = {
    recentScans: [],
    trendData: [],
    avgScore: 0,
    scoreDelta: 0,
    openIssues: { total: 0, critical: 0, serious: 0, moderate: 0, minor: 0 },
    siteCount: 0,
    usage: { pages: 0, sites: 0, period: "" },
    entitlements: baseEntitlements,
  };
  try {
    data = await getOverviewData(user.id);
  } catch (error) {
    console.error("Dashboard overview data failed, rendering empty state:", error);
  }

  const entitlements = data.entitlements;
  const hasScans = data.recentScans.length > 0;
  const pagesPct = entitlements.pagesPerMonth
    ? Math.min(100, Math.round((data.usage.pages / entitlements.pagesPerMonth) * 100))
    : 0;
  const sitesPct = entitlements.sites
    ? Math.min(100, Math.round((data.siteCount / entitlements.sites) * 100))
    : 0;
  const nearLimit = pagesPct >= 80 || sitesPct >= 80;

  const onboardingSteps = [
    {
      done: data.siteCount > 0 || hasScans,
      title: t("overview.onboarding.step1"),
      description: t("overview.onboarding.step1Desc"),
      icon: Search,
    },
    {
      done: data.recentScans.some((s) => s.status === "COMPLETED"),
      title: t("overview.onboarding.step2"),
      description: t("overview.onboarding.step2Desc"),
      icon: FileText,
    },
    {
      done: false,
      title: t("overview.onboarding.step3"),
      description: t("overview.onboarding.step3Desc"),
      icon: ShieldCheck,
    },
  ];

  return (
    <main id="main-content" tabIndex={-1}>
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8 space-y-6">
        {/* Greeting */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-foreground">
              {user.firstName
                ? t("overview.greeting", { name: user.firstName })
                : t("overview.greetingFallback")}
            </h1>
            <p className="mt-1 text-sm sm:text-base text-muted-foreground">
              {t("overview.subtitle")}
            </p>
          </div>
          {hasScans && (
            <Link href="/scans">
              <Button variant="outline" size="sm" className="gap-1.5">
                {t("overview.recentScans.viewAll")}
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          )}
        </div>

        {/* New scan — always front and center */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/[0.03] to-transparent">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
              </span>
              {t("newScan.title")}
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {t("newScan.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <NewScanForm />
          </CardContent>
        </Card>

        {!hasScans ? (
          /* Onboarding for new users */
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display text-lg sm:text-xl">
                <Sparkles className="h-5 w-5 text-primary" />
                {t("overview.onboarding.title")}
              </CardTitle>
              <CardDescription>{t("overview.onboarding.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="grid gap-4 sm:grid-cols-3">
                {onboardingSteps.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={i}
                      className={cn(
                        "relative rounded-xl border p-4",
                        step.done ? "border-success/30 bg-success/5" : "border-border"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {step.done ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : (
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">
                            {i + 1}
                          </span>
                        )}
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <KpiCard
                title={t("stats.averageScore")}
                value={data.avgScore}
                subtitle={t("overview.kpi.avgScoreSub")}
                icon={Activity}
                delta={data.scoreDelta}
              />
              <KpiCard
                title={t("stats.critical")}
                value={data.openIssues.critical}
                subtitle={t("overview.kpi.criticalSub")}
                icon={AlertTriangle}
                tone={data.openIssues.critical > 0 ? "critical" : "success"}
              />
              <KpiCard
                title={t("overview.kpi.openIssues")}
                value={data.openIssues.total}
                subtitle={t("overview.kpi.openIssuesSub")}
                icon={FileText}
              />
              <KpiCard
                title={t("overview.kpi.sites")}
                value={data.siteCount}
                subtitle={t("overview.kpi.sitesSub", {
                  used: data.siteCount,
                  limit: entitlements.sites,
                })}
                icon={Globe}
              />
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base sm:text-lg">
                    {t("overview.charts.trendTitle")}
                  </CardTitle>
                  <CardDescription>{t("overview.charts.trendDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {data.trendData.length >= 2 ? (
                    <ScoreTrendChart data={data.trendData} />
                  ) : (
                    <div className="flex h-[240px] items-center justify-center text-sm text-muted-foreground">
                      {t("overview.charts.trendEmpty")}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="font-display text-base sm:text-lg">
                    {t("overview.charts.impactTitle")}
                  </CardTitle>
                  <CardDescription>{t("overview.charts.impactDescription")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <IssuesByImpactChart stats={data.openIssues} className="h-[240px]" />
                </CardContent>
              </Card>
            </div>

            {/* Recent scans + plan usage */}
            <div className="grid gap-4 lg:grid-cols-3 items-start">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="font-display text-base sm:text-lg">
                    {t("recentScans.title")}
                  </CardTitle>
                  <CardDescription>{t("recentScans.description")}</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Mobile cards */}
                  <div className="block sm:hidden space-y-3">
                    {data.recentScans.map((scan) => (
                      <Link key={scan.id} href={`/scans/${scan.id}`} className="block">
                        <div className="rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <SiteImage
                                src={getFaviconFromUrl(scan.site.url)}
                                alt=""
                                width={16}
                                height={16}
                                className="rounded shrink-0"
                              />
                              <span className="truncate text-sm font-medium text-foreground">
                                {new URL(scan.site.url).hostname}
                              </span>
                            </div>
                            {scan.score !== null && <ScoreBadge score={scan.score} size="sm" />}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-2">
                              <StatusBadge
                                status={scan.status}
                                label={t(`status.${scan.status}` as any)}
                              />
                              <span>
                                {scan.issues ?? 0} {tCommon("issues")}
                              </span>
                            </div>
                            <span>{formatDateShort(scan.createdAt)}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Desktop table */}
                  <div className="hidden sm:block rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("recentScans.tableHeaders.site")}</TableHead>
                          <TableHead>{t("recentScans.tableHeaders.score")}</TableHead>
                          <TableHead>{t("recentScans.tableHeaders.status")}</TableHead>
                          <TableHead>{t("recentScans.tableHeaders.issues")}</TableHead>
                          <TableHead>{t("recentScans.tableHeaders.date")}</TableHead>
                          <TableHead className="text-right">
                            {t("overview.recentScans.report")}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.recentScans.map((scan) => (
                          <TableRow key={scan.id} className="hover:bg-muted/50">
                            <TableCell>
                              <Link
                                href={`/scans/${scan.id}`}
                                className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
                              >
                                <SiteImage
                                  src={getFaviconFromUrl(scan.site.url)}
                                  alt=""
                                  width={16}
                                  height={16}
                                  className="rounded"
                                />
                                <span className="truncate max-w-44">
                                  {new URL(scan.site.url).hostname}
                                </span>
                                <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                              </Link>
                            </TableCell>
                            <TableCell>
                              {scan.score !== null ? (
                                <ScoreBadge score={scan.score} size="sm" />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <StatusBadge
                                status={scan.status}
                                label={t(`status.${scan.status}` as any)}
                              />
                            </TableCell>
                            <TableCell className="font-medium">{scan.issues ?? 0}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(scan.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              {scan.status === "COMPLETED" && (
                                <ExportButtons
                                  scanId={scan.id}
                                  includeVNI={scan.hasVni}
                                  showLanguageSelector={false}
                                  className="justify-end"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Plan usage — upgrade prompt appears exactly when limits near */}
              <Card>
                <CardHeader>
                  <CardTitle className="font-display text-base sm:text-lg">
                    {t("overview.usage.title")}
                  </CardTitle>
                  <CardDescription>{t("overview.usage.description")}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("overview.usage.pages")}</span>
                      <span className="font-medium text-foreground">
                        {t("overview.usage.of", {
                          used: data.usage.pages.toLocaleString(),
                          limit: entitlements.pagesPerMonth.toLocaleString(),
                        })}
                      </span>
                    </div>
                    <Progress
                      value={pagesPct}
                      className={cn("h-2", pagesPct >= 80 && "[&>div]:bg-warning")}
                    />
                  </div>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{t("overview.usage.sites")}</span>
                      <span className="font-medium text-foreground">
                        {t("overview.usage.of", {
                          used: data.siteCount.toLocaleString(),
                          limit: entitlements.sites.toLocaleString(),
                        })}
                      </span>
                    </div>
                    <Progress
                      value={sitesPct}
                      className={cn("h-2", sitesPct >= 80 && "[&>div]:bg-warning")}
                    />
                  </div>

                  {nearLimit && (
                    <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                      <p className="text-sm font-semibold text-foreground">
                        {t("overview.usage.upgradeTitle")}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("overview.usage.upgradeBody")}
                      </p>
                      <Link href="/settings/billing" className="mt-3 block">
                        <Button size="sm" className="w-full">
                          {t("overview.usage.upgradeCta")}
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
