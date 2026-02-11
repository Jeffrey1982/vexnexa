import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { verifyUnsubscribeToken } from '@/lib/outreach/unsubscribe';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ email?: string; token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const email: string = (params.email ?? '').toLowerCase().trim();
  const token: string = params.token ?? '';

  let success = false;
  let errorMsg = '';

  if (!email || !token) {
    errorMsg = 'Invalid unsubscribe link. Missing email or token.';
  } else if (!verifyUnsubscribeToken(email, token)) {
    errorMsg = 'Invalid or expired unsubscribe link.';
  } else {
    try {
      // Insert into outreach_unsubscribes (ignore conflict)
      await supabaseAdmin
        .from('outreach_unsubscribes')
        .upsert({ email, reason: 'unsubscribe_link' }, { onConflict: 'email' });

      // Mark contact as unsubscribed if exists
      await supabaseAdmin
        .from('outreach_contacts')
        .update({ unsubscribed: true, updated_at: new Date().toISOString() })
        .eq('email', email);

      success = true;
    } catch (e: unknown) {
      console.error('[unsubscribe] error:', e);
      errorMsg = 'Something went wrong. Please try again later.';
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background p-4">
      <Card className="rounded-2xl max-w-md w-full">
        <CardContent className="pt-8 pb-8 px-8 text-center">
          {success ? (
            <>
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">You&apos;ve been unsubscribed</h1>
              <p className="text-muted-foreground text-sm">
                <strong>{email}</strong> has been removed from our mailing list.
                You will no longer receive outreach emails from us.
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h1 className="text-xl font-bold mb-2">Unsubscribe Failed</h1>
              <p className="text-muted-foreground text-sm">{errorMsg}</p>
            </>
          )}
          <div className="mt-6">
            <a
              href="https://www.vexnexa.com"
              className="text-sm text-[var(--vn-primary)] hover:underline"
            >
              ← Back to VexNexa
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
