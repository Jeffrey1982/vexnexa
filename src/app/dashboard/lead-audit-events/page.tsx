import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getAuditEvents, getOrCreateLeadWorkspace } from "@/lib/lead-intelligence/repository";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default async function LeadAuditEventsPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/lead-audit-events");
  }

  let rows: any[] = [];
  let unavailable = false;
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    rows = await getAuditEvents(workspace.id);
  } catch (error) {
    console.error("Lead audit events unavailable:", error);
    unavailable = true;
  }

  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-emerald-700">Lead Intelligence</p>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Audit events</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Server-side records for imports and future lead decisions.</p>
        <div className="mt-6 overflow-hidden rounded-lg border bg-card">
          {unavailable ? (
            <p className="p-6 text-sm text-muted-foreground">Lead database tables are not available yet.</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No audit events recorded.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-muted/40">
                <tr><th className="p-3">Created</th><th className="p-3">Event</th><th className="p-3">Entity</th><th className="p-3">Metadata</th></tr>
              </thead>
              <tbody>{rows.map((row) => <tr key={row.id} className="border-b align-top"><td className="p-3">{formatDate(row.created_at)}</td><td className="p-3">{row.event_type}</td><td className="p-3">{row.entity_type}</td><td className="p-3"><pre className="max-w-xl overflow-auto text-xs">{JSON.stringify(row.metadata, null, 2)}</pre></td></tr>)}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
