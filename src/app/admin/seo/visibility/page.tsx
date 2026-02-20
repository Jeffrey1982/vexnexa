import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  AdminTableShell,
  type KpiCardData,
} from "@/components/admin/layout";
import { Eye, Plug, Settings, TrendingUp, TrendingDown } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'Search Visibility - VexNexa Admin',
  description: 'Monitor search rankings and visibility',
};

async function getP2Data() {
  try {
    const latest = await prisma.$queryRaw<any[]>`
      SELECT
        date,
        p2_search_visibility,
        breakdown
      FROM score_daily
      ORDER BY date DESC
      LIMIT 1
    `;
    return latest[0] || null;
  } catch (error) {
    console.error('Error fetching P2 data:', error);
    return null;
  }
}

async function getTopQueries() {
  try {
    const siteUrl = process.env.GSC_SITE_URL!;
    const queries = await prisma.$queryRaw<any[]>`
      SELECT query, impressions, clicks, ctr, position
      FROM gsc_daily_query_metrics
      WHERE site_url = ${siteUrl}
        AND date = (SELECT MAX(date) FROM gsc_daily_query_metrics WHERE site_url = ${siteUrl})
      ORDER BY impressions DESC
      LIMIT 20
    `;
    return queries;
  } catch (error) {
    console.error('Error fetching top queries:', error);
    return [];
  }
}

async function getTopPages() {
  try {
    const siteUrl = process.env.GSC_SITE_URL!;
    const pages = await prisma.$queryRaw<any[]>`
      SELECT page, impressions, clicks, ctr, position
      FROM gsc_daily_page_metrics
      WHERE site_url = ${siteUrl}
        AND date = (SELECT MAX(date) FROM gsc_daily_page_metrics WHERE site_url = ${siteUrl})
      ORDER BY impressions DESC
      LIMIT 20
    `;
    return pages;
  } catch (error) {
    console.error('Error fetching top pages:', error);
    return [];
  }
}

async function getP2Actions() {
  try {
    const actions = await prisma.$queryRaw<any[]>`
      SELECT pillar, severity, title, description, impact_points
      FROM score_actions_daily
      WHERE pillar = 'P2'
        AND date = (SELECT MAX(date) FROM score_actions_daily)
      ORDER BY impact_points DESC
    `;
    return actions;
  } catch (error) {
    console.error('Error fetching P2 actions:', error);
    return [];
  }
}

export default async function AdminSeoVisibilityPage() {
  const [p2Data, topQueries, topPages, p2Actions] = await Promise.all([
    getP2Data(),
    getTopQueries(),
    getTopPages(),
    getP2Actions(),
  ]);

  // Show empty state if no data
  if (!p2Data) {
    const kpis: KpiCardData[] = [
      {
        label: "P2 Score",
        value: "—",
        valueColor: "text-muted-foreground",
        primary: true,
        subtitle: "Connect Google to track",
      },
      {
        label: "Clicks Trend",
        value: "—",
        valueColor: "text-muted-foreground",
      },
      {
        label: "Top Queries",
        value: "—",
        valueColor: "text-muted-foreground",
      },
      {
        label: "Avg Position",
        value: "—",
        valueColor: "text-muted-foreground",
      },
    ];

    return (
      <AdminPageShell>
        <AdminPageHeader
          title="Search Visibility (P2)"
          subtitle="Monitor search rankings and visibility"
          icon={Eye}
        />

        <AdminKpiGrid kpis={kpis} columns={4} />

        <div className="mt-6">
          <AdminEmptyState
            icon={Eye}
            title="Search visibility data not available"
            description="Connect Google Search Console to monitor rankings, track top queries, and analyze search performance."
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
          />
        </div>
      </AdminPageShell>
    );
  }

  // Extract P2 components from breakdown
  const p2Components = p2Data.breakdown?.p2SearchVisibility?.components || {
    clicksTrend: 0,
    topQueriesPerformance: 0,
    avgPosition: 0,
  };

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const kpis: KpiCardData[] = [
    {
      label: "P2 Score",
      value: Math.round(p2Data.p2_search_visibility).toString(),
      valueColor: getScoreColor(p2Data.p2_search_visibility),
      primary: true,
      subtitle: `/ 250 • ${new Date(p2Data.date).toLocaleDateString()}`,
    },
    {
      label: "Clicks Trend",
      value: p2Components.clicksTrend.toString(),
      valueColor: getScoreColor(p2Components.clicksTrend),
      subtitle: "/ 100",
    },
    {
      label: "Top Queries Performance",
      value: p2Components.topQueriesPerformance.toString(),
      valueColor: getScoreColor(p2Components.topQueriesPerformance),
      subtitle: "/ 100",
    },
    {
      label: "Avg Position",
      value: p2Components.avgPosition.toString(),
      valueColor: getScoreColor(p2Components.avgPosition * 2), // Scale to 100
      subtitle: "/ 50",
    },
  ];

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="Search Visibility (P2)"
        subtitle="Monitor search rankings and visibility"
        icon={Eye}
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

      {/* Component Breakdown */}
      <div className="mt-6 bg-white dark:bg-card border border-gray-200 dark:border-white/[0.06] rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
          Score Components
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground">Clicks Trend</p>
              <p className="text-xs text-muted-foreground mt-1">
                7-day growth vs. previous period
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                {p2Components.clicksTrend}
              </p>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground">Top Queries Performance</p>
              <p className="text-xs text-muted-foreground mt-1">
                Queries ranking in top 10
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                {p2Components.topQueriesPerformance}
              </p>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.03] rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-foreground">Average Position</p>
              <p className="text-xs text-muted-foreground mt-1">
                Average ranking position across queries
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900 dark:text-foreground">
                {p2Components.avgPosition}
              </p>
              <p className="text-xs text-muted-foreground">/ 50</p>
            </div>
          </div>
        </div>
      </div>

      {/* Top Queries */}
      {topQueries.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Top Queries"
            description="Highest performing search queries by impressions"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Query
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Impressions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      CTR
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topQueries.map((query: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground">
                        {query.query}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {query.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {query.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {(query.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`${
                          query.position <= 10 ? 'text-green-600 font-medium' :
                          query.position <= 20 ? 'text-yellow-600' : 'text-muted-foreground'
                        }`}>
                          {query.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTableShell>
        </div>
      )}

      {/* Top Pages */}
      {topPages.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Top Pages"
            description="Highest performing pages by impressions"
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-white/[0.06]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Page
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Impressions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      CTR
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-muted-foreground uppercase">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {topPages.map((page: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground max-w-md truncate">
                        {page.page}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {page.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {page.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 dark:text-foreground text-right">
                        {(page.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-right">
                        <span className={`${
                          page.position <= 10 ? 'text-green-600 font-medium' :
                          page.position <= 20 ? 'text-yellow-600' : 'text-muted-foreground'
                        }`}>
                          {page.position.toFixed(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTableShell>
        </div>
      )}

      {/* Recommended Actions */}
      {p2Actions.length > 0 && (
        <div className="mt-6 bg-white dark:bg-card border border-gray-200 dark:border-white/[0.06] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
            Recommended Actions
          </h2>
          <div className="space-y-3">
            {p2Actions.map((action: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 dark:border-white/[0.06] rounded-md">
                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                  action.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  action.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  action.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700 dark:text-blue-300'
                }`}>
                  {action.severity}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-foreground">{action.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
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
