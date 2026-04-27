"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

type ScanStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "queued" | "running" | "done" | "failed";

interface ScanProgress {
  message?: string;
  currentPage?: number;
  totalPages?: number;
  currentUrl?: string;
  scannedUrls?: string[];
  percent?: number;
}

interface ScanProcessingStatusProps {
  scanId: string;
  initialStatus: ScanStatus;
  url: string;
}

export function ScanProcessingStatus({ scanId, initialStatus, url }: ScanProcessingStatusProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ScanStatus>(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [scanProgress, setScanProgress] = useState<ScanProgress | null>(null);

  const progress = useMemo(() => {
    if (typeof scanProgress?.percent === "number") {
      return Math.min(96, Math.max(8, scanProgress.percent));
    }
    if (status === "PENDING" || status === "queued") return 12;
    if (status === "PROCESSING" || status === "running") {
      return Math.min(92, 24 + elapsedSeconds * 1.1);
    }
    if (status === "COMPLETED" || status === "done") return 100;
    return Math.min(100, 24 + elapsedSeconds);
  }, [elapsedSeconds, scanProgress?.percent, status]);

  useEffect(() => {
    const tick = window.setInterval(() => {
      setElapsedSeconds((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const pollScan = async () => {
      try {
        const response = await fetch(`/api/scans/${scanId}`, { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Failed to check scan status");
        }

        const nextStatus = payload.data?.status as ScanStatus | undefined;
        const nextError = payload.data?.error as string | null | undefined;
        const nextProgress = payload.data?.resultJson?.scanProgress as ScanProgress | undefined;

        if (cancelled || !nextStatus) return;

        setStatus(nextStatus);
        setScanProgress(nextProgress || null);

        if (nextStatus === "COMPLETED" || nextStatus === "done") {
          router.refresh();
        }

        if (nextStatus === "FAILED" || nextStatus === "failed") {
          setError(nextError || "The scan failed while processing. Please try again.");
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(pollError instanceof Error ? pollError.message : "Failed to check scan status");
        }
      }
    };

    pollScan();
    const interval = window.setInterval(pollScan, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [router, scanId]);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader>
        <div className="flex items-start gap-3">
          <Loader2 className="mt-1 h-5 w-5 animate-spin text-primary" />
          <div>
            <CardTitle>Processing heavy site...</CardTitle>
            <CardDescription className="mt-1">
              This may take up to 90 seconds while VexNexa scans internal pages, runs axe-core, AI checks, and analytics in the background.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="truncate">{scanProgress?.currentUrl || url}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          {scanProgress?.message && (
            <p className="text-sm text-muted-foreground">{scanProgress.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
          <div className="rounded-lg border border-border p-3">
            <div className="font-medium">Status</div>
            <div className="mt-1 text-muted-foreground">{status}</div>
          </div>
          {scanProgress?.totalPages ? (
            <div className="rounded-lg border border-border p-3">
              <div className="font-medium">Pages</div>
              <div className="mt-1 text-muted-foreground">
                {scanProgress.currentPage || 0} / {scanProgress.totalPages}
              </div>
            </div>
          ) : null}
          <div className="rounded-lg border border-border p-3">
            <div className="font-medium">Elapsed</div>
            <div className="mt-1 text-muted-foreground">{elapsedSeconds}s</div>
          </div>
          <div className="rounded-lg border border-border p-3">
            <div className="font-medium">Polling</div>
            <div className="mt-1 text-muted-foreground">Every 3 seconds</div>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
