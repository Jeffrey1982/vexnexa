"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TouchButton } from "@/components/ui/touch-button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, Sparkles, Info } from "lucide-react";
import { useTranslations } from "next-intl";
import { normalizeUrl } from "@/lib/url";
import { cn } from "@/lib/utils";

export function NewScanForm() {
  const t = useTranslations("dashboard.newScan");
  const tScan = useTranslations("scanForm");
  const [url, setUrl] = useState("");
  const [includeVNI, setIncludeVNI] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const normalizedUrl = normalizeUrl(url);
    if (!normalizedUrl) {
      setError("Please enter a valid website URL.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      setUrl(normalizedUrl);
      console.log("[NewScanForm] Starting scan for URL:", normalizedUrl);
      console.log("[NewScanForm] Sending request to /api/scan...");

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: normalizedUrl,
          includeVNI,
          standard: "WCAG 2.2 AA",
        }),
      });

      console.log("[NewScanForm] Response status:", response.status);
      console.log("[NewScanForm] Response headers:", Object.fromEntries(response.headers.entries()));

      const data = await response.json();
      console.log("[NewScanForm] Response data:", data);

      if (!response.ok) {
        console.error("[NewScanForm] Request failed with status:", response.status, "data:", data);
        throw new Error(data.error || `Failed to start scan (${response.status})`);
      }

      if (data.scanId) {
        console.log("[NewScanForm] Scan started successfully, redirecting to:", `/scans/${data.scanId}`);
        router.push(`/scans/${data.scanId}`);
      } else {
        console.error("[NewScanForm] No scan ID in response:", data);
        throw new Error("No scan ID returned");
      }
    } catch (err: any) {
      console.error("[NewScanForm] Scan request failed:", err);
      setError(err.message || "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4" noValidate>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="e.g., https://example.com or example.com"
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
          className="h-10 sm:h-11 px-4 sm:px-6 text-sm sm:text-base w-full sm:w-auto bg-[#FF7A00] hover:bg-[#FF7A00]/90"
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

      <div className="flex justify-center pt-1">
        <button
          type="button"
          onClick={() => setIncludeVNI((value) => !value)}
          disabled={isLoading}
          aria-pressed={includeVNI}
          className="group flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-[#FF8C00]/30 bg-background px-4 py-3 text-left shadow-sm transition-all hover:border-[#FF8C00]/60 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:min-w-[420px]"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-2 text-sm font-semibold text-foreground sm:text-base">
              {tScan("vniToggle.label")}
              <span
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#FF8C00]/40 bg-[#FF8C00]/10 text-[10px] font-bold text-[#FF8C00]"
                title={tScan("vniToggle.tooltip")}
                aria-label={tScan("vniToggle.tooltip")}
              >
                i
              </span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              {tScan("vniToggle.subtext")}
            </span>
          </span>

          <span
            className={cn(
              "relative inline-flex h-7 w-14 flex-none items-center rounded-full border border-transparent transition-colors",
              includeVNI ? "bg-[#FF8C00]" : "bg-input"
            )}
            aria-hidden="true"
          >
            <span
              className={cn(
                "absolute left-1 h-5 w-5 rounded-full bg-background shadow-md transition-transform",
                includeVNI && "translate-x-7"
              )}
            />
          </span>
        </button>
      </div>

      <div aria-live="assertive" aria-atomic="true">
        {error && (
          <Alert variant="destructive" id="scan-error">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>

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
