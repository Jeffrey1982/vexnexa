import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  AdminTableShell,
  type KpiCardData,
} from "@/components/admin/layout";
import { Award, Plug, Settings, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'Page Quality - VexNexa Admin',
  description: 'Monitor engagement and content performance metrics',
};

async function getP3P4Data() {
  const latest = await prisma.$queryRaw<any[]>`
    SELECT
      date,
      p3_engagement_intent,
      p4_content_performance,
      breakdown
    FROM score_daily
    ORDER BY date DESC
    LIMIT 1
  `;
  return latest[0] || null;
}

async function getLowCTRPages() {
  const siteUrl = process.env.GSC_SITE_URL!;

  // Find pages with high impressions but low CTR
  const pages = await prisma.$queryRaw<any[]>`
    SELECT page, impressions, clicks, ctr, position
    FROM gsc_daily_page_metrics
    WHERE site_url = ${siteUrl}
      AND date = (SELECT MAX(date) FROM gsc_daily_page_metrics WHERE site_url = ${siteUrl})
      AND impressions >= 100
      AND ctr < 0.02
    ORDER BY impressions DESC
    LIMIT 20
  `;
  return pages;
}

async function getLowEngagementPages() {
  const propertyId = process.env.GA4_PROPERTY_ID!;

  // Find pages with low engagement
  const pages = await prisma.$queryRaw<any[]>`
    SELECT
      landing_page,
      organic_sessions,
      engagement_rate,
      avg_engagement_time_seconds,
      bounce_rate
    FROM ga4_daily_landing_metrics
    WHERE property_id = ${propertyId}
      AND date = (SELECT MAX(date) FROM ga4_daily_landing_metrics WHERE property_id = ${propertyId})
      AND organic_sessions >= 10
      AND engagement_rate < 0.3
    ORDER BY organic_sessions DESC
    LIMIT 20
  `;
  return pages;
}

async function getP3P4Actions() {
  const actions = await prisma.$queryRaw<any[]>`
    SELECT pillar, severity, title, description, impact_points
    FROM score_actions_daily
    WHERE pillar IN ('P3', 'P4')
      AND date = (SELECT MAX(date) FROM score_actions_daily)
    ORDER BY impact_points DESC
  `;
  return actions;
}

