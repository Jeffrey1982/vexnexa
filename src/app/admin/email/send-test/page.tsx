import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/mailgun";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SendHorizonal } from "lucide-react";

export const dynamic = "force-dynamic";

async function sendTestAction(formData: FormData): Promise<void> {
  "use server";

  await requireAdmin();

  const to: string = formData.get("to") as string;
  const subject: string = formData.get("subject") as string;
  const html: string | undefined = (formData.get("html") as string) || undefined;
  const text: string | undefined = (formData.get("text") as string) || undefined;
  const tag: string | undefined = (formData.get("tag") as string) || undefined;

  if (!to || !subject) {
    redirect("/admin/email/send-test?error=to+and+subject+are+required");
  }

  try {
    const result = await sendEmail({
      to,
      subject,
      html,
      text: text || (!html ? "(empty test email)" : undefined),
      tag,
    });
    const messageId: string = (result.id ?? "").replace(/^<|>$/g, "");
    redirect(`/admin/email/send-test?sent=${encodeURIComponent(messageId)}`);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("NEXT_REDIRECT")) throw err;
    redirect(`/admin/email/send-test?error=${encodeURIComponent(msg)}`);
  }
}

interface PageProps {
  searchParams: Promise<{ sent?: string; error?: string }>;
}

export default async function SendTestPage({ searchParams }: PageProps) {
  await requireAdmin();

  const params = await searchParams;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <SendHorizonal className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Send Test Email</h1>
          <p className="text-muted-foreground text-sm">Send a test email via Mailgun</p>
        </div>
      </div>

      {params.sent && (
        <div className="rounded-xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 px-4 py-3 text-sm text-green-700 dark:text-green-400">
          Email sent successfully! Message ID: {params.sent}
        </div>
      )}

      {params.error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          Error: {params.error}
        </div>
      )}

      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Compose</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={sendTestAction} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">To</label>
              <input name="to" type="email" placeholder="recipient@example.com" required
                className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subject</label>
              <input name="subject" type="text" placeholder="Test email subject" required
                className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tag (optional)</label>
              <input name="tag" type="text" placeholder="test"
                className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">HTML Body</label>
              <textarea name="html" rows={6} placeholder="<h1>Hello!</h1><p>This is a test email.</p>"
                className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Plain Text Body</label>
              <textarea name="text" rows={3} placeholder="Hello! This is a test email."
                className="w-full rounded-xl border border-[var(--vn-border)] bg-background px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--vn-primary)]" />
            </div>
            <button type="submit"
              className="rounded-xl bg-[var(--vn-primary)] text-white px-6 py-2.5 text-sm font-medium hover:bg-[var(--vn-primary-hover)] transition-colors">
              Send Test Email
            </button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
