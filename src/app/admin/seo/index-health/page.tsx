import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Database, Plug, Settings, TrendingDown, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'Index Health - VexNexa Admin',
  description: 'Monitor page indexing status and coverage',
};

async function getP1Data() {
  const latest = await prisma.$queryRaw<any[]>`
    SELECT
      date,
      p1_index_crawl_health,
      breakdown
    FROM score_daily
    ORDER BY date DESC
    LIMIT 1
  `;
  return latest[0] || null;
}

async function getImpressionsTrend() {
  const siteUrl = process.env.GSC_SITE_URL!;
  const trend = await prisma.$queryRaw<any[]>`
    SELECT date, impressions, clicks
    FROM gsc_daily_site_metrics
    WHERE site_url = ${siteUrl}
      AND date >= CURRENT_DATE - INTERVAL '30 days'
    ORDER BY date ASC
  `;
  return trend;
}

async function getP1Actions() {
  const actions = await prisma.$queryRaw<any[]>`
    SELECT pillar, severity, title, description, impact_points
    FROM score_actions_daily
    WHERE pillar = 'P1'
      AND date = (SELECT MAX(date) FROM score_actions_daily)
    ORDER BY impact_points DESC
  `;
  return actions;
}

export default async function AdminSeoIndexHealthPage() {
  const [p1Data, impressionsTrend, p1Actions] = await Promise.all([
    getP1Data(),
    getImpressionsTrend(),
    getP1Actions(),
  ]);

  // Show empty state if no data
  if (!p1Data) {
    const kpis: KpiCardData[] = [
      {
        label: "P1 Score",
        value: "—",
        valueColor: "text-gray-400",
        primary: true,
        subtitle: "Connect Google to track",
      },
      {
        label: "Impressions Trend",
        value: "—",
        valueColor: "text-gray-400",
      },
      {
        label: "Index Coverage",
        value: "—",
        valueColor: "text-gray-400",
      },
      {
        label: "Crawl Errors",
        value: "—",
        valueColor: "text-gray-400",
      },
    ];

    return (
      <AdminPageShell>
        <AdminPageHeader
          title="Index Health (P1)"
          subtitle="Track which pages are indexed and identify coverage issues"
          icon={Database}
        />

        <AdminKpiGrid kpis={kpis} columns={4} />

        <div className="mt-6">
          <AdminEmptyState
            icon={Database}
            title="Index coverage data not available"
            description={
              <div className="space-y-2">
                <p>
                  Connect Google Search Console to monitor your site's index coverage,
                  identify crawl errors, and track indexing status.
                </p>
              </div>
            }
            actions={[
              {
                label: "Connect Google Account",
                variant: "default",
                icon: Plug,
                href: "/admin/seo/settings",
              },
              {
                label: "SEO Settings",
                variant: "outline",
                icon: Settings,
                href: "/admin/seo/settings",
              },
            ]}
            helpText={
              <p>
                Monitor valid pages, pages with warnings, excluded pages,
                and error states to ensure optimal search visibility.
              </p>
            }
          />
        </div>
      </AdminPageShell>
    );
  }

  // Extract P1 components from breakdown
  const p1Components = p1Data.breakdown?.p1IndexCrawlHealth?.components || {
    impressionsTrend: 0,
    indexCoverage: 0,
    crawlErrors: 0,
  };

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const kpis: KpiCardData[] = [
    {
      label: "P1 Score",
      value: Math.round(p1Data.p1_index_crawl_health).toString(),
      valueColor: getScoreColor(p1Data.p1_index_crawl_health),
      primary: true,
      subtitle: `/ 250 • ${new Date(p1Data.date).toLocaleDateString()}`,
    },
    {
      label: "Impressions Trend",
      value: p1Components.impressionsTrend.toString(),
      valueColor: getScoreColor(p1Components.impressionsTrend),
      subtitle: "/ 100",
    },
    {
      label: "Index Coverage",
      value: p1Components.indexCoverage.toString(),
      valueColor: getScoreColor(p1Components.indexCoverage),
      subtitle: "/ 100",
    },
    {
      label: "Crawl Errors",
      value: p1Components.crawlErrors.toString(),
      valueColor: getScoreColor(p1Components.crawlErrors * 2), // Scale to 100
      subtitle: "/ 50",
    },
  ];

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="Index Health (P1)"
        subtitle="Track which pages are indexed and identify coverage issues"
        icon={Database}
        actions={
          <Link
            href="/admin/seo"
            className="text-sm text-[#e8570e] hover:text-[#b8450b] transition-colors"
          >
            ← Back to Overview
          </Link>
        }
      />

      {/* KPI Grid */}
      <AdminKpiGrid kpis={kpis} columns={4} />

      {/* Impressions Trend Chart */}
      {impressionsTrend.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            30-Day Impressions Trend
          </h2>
          <div className="grid grid-cols-7 gap-2">
            {impressionsTrend.slice(-30).map((day: any) => {
              const maxImpressions = Math.max(...impressionsTrend.map((d: any) => d.impressions));
              const percentage = (day.impressions / maxImpressions) * 100;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div className="w-full h-32 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full bg-blue-500"
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                  <span className="text-xs font-medium text-gray-700">
                    {day.impressions.toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Component Breakdown */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Score Components
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Impressions Trend</p>
              <p className="text-xs text-gray-600 mt-1">
                7-day growth vs. previous period
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p1Components.impressionsTrend}
              </p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Index Coverage</p>
              <p className="text-xs text-gray-600 mt-1">
                Pages successfully indexed
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p1Components.indexCoverage}
              </p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Crawl Errors</p>
              <p className="text-xs text-gray-600 mt-1">
                No critical crawl errors detected
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p1Components.crawlErrors}
              </p>
              <p className="text-xs text-gray-500">/ 50</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      {p1Actions.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Actions
          </h2>
          <div className="space-y-3">
            {p1Actions.map((action: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 rounded-md">
                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                  action.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  action.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  action.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {action.severity}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Potential Impact: +{action.impact_points} points
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
