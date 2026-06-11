// Force dynamic rendering for authenticated pages
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { TeamList } from "@/components/teams/TeamList";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TeamsPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/teams");
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1">
        <div className="container mx-auto py-8">
          <TeamList />
        </div>
      </div>
    </div>
  );
}