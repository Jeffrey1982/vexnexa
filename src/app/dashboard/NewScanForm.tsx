"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TouchButton } from "@/components/ui/touch-button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Search, AlertCircle, Sparkles, Info } from "lucide-react";
import { useTranslations } from "next-intl";

export function NewScanForm() {
  const t = useTranslations("dashboard.newScan");
  const tScan = useTranslations("scanForm");
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
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        <div className="flex-1">
          <Input
            type="url"
            placeholder={tScan("placeholder")}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={isLoading}
            className="h-10 sm:h-11 text-base sm:text-base px-4 touch-manipulation"
            required
            aria-label={t("title")}
            autoComplete="url"
            inputMode="url"
          />
        </div>
        <TouchButton
          type="submit"
          disabled={!url.trim() || isLoading}
          className="h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base w-full sm:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span className="hidden sm:inline">{tScan("button.loading")}</span>
              <span className="sm:hidden">{tScan("button.loading")}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{tScan("button.idle")}</span>
              <span className="sm:hidden">{tScan("button.idle")}</span>
            </>
          )}
        </TouchButton>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {t("description")}
        </p>

        <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <div className="text-xs text-primary">
            <div className="font-medium mb-1">{t("enhancedTitle")}</div>
            <div className="text-primary/80">
              {t("enhancedDescription")}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}