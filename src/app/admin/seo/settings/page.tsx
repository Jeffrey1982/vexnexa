import {
  AdminPageShell,
  AdminPageHeader,
  AdminTableShell,
} from "@/components/admin/layout";
import { Settings, BookOpen, AlertCircle, Eye } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const metadata = {
  title: 'SEO Settings - VexNexa Admin',
  description: 'Configure alert rules and monitoring settings',
};

async function getAlertRules() {
  const rules = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      type,
      enabled,
      severity,
      thresholds,
      lookback_days,
      description
    FROM alert_rules
    ORDER BY
      CASE severity
        WHEN 'critical' THEN 1
        WHEN 'high' THEN 2
        WHEN 'medium' THEN 3
        ELSE 4
      END,
      type
  `;
  return rules;
}

async function getWatchedPages() {
  const pages = await prisma.$queryRaw<any[]>`
    SELECT
      id,
      url,
      label,
      active,
      added_at
    FROM watched_pages
    ORDER BY added_at DESC
  `;
  return pages;
}

export default async function AdminSeoSettingsPage() {
  const [alertRules, watchedPages] = await Promise.all([
    getAlertRules(),
    getWatchedPages(),
  ]);

  const getAlertTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'SCORE_DROP_7D': 'Total Score Drop (7-day)',
      'PILLAR_DROP': 'Pillar Score Drop',
      'VISIBILITY_IMPRESSIONS_DROP': 'Impressions Drop',
      'CTR_ANOMALY': 'CTR Anomaly Detection',
      'FUNNEL_CONV_DROP': 'Conversion Rate Drop',
    };
    return labels[type] || type;
  };

  return (
    <AdminPageShell>
      {/* Page Header */}
      <AdminPageHeader
        title="SEO Settings"
        subtitle="Configure alert rules and monitoring settings"
        icon={Settings}
        actions={
          <Link
            href="/admin/seo"
            className="text-sm text-[#e8570e] hover:text-[#b8450b] transition-colors"
          >
            ← Back to Overview
          </Link>
        }
      />

      {/* Environment Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-1">
              Setup Required
            </h3>
            <p className="text-sm text-blue-800 mb-2">
              Configure environment variables to enable Google API integration:
            </p>
            <div className="bg-white border border-blue-200 rounded p-3 font-mono text-xs space-y-1">
              <div><span className="text-gray-500"># Required</span></div>
              <div>GSC_SITE_URL=https://your-site.com</div>
              <div>GA4_PROPERTY_ID=123456789</div>
              <div>GOOGLE_CLIENT_EMAIL=service-account@...iam.gserviceaccount.com</div>
              <div>GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."</div>
              <div>CRON_TOKEN=your-secret-token</div>
              <div className="pt-2"><span className="text-gray-500"># Optional</span></div>
              <div>PAGESPEED_API_KEY=your-pagespeed-key</div>
              <div>GSC_QUERY_LIMIT=500</div>
              <div>GSC_PAGE_LIMIT=500</div>
              <div>GA4_LANDING_LIMIT=500</div>
            </div>
            <p className="text-xs text-blue-700 mt-2">
              See <Link href="/docs/google-health-score" className="underline">setup documentation</Link> for detailed instructions.
            </p>
          </div>
        </div>
      </div>

      {/* Alert Rules */}
      <div className="mt-6">
        <AdminTableShell
          title="Alert Rules"
          description="Manage automated monitoring rules and thresholds"
          icon={AlertCircle}
        >
          <div className="space-y-3">
            {alertRules.map((rule: any) => (
              <div
                key={rule.id}
                className="flex items-start gap-4 p-4 border border-gray-200 rounded-md"
              >
                <div className="flex-shrink-0 pt-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    rule.enabled ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <AlertCircle className={`w-5 h-5 ${
                      rule.enabled ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {getAlertTypeLabel(rule.type)}
                    </h3>
                    <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                      rule.severity === 'critical' ? 'bg-red-100 text-red-700' :
                      rule.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                      rule.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {rule.severity}
                    </div>
                    <div className={`px-2 py-0.5 text-xs font-medium rounded ${
                      rule.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {rule.enabled ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-2">
                    {rule.description || 'No description'}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Lookback:</span> {rule.lookback_days} days
                    </div>
                    {rule.thresholds && typeof rule.thresholds === 'object' && (
                      <>
                        {Object.entries(rule.thresholds).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium">{key}:</span> {String(value)}
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <button
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </AdminTableShell>
      </div>

      {/* Watched Pages */}
      {watchedPages.length > 0 && (
        <div className="mt-6">
          <AdminTableShell
            title="Watched Pages"
            description="Pages monitored for Core Web Vitals via PageSpeed Insights"
            icon={Eye}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      URL
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Label
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Added
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {watchedPages.map((page: any) => (
                    <tr key={page.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900 max-w-md truncate">
                        {page.url}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {page.label || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                          page.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {page.active ? 'Active' : 'Paused'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(page.added_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button className="px-3 py-1.5 text-xs border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminTableShell>
        </div>
      )}

      {/* Cron Jobs Info */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Cron Job Endpoints
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Schedule these endpoints to run daily via Vercel Cron or your preferred scheduler:
        </p>
        <div className="space-y-2 font-mono text-xs">
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-blue-600 font-semibold">POST</span>
            <span className="text-gray-900">/api/cron/ingest-gsc</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-blue-600 font-semibold">POST</span>
            <span className="text-gray-900">/api/cron/ingest-ga4</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-blue-600 font-semibold">POST</span>
            <span className="text-gray-900">/api/cron/ingest-pagespeed</span>
            <span className="text-xs text-gray-500">(optional)</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-blue-600 font-semibold">POST</span>
            <span className="text-gray-900">/api/cron/compute-score</span>
          </div>
          <div className="flex items-center gap-2 p-2 bg-white rounded border">
            <span className="text-blue-600 font-semibold">POST</span>
            <span className="text-gray-900">/api/cron/run-alerts</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3">
          All endpoints require <code className="bg-gray-200 px-1 rounded">X-CRON-TOKEN</code> header matching your <code className="bg-gray-200 px-1 rounded">CRON_TOKEN</code> environment variable.
        </p>
      </div>
    </AdminPageShell>
  );
}
