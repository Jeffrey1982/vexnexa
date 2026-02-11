'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2, Plus, Pencil, Trash2, Loader2, X, Save, Search,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import { fetchCompanies, createCompany, updateCompany, deleteCompany } from '../actions';

interface Company {
  id: string;
  name: string;
  website: string | null;
  domain: string | null;
  country: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

const PAGE_SIZE = 25;

export default function CompaniesClient() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [industry, setIndustry] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number, q?: string) => {
    const r = await fetchCompanies(PAGE_SIZE, (p - 1) * PAGE_SIZE, q || undefined);
    if (r.ok && r.data) {
      const d = r.data as { companies: Company[]; total: number };
      setCompanies(d.companies);
      setTotal(d.total);
      setPage(p);
    }
  }, []);

  useEffect(() => { load(1); }, [load]);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const clearForm = () => { setFormMode(null); setEditId(null); setName(''); setWebsite(''); setCountry(''); setIndustry(''); setNotes(''); setError(null); };

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return; }
    setSaving(true); setError(null);
    const r = formMode === 'edit' && editId
      ? await updateCompany(editId, { name, website, country, industry, notes })
      : await createCompany({ name, website, country, industry, notes });
    setSaving(false);
    if (!r.ok) { setError(r.error || 'Save failed'); return; }
    flash(formMode === 'edit' ? 'Company updated.' : 'Company created.');
    clearForm();
    await load(page, search);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this company?')) return;
    setDeleting(id);
    const r = await deleteCompany(id);
    setDeleting(null);
    if (!r.ok) { alert(r.error || 'Delete failed'); return; }
    flash('Company deleted.');
    await load(page, search);
  };

  const startEdit = (c: Company) => {
    setFormMode('edit'); setEditId(c.id); setName(c.name); setWebsite(c.website || '');
    setCountry(c.country || ''); setIndustry(c.industry || ''); setNotes(c.notes || '');
    setError(null); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Companies</h1>
        </div>
        {!formMode && (
          <Button onClick={() => setFormMode('create')} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Company
          </Button>
        )}
      </div>

      {success && <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-300">{success}</div>}

      {formMode && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">{formMode === 'edit' ? 'Edit Company' : 'Add Company'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={clearForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="mb-1.5 block">Name *</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Acme Corp" /></div>
              <div><Label className="mb-1.5 block">Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://acme.com" /></div>
              <div><Label className="mb-1.5 block">Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Netherlands" /></div>
              <div><Label className="mb-1.5 block">Industry</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} placeholder="SaaS" /></div>
            </div>
            <div><Label className="mb-1.5 block">Notes</Label><Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" /></div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {formMode === 'edit' ? 'Update' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={clearForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && load(1, search)}
            placeholder="Search companies..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => load(1, search)}>Search</Button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Website</th>
                  <th className="pb-2 pr-4 font-medium">Country</th>
                  <th className="pb-2 pr-4 font-medium">Industry</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.length === 0 ? (
                  <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No companies yet.</td></tr>
                ) : companies.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{c.website || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.country || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.industry || '—'}</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)} disabled={deleting === c.id}>
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
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => load(page - 1, search)} className="gap-1"><ChevronLeft className="w-4 h-4" /> Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => load(page + 1, search)} className="gap-1">Next <ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
