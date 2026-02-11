'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { importContacts } from '../actions';

interface ImportReport {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ParsedRow {
  company_name?: string;
  website?: string;
  country?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  position?: string;
  tags?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  const rows: ParsedRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row as ParsedRow);
  }

  return rows;
}

export default function ImportClient() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setReport(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        setError('No valid rows found. Make sure the CSV has a header row.');
        return;
      }
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setError(null);
    setReport(null);

    const r = await importContacts(rows);
    setImporting(false);

    if (!r.ok) {
      setError(r.error || 'Import failed');
      return;
    }
    setReport(r.data as ImportReport);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Upload className="h-7 w-7 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Import Contacts</h1>
          <p className="text-muted-foreground text-sm">Upload a CSV to bulk-import companies and contacts</p>
        </div>
      </div>

      {/* Instructions */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-display">CSV Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            Your CSV should have a header row with these columns (all optional except <strong>email</strong>):
          </p>
          <code className="block bg-muted rounded-lg p-3 text-xs font-mono overflow-x-auto">
            company_name, website, country, first_name, last_name, email, position, tags
          </code>
          <p className="text-xs text-muted-foreground mt-2">
            Tags should be comma-separated within the field (e.g. &quot;lead, enterprise&quot;).
            Companies are upserted by domain or name. Contacts are upserted by email.
          </p>
        </CardContent>
      </Card>

      {/* Upload */}
      <Card className="rounded-2xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4">
            <div
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-[var(--vn-primary)] transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm font-medium">{fileName || 'Click to select a CSV file'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {rows.length > 0 ? `${rows.length} rows parsed` : 'Supports .csv files'}
              </p>
            </div>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

            {rows.length > 0 && !report && (
              <div className="w-full">
                {/* Preview first 5 rows */}
                <div className="overflow-x-auto mb-4">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-1 pr-3 font-medium">#</th>
                        <th className="pb-1 pr-3 font-medium">Email</th>
                        <th className="pb-1 pr-3 font-medium">Name</th>
                        <th className="pb-1 pr-3 font-medium">Company</th>
                        <th className="pb-1 pr-3 font-medium">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="py-1 pr-3 text-muted-foreground">{i + 1}</td>
                          <td className="py-1 pr-3">{r.email || '—'}</td>
                          <td className="py-1 pr-3">{[r.first_name, r.last_name].filter(Boolean).join(' ') || '—'}</td>
                          <td className="py-1 pr-3">{r.company_name || '—'}</td>
                          <td className="py-1 pr-3">{r.country || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 5 && <p className="text-xs text-muted-foreground mt-1">...and {rows.length - 5} more rows</p>}
                </div>

                <Button onClick={handleImport} disabled={importing} className="gap-2 w-full">
                  {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  Import {rows.length} Contacts
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Report */}
      {report && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" /> Import Complete
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{report.imported}</div>
                <div className="text-xs text-muted-foreground">New contacts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{report.updated}</div>
                <div className="text-xs text-muted-foreground">Updated</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{report.skipped}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
            {report.errors.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-1">Errors ({report.errors.length}):</p>
                <div className="max-h-40 overflow-y-auto bg-muted rounded-lg p-3">
                  {report.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-600 dark:text-red-400">{err}</p>
                  ))}
                </div>
              </div>
            )}
            <Button variant="outline" className="mt-3" onClick={() => { setRows([]); setReport(null); setFileName(''); }}>
              Import Another File
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
