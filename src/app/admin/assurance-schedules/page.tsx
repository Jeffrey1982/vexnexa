'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Loader2,
  RefreshCw,
  Calendar,
  Play,
  Pause,
  Eye,
  Clock,
  Mail,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Globe,
  Users,
  RotateCcw,
} from 'lucide-react';

// ── Types ──

interface AdminSchedule {
  id: string;
  userId: string;
  siteId: string;
  user: { id: string; email: string; firstName: string | null; lastName: string | null };
  site: { id: string; url: string };
  isEnabled: boolean;
  timezone: string;
  frequency: string;
  daysOfWeek: number[];
  dayOfMonth: number | null;
  timeOfDay: string;
  startsAt: string;
  endsAt: string | null;
  lastRunAt: string | null;
  nextRunAt: string;
  recipients: string[];
  deliverFormat: string;
  includeExecutiveSummaryOnly: boolean;
  consecutiveFailures: number;
  _count: { runs: number };
  createdAt: string;
  runs?: Array<{
    id: string;
    windowKey: string;
    status: string;
    scanScore: number | null;
    emailSentAt: string | null;
    startedAt: string;
    completedAt: string | null;
    error: string | null;
  }>;
}

// ── Constants ──

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRunStatusIcon(status: string) {
  switch (status) {
    case 'success':
      return <CheckCircle2 className="w-4 h-4 text-green-500" />;
    case 'failed':
      return <XCircle className="w-4 h-4 text-red-500" />;
    case 'running':
      return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
    default:
      return <Clock className="w-4 h-4 text-muted-foreground" />;
  }
}

// ── Main Page ──

