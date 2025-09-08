"use client";
import { useState } from "react";

export default function ScanForm() {
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
      const r = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await r.json();
      if (!r.ok || !data.ok) throw new Error(data.error || "Scan mislukt");
      setRes(data);
    } catch (err: any) {
      setError(err.message ?? "Onbekende fout");
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
          placeholder="bijv. example.com of https://example.com"
          className="flex-1 border rounded-xl px-3 py-2"
          required
        />
        <button disabled={loading} className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-50">
          {loading ? "Scannen..." : "Scan"}
        </button>
      </form>

      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-red-800">{error}</div>}

      {res && (
        <div className="rounded-xl border p-4">
          <div className="text-sm text-gray-600">Site</div>
          <div className="font-medium mb-2">{res.site}</div>
          <div className="text-sm text-gray-600">Score</div>
          <div className="text-2xl font-semibold mb-2">{res.score}</div>
          <div className="text-sm text-gray-600">Top issues</div>
          <pre className="mt-1 whitespace-pre-wrap text-sm bg-gray-50 p-3 rounded-lg">
            {JSON.stringify(res.summary?.top ?? [], null, 2)}
          </pre>
          <a href={`/scans/${res.scanId}`} className="text-blue-600 underline text-sm mt-2 inline-block">
            Bekijk volledige details →
          </a>
        </div>
      )}
    </div>
  );
}