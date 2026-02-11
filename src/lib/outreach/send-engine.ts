/**
 * Outreach send engine — batched, throttled, idempotent.
 * Server-only.
 */
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/mailgun';
import { mergeVariables, type PersonalizationVars } from './personalize';
import { buildUnsubscribeUrl } from './unsubscribe';

const BATCH_SIZE: number = Number(process.env.OUTREACH_BATCH_SIZE || '25');
const RATE_LIMIT_PER_MIN: number = Number(process.env.OUTREACH_RATE_LIMIT_PER_MIN || '50');
const DELAY_MS: number = Math.ceil((60 * 1000) / RATE_LIMIT_PER_MIN);

export interface SendBatchResult {
  sent: number;
  failed: number;
  skipped: number;
  done: boolean;
  error?: string;
}

/**
 * Acquire a send lock for a campaign. Returns true if lock acquired.
 */
async function acquireLock(campaignId: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('outreach_campaigns')
    .update({ send_lock: true, status: 'sending', send_started_at: new Date().toISOString() })
    .eq('id', campaignId)
    .eq('send_lock', false)
    .in('status', ['draft', 'sending', 'paused'])
    .select('id')
    .single();

  return !error && !!data;
}

/**
 * Release the send lock for a campaign.
 */
async function releaseLock(campaignId: string): Promise<void> {
  await supabaseAdmin
    .from('outreach_campaigns')
    .update({ send_lock: false, updated_at: new Date().toISOString() })
    .eq('id', campaignId);
}

/**
 * Check if an email is suppressed (unsubscribed or in global suppressions).
 */
