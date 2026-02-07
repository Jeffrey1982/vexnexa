// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { TeamList } from "@/components/teams/TeamList";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { requireAuth } from "@/lib/auth";

export default async function TeamsPage() {
  const user = await requireAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
        <div className="container mx-auto py-8">
          <TeamList />
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}