export default async function AdminSeoPageQualityPage() {
  const [p3p4Data, lowCTRPages, lowEngagementPages, actions] = await Promise.all([
    getP3P4Data(),
    getLowCTRPages(),
    getLowEngagementPages(),
    getP3P4Actions(),
  ]);

  // Show empty state if no data
  if (!p3p4Data) {
    const kpis: KpiCardData[] = [
      {
        label: "Engagement Score (P3)",
        value: "—",
        valueColor: "text-gray-400",
        primary: true,
        subtitle: "Connect Google to track",
      },
      {
        label: "Content Score (P4)",
        value: "—",
        valueColor: "text-gray-400",
      },
      {
        label: "CTR Issues",
        value: "—",
        valueColor: "text-gray-400",
      },
      {
        label: "Low Engagement",
        value: "—",
        valueColor: "text-gray-400",
      },
    ];

    return (
      <AdminPageShell>
        <AdminPageHeader
          title="Page Quality (P3 + P4)"
          subtitle="Monitor engagement and content performance metrics"
          icon={Award}
        />

        <AdminKpiGrid kpis={kpis} columns={4} />

        <div className="mt-6">
          <AdminEmptyState
            icon={Award}
            title="Page quality data not available"
            description="Connect Google Search Console and Analytics to monitor CTR, engagement, and content performance."
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

  // Extract components from breakdown
  const p3Components = p3p4Data.breakdown?.p3EngagementIntent?.components || {
    ctrQuality: 0,
    engagementRate: 0,
    returningUsers: 0,
  };

  const p4Components = p3p4Data.breakdown?.p4ContentPerformance?.components || {
    topPagesGrowth: 0,
    contentDepth: 0,
    conversionQuality: 0,
  };

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 75) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const kpis: KpiCardData[] = [
    {
      label: "Engagement Score (P3)",
      value: Math.round(p3p4Data.p3_engagement_intent).toString(),
      valueColor: getScoreColor(p3p4Data.p3_engagement_intent),
      primary: true,
      subtitle: `/ 200 • ${new Date(p3p4Data.date).toLocaleDateString()}`,
    },
    {
      label: "Content Score (P4)",
      value: Math.round(p3p4Data.p4_content_performance).toString(),
      valueColor: getScoreColor(p3p4Data.p4_content_performance),
      subtitle: "/ 200",
    },
    {
      label: "CTR Issues",
      value: lowCTRPages.length.toString(),
      valueColor: lowCTRPages.length > 0 ? "text-red-600" : "text-green-600",
      subtitle: "pages with low CTR",
    },
    {
      label: "Low Engagement",
      value: lowEngagementPages.length.toString(),
      valueColor: lowEngagementPages.length > 0 ? "text-red-600" : "text-green-600",
      subtitle: "pages need improvement",
    },
  ];

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="Page Quality (P3 + P4)"
        subtitle="Monitor engagement and content performance metrics"
        icon={Award}
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

      {/* P3: Engagement & Intent Breakdown */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          P3: Engagement & Intent Components
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">CTR Quality</p>
              <p className="text-xs text-gray-600 mt-1">
                Click-through rate vs. expected baseline
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p3Components.ctrQuality}
              </p>
              <p className="text-xs text-gray-500">/ 80</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Engagement Rate</p>
              <p className="text-xs text-gray-600 mt-1">
                User engagement on landing pages
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p3Components.engagementRate}
              </p>
              <p className="text-xs text-gray-500">/ 80</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Returning Users</p>
              <p className="text-xs text-gray-600 mt-1">
                Percentage of returning visitors
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p3Components.returningUsers}
              </p>
              <p className="text-xs text-gray-500">/ 40</p>
            </div>
          </div>
        </div>
      </div>

      {/* P4: Content Performance Breakdown */}
      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          P4: Content Performance Components
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Top Pages Growth</p>
              <p className="text-xs text-gray-600 mt-1">
                Growth in top-performing pages
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p4Components.topPagesGrowth}
              </p>
              <p className="text-xs text-gray-500">/ 80</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Content Depth</p>
              <p className="text-xs text-gray-600 mt-1">
                Average engagement time on pages
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p4Components.contentDepth}
              </p>
              <p className="text-xs text-gray-500">/ 80</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-md">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Conversion Quality</p>
              <p className="text-xs text-gray-600 mt-1">
                Conversion rate from organic traffic
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {p4Components.conversionQuality}
              </p>
              <p className="text-xs text-gray-500">/ 40</p>
            </div>
          </div>
        </div>
      </div>

      {/* Low CTR Pages */}
      {lowCTRPages.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Low CTR Pages"
            description="Pages with high impressions but low click-through rate"
            icon={AlertCircle}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Page
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Impressions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Clicks
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      CTR
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Position
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowCTRPages.map((page: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">
                        {page.page}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {page.impressions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {page.clicks.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right font-medium">
                        {(page.ctr * 100).toFixed(2)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {page.position.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTableShell>
        </div>
      )}

      {/* Low Engagement Pages */}
      {lowEngagementPages.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Low Engagement Pages"
            description="Pages with poor user engagement metrics"
            icon={AlertCircle}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Landing Page
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Sessions
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Engagement Rate
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Avg Time (s)
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Bounce Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowEngagementPages.map((page: any, idx: number) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">
                        {page.landing_page}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900 text-right">
                        {page.organic_sessions.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-red-600 text-right font-medium">
                        {(page.engagement_rate * 100).toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {page.avg_engagement_time_seconds?.toFixed(0) || 0}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600 text-right">
                        {(page.bounce_rate * 100).toFixed(1)}%
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
      {actions.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recommended Actions
          </h2>
          <div className="space-y-3">
            {actions.map((action: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-4 border border-gray-200 rounded-md">
                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                  action.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  action.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  action.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {action.pillar} • {action.severity}
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
