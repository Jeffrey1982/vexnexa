'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { AlertTriangle, Loader2, TrendingDown } from 'lucide-react';

const PLANS = ['TRIAL', 'STARTER', 'PRO', 'BUSINESS'] as const;
type SelectablePlan = (typeof PLANS)[number];
type PlanType = SelectablePlan | 'ENTERPRISE';

const PLAN_RANK: Record<PlanType, number> = {
  TRIAL: 0,
  STARTER: 1,
  PRO: 2,
  BUSINESS: 3,
  ENTERPRISE: 4,
};

const PLAN_LABELS: Record<SelectablePlan, string> = {
  TRIAL: 'Trial',
  STARTER: 'Starter — €24.99/mo',
  PRO: 'Pro — €59.99/mo',
  BUSINESS: 'Business — €129/mo',
};

interface ChangePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Single-user mode */
  userId?: string;
  currentPlan?: PlanType | string;
  /** Bulk mode */
  userIds?: string[];
  userCount?: number;
  /** Called after a successful plan change */
  onSuccess?: (newPlan: SelectablePlan) => void;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  userId,
  currentPlan,
  userIds,
  userCount,
  onSuccess,
}: ChangePlanDialogProps) {
  const { toast } = useToast();
  const isBulk = !!(userIds && userIds.length > 0);

  const [selectedPlan, setSelectedPlan] = useState<SelectablePlan | ''>('');
  const [applyImmediately, setApplyImmediately] = useState(true);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDowngradeConfirm, setShowDowngradeConfirm] = useState(false);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedPlan('');
      setApplyImmediately(true);
      setNote('');
      setLoading(false);
      setShowDowngradeConfirm(false);
    }
  }, [open]);

  const isDowngrade = useCallback((): boolean => {
    if (!currentPlan || !selectedPlan) return false;
    const currentRank = PLAN_RANK[currentPlan as PlanType] ?? 0;
    const selectedRank = PLAN_RANK[selectedPlan as PlanType] ?? 0;
    return selectedRank < currentRank;
  }, [currentPlan, selectedPlan]);

  const handleSubmit = async () => {
    if (!selectedPlan) return;

    // Check for downgrade — show confirmation step
    if (!isBulk && isDowngrade() && !showDowngradeConfirm) {
      setShowDowngradeConfirm(true);
      return;
    }

    setLoading(true);

    try {
      if (isBulk && userIds) {
        // Bulk plan change
        const response = await fetch('/api/admin/bulk-plan-change', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userIds,
            newPlan: selectedPlan,
            applyImmediately,
            note: note.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to update plans');
        }

        toast({
          title: 'Plans updated successfully',
          description: `Updated ${data.updated} user(s) to ${selectedPlan}`,
        });
      } else if (userId) {
        // Single-user plan change via new API route
        const response = await fetch(`/api/admin/users/${userId}/plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            plan: selectedPlan,
            applyImmediately,
            note: note.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to change plan');
        }

        toast({
          title: 'Plan changed successfully',
          description: `Changed from ${data.oldPlan} to ${data.newPlan}`,
        });
      }

      onOpenChange(false);
      onSuccess?.(selectedPlan as SelectablePlan);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: 'destructive',
        title: 'Failed to change plan',
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowDowngradeConfirm(false);
  };

  const title = isBulk
    ? `Change Plan for ${userCount ?? userIds?.length} User(s)`
    : 'Change Plan';

  const description = isBulk
    ? 'Select the new plan for the selected users. This will update billing and entitlements.'
    : 'Select the new plan for this user. This will update billing/entitlements.';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="change-plan-dialog">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {showDowngradeConfirm ? (
          /* ── Downgrade Confirmation Step ── */
          <div className="space-y-4" data-testid="downgrade-confirm">
            <div className="flex items-start gap-3 rounded-lg border border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/30 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-400" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                  Downgrade Warning
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  You are changing from <strong>{currentPlan}</strong> to{' '}
                  <strong>{selectedPlan}</strong>. This may reduce the user&apos;s
                  access to features, site limits, and page quotas.
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:justify-between">
              <Button variant="outline" onClick={handleBack} disabled={loading}>
                Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleSubmit}
                disabled={loading}
                data-testid="confirm-downgrade-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing…
                  </>
                ) : (
                  <>
                    <TrendingDown className="mr-2 h-4 w-4" />
                    Confirm Downgrade
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* ── Main Form ── */
          <div className="space-y-5">
            {/* Current plan indicator (single-user only) */}
            {!isBulk && currentPlan && (
              <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
                Current plan:{' '}
                <span className="font-semibold text-foreground">
                  {currentPlan}
                </span>
              </div>
            )}

            {/* Plan selector */}
            <div className="space-y-2">
              <Label htmlFor="plan-select">New Plan</Label>
              <Select
                value={selectedPlan}
                onValueChange={(v) => setSelectedPlan(v as SelectablePlan)}
              >
                <SelectTrigger id="plan-select" data-testid="plan-select">
                  <SelectValue placeholder="Select a plan…" />
                </SelectTrigger>
                <SelectContent>
                  {PLANS.map((p) => (
                    <SelectItem
                      key={p}
                      value={p}
                      disabled={!isBulk && p === currentPlan}
                    >
                      {PLAN_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Apply immediately toggle */}
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="apply-immediately">Apply immediately</Label>
                <p className="text-xs text-muted-foreground">
                  Update billing status and entitlements now
                </p>
              </div>
              <Switch
                id="apply-immediately"
                checked={applyImmediately}
                onCheckedChange={setApplyImmediately}
                data-testid="apply-immediately-toggle"
              />
            </div>

            {/* Note / reason */}
            <div className="space-y-2">
              <Label htmlFor="plan-note">
                Note <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="plan-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Reason for plan change (stored in audit log)…"
                rows={2}
                data-testid="plan-note"
              />
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !selectedPlan}
                data-testid="submit-plan-change"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing…
                  </>
                ) : (
                  'Change Plan'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
