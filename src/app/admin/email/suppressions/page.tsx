import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldBan, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface Suppression {
  id: string;
  email: string;
  type: string;
  reason: string | null;
  created_at: string;
}

interface SuppressionsResponse {
  suppressions: Suppression[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{ type?: string; page?: string }>;
}

export default async function SuppressionsPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/suppressions"); }

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
  if (params.type) sp.set("type", params.type);

  let suppressions: Suppression[] = [];
  let total = 0;
  try {
    const data = await adminFetch<SuppressionsResponse>(`/api/admin/email/suppressions?${sp.toString()}`);
    suppressions = data.suppressions;
    total = data.total;
  } catch (e) {
    console.error("[admin/email/suppressions] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  const typeColor: Record<string, "default" | "destructive" | "outline" | "secondary"> = {
    manual: "secondary",
    bounce: "destructive",
    complaint: "destructive",
    unsubscribe: "outline",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldBan className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Suppressions</h1>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Add Suppression</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/admin/email/suppressions" className="flex flex-wrap gap-3">
            <input name="email" type="email" placeholder="email@example.com" required
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <select name="type" defaultValue="manual"
              className="w-40 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="manual">Manual</option>
              <option value="bounce">Bounce</option>
              <option value="complaint">Complaint</option>
              <option value="unsubscribe">Unsubscribe</option>
            </select>
            <input name="reason" type="text" placeholder="Reason (optional)"
              className="w-48 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors">
              Add
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Suppression List</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/email/suppressions" className="flex flex-wrap gap-3 mb-6">
            <select name="type" defaultValue={params.type ?? ""}
              className="w-40 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="">All types</option>
              <option value="manual">Manual</option>
              <option value="bounce">Bounce</option>
              <option value="complaint">Complaint</option>
              <option value="unsubscribe">Unsubscribe</option>
            </select>
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors">
              Filter
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Type</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Added</th>
                </tr>
              </thead>
              <tbody>
                {suppressions.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No suppressions yet.</td></tr>
                ) : (
                  suppressions.map((s) => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4">{s.email}</td>
                      <td className="py-2.5 pr-4">
                        <Badge variant={typeColor[s.type] ?? "outline"}>{s.type}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-xs max-w-[250px] truncate">{s.reason ?? "—"}</td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(s.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                  <a href={`/admin/email/suppressions?page=${currentPage - 1}${params.type ? `&type=${params.type}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/email/suppressions?page=${currentPage + 1}${params.type ? `&type=${params.type}` : ""}`}
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