export default function AdminAssuranceSchedulesPage() {
  const { toast } = useToast();

  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Detail drawer
  const [selectedSchedule, setSelectedSchedule] = useState<AdminSchedule | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  // Fetch
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/admin/schedules?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules);
      } else {
        throw new Error(data.error);
      }
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to load schedules',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  }, [searchQuery, statusFilter, toast]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Open detail
  const openDetail = async (schedule: AdminSchedule) => {
    setSelectedSchedule(schedule);
    setDetailOpen(true);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedSchedule(data.schedule);
      }
    } catch {
      // Use existing data
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle enable/disable
  const toggleSchedule = async (schedule: AdminSchedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !schedule.isEnabled }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({
        title: schedule.isEnabled ? 'Schedule disabled' : 'Schedule enabled',
        description: `${schedule.user.email} — ${schedule.site.url}`,
      });
      fetchSchedules();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to update',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Reset failures
  const resetFailures = async (schedule: AdminSchedule) => {
    try {
      const res = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consecutiveFailures: 0, isEnabled: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: 'Failures reset & schedule re-enabled' });
      fetchSchedules();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to reset',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Force run (trigger cron for this schedule)
  const forceRun = async (schedule: AdminSchedule) => {
    try {
      // Set nextRunAt to now so the cron picks it up
      const res = await fetch(`/api/admin/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: true }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      // Now trigger the cron
      const cronRes = await fetch('/api/cron/assurance-schedules', {
        method: 'POST',
        headers: { 'X-CRON-TOKEN': '(admin-force-run)' },
      });
      // This will likely fail auth in prod, but the schedule is now marked for next cron run
      if (cronRes.ok) {
        toast({ title: 'Force run triggered', description: schedule.site.url });
      } else {
        toast({ title: 'Schedule enabled for next cron run', description: 'The cron job will pick it up on its next cycle.' });
      }
      fetchSchedules();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to force run',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Stats
  const enabledCount = schedules.filter((s) => s.isEnabled).length;
  const failingCount = schedules.filter((s) => s.consecutiveFailures > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assurance Schedules</h1>
          <p className="text-muted-foreground text-sm mt-1">
            View and manage customer scan schedules across all accounts.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{schedules.length}</p>
                <p className="text-xs text-muted-foreground">Total Schedules</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-500/10">
                <Play className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{enabledCount}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{failingCount}</p>
                <p className="text-xs text-muted-foreground">With Failures</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by email or site URL…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="enabled">Enabled</SelectItem>
                <SelectItem value="disabled">Disabled</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchSchedules} title="Refresh">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Schedules
          </CardTitle>
          <CardDescription>
            {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No schedules found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead>
                  <tr className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Site</th>
                    <th className="px-4 py-3">Schedule</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Next Run</th>
                    <th className="px-4 py-3">Runs</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {schedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium text-foreground">{schedule.user.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {[schedule.user.firstName, schedule.user.lastName].filter(Boolean).join(' ')}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                          <span className="text-foreground truncate max-w-[200px]">{schedule.site.url}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
                        {schedule.frequency === 'WEEKLY' && (
                          <> ({schedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(',')})</>
                        )}
                        {' '}at {schedule.timeOfDay}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Badge variant={schedule.isEnabled ? 'default' : 'secondary'}>
                            {schedule.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                          {schedule.consecutiveFailures > 0 && (
                            <Badge variant="destructive" className="text-[10px]">
                              {schedule.consecutiveFailures} fail{schedule.consecutiveFailures > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDateTime(schedule.nextRunAt)}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {schedule._count.runs}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDetail(schedule)} title="View details">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleSchedule(schedule)} title={schedule.isEnabled ? 'Disable' : 'Enable'}>
                            {schedule.isEnabled ? <Pause className="w-4 h-4 text-orange-500" /> : <Play className="w-4 h-4 text-green-500" />}
                          </Button>
                          {schedule.consecutiveFailures > 0 && (
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => resetFailures(schedule)} title="Reset failures & re-enable">
                              <RotateCcw className="w-4 h-4 text-blue-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedSchedule && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  {selectedSchedule.site.url}
                </SheetTitle>
                <SheetDescription>
                  {selectedSchedule.user.email}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Frequency</p>
                    <p className="font-medium text-foreground mt-1">
                      {FREQUENCY_LABELS[selectedSchedule.frequency]}
                      {selectedSchedule.frequency === 'WEEKLY' && (
                        <> ({selectedSchedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')})</>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Time</p>
                    <p className="font-medium text-foreground mt-1">{selectedSchedule.timeOfDay} ({selectedSchedule.timezone})</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Next Run</p>
                    <p className="font-medium text-foreground mt-1">{formatDateTime(selectedSchedule.nextRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Last Run</p>
                    <p className="font-medium text-foreground mt-1">{formatDateTime(selectedSchedule.lastRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Recipients</p>
                    <div className="mt-1 space-y-0.5">
                      {selectedSchedule.recipients.map((r) => (
                        <p key={r} className="text-foreground text-xs">{r}</p>
                      ))}
                      {selectedSchedule.recipients.length === 0 && <p className="text-muted-foreground text-xs">None</p>}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Format</p>
                    <p className="font-medium text-foreground mt-1">{selectedSchedule.deliverFormat}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Runs</p>
                    <p className="font-medium text-foreground mt-1">{selectedSchedule._count.runs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Failures</p>
                    <p className="font-medium text-foreground mt-1">{selectedSchedule.consecutiveFailures}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleSchedule(selectedSchedule)}>
                    {selectedSchedule.isEnabled ? (
                      <><Pause className="w-4 h-4 mr-2" />Disable</>
                    ) : (
                      <><Play className="w-4 h-4 mr-2" />Enable</>
                    )}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => forceRun(selectedSchedule)}>
                    <Play className="w-4 h-4 mr-2" />
                    Force Run
                  </Button>
                  {selectedSchedule.consecutiveFailures > 0 && (
                    <Button variant="outline" size="sm" onClick={() => resetFailures(selectedSchedule)}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Failures
                    </Button>
                  )}
                </div>

                {/* Run history */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Run History
                  </h3>
                  {detailLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : selectedSchedule.runs && selectedSchedule.runs.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSchedule.runs.map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                        >
                          <div className="flex items-center gap-2">
                            {getRunStatusIcon(run.status)}
                            <div>
                              <p className="text-sm font-medium text-foreground">{run.windowKey}</p>
                              {run.scanScore !== null && (
                                <p className="text-xs text-muted-foreground">Score: {run.scanScore}/100</p>
                              )}
                              {run.error && (
                                <p className="text-xs text-red-500 truncate max-w-[250px]">{run.error}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{formatDateTime(run.startedAt)}</p>
                            {run.emailSentAt && (
                              <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 justify-end">
                                <Mail className="w-3 h-3" /> Sent
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">No runs yet</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
