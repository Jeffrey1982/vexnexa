import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Search, Plug, Settings, BookOpen } from "lucide-react";

export const metadata = {
  title: 'SEO Health - VexNexa Admin',
  description: 'Monitor SEO performance and search visibility',
};

export default async function AdminSeoPage() {
  // Placeholder KPIs - will be populated when Google integration is connected
  const kpis: KpiCardData[] = [
    {
      label: "Indexed Pages",
      value: "—",
      valueColor: "text-gray-400",
      primary: true,
      subtitle: "Connect Google to track",
    },
    {
      label: "Search Impressions",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Avg. Position",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Click-through Rate",
      value: "—",
      valueColor: "text-gray-400",
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
          <div className="flex gap-2">
            {/* Placeholder for future actions */}
          </div>
        }
      />

      {/* KPI Grid */}
      <AdminKpiGrid kpis={kpis} columns={4} />

      {/* Empty State - Connect Google */}
      <div className="mt-6">
        <AdminEmptyState
          icon={Search}
          title="Connect Google Search Console"
          description={
            <div className="space-y-2">
              <p>
                Get comprehensive insights into your site's search performance
                by connecting Google Search Console.
              </p>
              <p className="text-sm">
                Track indexed pages, search impressions, click-through rates,
                and identify technical SEO issues.
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
              href: "/docs/seo",
            },
          ]}
          helpText={
            <div className="space-y-1">
              <p>
                Once connected, you'll see real-time data on:
              </p>
              <ul className="text-sm list-disc list-inside space-y-1">
                <li>Index coverage and health</li>
                <li>Search visibility and rankings</li>
                <li>Page quality metrics</li>
                <li>Technical SEO alerts</li>
              </ul>
            </div>
          }
        />
      </div>
    </AdminPageShell>
  );
}
