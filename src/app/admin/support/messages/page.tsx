import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { adminFetch, hasAdminSecret } from "@/lib/adminFetch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Inbox, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

interface SupportMessage {
  id: string;
  ticket_id: string;
  from_email: string;
  body: string;
  created_at: string;
}

interface MessagesResponse {
  messages: SupportMessage[];
  total: number;
}

interface SupportTicket {
  id: string;
  email: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
}

interface TicketsResponse {
  tickets: SupportTicket[];
  total: number;
}

interface PageProps {
  searchParams: Promise<{ ticket_id?: string }>;
}

export default async function MessagesPage({ searchParams }: PageProps) {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/support/messages"); }

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
  const ticketId: string | undefined = params.ticket_id;

  if (!ticketId) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <Inbox className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Messages</h1>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="pt-6 pb-6 text-center">
            <p className="text-muted-foreground text-sm">
              Select a ticket from the{" "}
              <a href="/admin/support/tickets" className="text-[var(--vn-primary)] hover:underline">Tickets</a>{" "}
              page to view its message thread.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  let ticket: SupportTicket | null = null;
  let messages: SupportMessage[] = [];

  try {
    const ticketData = await adminFetch<TicketsResponse>(`/api/admin/support/tickets?query=${ticketId}&limit=1`);
    ticket = ticketData.tickets.find((t) => t.id === ticketId) ?? null;
  } catch (e) {
    console.error("[admin/support/messages] ticket fetch error:", e);
  }

  try {
    const msgData = await adminFetch<MessagesResponse>(`/api/admin/support/messages?ticket_id=${ticketId}`);
    messages = msgData.messages;
  } catch (e) {
    console.error("[admin/support/messages] messages fetch error:", e);
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Inbox className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Message Thread</h1>
          {ticket && (
            <p className="text-muted-foreground text-sm">
              {ticket.subject} — {ticket.email} — {ticket.status}
            </p>
          )}
        </div>
      </div>

      <a href="/admin/support/tickets" className="inline-block text-sm text-[var(--vn-primary)] hover:underline">
        ← Back to Tickets
      </a>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Messages ({messages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">No messages in this thread yet.</p>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="rounded-xl border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{msg.from_email}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{msg.body}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
