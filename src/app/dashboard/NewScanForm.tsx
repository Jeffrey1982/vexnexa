"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle } from "lucide-react";

export function NewScanForm() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError("");

    try {
      console.log('🔍 Starting scan for URL:', url.trim());
      console.log('🔍 Sending request to /api/scan...');

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      console.log('🔍 Response status:', response.status);
      console.log('🔍 Response headers:', Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log('🔍 Response data:', data);

      if (!response.ok) {
        console.error('🔍 Request failed with status:', response.status, 'data:', data);
        throw new Error(data.error || `Failed to start scan (${response.status})`);
      }

      if (data.scanId) {
        console.log('🔍 Scan started successfully, redirecting to:', `/scans/${data.scanId}`);
        router.push(`/scans/${data.scanId}`);
      } else {
        console.error('🔍 No scan ID in response:', data);
        throw new Error("No scan ID returned");
      }
    } catch (err: any) {
      console.error('🔍 Scan request failed:', err);
      setError(err.message || 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder="https://example.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="h-11"
            required
            aria-label="Website URL to scan"
          />
        </div>
        <Button 
          type="submit" 
          disabled={!url.trim() || isLoading}
          className="h-11 px-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Start Scan
            </>
          )}
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <p className="text-xs text-muted-foreground">
        Enter a complete URL including https:// to run a comprehensive WCAG accessibility scan.
      </p>
    </form>
  );
}