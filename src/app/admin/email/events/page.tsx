import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Webhook, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface EmailEvent {
  id: string;
  mailgun_message_id: string | null;
  event_type: string;
  severity: string | null;
  reason: string | null;
  recipient: string | null;
  occurred_at: string;
}

interface EventsResponse {
  events: EmailEvent[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{
    event_type?: string;
    message_id?: string;
    page?: string;
  }>;
}

export default async function WebhookEventsPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/events"); }

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
  if (params.event_type) sp.set("event_type", params.event_type);
  if (params.message_id) sp.set("message_id", params.message_id);

  let events: EmailEvent[] = [];
  let total = 0;
  try {
    const data = await adminFetch<EventsResponse>(`/api/admin/email/events?${sp.toString()}`);
    events = data.events;
    total = data.total;
  } catch (e) {
    console.error("[admin/email/events] fetch error:", e);
  }

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  const eventColor: Record<string, string> = {
    delivered: "default",
    failed: "destructive",
    opened: "secondary",
    clicked: "secondary",
    complained: "destructive",
    unsubscribed: "outline",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Webhook className="h-7 w-7 text-[var(--vn-primary)]" />
        <h1 className="font-display text-2xl font-bold tracking-tight">Webhook Events</h1>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" action="/admin/email/events" className="flex flex-wrap gap-3 mb-6">
            <select name="event_type" defaultValue={params.event_type ?? ""}
              className="w-40 rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]">
              <option value="">All events</option>
              <option value="delivered">Delivered</option>
              <option value="failed">Failed</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="complained">Complained</option>
              <option value="unsubscribed">Unsubscribed</option>
            </select>
            <input name="message_id" type="text" placeholder="Message ID" defaultValue={params.message_id ?? ""}
              className="flex-1 min-w-[200px] rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary-aaa-btn)] text-[var(--vn-on-primary-aaa-btn)] px-5 py-2 text-sm font-medium hover:bg-[var(--vn-primary-aaa-btn-hover)] transition-colors">
              Filter
            </button>
          </form>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Event</th>
                  <th className="pb-2 pr-4 font-medium">Recipient</th>
                  <th className="pb-2 pr-4 font-medium">Message ID</th>
                  <th className="pb-2 pr-4 font-medium">Severity</th>
                  <th className="pb-2 pr-4 font-medium">Reason</th>
                  <th className="pb-2 font-medium">Occurred At</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No webhook events yet.</td></tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                      <td className="py-2.5 pr-4">
                        <Badge variant={(eventColor[ev.event_type] as "default" | "destructive" | "outline" | "secondary") ?? "outline"}>
                          {ev.event_type}
                        </Badge>
                      </td>
                      <td className="py-2.5 pr-4 max-w-[200px] truncate">{ev.recipient ?? "—"}</td>
                      <td className="py-2.5 pr-4 max-w-[180px] truncate text-xs font-mono">{ev.mailgun_message_id ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs">{ev.severity ?? "—"}</td>
                      <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{ev.reason ?? "—"}</td>
                      <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(ev.occurred_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
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
                  <a href={`/admin/email/events?page=${currentPage - 1}${params.event_type ? `&event_type=${params.event_type}` : ""}${params.message_id ? `&message_id=${params.message_id}` : ""}`}
                    className="rounded-lg border px-3 py-1 text-sm hover:bg-muted transition-colors">← Prev</a>
                )}
                {currentPage < totalPages && (
                  <a href={`/admin/email/events?page=${currentPage + 1}${params.event_type ? `&event_type=${params.event_type}` : ""}${params.message_id ? `&message_id=${params.message_id}` : ""}`}
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
