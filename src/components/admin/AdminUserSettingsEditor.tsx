'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Shield,
  Mail,
  Loader2,
  Save,
  CalendarIcon,
  FileText,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updateUserSettings } from '@/app/actions/admin-user';
import type { UpdateUserSettingsInput } from '@/app/actions/admin-user';
import type { Plan, AssuranceTier } from '@prisma/client';

// ── Types ─────────────────────────────────────────────
interface UserSettingsData {
  id: string;
  email: string;
  plan: Plan;
  subscriptionStatus: string;
  billingInterval: string;
    hasAssurance: boolean;
  reportEmailEnabled: boolean;
  reportEmailFrequency: string;
  reportRecipientEmail: string | null;
  reportFormat: string;
  nextReportAt: Date | null;
  lastReportSentAt: Date | null;
  assuranceSubscriptions?: Array<{
    id: string;
    tier: AssuranceTier;
    status: string;
  }>;
}

interface AdminUserSettingsEditorProps {
  user: UserSettingsData;
}

// ── Constants ─────────────────────────────────────────
const PLANS: { value: Plan; label: string }[] = [
  { value: 'TRIAL', label: 'Trial' },
  { value: 'STARTER', label: 'Starter' },
  { value: 'PRO', label: 'Pro' },
  { value: 'BUSINESS', label: 'Business' },
  { value: 'ENTERPRISE', label: 'Enterprise' },
];

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'trialing', label: 'Trialing' },
  { value: 'canceled', label: 'Canceled' },
  { value: 'past_due', label: 'Past Due' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'suspended', label: 'Suspended' },
];

const INTERVALS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const ASSURANCE_TIERS: { value: AssuranceTier; label: string }[] = [
  { value: 'BASIC', label: 'Basic — €9.99/mo' },
  { value: 'PRO', label: 'Pro — €24.99/mo' },
  { value: 'PUBLIC_SECTOR', label: 'Public Sector — €49.99/mo' },
];

const FREQUENCIES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
];

const FORMATS = [
  { value: 'pdf', label: 'PDF only' },
  { value: 'docx', label: 'DOCX only' },
  { value: 'both', label: 'PDF + DOCX' },
];

