'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Send, Eye, Users, Loader2, X, Play, CheckCircle2,
  AlertTriangle, Clock, XCircle, SkipForward,
} from 'lucide-react';
import {
  fetchCampaign,
  fetchRecipients,
  fetchRecipientCounts,
  buildRecipients,
  sendCampaignBatch,
  previewCampaignEmail,
} from '../../actions';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  html_body: string;
  text_body: string;
  template_name: string | null;
  from_name: string;
  from_email: string;
  reply_to: string;
  tag: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  send_started_at: string | null;
  send_completed_at: string | null;
  filters: Record<string, unknown>;
  created_at: string;
}

interface Recipient {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name: string;
  country: string;
  status: string;
  error: string | null;
  sent_at: string | null;
}

interface Counts {
  pending: number;
  sent: number;
  failed: number;
  skipped: number;
}

interface CampaignDetailClientProps {
  campaignId: string;
}

const statusBadge = (status: string): React.ReactNode => {
  const map: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string }> = {
    draft: { variant: 'outline', label: 'Draft' },
    sending: { variant: 'default', label: 'Sending' },
    paused: { variant: 'secondary', label: 'Paused' },
    completed: { variant: 'default', label: 'Completed' },
    cancelled: { variant: 'destructive', label: 'Cancelled' },
  };
  const cfg = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const recipientBadge = (status: string): React.ReactNode => {
  const map: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; label: string }> = {
    pending: { variant: 'outline', label: 'Pending' },
    sent: { variant: 'default', label: 'Sent' },
    failed: { variant: 'destructive', label: 'Failed' },
    skipped: { variant: 'secondary', label: 'Skipped' },
  };
  const cfg = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={cfg.variant} className="text-[10px]">{cfg.label}</Badge>;
};

