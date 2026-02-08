import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  MousePointerClick,
  AlertTriangle,
  UserMinus,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

interface HealthMetrics {
  total_sent: number;
  delivered: number;
  failed: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  complained: number;
}

async function getHealthMetrics(hours: number): Promise<HealthMetrics> {
  const since: string = new Date(
    Date.now() - hours * 60 * 60 * 1000
  ).toISOString();

  const [eventsResult, sentResult] = await Promise.all([
    supabaseAdmin
      .from("email_events")
      .select("event_type")
      .gte("occurred_at", since),
    supabaseAdmin
      .from("email_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);

  const counts: HealthMetrics = {
    total_sent: sentResult.count ?? 0,
    delivered: 0,
    failed: 0,
    opened: 0,
    clicked: 0,
    unsubscribed: 0,
    complained: 0,
  };

  for (const row of eventsResult.data ?? []) {
    const t: string = row.event_type;
    if (t !== "total_sent" && t in counts) {
      counts[t as keyof Omit<HealthMetrics, "total_sent">]++;
    }
  }

  return counts;
}

interface EmailLog {
  id: string;
  user_id: string | null;
  to_email: string;
  subject: string;
  tag: string | null;
  mailgun_message_id: string | null;
  status: string;
  last_event_type: string | null;
  last_event_at: string | null;
  created_at: string;
}

async function getRecentLogs(
  query?: string,
  tag?: string,
  status?: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ logs: EmailLog[]; total: number }> {
  let qb = supabaseAdmin
    .from("email_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (tag) qb = qb.eq("tag", tag);
  if (status) qb = qb.eq("status", status);
  if (query) {
    qb = qb.or(
      `to_email.ilike.%${query}%,subject.ilike.%${query}%,user_id.ilike.%${query}%`
    );
  }

  const { data, count, error } = await qb;
  if (error) {
    console.error("[admin/email] logs query error:", error);
    return { logs: [], total: 0 };
  }

  return { logs: (data as EmailLog[]) ?? [], total: count ?? 0 };
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
    range?: string;
    page?: string;
  }>;
}

export default async function AdminEmailPage({ searchParams }: PageProps) {
  // Auth guard
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/admin/email");
  }

  const params = await searchParams;
  const rangeParam: string = params.range ?? "24h";
  const hours: number =
    rangeParam === "30d" ? 720 : rangeParam === "7d" ? 168 : 24;
  const currentPage: number = Math.max(1, Number(params.page ?? "1"));
  const pageSize = 25;
  const offset: number = (currentPage - 1) * pageSize;

  const [metrics, { logs, total }] = await Promise.all([
    getHealthMetrics(hours),
    getRecentLogs(params.query, params.tag, params.status, pageSize, offset),
  ]);

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  const kpis: {
    label: string;
    value: number;
    icon: React.ReactNode;
    color: string;
  }[] = [
    {
      label: "Sent",
      value: metrics.total_sent,
      icon: <Send className="h-5 w-5" />,
      color: "text-blue-500",
    },
    {
      label: "Delivered",
      value: metrics.delivered,
      icon: <CheckCircle2 className="h-5 w-5" />,
      color: "text-green-500",
    },
    {
      label: "Failed",
      value: metrics.failed,
      icon: <XCircle className="h-5 w-5" />,
      color: "text-red-500",
    },
    {
      label: "Opened",
      value: metrics.opened,
      icon: <Eye className="h-5 w-5" />,
      color: "text-purple-500",
    },
    {
      label: "Clicked",
      value: metrics.clicked,
      icon: <MousePointerClick className="h-5 w-5" />,
      color: "text-indigo-500",
    },
    {
      label: "Complained",
      value: metrics.complained,
      icon: <AlertTriangle className="h-5 w-5" />,
      color: "text-orange-500",
    },
    {
      label: "Unsubscribed",
      value: metrics.unsubscribed,
      icon: <UserMinus className="h-5 w-5" />,
      color: "text-yellow-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Mail className="h-8 w-8 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Email Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Mailgun delivery health &amp; message logs
          </p>
        </div>
      </div>

      {/* Range selector */}
      <div className="flex gap-2">
        {(["24h", "7d", "30d"] as const).map((r) => (
          <a
            key={r}
            href={`/admin/email?range=${r}${params.query ? `&query=${params.query}` : ""}${params.tag ? `&tag=${params.tag}` : ""}${params.status ? `&status=${params.status}` : ""}`}
            className={`rounded-xl px-4 py-1.5 text-sm font-medium transition-colors ${
              rangeParam === r
                ? "bg-[var(--vn-primary)] text-white shadow-sm"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {r === "24h" ? "Last 24h" : r === "7d" ? "Last 7 days" : "Last 30 days"}
          </a>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl">
            <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
              <span className={kpi.color}>{kpi.icon}</span>
              <span className="text-2xl font-bold font-display">
                {kpi.value}
              </span>
              <span className="text-xs text-muted-foreground">{kpi.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search / filter bar */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Message Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/email" className="flex flex-wrap gap-3 mb-6">
            <input type="hidden" name="range" value={rangeParam} />
            <input
              name="query"
              type="text"
              placeholder="Search email, subject, user_id…"
              defaultValue={params.query ?? ""}
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]"
            />
            <input
              name="tag"
              type="text"
              placeholder="Tag"
              defaultValue={params.tag ?? ""}
              className="w-32 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]"
            />
            <select
              name="status"
              defaultValue={params.status ?? ""}
              className="w-36 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]"
            >
              <option value="">All statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="complained">Complained</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <button
              type="submit"
              className="rounded-xl bg-[var(--vn-primary)] text-white px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-hover)] transition-colors"
            >
              Search
            </button>
          </form>

          {/* Table */}
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
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No email logs found.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-2.5 pr-4 max-w-[200px] truncate">
                        {log.to_email}
                      </td>
                      <td className="py-2.5 pr-4 max-w-[250px] truncate">
                        {log.subject}
                      </td>
                      <td className="py-2.5 pr-4">
                        {log.tag ? (
                          <Badge variant="outline" className="text-xs">
                            {log.tag}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4">{statusBadge(log.status)}</td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                        {log.last_event_type ? (
                          <span>
                            {log.last_event_type}
                            {log.last_event_at && (
                              <>
                                {" · "}
                                {new Date(log.last_event_at).toLocaleString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {total} total · Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                {currentPage > 1 && (
                  <a
                    href={`/admin/email?range=${rangeParam}&page=${currentPage - 1}${params.query ? `&query=${params.query}` : ""}${params.tag ? `&tag=${params.tag}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors"
                  >
                    ← Prev
                  </a>
                )}
                {currentPage < totalPages && (
                  <a
                    href={`/admin/email?range=${rangeParam}&page=${currentPage + 1}${params.query ? `&query=${params.query}` : ""}${params.tag ? `&tag=${params.tag}` : ""}${params.status ? `&status=${params.status}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors"
                  >
                    Next →
                  </a>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
