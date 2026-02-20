import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface ContactLog {
  id: string;
  email: string;
  name: string;
  message: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

interface ContactLogsResponse {
  logs: ContactLog[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{ query?: string; page?: string }>;
}

export default async function ContactLogsPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/support/contact-logs"); }

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
  const pageSize = 30;
  const offset: number = (currentPage - 1) * pageSize;

  const sp = new URLSearchParams();
  sp.set("limit", String(pageSize));
  sp.set("offset", String(offset));
  if (params.query) sp.set("query", params.query);

  let logs: ContactLog[] = [];
  let total = 0;
  try {
    const data = await adminFetch<ContactLogsResponse>(`/api/admin/support/contact-logs?${sp.toString()}`);
    logs = data.logs;
    total = data.total;
  } catch (e) {
    console.error("[admin/support/contact-logs] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ClipboardList className="h-7 w-7 text-[var(--vn-primary)]" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Contact Form Logs</h1>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Search</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/support/contact-logs" className="flex flex-wrap gap-3 mb-6">
            <input name="query" type="text" placeholder="Search email, name, message…" defaultValue={params.query ?? ""}
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors">
              Search
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Message</th>
                  <th className="pb-2 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No contact form submissions yet.</td></tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 max-w-[150px] truncate">{log.name || "—"}</td>
                      <td className="py-2.5 pr-4 max-w-[200px] truncate">{log.email}</td>
                      <td className="py-2.5 pr-4 max-w-[350px] truncate">{log.message || "—"}</td>
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
                  <a href={`/admin/support/contact-logs?page=${currentPage - 1}${params.query ? `&query=${params.query}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/support/contact-logs?page=${currentPage + 1}${params.query ? `&query=${params.query}` : ""}`}
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