export default function CampaignDetailClient({ campaignId }: CampaignDetailClientProps) {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientTotal, setRecipientTotal] = useState(0);
  const [counts, setCounts] = useState<Counts>({ pending: 0, sent: 0, failed: 0, skipped: 0 });
  const [recipientPage, setRecipientPage] = useState(1);

  // Audience builder
  const [filterCountry, setFilterCountry] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterHasWebsite, setFilterHasWebsite] = useState(false);
  const [building, setBuilding] = useState(false);

  // Send
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const PAGE_SIZE = 25;

  const loadCampaign = useCallback(async () => {
    const r = await fetchCampaign(campaignId);
    if (r.ok && r.data) setCampaign(r.data as Campaign);
  }, [campaignId]);

  const loadRecipients = useCallback(async (p: number) => {
    const r = await fetchRecipients(campaignId, PAGE_SIZE, (p - 1) * PAGE_SIZE);
    if (r.ok && r.data) {
      const d = r.data as { recipients: Recipient[]; total: number };
      setRecipients(d.recipients);
      setRecipientTotal(d.total);
      setRecipientPage(p);
    }
  }, [campaignId]);

  const loadCounts = useCallback(async () => {
    const r = await fetchRecipientCounts(campaignId);
    if (r.ok && r.data) setCounts(r.data as Counts);
  }, [campaignId]);

  useEffect(() => {
    Promise.all([loadCampaign(), loadRecipients(1), loadCounts()]).then(() => setLoading(false));
  }, [loadCampaign, loadRecipients, loadCounts]);

  const handleBuildRecipients = async () => {
    setBuilding(true);
    setError(null);
    const r = await buildRecipients(campaignId, {
      country: filterCountry || undefined,
      tag: filterTag || undefined,
      hasWebsite: filterHasWebsite || undefined,
    });
    setBuilding(false);
    if (!r.ok) { setError(r.error || 'Failed to build recipients'); return; }
    const d = r.data as { total: number };
    setSendResult(`Built ${d.total} recipients.`);
    setTimeout(() => setSendResult(null), 4000);
    await Promise.all([loadCampaign(), loadRecipients(1), loadCounts()]);
  };

  const handleSendBatch = async () => {
    if (!confirm(`Send next batch of emails for "${campaign?.name}"? This will send real emails.`)) return;
    setSending(true);
    setError(null);
    setSendResult(null);
    const r = await sendCampaignBatch(campaignId);
    setSending(false);
    if (!r.ok) { setError(r.error || 'Send failed'); return; }
    const d = r.data as { sent: number; failed: number; skipped: number; done: boolean };
    setSendResult(`Batch complete: ${d.sent} sent, ${d.failed} failed, ${d.skipped} skipped.${d.done ? ' Campaign complete!' : ''}`);
    await Promise.all([loadCampaign(), loadRecipients(recipientPage), loadCounts()]);
  };

  const handlePreview = async () => {
    const r = await previewCampaignEmail(campaignId);
    if (r.ok && r.data) {
      const d = r.data as { subject: string; html: string };
      setPreviewSubject(d.subject);
      setPreviewHtml(d.html);
    } else {
      setError(r.error || 'Preview failed');
    }
  };

  const writeIframe = (iframe: HTMLIFrameElement | null) => {
    if (!iframe || !previewHtml) return;
    const doc = iframe.contentDocument;
    if (doc) { doc.open(); doc.write(previewHtml); doc.close(); }
  };

  const recipientPages = Math.max(1, Math.ceil(recipientTotal / PAGE_SIZE));

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-6">
        <Card className="rounded-2xl max-w-md mx-auto">
          <CardContent className="pt-6 pb-6 text-center">
            <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-3" />
            <p className="text-muted-foreground">Campaign not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Send className="h-7 w-7 text-[var(--vn-primary)]" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight">{campaign.name}</h1>
            <p className="text-muted-foreground text-sm">{campaign.subject}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(campaign.status)}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {error}
        </div>
      )}
      {sendResult && (
        <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {sendResult}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-3 px-4 flex flex-col items-center text-center gap-1">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-xl font-bold">{counts.pending}</span>
            <span className="text-xs text-muted-foreground">Pending</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-3 px-4 flex flex-col items-center text-center gap-1">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="text-xl font-bold">{counts.sent}</span>
            <span className="text-xs text-muted-foreground">Sent</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-3 px-4 flex flex-col items-center text-center gap-1">
            <XCircle className="h-5 w-5 text-red-500" />
            <span className="text-xl font-bold">{counts.failed}</span>
            <span className="text-xs text-muted-foreground">Failed</span>
          </CardContent>
        </Card>
        <Card className="rounded-2xl">
          <CardContent className="pt-4 pb-3 px-4 flex flex-col items-center text-center gap-1">
            <SkipForward className="h-5 w-5 text-muted-foreground" />
            <span className="text-xl font-bold">{counts.skipped}</span>
            <span className="text-xs text-muted-foreground">Skipped</span>
          </CardContent>
        </Card>
      </div>

      {/* Audience Builder */}
      {(campaign.status === 'draft' || campaign.status === 'paused') && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Users className="w-5 h-5" /> Build Audience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-muted-foreground">
              Select filters to build a recipient snapshot. Only active contacts (not unsubscribed, not do-not-email) are included.
              Rebuilding replaces the existing recipient list.
            </p>
            <div className="flex flex-wrap gap-3">
              <div>
                <Label className="mb-1 block text-xs">Country</Label>
                <Input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="e.g. Netherlands" className="w-40" />
              </div>
              <div>
                <Label className="mb-1 block text-xs">Tag</Label>
                <Input value={filterTag} onChange={e => setFilterTag(e.target.value)} placeholder="e.g. enterprise" className="w-40" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={filterHasWebsite} onChange={e => setFilterHasWebsite(e.target.checked)} className="rounded" />
                  Has website
                </label>
              </div>
            </div>
            <Button onClick={handleBuildRecipients} disabled={building} className="gap-2">
              {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
              Build Recipients
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button variant="outline" onClick={handlePreview} className="gap-2" disabled={campaign.total_recipients === 0}>
          <Eye className="w-4 h-4" /> Preview Email
        </Button>
        {(campaign.status === 'draft' || campaign.status === 'sending' || campaign.status === 'paused') && counts.pending > 0 && (
          <Button onClick={handleSendBatch} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Send Next Batch ({Math.min(counts.pending, 25)} emails)
          </Button>
        )}
      </div>

      {/* Recipients Table */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">Recipients ({recipientTotal})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">Country</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium">Sent At</th>
                </tr>
              </thead>
              <tbody>
                {recipients.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No recipients yet. Build an audience first.</td></tr>
                ) : recipients.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2 pr-4 text-xs max-w-[200px] truncate">{r.email}</td>
                    <td className="py-2 pr-4 text-xs whitespace-nowrap">{r.first_name} {r.last_name}</td>
                    <td className="py-2 pr-4 text-xs">{r.company_name || '—'}</td>
                    <td className="py-2 pr-4 text-xs">{r.country || '—'}</td>
                    <td className="py-2 pr-4">
                      {recipientBadge(r.status)}
                      {r.error && <span className="text-[10px] text-red-500 ml-1" title={r.error}>⚠</span>}
                    </td>
                    <td className="py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {r.sent_at ? new Date(r.sent_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {recipientPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">Page {recipientPage} of {recipientPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={recipientPage <= 1} onClick={() => loadRecipients(recipientPage - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={recipientPage >= recipientPages} onClick={() => loadRecipients(recipientPage + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">Preview: {previewSubject}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPreviewHtml(null)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="flex-1 overflow-auto bg-white">
              <iframe ref={writeIframe} title="Email Preview" className="w-full h-full min-h-[500px] border-0" sandbox="allow-same-origin" />
            </div>
            <div className="flex items-center justify-end px-5 py-3 border-t">
              <Button variant="outline" size="sm" onClick={() => setPreviewHtml(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
