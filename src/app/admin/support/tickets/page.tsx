import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ticket, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    query?: string;
    page?: string;
  }>;
}

const statusVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  open: "default",
  in_progress: "secondary",
  resolved: "outline",
  closed: "outline",
};

const priorityVariant: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
  low: "outline",
  normal: "secondary",
  high: "default",
  urgent: "destructive",
};

export default async function TicketsPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/support/tickets"); }

  if (!hasAdminSecret()) {
    return (
      <div className="p-8 flex justify-center">
        <Card className="rounded-2xl max-w-md">
          <CardContent className="pt-6 pb-6 px-6 text-center">
            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ADMIN_DASH_SECRET is not configured.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const params = await searchParams;
  const currentPage: number = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 25;
  const offset: number = (currentPage - 1) * pageSize;

  const sp = new URLSearchParams();
  sp.set("limit", String(pageSize));
  sp.set("offset", String(offset));
  if (params.status) sp.set("status", params.status);
  if (params.priority) sp.set("priority", params.priority);
  if (params.query) sp.set("query", params.query);

  let tickets: SupportTicket[] = [];
  let total = 0;
  try {
    const data = await adminFetch<TicketsResponse>(`/api/admin/support/tickets?${sp.toString()}`);
    tickets = data.tickets;
    total = data.total;
  } catch (e) {
    console.error("[admin/support/tickets] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Ticket className="h-7 w-7 text-[var(--vn-primary)]" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Support Tickets</h1>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/support/tickets" className="flex flex-wrap gap-3 mb-6">
            <input name="query" type="text" placeholder="Search email, subject…" defaultValue={params.query ?? ""}
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <select name="status" defaultValue={params.status ?? ""}
              className="w-36 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <select name="priority" defaultValue={params.priority ?? ""}
              className="w-36 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="">All priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary)] text-white px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-hover)] transition-colors">
              Search
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Priority</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No tickets yet.</td></tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 max-w-[200px] truncate">{t.email}</td>
                      <td className="py-2.5 pr-4 max-w-[250px] truncate">
                        <a href={`/admin/support/messages?ticket_id=${t.id}`} className="text-[var(--vn-primary)] hover:underline">
                          {t.subject}
                        </a>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={statusVariant[t.status] ?? "outline"}>{t.status.replace("_", " ")}</Badge>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={priorityVariant[t.priority] ?? "outline"}>{t.priority}</Badge>
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.updated_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">{total} total · Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a href={`/admin/support/tickets?page=${currentPage - 1}${params.status ? `&status=${params.status}` : ""}${params.priority ? `&priority=${params.priority}` : ""}${params.query ? `&query=${params.query}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/support/tickets?page=${currentPage + 1}${params.status ? `&status=${params.status}` : ""}${params.priority ? `&priority=${params.priority}` : ""}${params.query ? `&query=${params.query}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">Next →</a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
