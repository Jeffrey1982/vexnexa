import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  type KpiCardData,
} from "@/components/admin/layout";
import { Award, Plug, Settings, BookOpen } from "lucide-react";

export const metadata = {
  title: 'Page Quality - VexNexa Admin',
  description: 'Monitor Core Web Vitals and page experience metrics',
};

export default async function AdminSeoPageQualityPage() {
  const kpis: KpiCardData[] = [
    {
      label: "Good Pages",
      value: "—",
      valueColor: "text-gray-400",
      primary: true,
      subtitle: "Core Web Vitals",
    },
    {
      label: "Needs Improvement",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Poor Pages",
      value: "—",
      valueColor: "text-gray-400",
    },
    {
      label: "Mobile Usability",
      value: "—",
      valueColor: "text-gray-400",
    },
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Page Quality"
        subtitle="Monitor Core Web Vitals and page experience signals"
        icon={Award}
      />

      <AdminKpiGrid kpis={kpis} columns={4} />

      <div className="mt-6">
        <AdminEmptyState
          icon={Award}
          title="Page quality data not available"
          description={
            <div className="space-y-2">
              <p>
                Connect Google Search Console to monitor Core Web Vitals,
                page experience metrics, and mobile usability issues.
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
              href: "/docs/seo/page-quality",
            },
          ]}
          helpText={
            <p>
              Track Largest Contentful Paint (LCP), First Input Delay (FID),
              Cumulative Layout Shift (CLS), and mobile usability metrics.
            </p>
          }
        />
      </div>
    </AdminPageShell>
  );
}
