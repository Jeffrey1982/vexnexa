import { redirect } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  Bug,
  CheckCircle2,
  ClipboardList,
  Eye,
  Megaphone,
  Pencil,
  Radar,
  Send,
} from "lucide-react";
import { StatusUpdateType } from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { saveStatusUpdate, setStatusUpdatePublication } from "@/app/actions/status-updates";

export const dynamic = "force-dynamic";

const typeOptions: Array<{ value: StatusUpdateType; label: string }> = [
  { value: "KNOWN_ISSUE", label: "Known issue" },
  { value: "INCIDENT", label: "Incident" },
  { value: "FIX", label: "Fix" },
  { value: "PRODUCT_UPDATE", label: "Product update" },
];

const publicStatuses = ["Investigating", "Fix in progress", "Monitoring", "Resolved", "Clear"];
const severities = ["Informational", "Low", "Medium", "High", "Critical"];

function labelType(type: StatusUpdateType) {
  return typeOptions.find((option) => option.value === type)?.label ?? type;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Not set";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SelectField({
  name,
  defaultValue,
  options,
}: {
  name: string;
  defaultValue?: string;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
    >
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.value;
        const label = typeof option === "string" ? option : option.label;
        return (
          <option key={value} value={value}>
            {label}
          </option>
        );
      })}
    </select>
  );
}

function TextInput({
  name,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      className="h-10 rounded-md border border-border bg-background px-3 text-sm"
    />
  );
}

function TextArea({
  name,
  defaultValue,
  placeholder,
  required,
}: {
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <textarea
      name={name}
      defaultValue={defaultValue ?? ""}
      placeholder={placeholder}
      required={required}
      rows={3}
      className="rounded-md border border-border bg-background px-3 py-2 text-sm"
    />
  );
}

function PublicationControls({ id, isPublished }: { id: string; isPublished: boolean }) {
  return (
    <form action={setStatusUpdatePublication} className="flex flex-wrap gap-2">
      <input type="hidden" name="id" value={id} />
      {isPublished ? (
        <Button type="submit" name="intent" value="unpublish" variant="outline" size="sm">
          Unpublish
        </Button>
      ) : (
        <Button type="submit" name="intent" value="publish" size="sm">
          <Send className="mr-2 h-4 w-4" aria-hidden="true" />
          Publish
        </Button>
      )}
      <Button type="submit" name="intent" value="archive" variant="secondary" size="sm">
        Archive
      </Button>
    </form>
  );
}

