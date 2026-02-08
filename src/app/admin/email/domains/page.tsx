import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerCog, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DomainsPage() {
  try { await requireAuth(); } catch { redirect("/auth/login?redirect=/admin/email/domains"); }

  const domain: string = process.env.MAILGUN_DOMAIN ?? "(not set)";
  const webhookUrl = "https://www.vexnexa.com/api/email/webhook";

  const checklist: { label: string; description: string }[] = [
    { label: "SPF Record", description: `Add a TXT record: v=spf1 include:mailgun.org ~all` },
    { label: "DKIM Record", description: `Add the DKIM TXT records provided by Mailgun for ${domain}` },
    { label: "DMARC Record", description: `Add a TXT record: v=DMARC1; p=none; rua=mailto:dmarc@${domain}` },
    { label: "MX Records", description: `Set MX records to mxa.mailgun.org and mxb.mailgun.org (priority 10)` },
    { label: "CNAME Tracking", description: `Add CNAME for email.${domain} pointing to mailgun.org tracking` },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <ServerCog className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Domains & DNS</h1>
          <p className="text-muted-foreground text-sm">Mailgun domain configuration & DNS checklist</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">Sending Domain</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="text-sm text-muted-foreground">MAILGUN_DOMAIN</span>
              <p className="font-mono text-sm font-medium">{domain}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Webhook URL</span>
              <p className="font-mono text-sm font-medium break-all">{webhookUrl}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              Set this URL in your Mailgun dashboard under Sending → Webhooks for all event types.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display">DNS Checklist</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checklist.map((item) => (
                <div key={item.label} className="flex gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Documentation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <a href="https://documentation.mailgun.com/en/latest/quickstart-sending.html" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--vn-primary)] hover:underline">
            <ExternalLink className="h-4 w-4" /> Mailgun Quickstart Guide
          </a>
          <a href="https://documentation.mailgun.com/en/latest/user_manual.html#verifying-your-domain" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-[var(--vn-primary)] hover:underline">
            <ExternalLink className="h-4 w-4" /> Domain Verification Guide
          </a>
          <p className="text-xs text-muted-foreground mt-3">
            See also: <code>docs/MAILGUN_ADMIN.md</code> and <code>docs/API_DEBUG.md</code> in the repo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
