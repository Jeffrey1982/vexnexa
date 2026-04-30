"use client";

import useSWR from "swr";
import { motion } from "framer-motion";
import { Activity, Download, Gauge, Loader2, Radar, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type AdminScan = {
  id: string;
  url: string;
  siteUrl: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  score: number | null;
  issues: number | null;
  impactCritical: number;
  impactSerious: number;
  impactModerate: number;
  impactMinor: number;
  performanceScore: number | null;
  scanDuration: number | null;
  pageLoadTime: number | null;
  elementsScanned: number | null;
  createdAt: string;
  user: {
    email: string;
    name: string | null;
  };
  vni: {
    score: number | null;
    tier: string | null;
  };
};

type ScansResponse = {
  ok: boolean;
  scans: AdminScan[];
  refreshedAt: string;
};

const fetcher = async (url: string): Promise<ScansResponse> => {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Could not refresh scans");
  }
  return response.json();
};

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function formatDuration(ms: number | null): string {
  if (!ms) return "-";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function statusLabel(status: AdminScan["status"]) {
  if (status === "PROCESSING" || status === "PENDING") return "Scanning...";
  return status.charAt(0) + status.slice(1).toLowerCase();
}

function StatusBadge({ status }: { status: AdminScan["status"] }) {
  const scanning = status === "PROCESSING" || status === "PENDING";

  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-xl border px-2.5 py-1",
        status === "COMPLETED" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
        status === "FAILED" && "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
        scanning && "border-teal-500/40 bg-teal-500/10 text-teal-700 dark:text-teal-300"
      )}
    >
      {scanning && <span className="mr-1.5 inline-flex h-2 w-2 animate-ping rounded-full bg-teal-500" />}
      {scanning && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
      {statusLabel(status)}
    </Badge>
  );
}

function VniBadge({ scan }: { scan: AdminScan }) {
  if (scan.status !== "COMPLETED") {
    return <span className="text-sm text-muted-foreground">Pending VNI</span>;
  }

  const score = scan.vni.score ?? scan.score ?? 0;
  const stars = score >= 90 ? 3 : score >= 75 ? 2 : score >= 60 ? 1 : 0;
  const elite = stars === 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-semibold",
        elite
          ? "border-teal-500/50 bg-teal-500/15 text-teal-700 dark:text-teal-300"
          : "border-border bg-muted/40 text-muted-foreground"
      )}
    >
      <span>{elite ? "Elite" : scan.vni.tier ?? "VNI"}</span>
      <span className="flex items-center gap-0.5">
        {[0, 1, 2].map((index) => (
          <motion.span
            key={index}
            initial={{ opacity: 0, scale: 0.4, rotate: -12 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ delay: 0.08 * index, duration: 0.25 }}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                index < stars ? "fill-teal-500 text-teal-500" : "text-muted-foreground/30"
              )}
            />
          </motion.span>
        ))}
      </span>
    </motion.div>
  );
}

export function AdminScansClient() {
  const { data, error, isLoading } = useSWR<ScansResponse>("/api/admin/scans", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
    dedupingInterval: 1500,
  });

  const scans = data?.scans ?? [];
  const activeScans = scans.filter((scan) => scan.status === "PROCESSING" || scan.status === "PENDING").length;
  const completedScans = scans.filter((scan) => scan.status === "COMPLETED");
  const averageScore = completedScans.length
    ? Math.round(completedScans.reduce((sum, scan) => sum + (scan.score ?? 0), 0) / completedScans.length)
    : 0;
  const eliteScans = completedScans.filter((scan) => (scan.vni.score ?? scan.score ?? 0) >= 90).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4 text-teal-500" />
              Active scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{activeScans}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Gauge className="h-4 w-4 text-teal-500" />
              Average score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="h-4 w-4 fill-teal-500 text-teal-500" />
              Elite VNI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-teal-600">{eliteScans}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5 text-teal-500" />
            Realtime scans
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            {data?.refreshedAt ? `Updated ${new Date(data.refreshedAt).toLocaleTimeString()}` : "Polling every 5s"}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-700 dark:text-red-300">
              Scan refresh failed. Retrying automatically.
            </div>
          )}

          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Scan result</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>VNI</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      Loading scans...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && scans.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      No scans found.
                    </TableCell>
                  </TableRow>
                )}
                {scans.map((scan) => (
                  <TableRow key={scan.id}>
                    <TableCell>
                      <div className="flex min-w-[260px] items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{hostFromUrl(scan.url)}</div>
                          <div className="truncate text-xs text-muted-foreground">{scan.url}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            Score {scan.score ?? "-"} / Issues {scan.issues ?? 0}
                          </div>
                        </div>
                        {scan.status === "COMPLETED" && (
                          <Button asChild size="sm" className="shrink-0 bg-teal-600 text-white hover:bg-teal-700">
                            <a href={`/api/admin/download-report?scanId=${scan.id}`} target="_blank" rel="noreferrer">
                              <Download className="h-4 w-4" />
                              PDF
                            </a>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={scan.status} />
                    </TableCell>
                    <TableCell>
                      <VniBadge scan={scan} />
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div>{scan.performanceScore !== null ? `${Math.round(scan.performanceScore)} perf` : "No perf score"}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(scan.scanDuration)} scan / {formatDuration(scan.pageLoadTime)} load
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[180px] truncate text-sm">{scan.user.name ?? scan.user.email}</div>
                      {scan.user.name && <div className="max-w-[180px] truncate text-xs text-muted-foreground">{scan.user.email}</div>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(scan.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
