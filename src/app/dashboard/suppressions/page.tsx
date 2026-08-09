import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getOrCreateLeadWorkspace, getSuppressionEntries } from "@/lib/lead-intelligence/repository";

export const dynamic = "force-dynamic";

export default async function SuppressionsPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/suppressions");
  }

  let rows: any[] = [];
  let unavailable = false;
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    rows = await getSuppressionEntries(workspace.id);
  } catch (error) {
    console.error("Suppression list unavailable:", error);
    unavailable = true;
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-emerald-700">Lead Intelligence</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Suppression list</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Emails and domains that block commercial outreach.</p>
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          {unavailable ? (
            <p className="p-6 text-sm text-muted-foreground">Lead database tables are not available yet.</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No suppression entries recorded.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr><th className="p-3">Email</th><th className="p-3">Domain</th><th className="p-3">Reason</th><th className="p-3">Source</th></tr>
              </thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="border-b"><td className="p-3 font-mono text-xs">{row.normalized_email ?? "-"}</td><td className="p-3 font-mono text-xs">{row.normalized_domain ?? "-"}</td><td className="p-3">{row.reason}</td><td className="p-3">{row.source}</td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
