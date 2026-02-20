import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  AdminTableShell,
  type KpiCardData,
} from "@/components/admin/layout";
import { Bell, Plug, Settings, AlertTriangle, CheckCircle2 } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'SEO Alerts - VexNexa Admin',
  description: 'Track SEO issues and alerts',
};

async function getAlertStats() {
  try {
    const activeAlerts = await prisma.$queryRaw<any[]>`
      SELECT
        COUNT(*) as total_active,
        COUNT(*) FILTER (WHERE severity = 'critical') as critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') as high_count,
        COUNT(*) FILTER (WHERE severity = 'medium') as medium_count
      FROM alerts
      WHERE status = 'active'
    `;

    const resolved7d = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM alerts
      WHERE status = 'resolved'
        AND resolved_at >= NOW() - INTERVAL '7 days'
    `;

    return {
      totalActive: Number(activeAlerts[0]?.total_active || 0),
      critical: Number(activeAlerts[0]?.critical_count || 0),
      high: Number(activeAlerts[0]?.high_count || 0),
      medium: Number(activeAlerts[0]?.medium_count || 0),
      resolved7d: Number(resolved7d[0]?.count || 0),
    };
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    return {
      totalActive: 0,
      critical: 0,
      high: 0,
      medium: 0,
      resolved7d: 0,
    };
  }
}

async function getActiveAlerts() {
  try {
    const alerts = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        severity,
        type,
        entity_type,
        entity_key,
        message,
        details,
        created_at
      FROM alerts
      WHERE status = 'active'
      ORDER BY
        CASE severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        created_at DESC
    `;
    return alerts;
  } catch (error) {
    console.error('Error fetching active alerts:', error);
    return [];
  }
}

async function getRecentResolvedAlerts() {
  try {
    const alerts = await prisma.$queryRaw<any[]>`
      SELECT
        id,
        severity,
        type,
        message,
        resolved_at
      FROM alerts
      WHERE status = 'resolved'
        AND resolved_at >= NOW() - INTERVAL '7 days'
      ORDER BY resolved_at DESC
      LIMIT 10
    `;
    return alerts;
  } catch (error) {
    console.error('Error fetching resolved alerts:', error);
    return [];
  }
}

export default async function AdminSeoAlertsPage() {
  const [stats, activeAlerts, resolvedAlerts] = await Promise.all([
    getAlertStats(),
    getActiveAlerts(),
    getRecentResolvedAlerts(),
  ]);

  // Show empty state if no alerts
  if (stats.totalActive === 0 && stats.resolved7d === 0) {
    const kpis: KpiCardData[] = [
      {
        label: "Active Alerts",
        value: "0",
        valueColor: "text-green-600",
        primary: true,
        subtitle: "All systems healthy",
      },
      {
        label: "Critical Issues",
        value: "0",
        valueColor: "text-green-600",
      },
      {
        label: "Warnings",
        value: "0",
        valueColor: "text-green-600",
      },
      {
        label: "Resolved (7d)",
        value: "0",
        valueColor: "text-muted-foreground",
      },
    ];

    return (
      <AdminPageShell>
        <AdminPageHeader
          title="SEO Alerts"
          subtitle="Monitor and track technical SEO issues"
          icon={Bell}
          actions={
            <Link
              href="/admin/seo/settings"
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.06] rounded-md hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Alert Settings
            </Link>
          }
        />

        <AdminKpiGrid kpis={kpis} columns={4} />

        <div className="mt-6">
          <AdminEmptyState
            icon={CheckCircle2}
            title="No Active Alerts"
            description="All monitoring rules are passing. Your SEO health looks good!"
            helpText="Alerts will appear here when score drops, traffic anomalies, or other issues are detected."
          />
        </div>
      </AdminPageShell>
    );
  }

  const kpis: KpiCardData[] = [
    {
      label: "Active Alerts",
      value: stats.totalActive.toString(),
      valueColor: stats.totalActive > 0 ? "text-red-600" : "text-green-600",
      primary: true,
      subtitle: stats.totalActive > 0 ? "requires attention" : "all clear",
    },
    {
      label: "Critical Issues",
      value: stats.critical.toString(),
      valueColor: stats.critical > 0 ? "text-red-600" : "text-green-600",
      subtitle: "highest priority",
    },
    {
      label: "High Priority",
      value: stats.high.toString(),
      valueColor: stats.high > 0 ? "text-orange-600" : "text-green-600",
      subtitle: "needs review",
    },
    {
      label: "Resolved (7d)",
      value: stats.resolved7d.toString(),
      valueColor: "text-muted-foreground",
      subtitle: "last week",
    },
  ];

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="SEO Alerts"
        subtitle="Monitor and track technical SEO issues"
        icon={Bell}
        actions={
          <Link
            href="/admin/seo/settings"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-white/[0.06] rounded-md hover:bg-gray-50 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Alert Settings
          </Link>
        }
      />

      {/* KPI Grid */}
      <AdminKpiGrid kpis={kpis} columns={4} />

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Active Alerts"
            description="Issues requiring attention, sorted by severity"
          >
            <div className="space-y-3">
              {activeAlerts.map((alert: any) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 dark:border-white/[0.06] rounded-md hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-shrink-0">
                    <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                      alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {alert.severity}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 dark:text-muted-foreground rounded">
                        {alert.type}
                      </span>
                      {alert.entity_type && (
                        <span className="text-xs text-muted-foreground">
                          {alert.entity_type}: {alert.entity_key}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-gray-900 dark:text-foreground mb-2">
                      {alert.message}
                    </p>

                    {alert.details && typeof alert.details === 'object' && (
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {Object.entries(alert.details).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-1">
                            <span className="font-medium">{key}:</span>
                            <span>{typeof value === 'number' ? value.toLocaleString() : String(value)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(alert.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex-shrink-0">
                    <button
                      className="px-3 py-1.5 text-xs border border-gray-200 dark:border-white/[0.06] rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </AdminTableShell>
        </div>
      )}

      {/* Recently Resolved */}
      {resolvedAlerts.length > 0 && (
        <div className="mt-6 bg-white dark:bg-card border border-gray-200 dark:border-white/[0.06] rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-4">
            Recently Resolved (Last 7 Days)
          </h2>
          <div className="space-y-2">
            {resolvedAlerts.map((alert: any) => (
              <div
                key={alert.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/[0.03] rounded-md"
              >
                <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-foreground">{alert.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved {new Date(alert.resolved_at).toLocaleString()}
                  </p>
                </div>
                <div className={`px-2 py-0.5 text-xs font-medium rounded opacity-50 ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-700' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                  alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  was {alert.severity}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
