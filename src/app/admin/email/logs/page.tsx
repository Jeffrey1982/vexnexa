import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface EmailLog {
  id: string;
  user_id: string | null;
  to_email: string;
  subject: string;
  tag: string | null;
  status: string;
  last_event_type: string | null;
  last_event_at: string | null;
  created_at: string;
}

interface LogsResponse {
  logs: EmailLog[];
  total: number;
}

function statusBadge(status: string): React.ReactNode {
  const map: Record<string, { variant: "default" | "destructive" | "outline" | "secondary"; label: string }> = {
    sent: { variant: "secondary", label: "Sent" },
    delivered: { variant: "default", label: "Delivered" },
    failed: { variant: "destructive", label: "Failed" },
    complained: { variant: "destructive", label: "Complained" },
    unsubscribed: { variant: "outline", label: "Unsubscribed" },
  };
  const cfg = map[status] ?? { variant: "outline" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

interface PageProps {
  searchParams: Promise<{
    query?: string;
    tag?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function EmailLogsPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/logs"); }

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
  if (params.query) sp.set("query", params.query);
  if (params.tag) sp.set("tag", params.tag);
  if (params.status) sp.set("status", params.status);

  let logs: EmailLog[] = [];
  let total = 0;
  try {
    const data = await adminFetch<LogsResponse>(`/api/admin/email/logs?${sp.toString()}`);
    logs = data.logs;
    total = data.total;
  } catch (e) {
    console.error("[admin/email/logs] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ScrollText className="h-7 w-7 text-[var(--vn-primary)]" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Message Logs</h1>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/email/logs" className="flex flex-wrap gap-3 mb-6">
            <input name="query" type="text" placeholder="Search email, subject, user_id…" defaultValue={params.query ?? ""}
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <input name="tag" type="text" placeholder="Tag" defaultValue={params.tag ?? ""}
              className="w-32 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <select name="status" defaultValue={params.status ?? ""}
              className="w-36 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="complained">Complained</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors">
              Search
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">To</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Tag</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Last Event</th>
                  <th className="pb-2 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No email logs found.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 max-w-[200px] truncate">{log.to_email}</td>
                      <td className="py-2.5 pr-4 max-w-[250px] truncate">{log.subject}</td>
                      <td className="py-2.5 pr-4">
                        {log.tag ? <Badge variant="outline" className="text-xs">{log.tag}</Badge> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">{statusBadge(log.status)}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {log.last_event_type ?? "—"}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                  <a href={`/admin/email/logs?page=${currentPage - 1}${params.query ? `&query=${params.query}` : ""}${params.tag ? `&tag=${params.tag}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/email/logs?page=${currentPage + 1}${params.query ? `&query=${params.query}` : ""}${params.tag ? `&tag=${params.tag}` : ""}${params.status ? `&status=${params.status}` : ""}`}
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
