import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Activity, MailCheck, ShieldAlert, ShieldCheck } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getLeadDetail, getOrCreateLeadWorkspace } from "@/lib/lead-intelligence/repository";
import { canSendCommercialEmail } from "@/lib/lead-intelligence/outreach-eligibility";

export const dynamic = "force-dynamic";

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card p-5">
      <h2 className="mb-4 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function totalScanIssues(scan: any) {
  return (
    (scan.critical_issues ?? 0) +
    (scan.serious_issues ?? 0) +
    (scan.moderate_issues ?? 0) +
    (scan.minor_issues ?? 0)
  );
}

function sourceLabel(source?: string | null) {
  if (source === "free_scan_lead") return "Free scan";
  if (source === "csv_import") return "CSV import";
  return source ?? "-";
}

function draftStatusLabel(status?: string | null) {
  if (!status) return "Draft";
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/leads");
  }

  const { leadId } = await params;
  let detail;
  try {
    const workspace = await getOrCreateLeadWorkspace(user);
    detail = await getLeadDetail(workspace.id, leadId);
  } catch (error) {
    console.error("Lead detail unavailable:", error);
    notFound();
  }

  const lead: any = detail.lead;
  const org = lead.organizations;
  const primaryContact: any | undefined = detail.contacts[0];
  const decision = primaryContact
    ? canSendCommercialEmail({
      contactEmail: primaryContact.email,
      contactId: primaryContact.id,
        organizationDomain: org.normalized_domain,
        leadStatus: lead.status,
        consentEvents: detail.consents.map((event: any) => ({
          contactId: event.contact_id,
          consentType: event.consent_type,
          status: event.status,
          evidence: event.evidence,
          expiresAt: event.expires_at,
        })),
        suppressedEmails: detail.suppressions.map((entry: any) => entry.normalized_email).filter(Boolean),
        suppressedDomains: detail.suppressions.map((entry: any) => entry.normalized_domain).filter(Boolean),
      })
    : { allowed: false, reason: "No contact is recorded for this lead." };

  return (
    <div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">Lead detail</p>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{org.name}</h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">{org.normalized_domain}</p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard/leads">Back to leads</Link>
          </Button>
        </div>

        <div className={`mb-6 rounded-lg border p-5 ${decision.allowed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="flex items-start gap-3">
            {decision.allowed ? <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-800" /> : <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-800" />}
            <div>
              <h2 className="font-semibold text-foreground">
                Outreach is {decision.allowed ? "allowed with recorded evidence" : "blocked"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{decision.reason}</p>
              <p className="mt-2 text-xs text-muted-foreground">No active send-email function exists in Phase 1.</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Organization">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Website</dt><dd>{org.website_url}</dd></div>
              <div><dt className="text-muted-foreground">Country</dt><dd>{org.country_code ?? "-"}</dd></div>
              <div><dt className="text-muted-foreground">Industry</dt><dd>{org.industry ?? "-"}</dd></div>
              <div><dt className="text-muted-foreground">Source</dt><dd>{sourceLabel(org.source_type)}</dd></div>
            </dl>
          </Section>

          <Section title="Lead status and score">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Status</dt><dd><Badge variant="outline">{lead.status}</Badge></dd></div>
              <div><dt className="text-muted-foreground">Score</dt><dd>{lead.score}/100</dd></div>
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Explanation</dt><dd>{lead.score_explanation ?? "-"}</dd></div>
            </dl>
          </Section>

          <Section title="Contacts">
            <div className="space-y-3">
              {detail.contacts.length === 0 ? <p className="text-sm text-muted-foreground">No contacts recorded.</p> : detail.contacts.map((contact: any) => (
                <div key={contact.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{[contact.first_name, contact.last_name].filter(Boolean).join(" ") || contact.email}</p>
                  <p className="font-mono text-xs text-muted-foreground">{contact.email}</p>
                  <p className="text-xs text-muted-foreground">{contact.job_title ?? "No job title"} - Personal data: {contact.is_personal_data ? "yes" : "no"}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Consent events">
            <div className="space-y-3">
              {detail.consents.length === 0 ? <p className="text-sm text-muted-foreground">No consent or customer relationship evidence recorded.</p> : detail.consents.map((event: any) => (
                <div key={event.id} className="rounded-md border p-3 text-sm">
                  <p className="font-medium">{event.consent_type} - {event.status}</p>
                  <p className="text-xs text-muted-foreground">Lawful basis: {event.lawful_basis} - Occurred: {formatDate(event.occurred_at)} - Expires: {formatDate(event.expires_at)}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Suppression status">
            {detail.suppressions.length === 0 ? <p className="text-sm text-muted-foreground">No matching suppression entry found.</p> : (
              <ul className="space-y-2 text-sm">{detail.suppressions.map((entry: any) => <li key={entry.id}>{entry.reason} - {entry.normalized_email ?? entry.normalized_domain}</li>)}</ul>
            )}
          </Section>

          <Section title="Website scans">
            {detail.scans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No scan records yet.</p>
            ) : (
              <div className="space-y-3">
                {detail.scans.map((scan: any) => (
                  <div key={scan.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 font-medium">
                        <Activity className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        {scan.status}
                      </p>
                      <Badge variant="secondary">{formatDate(scan.created_at)}</Badge>
                    </div>
                    <dl className="mt-3 grid gap-2 sm:grid-cols-3">
                      <div><dt className="text-muted-foreground">Score</dt><dd>{scan.accessibility_score ?? "-"}/100</dd></div>
                      <div><dt className="text-muted-foreground">Issues</dt><dd>{totalScanIssues(scan)}</dd></div>
                      <div><dt className="text-muted-foreground">URL</dt><dd className="truncate font-mono text-xs">{scan.final_url ?? scan.requested_url}</dd></div>
                    </dl>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                      <span className="rounded-md bg-red-50 px-2 py-1 text-red-800">Critical {scan.critical_issues}</span>
                      <span className="rounded-md bg-orange-50 px-2 py-1 text-orange-800">Serious {scan.serious_issues}</span>
                      <span className="rounded-md bg-amber-50 px-2 py-1 text-amber-800">Moderate {scan.moderate_issues}</span>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-slate-800">Minor {scan.minor_issues}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Email drafts">
            {detail.drafts.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-sm">
                <div className="flex items-start gap-3">
                  <MailCheck className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-foreground">No draft generated</p>
                    <p className="mt-1 text-muted-foreground">
                      Phase 1 keeps outreach manual. Create a draft only after consent or existing-customer evidence is recorded.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {detail.drafts.map((draft: any) => (
                  <div key={draft.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="flex items-center gap-2 font-medium">
                        <MailCheck className="h-4 w-4 text-emerald-700" aria-hidden="true" />
                        {draft.subject}
                      </p>
                      <Badge variant="outline">{draftStatusLabel(draft.status)}</Badge>
                    </div>
                    <p className="mt-2 line-clamp-3 text-muted-foreground">{draft.body_text}</p>
                    <p className="mt-3 text-xs text-muted-foreground">
                      Created: {formatDate(draft.created_at)} - Approved: {formatDate(draft.approved_at)} - Sent: {formatDate(draft.sent_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          <Section title="Audit history">
            {detail.auditEvents.length === 0 ? <p className="text-sm text-muted-foreground">No audit events recorded for this lead yet.</p> : (
              <ul className="space-y-2 text-sm">{detail.auditEvents.map((event: any) => <li key={event.id}>{formatDate(event.created_at)} - {event.event_type}</li>)}</ul>
            )}
          </Section>
        </div>
      </div>
    </div>
  );
}
