"use client";

/**
 * CheckoutDialog — unified checkout popup for plan selection.
 *
 * Shows a fixed VAT-inclusive price. Company details are collected
 * for invoicing only — they never change the price.
 *
 * "All prices include VAT" is shown clearly throughout.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  ArrowRight,
  CreditCard,
  User,
  Building2,
  XCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PLAN_PRICES,
  PLAN_DISPLAY_NAMES,
  formatEurPrice,
  type PlanKey,
  type BillingInterval,
} from "@/lib/billing/pricing-config";
import { validateCompanyName } from "@/lib/billing/validation";

// ── Types ──

type PurchaseAs = "individual" | "company";

interface CompanyFields {
  companyName: string;
  vatId: string;
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey: PlanKey | null;
  billingCycle: BillingInterval;
}

export function CheckoutDialog({
  open,
  onOpenChange,
  planKey,
  billingCycle,
}: CheckoutDialogProps): JSX.Element {
  // ── State ──
  const [purchaseAs, setPurchaseAs] = useState<PurchaseAs>("individual");
  const [companyFields, setCompanyFields] = useState<CompanyFields>({
    companyName: "",
    vatId: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  // ── Fixed price — never changes ──
  const price = planKey ? PLAN_PRICES[planKey][billingCycle] : 0;
  const planDisplayName = planKey ? PLAN_DISPLAY_NAMES[planKey] : "";

  // ── Pre-fill from billing profile ──
  useEffect(() => {
    if (!open || profileLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/profile");
        if (!res.ok) return;
        const { profile } = await res.json();
        if (cancelled || !profile) return;
        if (profile.billingType === "business") {
          setPurchaseAs("company");
        }
        setCompanyFields((prev) => ({
          ...prev,
          companyName: profile.companyName || prev.companyName,
          vatId: profile.vatId || prev.vatId,
        }));
        setProfileLoaded(true);
      } catch {
        // Non-fatal
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, profileLoaded]);

  // ── Reset on close ──
  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setServerError(null);
      setProfileLoaded(false);
      setSubmitting(false);
    }
  }, [open]);

  // ── Field update with error clearing ──
  const updateCompanyField = useCallback(
    (key: keyof CompanyFields, value: string) => {
      setCompanyFields((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  // ── Submit to Mollie ──
  const handleSubmit = useCallback(async () => {
    if (!planKey) return;

    // Only company name is required for company purchases
    if (purchaseAs === "company") {
      const errors: Record<string, string> = {};
      const nameCheck = validateCompanyName(companyFields.companyName);
      if (!nameCheck.valid) errors.companyName = nameCheck.error!;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    setSubmitting(true);
    setServerError(null);

    try {
      const body: Record<string, unknown> = {
        plan: planKey,
        billingCycle,
        purchaseAs,
      };

      if (purchaseAs === "company") {
        body.companyName = companyFields.companyName;
        body.vatId = companyFields.vatId || undefined;
      }

      const res = await fetch("/api/billing/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create payment");
      }

      window.location.href = data.checkoutUrl;
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setSubmitting(false);
    }
  }, [planKey, billingCycle, purchaseAs, companyFields]);

  const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Annual";
  const nextBillingLabel = billingCycle === "monthly" ? "/month" : "/year";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* ── Header ── */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="w-5 h-5 text-primary" />
            Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* ── Plan & Billing Summary ── */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Plan</span>
              <span className="font-semibold text-sm">VexNexa {planDisplayName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Billing</span>
              <span className="font-semibold text-sm">{billingCycleLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total due now</span>
              <span className="text-xl font-bold">{formatEurPrice(price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Next billing</span>
              <span className="font-semibold text-sm">
                {formatEurPrice(price)} {nextBillingLabel}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-1 border-t border-border mt-2">
              All prices include VAT
            </p>
          </div>

          {/* ── Purchase As selector ── */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Purchase as</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setPurchaseAs("individual");
                  setFieldErrors({});
                  setServerError(null);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-3.5 text-left transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  purchaseAs === "individual"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
                aria-pressed={purchaseAs === "individual"}
                role="radio"
                aria-checked={purchaseAs === "individual"}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    purchaseAs === "individual"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      purchaseAs === "individual" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Individual
                  </p>
                  <p className="text-xs text-muted-foreground">Personal use</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPurchaseAs("company");
                  setFieldErrors({});
                  setServerError(null);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-lg border-2 p-3.5 text-left transition-all duration-150",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  purchaseAs === "company"
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                )}
                aria-pressed={purchaseAs === "company"}
                role="radio"
                aria-checked={purchaseAs === "company"}
              >
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    purchaseAs === "company"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      purchaseAs === "company" ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    Company
                  </p>
                  <p className="text-xs text-muted-foreground">Business purchase</p>
                </div>
              </button>
            </div>
          </div>

          {/* ── Company Billing Details ── */}
          {purchaseAs === "company" && (
            <div className="space-y-4 rounded-lg border border-border p-4 bg-background">
              <p className="text-xs text-muted-foreground flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                These details appear on your invoice. You can also add or update billing details later.
              </p>

              {/* Company name */}
              <div className="space-y-1.5">
                <Label htmlFor="co-name" className="text-sm">
                  Company name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="co-name"
                  value={companyFields.companyName}
                  onChange={(e) => updateCompanyField("companyName", e.target.value)}
                  placeholder="Acme Inc."
                  className={cn(
                    "h-10",
                    fieldErrors.companyName && "border-destructive focus-visible:ring-destructive"
                  )}
                  disabled={submitting}
                />
                {fieldErrors.companyName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>

              {/* VAT Number (optional) */}
              <div className="space-y-1.5">
                <Label htmlFor="co-vat" className="text-sm">
                  VAT number (optional)
                </Label>
                <Input
                  id="co-vat"
                  value={companyFields.vatId}
                  onChange={(e) => updateCompanyField("vatId", e.target.value)}
                  placeholder="e.g. NL123456789B01, DE123456789"
                  className="h-10"
                  disabled={submitting}
                />
                <p className="text-xs text-muted-foreground">
                  Enter a VAT number if your company has one. We&apos;ll include it on the invoice.
                </p>
              </div>
            </div>
          )}

          {/* ── Server Error ── */}
          {serverError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          {/* ── CTA ── */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white font-medium"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Continue to payment — {formatEurPrice(price)}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            {purchaseAs === "company"
              ? "Company details will appear on your invoice."
              : "You can add company details later in billing settings."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
