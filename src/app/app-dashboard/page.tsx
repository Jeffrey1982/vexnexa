import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SiteList } from "@/components/dashboard/SiteList";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { RecentScans } from "@/components/dashboard/RecentScans";
import { QuickActions } from "@/components/dashboard/QuickActions";

export default async function AppDashboardPage() {
  let user;

  try {
    user = await requireAuth();
  } catch (error) {
    // Clean redirect to login without any cached parameters
    redirect("/auth/login?redirect=/app-dashboard&v=" + Date.now());
  }

  // Get user's sites with recent scans
  const sites = await prisma.site.findMany({
    where: { userId: user.id },
    include: {
      scans: {
        where: { status: "done" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          score: true,
          impactCritical: true,
          impactSerious: true,
          impactModerate: true,
          impactMinor: true,
          issues: true,
          createdAt: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  // Get recent scans across all sites
  const recentScans = await prisma.scan.findMany({
    where: {
      siteId: { in: sites.map(s => s.id) },
      status: "done"
    },
    include: {
      site: {
        select: {
          url: true,
          name: true
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.firstName || user.email}
          </p>
        </div>

        {/* Stats */}
        <DashboardStats sites={sites} />

        {/* Quick Actions */}
        <QuickActions />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sites List */}
          <div>
            <SiteList sites={sites} />
          </div>

          {/* Recent Scans */}
          <div>
            <RecentScans scans={recentScans} />
          </div>
        </div>
      </div>
    </div>
  );
}