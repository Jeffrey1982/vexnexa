"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ScanForm() {
  const t = useTranslations("scanForm");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setRes(null);
    setError(null);
    try {
      console.log('🔍 [ScanForm] Starting scan for URL:', url);

      const r = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      console.log('🔍 [ScanForm] Response status:', r.status);

      const data = await r.json();
      console.log('🔍 [ScanForm] Response data:', data);

      if (!r.ok || !data.ok) {
        console.error('🔍 [ScanForm] Request failed:', data);
        throw new Error(data.error || t("errors.failed"));
      }

      setRes(data);
    } catch (err: any) {
      console.error('🔍 [ScanForm] Error:', err);
      setError(err.message ?? t("errors.failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={t("placeholder")}
          className="flex-1 border rounded-xl px-3 py-2"
          required
        />
        <button disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:bg-[var(--vn-disabled-bg)] disabled:text-[var(--vn-disabled-fg)] disabled:opacity-100">
          {loading ? t("button.loading") : t("button.idle")}
        </button>
      </form>

      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

      {res && (
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Site</div>
          <div className="font-medium mb-2">{res.site}</div>
          <div className="text-sm text-muted-foreground">Score</div>
          <div className="text-2xl font-semibold mb-2">{res.score}</div>
          <div className="text-sm text-muted-foreground">Top issues</div>
          <pre className="mt-1 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg">
            {JSON.stringify(res.summary?.top ?? [], null, 2)}
          </pre>
          <a href={`/scans/${res.scanId}`} className="text-blue-600 underline text-sm mt-2 inline-block">
            {t("button.success")} →
          </a>
        </div>
      )}
    </div>
  );
}