function formatDateForInput(date: Date | null): string {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── Component ─────────────────────────────────────────
export function AdminUserSettingsEditor({ user }: AdminUserSettingsEditorProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState<boolean>(false);

  // ── Form state ────────────────────────────────────
  const [plan, setPlan] = useState<Plan>(user.plan);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>(user.subscriptionStatus);
  const [billingInterval, setBillingInterval] = useState<string>(user.billingInterval);

  const [hasAssurance, setHasAssurance] = useState<boolean>(user.hasAssurance);
  const activeAssurance = user.assuranceSubscriptions?.find((s) => s.status === 'active');
  const [assuranceTier, setAssuranceTier] = useState<AssuranceTier>(
    activeAssurance?.tier ?? 'BASIC'
  );

  const [reportEmailEnabled, setReportEmailEnabled] = useState<boolean>(user.reportEmailEnabled);
  const [reportEmailFrequency, setReportEmailFrequency] = useState<string>(
    user.reportEmailFrequency
  );
  const [reportRecipientEmail, setReportRecipientEmail] = useState<string>(
    user.reportRecipientEmail ?? ''
  );
  const [reportFormat, setReportFormat] = useState<string>(user.reportFormat);
  const [nextReportAt, setNextReportAt] = useState<string>(formatDateForInput(user.nextReportAt));

  // ── Validation state ──────────────────────────────
  const emailError =
    reportRecipientEmail && !isValidEmail(reportRecipientEmail)
      ? 'Invalid email address'
      : null;

  const reportDestinationError =
    reportEmailEnabled && !reportRecipientEmail && !user.email
      ? 'No recipient email set and no account email'
      : null;

  const hasErrors = !!emailError || !!reportDestinationError;

  // ── Dirty check ───────────────────────────────────
  const isDirty =
    plan !== user.plan ||
    subscriptionStatus !== user.subscriptionStatus ||
    billingInterval !== user.billingInterval ||
    hasAssurance !== user.hasAssurance ||
    assuranceTier !== (activeAssurance?.tier ?? 'BASIC') ||
    reportEmailEnabled !== user.reportEmailEnabled ||
    reportEmailFrequency !== user.reportEmailFrequency ||
    reportRecipientEmail !== (user.reportRecipientEmail ?? '') ||
    reportFormat !== user.reportFormat ||
    nextReportAt !== formatDateForInput(user.nextReportAt);

  // ── Save handler ──────────────────────────────────
  const handleSave = async (): Promise<void> => {
    if (hasErrors) return;
    setSaving(true);

    try {
      const input: UpdateUserSettingsInput = {};

      if (plan !== user.plan) input.plan = plan;
      if (subscriptionStatus !== user.subscriptionStatus)
        input.subscriptionStatus = subscriptionStatus;
      if (billingInterval !== user.billingInterval) input.billingInterval = billingInterval;

      if (hasAssurance !== user.hasAssurance) input.hasAssurance = hasAssurance;
      if (hasAssurance && assuranceTier !== (activeAssurance?.tier ?? 'BASIC'))
        input.assuranceTier = assuranceTier;

      if (reportEmailEnabled !== user.reportEmailEnabled)
        input.reportEmailEnabled = reportEmailEnabled;
      if (reportEmailFrequency !== user.reportEmailFrequency)
        input.reportEmailFrequency = reportEmailFrequency;
      if (reportRecipientEmail !== (user.reportRecipientEmail ?? ''))
        input.reportRecipientEmail = reportRecipientEmail || null;
      if (reportFormat !== user.reportFormat) input.reportFormat = reportFormat;
      if (nextReportAt !== formatDateForInput(user.nextReportAt))
        input.nextReportAt = nextReportAt || null;

      const result = await updateUserSettings(user.id, input);

      if (result.success) {
        toast({
          title: result.changed ? 'Settings updated' : 'No changes',
          description: result.changed
            ? 'User settings have been saved successfully.'
            : 'No changes were detected.',
        });
        router.refresh();
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to save settings';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ─── Subscription Section ───────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Plan, billing status, and trial configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Plan */}
            <div className="space-y-2">
              <Label htmlFor="settings-plan">Plan</Label>
              <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
                <SelectTrigger id="settings-plan">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="settings-status">Subscription Status</Label>
              <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
                <SelectTrigger id="settings-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Billing Interval */}
            <div className="space-y-2">
              <Label htmlFor="settings-interval">Billing Interval</Label>
              <Select value={billingInterval} onValueChange={setBillingInterval}>
                <SelectTrigger id="settings-interval">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INTERVALS.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </CardContent>
      </Card>

      {/* ─── Assurance Section ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Assurance
          </CardTitle>
          <CardDescription>Accessibility Assurance add-on configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="settings-assurance">Assurance Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Continuous monitoring &amp; automated alerts
              </p>
            </div>
            <Switch
              id="settings-assurance"
              checked={hasAssurance}
              onCheckedChange={setHasAssurance}
            />
          </div>

          {hasAssurance && (
            <>
              <hr className="border-border" />
              <div className="space-y-2">
                <Label htmlFor="settings-assurance-tier">Assurance Tier</Label>
                <Select
                  value={assuranceTier}
                  onValueChange={(v) => setAssuranceTier(v as AssuranceTier)}
                >
                  <SelectTrigger id="settings-assurance-tier">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSURANCE_TIERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {activeAssurance ? (
                  <p className="text-xs text-muted-foreground">
                    Current active subscription: <Badge variant="outline">{activeAssurance.tier}</Badge>
                  </p>
                ) : (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    No active assurance subscription found. The flag will be set but a Mollie
                    subscription may need to be created separately.
                  </p>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Reporting Section ──────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Automated Reports
          </CardTitle>
          <CardDescription>
            Email delivery of scheduled accessibility reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="settings-report-enabled">Report Emails Enabled</Label>
              <p className="text-xs text-muted-foreground">
                Send automated accessibility report emails
              </p>
            </div>
            <Switch
              id="settings-report-enabled"
              checked={reportEmailEnabled}
              onCheckedChange={setReportEmailEnabled}
            />
          </div>

          {reportEmailEnabled && (
            <>
              <hr className="border-border" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Frequency */}
                <div className="space-y-2">
                  <Label htmlFor="settings-frequency">Frequency</Label>
                  <Select value={reportEmailFrequency} onValueChange={setReportEmailFrequency}>
                    <SelectTrigger id="settings-frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Format */}
                <div className="space-y-2">
                  <Label htmlFor="settings-format">
                    <FileText className="inline h-4 w-4 mr-1" />
                    Report Format
                  </Label>
                  <Select value={reportFormat} onValueChange={setReportFormat}>
                    <SelectTrigger id="settings-format">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((f) => (
                        <SelectItem key={f.value} value={f.value}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Recipient Email */}
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="settings-recipient-email">Report Recipient Email</Label>
                  <Input
                    id="settings-recipient-email"
                    type="email"
                    value={reportRecipientEmail}
                    onChange={(e) => setReportRecipientEmail(e.target.value)}
                    placeholder={user.email ? `Falls back to ${user.email}` : 'Enter email address'}
                    className={emailError ? 'border-red-500' : ''}
                  />
                  {emailError && (
                    <p className="text-xs text-red-500">{emailError}</p>
                  )}
                  {!reportRecipientEmail && user.email && (
                    <p className="text-xs text-muted-foreground">
                      If empty, reports will be sent to the account email ({user.email})
                    </p>
                  )}
                  {reportDestinationError && (
                    <p className="text-xs text-red-500">{reportDestinationError}</p>
                  )}
                </div>

                {/* Next Report At */}
                <div className="space-y-2">
                  <Label htmlFor="settings-next-report">Next Scheduled Report</Label>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="settings-next-report"
                      type="datetime-local"
                      value={nextReportAt}
                      onChange={(e) => setNextReportAt(e.target.value)}
                      className="flex-1"
                    />
                    {nextReportAt && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNextReportAt('')}
                        className="text-xs"
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </div>

                {/* Last Sent (read-only) */}
                <div className="space-y-2">
                  <Label>Last Report Sent</Label>
                  <p className="text-sm text-muted-foreground pt-2">
                    {user.lastReportSentAt
                      ? new Date(user.lastReportSentAt).toLocaleString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ─── Save Bar ───────────────────────────────── */}
      <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-4">
        <div className="text-sm text-muted-foreground">
          {isDirty ? (
            <span className="text-yellow-600 dark:text-yellow-400 font-medium">
              Unsaved changes
            </span>
          ) : (
            'All changes saved'
          )}
        </div>
        <Button
          onClick={handleSave}
          disabled={saving || !isDirty || hasErrors}
          className="min-w-[120px]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
