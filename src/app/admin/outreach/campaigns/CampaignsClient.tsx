'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Send, Plus, Eye, Trash2, Loader2,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchCampaigns, deleteCampaign } from '../actions';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const PAGE_SIZE = 25;

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

export default function CampaignsClient() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number) => {
    const r = await fetchCampaigns(PAGE_SIZE, (p - 1) * PAGE_SIZE);
    if (r.ok && r.data) {
      const d = r.data as { campaigns: Campaign[]; total: number };
      setCampaigns(d.campaigns);
      setTotal(d.total);
      setPage(p);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign and all its recipients?')) return;
    setDeleting(id);
    const r = await deleteCampaign(id);
    setDeleting(null);
    if (!r.ok) { alert(r.error || 'Delete failed'); return; }
    flash('Campaign deleted.');
    await load(page);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Send className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Campaigns</h1>
        </div>
        <Link href="/admin/outreach/campaigns/new">
          <Button size="sm" className="gap-2"><Plus className="w-4 h-4" /> New Campaign</Button>
        </Link>
      </div>

      {success && <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-300">{success}</div>}

      <Card className="rounded-2xl">
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Recipients</th>
                  <th className="pb-2 pr-4 font-medium">Sent</th>
                  <th className="pb-2 pr-4 font-medium">Failed</th>
                  <th className="pb-2 pr-4 font-medium">Created</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">No campaigns yet. Create one to get started.</td></tr>
                ) : campaigns.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{c.subject || '—'}</td>
                    <td className="py-2.5 pr-4">{statusBadge(c.status)}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.total_recipients}</td>
                    <td className="py-2.5 pr-4 text-xs text-green-600">{c.sent_count}</td>
                    <td className="py-2.5 pr-4 text-xs text-red-600">{c.failed_count}</td>
                    <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/admin/outreach/campaigns/${c.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8" title="View"><Eye className="w-4 h-4" /></Button>
                        </Link>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)} disabled={deleting === c.id || c.status === 'sending'}>
                          {deleting === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">{total} total · Page {page} of {totalPages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
