import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Database, Plug, Settings, BookOpen } from "lucide-react";

export const metadata = {
  title: 'Index Health - VexNexa Admin',
  description: 'Monitor page indexing status and coverage',
};

export default async function AdminSeoIndexHealthPage() {
  const kpis: KpiCardData[] = [
    {
      label: "Total Pages",
      value: "—",
      valueColor: "text-gray-400",
      primary: true,
      subtitle: "Connect Google to track",
    },
    {
      label: "Indexed",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Valid with Warnings",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Excluded / Errors",
      value: "—",
      valueColor: "text-gray-400",
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Index Health"
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
            {
              label: "Learn More",
              variant: "ghost",
              icon: BookOpen,
              href: "/docs/seo/index-health",
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
