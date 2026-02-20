import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Search, Plug, Settings, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'SEO Health - VexNexa Admin',
  description: 'Monitor SEO performance and search visibility',
};

async function getLatestScore() {
  try {
    const latest = await prisma.$queryRaw<any[]>`
      SELECT
        date,
        total_score,
        p1_index_crawl_health,
        p2_search_visibility,
        p3_engagement_intent,
        p4_content_performance,
        p5_technical_experience
      FROM score_daily
      ORDER BY date DESC
      LIMIT 1
    `;
    return latest[0] || null;
  } catch (error) {
    console.error('Error fetching latest score:', error);
    return null;
  }
}

async function getScoreTrend() {
  try {
    const trend = await prisma.$queryRaw<any[]>`
      SELECT date, total_score
      FROM score_daily
      WHERE date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date ASC
    `;
    return trend;
  } catch (error) {
    console.error('Error fetching score trend:', error);
    return [];
  }
}

async function getLatestAlerts() {
  try {
    const alerts = await prisma.$queryRaw<any[]>`
      SELECT id, severity, type, message, created_at
      FROM alerts
      WHERE status = 'active'
      ORDER BY created_at DESC
      LIMIT 5
    `;
    return alerts;
  } catch (error) {
    console.error('Error fetching latest alerts:', error);
    return [];
  }
}

async function getTopActions() {
  try {
    const actions = await prisma.$queryRaw<any[]>`
      SELECT pillar, severity, title, description, impact_points
      FROM score_actions_daily
      WHERE date = (SELECT MAX(date) FROM score_actions_daily)
      ORDER BY impact_points DESC
      LIMIT 5
    `;
    return actions;
  } catch (error) {
    console.error('Error fetching top actions:', error);
    return [];
  }
}

export default async function AdminSeoPage() {
  const [latestScore, scoreTrend, latestAlerts, topActions] = await Promise.all([
    getLatestScore(),
    getScoreTrend(),
    getLatestAlerts(),
    getTopActions(),
  ]);

  // Show empty state if no data exists
  if (!latestScore) {
    const kpis: KpiCardData[] = [
      {
        label: "Health Score",
        value: "—",
        valueColor: "text-muted-foreground",
        primary: true,
        subtitle: "Connect Google to track",
      },
      {
        label: "Index Health",
        value: "—",
        valueColor: "text-muted-foreground",
      },
      {
        label: "Visibility",
        value: "—",
        valueColor: "text-muted-foreground",
      },
      {
        label: "Active Alerts",
        value: "—",
        valueColor: "text-muted-foreground",
      },
    ];

    return (
      <AdminPageShell>
        <AdminPageHeader
          title="SEO Health"
          subtitle="Monitor search performance and indexing status"
          icon={Search}
        />

        <AdminKpiGrid kpis={kpis} columns={4} />

        <div className="mt-6">
          <AdminEmptyState
            icon={Search}
            title="Connect Google Services"
            description={
              <div className="space-y-2">
                <p>
                  Get comprehensive insights into your site's search performance
                  by connecting Google Search Console and Google Analytics.
                </p>
                <p className="text-sm">
                  Track your 0-1000 Health Score across 5 pillars: Index Health,
                  Visibility, Engagement, Content, and Technical Performance.
                </p>
              </div>
            }
            actions={[
              {
                label: "Trigger Data Ingestion",
                variant: "default",
                icon: Plug,
                href: "/admin/seo/settings",
              },
              {
                label: "View Documentation",
                variant: "outline",
                icon: BookOpen,
                href: "/docs/google-health-score",
              },
            ]}
            helpText={
              <div className="space-y-2">
                <p className="font-semibold">Good news! Google APIs are already configured ✅</p>
                <p>All environment variables are set. Click "Trigger Data Ingestion" above to populate your dashboard.</p>
                <p className="text-xs">
                  This will fetch yesterday's data from Google Search Console and Google Analytics 4,
                  then calculate your SEO Health Score (0-1000).
                </p>
              </div>
            }
          />
        </div>
      </AdminPageShell>
    );
  }

  // Calculate score color
  const getScoreColor = (score: number) => {
    if (score >= 750) return "text-green-600";
    if (score >= 500) return "text-yellow-600";
    return "text-red-600";
  };

  // Build KPIs with real data
  const kpis: KpiCardData[] = [
    {
      label: "Health Score",
      value: latestScore.total_score.toString(),
      valueColor: getScoreColor(latestScore.total_score),
      primary: true,
      subtitle: `out of 1000 • ${new Date(latestScore.date).toLocaleDateString()}`,
    },
    {
      label: "Index Health (P1)",
      value: Math.round(latestScore.p1_index_crawl_health).toString(),
      valueColor: getScoreColor(latestScore.p1_index_crawl_health * 4), // Scale to 1000
      subtitle: "/ 250",
    },
    {
      label: "Visibility (P2)",
      value: Math.round(latestScore.p2_search_visibility).toString(),
      valueColor: getScoreColor(latestScore.p2_search_visibility * 4),
      subtitle: "/ 250",
    },
    {
      label: "Active Alerts",
      value: latestAlerts.length.toString(),
      valueColor: latestAlerts.length > 0 ? "text-red-600" : "text-green-600",
      subtitle: latestAlerts.length > 0 ? "requires attention" : "all clear",
    },
  ];

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="SEO Health"
        subtitle="Monitor search performance and indexing status"
        icon={Search}
        actions={
          <Link
            href="/admin/seo/settings"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        }
      />

      {/* KPI Grid */}
      <AdminKpiGrid kpis={kpis} columns={4} />

      {/* Score Trend */}
      {scoreTrend.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-gray-900">30-Day Score Trend</h2>
            </div>
            <Link
              href="/admin/seo/index-health"
              className="text-sm text-[#e8570e] hover:text-[#b8450b] transition-colors"
            >
              View Details →
            </Link>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {scoreTrend.slice(-30).map((day: any) => {
              const percentage = (day.total_score / 1000) * 100;
              return (
                <div key={day.date} className="flex flex-col items-center gap-1">
                  <div className="w-full h-32 bg-gray-100 rounded relative overflow-hidden">
                    <div
                      className={`absolute bottom-0 w-full ${
                        percentage >= 75 ? 'bg-green-500' :
                        percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ height: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest Alerts */}
      {latestAlerts.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Latest Alerts</h2>
            </div>
            <Link
              href="/admin/seo/alerts"
              className="text-sm text-[#e8570e] hover:text-[#b8450b] transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {latestAlerts.map((alert: any) => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-md">
                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {alert.severity}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Actions */}
      {topActions.length > 0 && (
        <div className="mt-6 bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recommended Actions</h2>
            <Link
              href="/admin/seo/index-health"
              className="text-sm text-[#e8570e] hover:text-[#b8450b] transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {topActions.map((action: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 p-3 border border-gray-200 rounded-md">
                <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                  action.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  action.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  action.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {action.pillar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{action.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Impact: +{action.impact_points} points
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
