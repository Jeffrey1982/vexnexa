'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Send, Loader2, Eye, X } from 'lucide-react';
import { createCampaign, fetchTemplates } from '../../actions';

interface Template {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
}

export default function NewCampaignClient() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [htmlBody, setHtmlBody] = useState('');
  const [textBody, setTextBody] = useState('');
  const [fromName, setFromName] = useState('VexNexa');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [tag, setTag] = useState('outreach');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);

  useEffect(() => {
    fetchTemplates().then(r => {
      if (r.ok && r.data) setTemplates(r.data as Template[]);
    });
  }, []);

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    const t = templates.find(t => t.name === templateName);
    if (t) {
      setSubject(t.subject || subject);
      setHtmlBody(t.html || '');
      setTextBody(t.text || '');
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('Campaign name is required'); return; }
    if (!subject.trim()) { setError('Subject is required'); return; }
    if (!htmlBody.trim() && !textBody.trim()) { setError('At least HTML or text body is required'); return; }

    setSaving(true);
    setError(null);

    const r = await createCampaign({
      name,
      subject,
      template_name: selectedTemplate || undefined,
      html_body: htmlBody,
      text_body: textBody,
      from_name: fromName,
      from_email: fromEmail,
      reply_to: replyTo,
      tag,
    });

    setSaving(false);

    if (!r.ok) { setError(r.error || 'Failed to create campaign'); return; }

    const campaign = r.data as { id: string };
    router.push(`/admin/outreach/campaigns/${campaign.id}`);
  };

  const writeIframe = (iframe: HTMLIFrameElement | null) => {
    if (!iframe || !previewHtml) return;
    const doc = iframe.contentDocument;
    if (doc) { doc.open(); doc.write(previewHtml); doc.close(); }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Send className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">New Campaign</h1>
          <p className="text-muted-foreground text-sm">Create a new email campaign from a template or from scratch</p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>
      )}

      {/* Template Selection */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">1. Choose Template (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            value={selectedTemplate}
            onChange={e => handleTemplateSelect(e.target.value)}
            className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">— Start from scratch —</option>
            {templates.map(t => <option key={t.id} value={t.name}>{t.name} — {t.subject || '(no subject)'}</option>)}
          </select>
        </CardContent>
      </Card>

      {/* Campaign Details */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">2. Campaign Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label className="mb-1.5 block">Campaign Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Q1 Outreach - EU Leads" /></div>
            <div><Label className="mb-1.5 block">Subject Line *</Label><Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Hi {{first_name}}, quick question about {{company_name}}" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label className="mb-1.5 block">From Name</Label><Input value={fromName} onChange={e => setFromName(e.target.value)} placeholder="VexNexa" /></div>
            <div><Label className="mb-1.5 block">From Email</Label><Input value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="hello@vexnexa.com" /></div>
            <div><Label className="mb-1.5 block">Reply-To</Label><Input value={replyTo} onChange={e => setReplyTo(e.target.value)} placeholder="hello@vexnexa.com" /></div>
          </div>
          <div><Label className="mb-1.5 block">Tag</Label><Input value={tag} onChange={e => setTag(e.target.value)} placeholder="outreach" /></div>
        </CardContent>
      </Card>

      {/* Email Body */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">3. Email Body</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Available variables: <code>{`{{first_name}}`}</code>, <code>{`{{last_name}}`}</code>, <code>{`{{company_name}}`}</code>, <code>{`{{website}}`}</code>, <code>{`{{country}}`}</code>, <code>{`{{email}}`}</code>, <code>{`{{unsubscribe_url}}`}</code>
          </p>
          <div>
            <Label className="mb-1.5 block">HTML Body</Label>
            <textarea
              value={htmlBody}
              onChange={e => setHtmlBody(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="<html><body><h1>Hi {{first_name}},</h1><p>...</p></body></html>"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">Plain Text Body</Label>
            <textarea
              value={textBody}
              onChange={e => setTextBody(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
              placeholder="Hi {{first_name}},&#10;&#10;..."
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setPreviewHtml(htmlBody || '<p>No HTML body</p>')} disabled={!htmlBody.trim()} className="gap-2">
              <Eye className="w-4 h-4" /> Preview HTML
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Create Button */}
      <div className="flex gap-3">
        <Button onClick={handleCreate} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Create Campaign
        </Button>
        <Button variant="ghost" onClick={() => router.push('/admin/outreach/campaigns')}>Cancel</Button>
      </div>

      {/* Preview Modal */}
      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <span className="font-medium text-sm">Email Preview</span>
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
