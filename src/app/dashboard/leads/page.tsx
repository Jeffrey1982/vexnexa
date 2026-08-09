import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Upload } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLeadOverviewRows, getOrCreateLeadWorkspace } from "@/lib/lead-intelligence/repository";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

function sourceLabel(source?: string | null) {
  if (source === "free_scan_lead") return "Free scan";
  if (source === "csv_import") return "CSV";
  return source ?? "-";
}

function issueCount(scan: any) {
  if (!scan) return null;
  return (
    (scan.critical_issues ?? 0) +
    (scan.serious_issues ?? 0) +
    (scan.moderate_issues ?? 0) +
    (scan.minor_issues ?? 0)
  );
}

export default async function LeadsOverviewPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/leads");
  }

  let rows: any[] = [];
  let workspaceId: string | null = null;
  let unavailable = false;
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    workspaceId = workspace.id;
    rows = await getLeadOverviewRows(workspace.id);
  } catch (error) {
    console.error("Lead overview unavailable:", error);
    unavailable = true;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map((email) => email.trim()).filter(Boolean);
  adminEmails.push("jeffrey.aay@gmail.com");
  const showCaptureConfig = workspaceId && (user.isAdmin || adminEmails.includes(user.email));

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Lead Intelligence</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Leads</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Consent-aware lead records. Public contact data is never treated as permission to send.
            </p>
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/leads/import">
              <Upload className="h-4 w-4" />
              Import CSV
            </Link>
          </Button>
        </div>

        {unavailable ? (
          <div role="status" className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">
            Lead database tables are not available yet. Apply the Supabase migration, then refresh this page.
          </div>
        ) : (
          <div className="space-y-4">
            {showCaptureConfig && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
                <p className="font-semibold text-emerald-950">Free-scan lead storage</p>
                <p className="mt-1 text-emerald-900">
                  Set this in Vercel Production to store anonymous free-scan captures in this workspace:
                </p>
                <code className="mt-2 block overflow-x-auto rounded-md bg-white px-3 py-2 font-mono text-xs text-emerald-950">
                  LEAD_CAPTURE_WORKSPACE_ID={workspaceId}
                </code>
              </div>
            )}

            <div className="overflow-hidden rounded-lg border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Domain</TableHead>
                    <TableHead>Country</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Latest scan</TableHead>
                    <TableHead>Outreach eligibility</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                        No leads captured yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row) => {
                      const org = row.organizations;
                      return (
                        <TableRow key={row.id}>
                          <TableCell>
                            <Link href={`/dashboard/leads/${row.id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
                              {org?.name ?? "Unknown"}
                            </Link>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{org?.normalized_domain}</TableCell>
                          <TableCell>{org?.country_code ?? "-"}</TableCell>
                          <TableCell><Badge variant="outline">{sourceLabel(org?.source_type)}</Badge></TableCell>
                          <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                          <TableCell>{row.score}</TableCell>
                          <TableCell>
                            {row.latest_scan ? (
                              <div className="flex items-center gap-2 text-sm">
                                <Activity className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                                <span>{row.latest_scan.accessibility_score ?? "-"} score</span>
                                <span className="text-muted-foreground">/ {issueCount(row.latest_scan)} issues</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {row.status === "opted_in" || row.status === "existing_customer" ? "Verify evidence" : "Blocked"}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatDate(row.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
