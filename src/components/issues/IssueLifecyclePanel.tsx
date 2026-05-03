"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CopyButton } from "@/components/CopyButton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle2, Clock, FileWarning, ShieldCheck } from "lucide-react";

type IssueStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "ACCEPTED_RISK" | "FALSE_POSITIVE" | "CLOSED";

type IssueRecord = {
  id: string;
  violationId: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  impact: string | null;
  wcagCriteria: string[];
  helpUrl: string | null;
  pageUrl: string | null;
  selector: string | null;
  htmlSnippet: string | null;
  failureSummary: string | null;
  screenshotDataUrl: string | null;
  acceptedRiskReason: string | null;
  falsePositiveReason: string | null;
  estimatedHours: number | null;
  _count?: { comments: number };
};

interface IssueLifecyclePanelProps {
  scanId: string;
  initialIssues: IssueRecord[];
}

const statusLabels: Record<IssueStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  ACCEPTED_RISK: "Accepted risk",
  FALSE_POSITIVE: "False positive",
  CLOSED: "Closed",
};

const statusColumns: IssueStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "ACCEPTED_RISK", "FALSE_POSITIVE", "CLOSED"];

const priorityClasses: Record<IssueRecord["priority"], string> = {
  CRITICAL: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  HIGH: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200",
  LOW: "bg-slate-100 text-slate-700 dark:bg-white/[0.08] dark:text-slate-200",
};

function statusIcon(status: IssueStatus) {
  if (status === "RESOLVED" || status === "CLOSED") return <CheckCircle2 className="h-4 w-4 text-green-600" aria-hidden />;
  if (status === "ACCEPTED_RISK") return <ShieldCheck className="h-4 w-4 text-blue-600" aria-hidden />;
  if (status === "FALSE_POSITIVE") return <FileWarning className="h-4 w-4 text-slate-500" aria-hidden />;
  if (status === "IN_PROGRESS") return <Clock className="h-4 w-4 text-amber-600" aria-hidden />;
  return <AlertTriangle className="h-4 w-4 text-red-600" aria-hidden />;
}

export function IssueLifecyclePanel({ scanId, initialIssues }: IssueLifecyclePanelProps) {
  const [issues, setIssues] = useState<IssueRecord[]>(initialIssues);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const stats = useMemo(() => {
    const open = issues.filter((issue) => issue.status === "OPEN").length;
    const inProgress = issues.filter((issue) => issue.status === "IN_PROGRESS").length;
    const closed = issues.filter((issue) => ["RESOLVED", "ACCEPTED_RISK", "FALSE_POSITIVE", "CLOSED"].includes(issue.status)).length;
    const hours = issues.reduce((sum, issue) => sum + (issue.estimatedHours || 0), 0);
    return { open, inProgress, closed, hours };
  }, [issues]);

  async function updateIssue(issueId: string, updates: Partial<IssueRecord>) {
    setSavingId(issueId);
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Issue update failed");
      setIssues((current) => current.map((issue) => (issue.id === issueId ? { ...issue, ...data.issue } : issue)));
      toast({ title: "Issue updated" });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not update issue",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setSavingId(null);
    }
  }

  if (issues.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No tracked issues were created for this scan.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{issues.length}</div>
            <div className="text-xs text-muted-foreground">Tracked findings</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.open}</div>
            <div className="text-xs text-muted-foreground">Open</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-600">{stats.inProgress}</div>
            <div className="text-xs text-muted-foreground">In progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.closed}</div>
            <div className="text-xs text-muted-foreground">Resolved or accepted</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {statusColumns.map((status) => {
          const columnIssues = issues.filter((issue) => issue.status === status);
          return (
            <Card key={status} className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30 px-4 py-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2">
                    {statusIcon(status)}
                    {statusLabels[status]}
                  </span>
                  <Badge variant="outline">{columnIssues.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-3">
                {columnIssues.length === 0 ? (
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Empty
                  </div>
                ) : (
                  columnIssues.map((issue) => (
                    <div key={issue.id} className="space-y-3 rounded-md border bg-background p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={priorityClasses[issue.priority]}>{issue.priority}</Badge>
                            <code className="rounded bg-muted px-1.5 py-0.5 text-[11px]">{issue.violationId}</code>
                          </div>
                          <h3 className="mt-2 text-sm font-semibold leading-snug">{issue.title}</h3>
                        </div>
                      </div>

                      <Select
                        value={issue.status}
                        disabled={savingId === issue.id}
                        onValueChange={(value) => updateIssue(issue.id, { status: value as IssueStatus })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {statusColumns.map((item) => (
                            <SelectItem key={item} value={item}>
                              {statusLabels[item]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {issue.selector && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                            <span>Selector</span>
                            <CopyButton text={issue.selector} size="sm" />
                          </div>
                          <code className="block overflow-hidden text-ellipsis rounded bg-muted p-2 text-[11px]">
                            {issue.selector}
                          </code>
                        </div>
                      )}

                      {issue.screenshotDataUrl && (
                        <div
                          className="h-28 rounded-md border bg-muted bg-contain bg-center bg-no-repeat"
                          style={{ backgroundImage: `url(${issue.screenshotDataUrl})` }}
                          aria-label="Issue screenshot evidence"
                          role="img"
                        />
                      )}

                      {issue.wcagCriteria.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {issue.wcagCriteria.slice(0, 4).map((criterion) => (
                            <Badge key={criterion} variant="outline" className="text-[10px]">
                              {criterion}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {(issue.status === "ACCEPTED_RISK" || issue.status === "FALSE_POSITIVE") && (
                        <div className="space-y-2">
                          <Textarea
                            value={reasonDrafts[issue.id] ?? issue.acceptedRiskReason ?? issue.falsePositiveReason ?? ""}
                            onChange={(event) =>
                              setReasonDrafts((current) => ({ ...current, [issue.id]: event.target.value }))
                            }
                            placeholder={issue.status === "ACCEPTED_RISK" ? "Accepted risk reason" : "False positive reason"}
                            className="min-h-20 text-xs"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={savingId === issue.id}
                            onClick={() =>
                              updateIssue(
                                issue.id,
                                issue.status === "ACCEPTED_RISK"
                                  ? { acceptedRiskReason: reasonDrafts[issue.id] ?? "" }
                                  : { falsePositiveReason: reasonDrafts[issue.id] ?? "" }
                              )
                            }
                          >
                            Save reason
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">Scan ID: {scanId}</p>
    </div>
  );
}
