import Link from "next/link";
import { redirect } from "next/navigation";
import { Upload } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { getLeadOverviewRows, getOrCreateLeadWorkspace } from "@/lib/lead-intelligence/repository";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(value));
}

export default async function LeadsOverviewPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/leads");
  }

  let rows: any[] = [];
  let unavailable = false;
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    rows = await getLeadOverviewRows(workspace.id);
  } catch (error) {
    console.error("Lead overview unavailable:", error);
    unavailable = true;
  }

  return (
    <main id="main-content" tabIndex={-1}>
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
          <div className="overflow-hidden rounded-lg border bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Outreach eligibility</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No leads imported yet.
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
                        <TableCell><Badge variant="outline">{row.status}</Badge></TableCell>
                        <TableCell>{row.score}</TableCell>
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
        )}
      </div>
    </main>
  );
}