async function isSuppressed(email: string): Promise<boolean> {
  // Check outreach_unsubscribes
  const { data: unsub } = await supabaseAdmin
    .from('outreach_unsubscribes')
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle();

  if (unsub) return true;

  // Check email_suppressions (existing table)
  const { data: suppressed } = await supabaseAdmin
    .from('email_suppressions')
    .select('id')
    .eq('email', email.toLowerCase())
    .limit(1)
    .maybeSingle();

  return !!suppressed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Send one batch of pending recipients for a campaign.
 * Returns counts and whether the campaign is done.
 */
export async function sendBatch(campaignId: string): Promise<SendBatchResult> {
  // 1. Acquire lock
  const locked = await acquireLock(campaignId);
  if (!locked) {
    return { sent: 0, failed: 0, skipped: 0, done: false, error: 'Could not acquire send lock. Another send may be in progress.' };
  }

  try {
    // 2. Fetch campaign
    const { data: campaign, error: campErr } = await supabaseAdmin
      .from('outreach_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campErr || !campaign) {
      return { sent: 0, failed: 0, skipped: 0, done: false, error: 'Campaign not found.' };
    }

    // 3. Fetch pending recipients
    const { data: recipients, error: recErr } = await supabaseAdmin
      .from('outreach_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(BATCH_SIZE);

    if (recErr || !recipients) {
      return { sent: 0, failed: 0, skipped: 0, done: false, error: 'Failed to fetch recipients.' };
    }

    if (recipients.length === 0) {
      // Mark campaign as completed
      await supabaseAdmin
        .from('outreach_campaigns')
        .update({ status: 'completed', send_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', campaignId);
      return { sent: 0, failed: 0, skipped: 0, done: true };
    }

    const fromName: string = campaign.from_name || process.env.OUTREACH_FROM_NAME || 'VexNexa';
    const fromEmail: string = campaign.from_email || process.env.OUTREACH_FROM_EMAIL || `noreply@${process.env.MAILGUN_DOMAIN || 'vexnexa.com'}`;
    const replyTo: string = campaign.reply_to || process.env.OUTREACH_REPLY_TO || fromEmail;

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const recipient of recipients) {
      // 4. Check suppression
      const suppressed = await isSuppressed(recipient.email);
      if (suppressed) {
        await supabaseAdmin
          .from('outreach_campaign_recipients')
          .update({ status: 'skipped', error: 'Suppressed/unsubscribed' })
          .eq('id', recipient.id);
        skipped++;
        continue;
      }

      // 5. Build personalized content
      const unsubUrl = buildUnsubscribeUrl(recipient.email);
      const vars: PersonalizationVars = {
        first_name: recipient.first_name || '',
        last_name: recipient.last_name || '',
        company_name: recipient.company_name || '',
        website: recipient.website || '',
        country: recipient.country || '',
        email: recipient.email,
        unsubscribe_url: unsubUrl,
        ...(typeof recipient.variables === 'object' && recipient.variables !== null ? recipient.variables as Record<string, string> : {}),
      };

      const personalizedHtml = mergeVariables(campaign.html_body || '', vars, true);
      const personalizedText = mergeVariables(campaign.text_body || '', vars, false);

      // Append unsubscribe footer to HTML if not already present
      const htmlWithUnsub = personalizedHtml.includes('{{unsubscribe_url}}') || personalizedHtml.includes(unsubUrl)
        ? personalizedHtml
        : personalizedHtml + `<br/><hr style="margin:20px 0;border:none;border-top:1px solid #eee"/><p style="font-size:12px;color:#999;text-align:center">You received this because you're in our contact list. <a href="${unsubUrl}" style="color:#999">Unsubscribe</a></p>`;

      const textWithUnsub = personalizedText.includes('{{unsubscribe_url}}') || personalizedText.includes(unsubUrl)
        ? personalizedText
        : personalizedText + `\n\n---\nYou received this because you're in our contact list. Unsubscribe: ${unsubUrl}`;

      try {
        // 6. Send via Mailgun
        const result = await sendEmail({
          to: recipient.email,
          subject: mergeVariables(campaign.subject || '', vars, false),
          html: htmlWithUnsub,
          text: textWithUnsub,
          tag: campaign.tag || 'outreach',
          meta: {
            campaign_id: campaignId,
            recipient_id: recipient.id,
            'h:Reply-To': replyTo,
            'h:List-Unsubscribe': `<${unsubUrl}>`,
            'h:List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        });

        const rawId: string = result.id ?? '';
        const messageId: string = rawId.replace(/^<|>$/g, '');

        // 7. Update recipient status
        await supabaseAdmin
          .from('outreach_campaign_recipients')
          .update({ status: 'sent', mailgun_message_id: messageId, sent_at: new Date().toISOString() })
          .eq('id', recipient.id);

        // 8. Log to email_logs
        await supabaseAdmin.from('email_logs').insert({
          user_id: null,
          to_email: recipient.email,
          subject: campaign.subject,
          tag: campaign.tag || 'outreach',
          mailgun_message_id: messageId || null,
          mailgun_api_id: rawId || null,
          status: 'sent',
        });

        sent++;
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Unknown send error';
        await supabaseAdmin
          .from('outreach_campaign_recipients')
          .update({ status: 'failed', error: errMsg.substring(0, 500) })
          .eq('id', recipient.id);
        failed++;
      }

      // 9. Throttle
      await sleep(DELAY_MS);
    }

    // 10. Update campaign counts
    await supabaseAdmin
      .from('outreach_campaigns')
      .update({
        sent_count: (campaign.sent_count || 0) + sent,
        failed_count: (campaign.failed_count || 0) + failed,
        updated_at: new Date().toISOString(),
      })
      .eq('id', campaignId);

    // Check if more pending
    const { count } = await supabaseAdmin
      .from('outreach_campaign_recipients')
      .select('id', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('status', 'pending');

    const remaining = count ?? 0;
    if (remaining === 0) {
      await supabaseAdmin
        .from('outreach_campaigns')
        .update({ status: 'completed', send_completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', campaignId);
    }

    return { sent, failed, skipped, done: remaining === 0 };
  } finally {
    await releaseLock(campaignId);
  }
}
