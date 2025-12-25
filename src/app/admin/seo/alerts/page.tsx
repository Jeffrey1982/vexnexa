import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Bell, Plug, Settings, BookOpen } from "lucide-react";

export const metadata = {
  title: 'SEO Alerts - VexNexa Admin',
  description: 'Track SEO issues and alerts',
};

export default async function AdminSeoAlertsPage() {
  const kpis: KpiCardData[] = [
    {
      label: "Active Alerts",
      value: "—",
      valueColor: "text-gray-400",
      primary: true,
      subtitle: "Requires attention",
    },
    {
      label: "Critical Issues",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Warnings",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Resolved (7d)",
      value: "—",
      valueColor: "text-gray-400",
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="SEO Alerts"
        subtitle="Monitor and track technical SEO issues"
        icon={Bell}
      />

      <AdminKpiGrid kpis={kpis} columns={4} />

      <div className="mt-6">
        <AdminEmptyState
          icon={Bell}
          title="SEO alerts not available"
          description={
            <div className="space-y-2">
              <p>
                Connect Google Search Console to receive automated alerts
                for crawl errors, indexing issues, and manual actions.
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
              label: "Alert Settings",
              variant: "outline",
              icon: Settings,
              href: "/admin/seo/settings",
            },
            {
              label: "Learn More",
              variant: "ghost",
              icon: BookOpen,
              href: "/docs/seo/alerts",
            },
          ]}
          helpText={
            <p>
              Get notified about critical SEO issues including server errors,
              blocked resources, mobile usability problems, and manual penalties.
            </p>
          }
        />
      </div>
    </AdminPageShell>
  );
}
