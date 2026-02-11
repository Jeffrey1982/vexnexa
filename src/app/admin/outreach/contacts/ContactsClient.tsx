'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Users, Plus, Pencil, Trash2, Loader2, X, Save, Search,
  ChevronLeft, ChevronRight, Ban, MailX,
} from 'lucide-react';
import { fetchContacts, createContact, updateContact, deleteContact, fetchCompanies } from '../actions';

interface Contact {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_id: string | null;
  position: string | null;
  country: string | null;
  tags: string[];
  do_not_email: boolean;
  unsubscribed: boolean;
  created_at: string;
  outreach_companies: { name: string } | null;
}

interface Company {
  id: string;
  name: string;
}

const PAGE_SIZE = 25;

export default function ContactsClient() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterCountry, setFilterCountry] = useState('');
  const [filterTag, setFilterTag] = useState('');

  const [companies, setCompanies] = useState<Company[]>([]);
  const [formMode, setFormMode] = useState<'create' | 'edit' | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [position, setPosition] = useState('');
  const [country, setCountry] = useState('');
  const [tags, setTags] = useState('');

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const load = useCallback(async (p: number) => {
    const r = await fetchContacts(PAGE_SIZE, (p - 1) * PAGE_SIZE, {
      search: search || undefined,
      country: filterCountry || undefined,
      tag: filterTag || undefined,
    });
    if (r.ok && r.data) {
      const d = r.data as { contacts: Contact[]; total: number };
      setContacts(d.contacts);
      setTotal(d.total);
      setPage(p);
    }
  }, [search, filterCountry, filterTag]);

  useEffect(() => { load(1); }, [load]);

  useEffect(() => {
    fetchCompanies(200, 0).then(r => {
      if (r.ok && r.data) setCompanies((r.data as { companies: Company[] }).companies);
    });
  }, []);

  const flash = (msg: string) => { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); };

  const clearForm = () => {
    setFormMode(null); setEditId(null); setFirstName(''); setLastName('');
    setEmail(''); setCompanyId(''); setPosition(''); setCountry(''); setTags(''); setError(null);
  };

  const handleSave = async () => {
    if (!email.trim()) { setError('Email is required'); return; }
    setSaving(true); setError(null);
    const tagArr = tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      first_name: firstName, last_name: lastName, email: email.toLowerCase().trim(),
      company_id: companyId || undefined, position, country, tags: tagArr,
    };
    const r = formMode === 'edit' && editId
      ? await updateContact(editId, payload)
      : await createContact(payload);
    setSaving(false);
    if (!r.ok) { setError(r.error || 'Save failed'); return; }
    flash(formMode === 'edit' ? 'Contact updated.' : 'Contact created.');
    clearForm();
    await load(page);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contact?')) return;
    setDeleting(id);
    const r = await deleteContact(id);
    setDeleting(null);
    if (!r.ok) { alert(r.error || 'Delete failed'); return; }
    flash('Contact deleted.');
    await load(page);
  };

  const startEdit = (c: Contact) => {
    setFormMode('edit'); setEditId(c.id); setFirstName(c.first_name); setLastName(c.last_name);
    setEmail(c.email); setCompanyId(c.company_id || ''); setPosition(c.position || '');
    setCountry(c.country || ''); setTags((c.tags || []).join(', ')); setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleFlag = async (id: string, field: 'do_not_email' | 'unsubscribed', current: boolean) => {
    await updateContact(id, { [field]: !current });
    await load(page);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-7 w-7 text-[var(--vn-primary)]" />
          <h1 className="font-display text-2xl font-bold tracking-tight">Contacts</h1>
        </div>
        {!formMode && (
          <Button onClick={() => setFormMode('create')} size="sm" className="gap-2">
            <Plus className="w-4 h-4" /> Add Contact
          </Button>
        )}
      </div>

      {success && <div className="rounded-xl border border-green-300 dark:border-green-800 bg-green-50 dark:bg-green-950/30 px-4 py-2 text-sm text-green-700 dark:text-green-300">{success}</div>}

      {formMode && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-lg font-display">{formMode === 'edit' ? 'Edit Contact' : 'Add Contact'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={clearForm}><X className="w-4 h-4" /></Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm text-red-700 dark:text-red-300">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><Label className="mb-1.5 block">First Name</Label><Input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" /></div>
              <div><Label className="mb-1.5 block">Last Name</Label><Input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" /></div>
              <div><Label className="mb-1.5 block">Email *</Label><Input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@acme.com" type="email" /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="mb-1.5 block">Company</Label>
                <select value={companyId} onChange={e => setCompanyId(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm">
                  <option value="">— None —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><Label className="mb-1.5 block">Position</Label><Input value={position} onChange={e => setPosition(e.target.value)} placeholder="CTO" /></div>
              <div><Label className="mb-1.5 block">Country</Label><Input value={country} onChange={e => setCountry(e.target.value)} placeholder="Netherlands" /></div>
            </div>
            <div><Label className="mb-1.5 block">Tags (comma-separated)</Label><Input value={tags} onChange={e => setTags(e.target.value)} placeholder="lead, enterprise, eu" /></div>
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load(1)} placeholder="Search..." className="pl-9" />
        </div>
        <Input value={filterCountry} onChange={e => setFilterCountry(e.target.value)} placeholder="Country" className="w-32" />
        <Input value={filterTag} onChange={e => setFilterTag(e.target.value)} placeholder="Tag" className="w-32" />
        <Button variant="outline" size="sm" onClick={() => load(1)}>Filter</Button>
      </div>

      {/* Table */}
      <Card className="rounded-2xl">
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Name</th>
                  <th className="pb-2 pr-4 font-medium">Email</th>
                  <th className="pb-2 pr-4 font-medium">Company</th>
                  <th className="pb-2 pr-4 font-medium">Country</th>
                  <th className="pb-2 pr-4 font-medium">Tags</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No contacts found.</td></tr>
                ) : contacts.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-4 font-medium whitespace-nowrap">{c.first_name} {c.last_name}</td>
                    <td className="py-2.5 pr-4 text-xs max-w-[200px] truncate">{c.email}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.outreach_companies?.name || '—'}</td>
                    <td className="py-2.5 pr-4 text-xs">{c.country || '—'}</td>
                    <td className="py-2.5 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {(c.tags || []).slice(0, 3).map(t => (
                          <Badge key={t} variant="outline" className="text-[10px] px-1.5 py-0">{t}</Badge>
                        ))}
                        {(c.tags || []).length > 3 && <span className="text-[10px] text-muted-foreground">+{c.tags.length - 3}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <div className="flex gap-1">
                        {c.unsubscribed && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Unsub</Badge>}
                        {c.do_not_email && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">DNE</Badge>}
                        {!c.unsubscribed && !c.do_not_email && <span className="text-green-600 dark:text-green-400 text-xs">Active</span>}
                      </div>
                    </td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={c.do_not_email ? 'Remove DNE' : 'Mark Do Not Email'} onClick={() => toggleFlag(c.id, 'do_not_email', c.do_not_email)}>
                          <Ban className={`w-3.5 h-3.5 ${c.do_not_email ? 'text-red-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" title={c.unsubscribed ? 'Re-subscribe' : 'Unsubscribe'} onClick={() => toggleFlag(c.id, 'unsubscribed', c.unsubscribed)}>
                          <MailX className={`w-3.5 h-3.5 ${c.unsubscribed ? 'text-red-500' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(c.id)} disabled={deleting === c.id}>
                          {deleting === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
