'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutTemplate,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  X,
  Save,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: unknown;
  created_at: string;
  updated_at: string;
}

interface TemplatesClientProps {
  initialTemplates: EmailTemplate[];
  initialTotal: number;
  adminSecret: string;
  pageSize: number;
}

export default function TemplatesClient({
  initialTemplates,
  initialTotal,
  adminSecret,
  pageSize,
}: TemplatesClientProps) {
  // ── State ──────────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<EmailTemplate[]>(initialTemplates);
  const [total, setTotal] = useState<number>(initialTotal);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Form state
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState('');
  const [text, setText] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Preview
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewSubject, setPreviewSubject] = useState<string>('');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const totalPages: number = Math.max(1, Math.ceil(total / pageSize));

  // ── Helpers ────────────────────────────────────────────────────────
  const apiFetch = useCallback(
    async (path: string, init?: RequestInit) => {
      const res = await fetch(path, {
        ...init,
        headers: {
          'x-admin-secret': adminSecret,
          'Content-Type': 'application/json',
          ...(init?.headers ?? {}),
        },
      });
      if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(body || `API error ${res.status}`);
      }
      return res.json();
    },
    [adminSecret]
  );

  const fetchPage = useCallback(
    async (page: number) => {
      try {
        const offset = (page - 1) * pageSize;
        const data = await apiFetch(
          `/api/admin/email/templates?limit=${pageSize}&offset=${offset}`
        );
        setTemplates(data.templates ?? []);
        setTotal(data.total ?? 0);
        setCurrentPage(page);
      } catch (e: unknown) {
        console.error('Failed to fetch templates:', e);
      }
    },
    [apiFetch, pageSize]
  );

  const clearForm = () => {
    setFormMode(null);
    setEditId(null);
    setName('');
    setSubject('');
    setHtml('');
    setText('');
    setError(null);
  };

  const flash = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  // ── Create / Update ────────────────────────────────────────────────
  const handleSave = async () => {
    if (!name.trim()) {
      setError('Template name is required.');
      return;
    }
    setSaving(true);
    setError(null);

    try {
      if (formMode === 'edit' && editId) {
        await apiFetch('/api/admin/email/templates', {
          method: 'PUT',
          body: JSON.stringify({ id: editId, name, subject, html, text }),
        });
        flash('Template updated.');
      } else {
        await apiFetch('/api/admin/email/templates', {
          method: 'POST',
          body: JSON.stringify({ name, subject, html, text }),
        });
        flash('Template created.');
      }
      clearForm();
      await fetchPage(currentPage);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template permanently?')) return;
    setDeleting(id);
    try {
      await apiFetch(`/api/admin/email/templates?id=${id}`, { method: 'DELETE' });
      flash('Template deleted.');
      await fetchPage(currentPage);
    } catch (e: unknown) {
      console.error('Delete failed:', e);
      alert('Failed to delete template.');
    } finally {
      setDeleting(null);
    }
  };

  // ── Edit prefill ───────────────────────────────────────────────────
  const startEdit = (t: EmailTemplate) => {
    setFormMode('edit');
    setEditId(t.id);
    setName(t.name);
    setSubject(t.subject);
    setHtml(t.html);
    setText(t.text);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Preview ────────────────────────────────────────────────────────
  const openPreview = (t: EmailTemplate) => {
    setPreviewSubject(t.subject || t.name);
    setPreviewHtml(t.html || '<p style="color:#888;text-align:center;padding:40px;">No HTML body defined for this template.</p>');
  };

  const openFormPreview = () => {
    setPreviewSubject(subject || name || 'Untitled');
    setPreviewHtml(html || '<p style="color:#888;text-align:center;padding:40px;">No HTML body to preview.</p>');
  };

  // Write HTML into iframe once it mounts
  const writeIframe = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      if (!iframe || !previewHtml) return;
      const doc = iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(previewHtml);
        doc.close();
      }
    },
    [previewHtml]
  );

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LayoutTemplate className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Email Templates
          </h1>
        </div>
        {formMode === null && (
          <Button
            onClick={() => setFormMode('create')}
            className="gap-2"
            size="sm"
          >
            <Plus className="w-4 h-4" /> New Template
          </Button>
        )}
      </div>

      {/* Success toast */}
      {success && (
        <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-300">
          {success}
        </div>
      )}

      {/* ── Create / Edit Form ──────────────────────────────────────── */}
      {formMode !== null && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">
              {formMode === 'edit' ? 'Edit Template' : 'Create Template'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={clearForm}>
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-1.5 block">Template Name *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Welcome Email"
                />
              </div>
              <div>
                <Label className="mb-1.5 block">Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Welcome to VexNexa!"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block">HTML Body</Label>
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={10}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="<html>&#10;  <body>&#10;    <h1>Hello {{name}}</h1>&#10;  </body>&#10;</html>"
              />
            </div>

            <div>
              <Label className="mb-1.5 block">Plain Text Body</Label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                placeholder="Hello {{name}},&#10;&#10;Welcome to VexNexa..."
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {formMode === 'edit' ? 'Update Template' : 'Create Template'}
              </Button>
              <Button
                variant="outline"
                onClick={openFormPreview}
                className="gap-2"
                disabled={!html.trim()}
              >
                <Eye className="w-4 h-4" /> Preview
              </Button>
              <Button variant="ghost" onClick={clearForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Templates Table ─────────────────────────────────────────── */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">
            Templates{' '}
            <span className="text-sm font-normal text-muted-foreground">
              ({total})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Subject</th>
                  <th className="pb-2 pr-4 font-medium">Has HTML</th>
                  <th className="pb-2 pr-4 font-medium">Has Text</th>
                  <th className="pb-2 pr-4 font-medium">Updated</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {templates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-muted-foreground"
                    >
                      No templates yet. Click &quot;New Template&quot; to create
                      one.
                    </td>
                  </tr>
                ) : (
                  templates.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="py-2.5 pr-4 font-medium">{t.name}</td>
                      <td className="py-2.5 pr-4 max-w-[250px] truncate">
                        {t.subject || '—'}
                      </td>
                      <td className="py-2.5 pr-4 text-xs">
                        {t.html ? (
                          <span className="text-green-600 dark:text-green-400">
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs">
                        {t.text ? (
                          <span className="text-green-600 dark:text-green-400">
                            Yes
                          </span>
                        ) : (
                          <span className="text-muted-foreground">No</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(t.updated_at).toLocaleString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Preview"
                            onClick={() => openPreview(t)}
                            disabled={!t.html}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Edit"
                            onClick={() => startEdit(t)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            title="Delete"
                            onClick={() => handleDelete(t.id)}
                            disabled={deleting === t.id}
                          >
                            {deleting === t.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {total} total · Page {currentPage} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => fetchPage(currentPage - 1)}
                  className="gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchPage(currentPage + 1)}
                  className="gap-1"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview Modal ───────────────────────────────────────────── */}
      {previewHtml !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden border">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-sm">
                  Preview: {previewSubject}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPreviewHtml(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Iframe preview */}
            <div className="flex-1 overflow-auto bg-white">
              <iframe
                ref={writeIframe}
                title="Email Preview"
                className="w-full h-full min-h-[500px] border-0"
                sandbox="allow-same-origin"
              />
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end px-5 py-3 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewHtml(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
