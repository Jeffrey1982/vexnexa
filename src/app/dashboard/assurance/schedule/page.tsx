'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Clock,
  Calendar,
  Mail,
  Loader2,
  Play,
  Pause,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Globe,
  X,
} from 'lucide-react';

// ── Types ──

interface Site {
  id: string;
  url: string;
}

interface ScheduleRun {
  id: string;
  windowKey: string;
  status: string;
  scanScore: number | null;
  emailSentAt: string | null;
  startedAt: string;
  completedAt: string | null;
  error: string | null;
}

interface Schedule {
  id: string;
  userId: string;
  siteId: string;
  site: Site;
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
  runs: ScheduleRun[];
  _count: { runs: number };
  createdAt: string;
  updatedAt: string;
}

// ── Constants ──

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
};

const FORMAT_LABELS: Record<string, string> = {
  PDF: 'PDF only',
  PDF_AND_DOCX: 'PDF + DOCX',
  PDF_AND_HTML: 'PDF + HTML',
};

const COMMON_TIMEZONES = [
  'Europe/Amsterdam',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
  'UTC',
];

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

export default function AssuranceSchedulePage() {
  const { toast } = useToast();

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Fetch schedules
  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/schedules');
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
  }, [toast]);

  // Fetch user's sites
  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await res.json();
      if (data.sites) {
        setSites(data.sites);
      }
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    fetchSchedules();
    fetchSites();
  }, [fetchSchedules, fetchSites]);

  // Toggle enable/disable
  const toggleSchedule = async (schedule: Schedule) => {
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isEnabled: !schedule.isEnabled }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({
        title: schedule.isEnabled ? 'Schedule paused' : 'Schedule enabled',
        description: schedule.site.url,
      });
      fetchSchedules();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to update schedule',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // Delete schedule
  const deleteSchedule = async (schedule: Schedule) => {
    if (!confirm(`Delete schedule for ${schedule.site.url}?`)) return;
    try {
      const res = await fetch(`/api/schedules/${schedule.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast({ title: 'Schedule deleted' });
      fetchSchedules();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to delete',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assurance Scheduling</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure automated accessibility scans with PDF reports delivered to your inbox.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchSchedules}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Schedule
          </Button>
        </div>
      </div>

      {/* Schedules List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No schedules yet</h3>
            <p className="text-muted-foreground mb-4">
              Set up automated scans to receive regular accessibility reports.
            </p>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create your first schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id} className={!schedule.isEnabled ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <CardTitle className="text-base">{schedule.site.url}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant={schedule.isEnabled ? 'default' : 'secondary'}>
                          {schedule.isEnabled ? 'Active' : 'Paused'}
                        </Badge>
                        <span>
                          {FREQUENCY_LABELS[schedule.frequency] || schedule.frequency}
                          {schedule.frequency === 'WEEKLY' && schedule.daysOfWeek.length > 0 && (
                            <> on {schedule.daysOfWeek.map((d) => DAY_LABELS[d]).join(', ')}</>
                          )}
                          {schedule.frequency === 'MONTHLY' && schedule.dayOfMonth && (
                            <> on day {schedule.dayOfMonth}</>
                          )}
                          {' at '}
                          {schedule.timeOfDay} ({schedule.timezone})
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => toggleSchedule(schedule)}
                      title={schedule.isEnabled ? 'Pause' : 'Enable'}
                    >
                      {schedule.isEnabled ? (
                        <Pause className="w-4 h-4 text-orange-500" />
                      ) : (
                        <Play className="w-4 h-4 text-green-500" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => deleteSchedule(schedule)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Schedule info grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-muted-foreground text-xs">Next Run</p>
                    <p className="font-medium text-foreground">{formatDateTime(schedule.nextRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Last Run</p>
                    <p className="font-medium text-foreground">{formatDateTime(schedule.lastRunAt)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Recipients</p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />
                      {schedule.recipients.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Format</p>
                    <p className="font-medium text-foreground flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" />
                      {FORMAT_LABELS[schedule.deliverFormat] || schedule.deliverFormat}
                    </p>
                  </div>
                </div>

                {/* Failure warning */}
                {schedule.consecutiveFailures > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs mb-3">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {schedule.consecutiveFailures} consecutive failure{schedule.consecutiveFailures > 1 ? 's' : ''}
                    {schedule.consecutiveFailures >= 5 && ' — schedule auto-disabled'}
                  </div>
                )}

                {/* Recent runs */}
                {schedule.runs.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Recent Deliveries</p>
                    <div className="space-y-1">
                      {schedule.runs.slice(0, 5).map((run) => (
                        <div
                          key={run.id}
                          className="flex items-center justify-between py-1.5 px-2 rounded text-xs border border-border bg-muted/20"
                        >
                          <div className="flex items-center gap-2">
                            {getRunStatusIcon(run.status)}
                            <span className="text-foreground font-medium">{run.windowKey}</span>
                            {run.scanScore !== null && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {run.scanScore}/100
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            {run.emailSentAt && <Mail className="w-3 h-3 text-green-500" />}
                            <span>{formatDateTime(run.startedAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Schedule Dialog */}
      <CreateScheduleDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sites={sites}
        onSuccess={() => {
          fetchSchedules();
          setCreateOpen(false);
        }}
      />
    </div>
  );
}

// ── Create Schedule Dialog ──

interface CreateScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sites: Site[];
  onSuccess: () => void;
}

function CreateScheduleDialog({ open, onOpenChange, sites, onSuccess }: CreateScheduleDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [siteId, setSiteId] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [timezone, setTimezone] = useState('Europe/Amsterdam');
  const [frequency, setFrequency] = useState('WEEKLY');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1]); // Monday
  const [dayOfMonth, setDayOfMonth] = useState('1');
  const [timeOfDay, setTimeOfDay] = useState('09:00');
  const [recipientInput, setRecipientInput] = useState('');
  const [recipients, setRecipients] = useState<string[]>([]);
  const [deliverFormat, setDeliverFormat] = useState('PDF');
  const [includeExecutiveSummaryOnly, setIncludeExecutiveSummaryOnly] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setSiteId(sites.length > 0 ? sites[0].id : '');
      setIsEnabled(true);
      setTimezone('Europe/Amsterdam');
      setFrequency('WEEKLY');
      setDaysOfWeek([1]);
      setDayOfMonth('1');
      setTimeOfDay('09:00');
      setRecipientInput('');
      setRecipients([]);
      setDeliverFormat('PDF');
      setIncludeExecutiveSummaryOnly(false);
    }
  }, [open, sites]);

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const addRecipient = () => {
    const email = recipientInput.trim().toLowerCase();
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ variant: 'destructive', title: 'Invalid email address' });
      return;
    }
    if (recipients.includes(email)) {
      toast({ variant: 'destructive', title: 'Email already added' });
      return;
    }
    if (recipients.length >= 20) {
      toast({ variant: 'destructive', title: 'Maximum 20 recipients' });
      return;
    }
    setRecipients((prev) => [...prev, email]);
    setRecipientInput('');
  };

  const removeRecipient = (email: string) => {
    setRecipients((prev) => prev.filter((r) => r !== email));
  };

  const handleSubmit = async () => {
    if (!siteId) {
      toast({ variant: 'destructive', title: 'Select a site' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId,
          isEnabled,
          timezone,
          frequency,
          daysOfWeek: frequency === 'WEEKLY' ? daysOfWeek : [],
          dayOfMonth: frequency === 'MONTHLY' ? parseInt(dayOfMonth, 10) : null,
          timeOfDay,
          recipients,
          deliverFormat,
          includeExecutiveSummaryOnly,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create schedule');

      toast({ title: 'Schedule created!', description: `Next run: ${formatDateTime(data.schedule.nextRunAt)}` });
      onSuccess();
    } catch (error: unknown) {
      toast({
        variant: 'destructive',
        title: 'Failed to create schedule',
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            New Scan Schedule
          </DialogTitle>
          <DialogDescription>
            Set up automated accessibility scans with report delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          {/* Site */}
          <div className="space-y-2">
            <Label>Site</Label>
            <Select value={siteId} onValueChange={setSiteId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a site" />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.url}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMON_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days of week (weekly) */}
          {frequency === 'WEEKLY' && (
            <div className="space-y-2">
              <Label>Days</Label>
              <div className="flex gap-1.5 flex-wrap">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      daysOfWeek.includes(idx)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month (monthly) */}
          {frequency === 'MONTHLY' && (
            <div className="space-y-2">
              <Label htmlFor="day-of-month">Day of Month</Label>
              <Input
                id="day-of-month"
                type="number"
                min={1}
                max={28}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">1–28 recommended to avoid month-end issues</p>
            </div>
          )}

          {/* Time */}
          <div className="space-y-2">
            <Label htmlFor="time-of-day" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <Input
              id="time-of-day"
              type="time"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value)}
            />
          </div>

          {/* Recipients */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Recipients
            </Label>
            <div className="flex gap-2">
              <Input
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                placeholder="email@example.com"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addRecipient();
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                Add
              </Button>
            </div>
            {recipients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {recipients.map((email) => (
                  <Badge key={email} variant="secondary" className="gap-1 pr-1">
                    {email}
                    <button
                      type="button"
                      onClick={() => removeRecipient(email)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Format */}
          <div className="space-y-2">
            <Label>Report Format</Label>
            <Select value={deliverFormat} onValueChange={setDeliverFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PDF">PDF only</SelectItem>
                <SelectItem value="PDF_AND_DOCX">PDF + DOCX</SelectItem>
                <SelectItem value="PDF_AND_HTML">PDF + HTML</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Executive summary toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="exec-summary">Executive Summary Only</Label>
              <p className="text-xs text-muted-foreground">Shorter report without full issue details</p>
            </div>
            <Switch
              id="exec-summary"
              checked={includeExecutiveSummaryOnly}
              onCheckedChange={setIncludeExecutiveSummaryOnly}
            />
          </div>

          {/* Enabled toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="schedule-enabled">Enabled</Label>
              <p className="text-xs text-muted-foreground">Start running immediately</p>
            </div>
            <Switch id="schedule-enabled" checked={isEnabled} onCheckedChange={setIsEnabled} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !siteId}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Schedule
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