export default async function AdminStatusUpdatesPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/auth/login?redirect=/admin/status-updates");
  }

  const [statusUpdates, bugTickets, scanIssues, counts] = await Promise.all([
    prisma.statusUpdate.findMany({
      where: { archivedAt: null },
      orderBy: [{ isPublished: "desc" }, { updatedAt: "desc" }],
      take: 30,
    }),
    prisma.supportTicket.findMany({
      where: { category: "BUG_REPORT" },
      include: {
        user: { select: { email: true, company: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    }),
    prisma.issue.findMany({
      where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
      include: {
        scan: {
          include: {
            site: { select: { url: true } },
          },
        },
      },
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      take: 20,
    }),
    Promise.all([
      prisma.statusUpdate.count({ where: { archivedAt: null, isPublished: false } }),
      prisma.statusUpdate.count({ where: { archivedAt: null, isPublished: true } }),
      prisma.supportTicket.count({ where: { category: "BUG_REPORT", status: { in: ["OPEN", "IN_PROGRESS"] } } }),
      prisma.issue.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]),
  ]);

  const [draftCount, publishedCount, openBugTicketCount, openScanIssueCount] = counts;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Megaphone className="h-7 w-7 text-primary" aria-hidden="true" />
            <h1 className="font-display text-2xl font-bold tracking-tight">Status Updates Review</h1>
          </div>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Review bug reports and scan issues internally, draft a public note, then publish it to the Status & Updates page.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/updates" target="_blank" rel="noreferrer">
            View public page
            <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Drafts", value: draftCount, icon: Pencil },
          { label: "Published", value: publishedCount, icon: Eye },
          { label: "Open bug reports", value: openBugTicketCount, icon: Bug },
          { label: "Open scan issues", value: openScanIssueCount, icon: Radar },
        ].map((metric) => {
          const Icon = metric.icon;
          return (
            <Card key={metric.label} className="rounded-lg">
              <CardContent className="flex items-center justify-between p-5">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="mt-1 text-2xl font-bold">{metric.value}</p>
                </div>
                <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Create manual update</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveStatusUpdate} className="grid gap-3 lg:grid-cols-2">
            <TextInput name="title" placeholder="Public title" required />
            <div className="grid gap-3 sm:grid-cols-3">
              <SelectField name="type" defaultValue="KNOWN_ISSUE" options={typeOptions} />
              <SelectField name="publicStatus" defaultValue="Investigating" options={publicStatuses} />
              <SelectField name="severity" defaultValue="Informational" options={severities} />
            </div>
            <div className="lg:col-span-2">
              <TextArea name="summary" placeholder="Public summary: impact, status and workaround if available" required />
            </div>
            <div className="lg:col-span-2">
              <TextArea name="body" placeholder="Optional internal/public detail" />
            </div>
            <div className="flex gap-2 lg:col-span-2">
              <Button type="submit" name="intent" value="save" variant="outline">
                Save draft
              </Button>
              <Button type="submit" name="intent" value="publish">
                Publish now
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" aria-hidden="true" />
          <h2 className="font-display text-xl font-semibold">Drafts and published status items</h2>
        </div>

        {statusUpdates.length === 0 ? (
          <Card className="rounded-lg">
            <CardContent className="p-6 text-sm text-muted-foreground">No status updates yet.</CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {statusUpdates.map((update) => (
              <Card key={update.id} className="rounded-lg">
                <CardContent className="p-5">
                  <form action={saveStatusUpdate} className="grid gap-3 lg:grid-cols-2">
                    <input type="hidden" name="id" value={update.id} />
                    <TextInput name="title" defaultValue={update.title} required />
                    <div className="grid gap-3 sm:grid-cols-3">
                      <SelectField name="type" defaultValue={update.type} options={typeOptions} />
                      <SelectField name="publicStatus" defaultValue={update.publicStatus} options={publicStatuses} />
                      <SelectField name="severity" defaultValue={update.severity} options={severities} />
                    </div>
                    <div className="lg:col-span-2">
                      <TextArea name="summary" defaultValue={update.summary} required />
                    </div>
                    <div className="lg:col-span-2">
                      <TextArea name="body" defaultValue={update.body} />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3 lg:col-span-2">
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <Badge variant={update.isPublished ? "default" : "secondary"}>
                          {update.isPublished ? "Published" : "Draft"}
                        </Badge>
                        <Badge variant="outline">{labelType(update.type)}</Badge>
                        <span>Updated {formatDate(update.updatedAt)}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" name="intent" value={update.isPublished ? "publish" : "save"} variant="outline" size="sm">
                          Save
                        </Button>
                      </div>
                    </div>
                  </form>
                  <div className="mt-3">
                    <PublicationControls id={update.id} isPublished={update.isPublished} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" aria-hidden="true" />
              Bug report queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {bugTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bug report tickets found.</p>
            ) : (
              bugTickets.map((ticket) => {
                const latestMessage = ticket.messages[0]?.message ?? "";
                return (
                  <div key={ticket.id} className="rounded-lg border border-border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="font-semibold">{ticket.subject}</h3>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {ticket.user.email} · {ticket.status.replace("_", " ")} · {formatDate(ticket.updatedAt)}
                        </p>
                      </div>
                      <Badge variant={ticket.priority === "HIGH" ? "destructive" : "secondary"}>{ticket.priority}</Badge>
                    </div>
                    {latestMessage && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{latestMessage}</p>}
                    <form action={saveStatusUpdate} className="mt-4 flex flex-wrap gap-2">
                      <input type="hidden" name="type" value="KNOWN_ISSUE" />
                      <input type="hidden" name="title" value={ticket.subject} />
                      <input type="hidden" name="summary" value={latestMessage || ticket.subject} />
                      <input type="hidden" name="body" value={latestMessage} />
                      <input type="hidden" name="publicStatus" value={ticket.status === "RESOLVED" ? "Resolved" : "Investigating"} />
                      <input type="hidden" name="severity" value={ticket.priority === "HIGH" ? "High" : "Medium"} />
                      <input type="hidden" name="sourceType" value="support_ticket" />
                      <input type="hidden" name="sourceId" value={ticket.id} />
                      <input type="hidden" name="sourceUrl" value={`/admin/support/messages?ticket_id=${ticket.id}`} />
                      <Button type="submit" name="intent" value="save" variant="outline" size="sm">
                        Create draft
                      </Button>
                      <Button type="submit" name="intent" value="publish" size="sm">
                        Publish
                      </Button>
                    </form>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" aria-hidden="true" />
              Scan issue candidates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scanIssues.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open scan issues found.</p>
            ) : (
              scanIssues.map((issue) => (
                <div key={issue.id} className="rounded-lg border border-border p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="font-semibold">{issue.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {issue.scan.site.url} · {issue.status.replace("_", " ")} · {issue.priority}
                      </p>
                    </div>
                    <Badge variant={issue.priority === "CRITICAL" ? "destructive" : "secondary"}>{issue.impact ?? issue.priority}</Badge>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                    {issue.failureSummary || issue.description || issue.pageUrl || "No public-safe summary available yet."}
                  </p>
                  <form action={saveStatusUpdate} className="mt-4 flex flex-wrap gap-2">
                    <input type="hidden" name="type" value="KNOWN_ISSUE" />
                    <input type="hidden" name="title" value={`Accessibility issue: ${issue.title}`} />
                    <input type="hidden" name="summary" value={issue.failureSummary || issue.description || issue.title} />
                    <input type="hidden" name="body" value={`Affected site: ${issue.scan.site.url}${issue.pageUrl ? `\nPage: ${issue.pageUrl}` : ""}`} />
                    <input type="hidden" name="publicStatus" value="Investigating" />
                    <input type="hidden" name="severity" value={issue.priority === "CRITICAL" ? "High" : "Medium"} />
                    <input type="hidden" name="sourceType" value="scan_issue" />
                    <input type="hidden" name="sourceId" value={issue.id} />
                    <input type="hidden" name="sourceUrl" value={`/scans/${issue.scanId}`} />
                    <Button type="submit" name="intent" value="save" variant="outline" size="sm">
                      Create draft
                    </Button>
                    <Button type="submit" name="intent" value="publish" size="sm">
                      Publish
                    </Button>
                  </form>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-amber-200 bg-amber-50">
        <CardContent className="flex gap-3 p-5 text-sm text-amber-950">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none" aria-hidden="true" />
          <p>
            Keep security details, customer names, exploit steps and credentials out of public updates. Use impact, workaround,
            status and next step instead.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
