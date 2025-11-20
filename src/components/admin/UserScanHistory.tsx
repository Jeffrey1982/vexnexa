"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";
import { ExternalLink, Download, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { ScoreBadge } from "@/components/ScoreBadge";

interface Scan {
  id: string;
  status: string;
  score: number | null;
  createdAt: Date | string;
  elementsScanned: number | null;
  issues: number | null;
  site: {
    id: string;
    url: string;
  };
}

interface UserScanHistoryProps {
  scans: Scan[];
  userId: string;
}

export function UserScanHistory({ scans, userId }: UserScanHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "score">("date");

  const filteredScans = useMemo(() => {
    let filtered = [...scans];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.site.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scan.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(scan => scan.status === statusFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else {
        // Sort by score (nulls last)
        if (a.score === null) return 1;
        if (b.score === null) return -1;
        return b.score - a.score;
      }
    });

    return filtered;
  }, [scans, searchTerm, statusFilter, sortBy]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "done":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "pending":
      case "scanning":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "done":
        return <Badge variant="outline" className="border-green-500 text-green-600">Completed</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Pending</Badge>;
      case "scanning":
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Scanning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statsData = {
    total: scans.length,
    completed: scans.filter(s => s.status === "done").length,
    failed: scans.filter(s => s.status === "failed").length,
    pending: scans.filter(s => s.status === "pending" || s.status === "scanning").length,
    avgScore: scans.filter(s => s.score !== null).length > 0
      ? scans.filter(s => s.score !== null).reduce((sum, s) => sum + (s.score || 0), 0) / scans.filter(s => s.score !== null).length
      : null
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Scan History</CardTitle>
            <CardDescription>All accessibility scans performed by this user</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/admin/export-scans?userId=${userId}`} download>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{statsData.total}</div>
            <div className="text-xs text-gray-500">Total Scans</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{statsData.completed}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{statsData.failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{statsData.pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {statsData.avgScore !== null ? statsData.avgScore.toFixed(0) : "N/A"}
            </div>
            <div className="text-xs text-gray-500">Avg Score</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Search by URL..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="done">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="scanning">Scanning</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as "date" | "score")}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Sort by Date</SelectItem>
              <SelectItem value="score">Sort by Score</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Scans Table */}
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      {scans.length === 0 ? "No scans found" : "No scans match your filters"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(scan.status)}
                          {getStatusBadge(scan.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <div className="font-medium truncate">{scan.site.url}</div>
                          <div className="text-xs text-gray-500 truncate">ID: {scan.id.substring(0, 8)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {scan.score !== null ? (
                          <ScoreBadge score={scan.score} size="sm" />
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(new Date(scan.createdAt))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {scan.status === "done" ? (
                            <>
                              <Button variant="ghost" size="sm" asChild>
                                <Link href={`/dashboard/audits/${scan.id}`}>
                                  <ExternalLink className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="sm" asChild>
                                <a href={`/api/admin/download-report?scanId=${scan.id}`} download>
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            </>
                          ) : scan.status === "failed" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              title="Scan failed"
                            >
                              <AlertCircle className="w-4 h-4 text-red-600" />
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Failed Scans Alert */}
        {statsData.failed > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-900">
                  {statsData.failed} Failed Scans Detected
                </div>
                <div className="text-xs text-red-700 mt-1">
                  Review failed scans for error patterns. Common issues: timeout, invalid URLs, blocked by robots.txt, or site authentication required.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
