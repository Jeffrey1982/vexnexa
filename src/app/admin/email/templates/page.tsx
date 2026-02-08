import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LayoutTemplate, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: unknown;
  created_at: string;
  updated_at: string;
}

interface TemplatesResponse {
  templates: EmailTemplate[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function TemplatesPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/templates"); }

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

  let templates: EmailTemplate[] = [];
  let total = 0;
  try {
    const data = await adminFetch<TemplatesResponse>(`/api/admin/email/templates?limit=${pageSize}&offset=${offset}`);
    templates = data.templates;
    total = data.total;
  } catch (e) {
    console.error("[admin/email/templates] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Email Templates</h1>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Create Template</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="POST" action="/admin/email/templates" className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <input name="name" type="text" placeholder="Template name" required
                className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
              <input name="subject" type="text" placeholder="Subject line"
                className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <textarea name="html" placeholder="HTML body" rows={4}
              className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <textarea name="text" placeholder="Plain text body" rows={3}
              className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary)] text-white px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-hover)] transition-colors">
              Create Template
            </button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Has HTML</th>
                  <th className="pb-2 pr-4 font-medium">Has Text</th>
                  <th className="pb-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No templates yet.</td></tr>
                ) : (
                  templates.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4 font-medium">{t.name}</td>
                      <td className="py-2.5 pr-4 max-w-[250px] truncate">{t.subject || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs">{t.html ? "Yes" : "No"}</td>
                      <td className="py-2.5 pr-4 text-xs">{t.text ? "Yes" : "No"}</td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.updated_at).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
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
                  <a href={`/admin/email/templates?page=${currentPage - 1}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/email/templates?page=${currentPage + 1}`}
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
