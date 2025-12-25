import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Eye, Plug, Settings, BookOpen } from "lucide-react";

export const metadata = {
  title: 'Search Visibility - VexNexa Admin',
  description: 'Track search rankings and click-through rates',
};

export default async function AdminSeoVisibilityPage() {
  const kpis: KpiCardData[] = [
    {
      label: "Total Impressions",
      value: "—",
      valueColor: "text-gray-400",
      primary: true,
      subtitle: "Last 30 days",
    },
    {
      label: "Total Clicks",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Avg. CTR",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Avg. Position",
      value: "—",
      valueColor: "text-gray-400",
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Search Visibility"
        subtitle="Monitor search impressions, clicks, and rankings"
        icon={Eye}
      />

      <AdminKpiGrid kpis={kpis} columns={4} />

      <div className="mt-6">
        <AdminEmptyState
          icon={Eye}
          title="Search visibility data not available"
          description={
            <div className="space-y-2">
              <p>
                Connect Google Search Console to view detailed search analytics
                including impressions, clicks, CTR, and average position.
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
            {
              label: "Learn More",
              variant: "ghost",
              icon: BookOpen,
              href: "/docs/seo/visibility",
            },
          ]}
          helpText={
            <p>
              Track how often your pages appear in search results,
              measure click-through rates, and identify ranking opportunities.
            </p>
          }
        />
      </div>
    </AdminPageShell>
  );
}
