"use client";

/**
 * CheckoutDialog — unified checkout popup for plan selection.
 *
 * Combines plan summary, Individual/Company toggle, company billing fields,
 * inline VAT validation, KvK autofill, live price recalculation, and
 * Mollie payment creation into a single, polished dialog.
 *
 * Replaces the old two-dialog flow (checkout confirmation + CompanyDetailsModal).
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type BillingCycle,
  type PlanKey,
  formatEuro,
  BASE_PRICES,
  ANNUAL_PRICES,
} from "@/lib/pricing";
import { grossToNet, BASE_VAT_RATE } from "@/lib/pricing/vat-math";
import { COUNTRIES, isEuCountry, isNlCountry } from "@/lib/billing/countries";

// ── Types ──

type PurchaseAs = "individual" | "company";
type VatStatus = "idle" | "validating" | "valid" | "invalid" | "error";
type KvkStatus = "idle" | "loading" | "found" | "not_found" | "error";

interface CompanyFields {
  companyName: string;
  billingCountry: string;
  registrationNumber: string;
  vatId: string;
}

interface TaxQuote {
  baseAmount: number;
  vatAmount: number;
  totalAmount: number;
  tax: {
    ratePercent: number;
    mode: string;
    label: string;
    notes: string | null;
  };
  customer: {
    type: string;
    country: string;
    companyName: string | null;
    hasValidVat: boolean;
  };
}

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planKey: PlanKey | null;
  billingCycle: BillingCycle;
}

/** Client-side price computation for display (server is source of truth) */
function computeClientPrices(
  planKey: PlanKey,
  billingCycle: BillingCycle,
  purchaseAs: PurchaseAs,
  vatStatus: VatStatus,
  billingCountry: string
): { subtotal: number; vatRate: number; vatAmount: number; total: number; isReverseCharge: boolean } {
  const gross =
    billingCycle === "yearly"
      ? (ANNUAL_PRICES[planKey] ?? 0)
      : (BASE_PRICES[planKey] ?? 0);
  const net = grossToNet(gross, BASE_VAT_RATE);

  if (purchaseAs === "individual") {
    // Always NL 21% VAT
    const vatAmount = Math.round((gross - net) * 100) / 100;
    return { subtotal: net, vatRate: 21, vatAmount, total: gross, isReverseCharge: false };
  }

  // Company
  const country = billingCountry.toUpperCase();
  const isNL = isNlCountry(country);
  const isEU = isEuCountry(country);

  // Case: valid VAT + EU + not NL → reverse charge
  if (vatStatus === "valid" && isEU && !isNL) {
    return { subtotal: net, vatRate: 0, vatAmount: 0, total: net, isReverseCharge: true };
  }

  // Case: NL company, or EU company without valid VAT → 21% VAT
  if (isNL || (isEU && vatStatus !== "valid")) {
    const vatAmount = Math.round((gross - net) * 100) / 100;
    return { subtotal: net, vatRate: 21, vatAmount, total: gross, isReverseCharge: false };
  }

  // Case: non-EU company → 0% VAT
  if (!isEU && country.length === 2) {
    return { subtotal: net, vatRate: 0, vatAmount: 0, total: net, isReverseCharge: false };
  }

  // Default: full VAT
  const vatAmount = Math.round((gross - net) * 100) / 100;
  return { subtotal: net, vatRate: 21, vatAmount, total: gross, isReverseCharge: false };
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
    billingCountry: "NL",
    registrationNumber: "",
    vatId: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [vatStatus, setVatStatus] = useState<VatStatus>("idle");
  const [vatMessage, setVatMessage] = useState<string>("");
  const [kvkStatus, setKvkStatus] = useState<KvkStatus>("idle");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [profileLoaded, setProfileLoaded] = useState(false);

  const vatAbortRef = useRef<AbortController | null>(null);

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
          companyName: profile.companyName || prev.companyName,
          billingCountry: profile.countryCode || prev.billingCountry,
          registrationNumber:
            profile.registrationNumber || profile.kvkNumber || prev.registrationNumber,
          vatId: profile.vatId || prev.vatId,
        }));
        if (profile.vatValid === true && profile.vatId) {
          setVatStatus("valid");
          setVatMessage("EU VAT number verified");
        }
        setProfileLoaded(true);
      } catch {
        // Non-fatal
      }
    })();
    return () => { cancelled = true; };
  }, [open, profileLoaded]);

  // ── Reset on close ──
  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setServerError(null);
      setProfileLoaded(false);
      setVatStatus("idle");
      setVatMessage("");
      setKvkStatus("idle");
      setSubmitting(false);
    }
  }, [open]);

  // ── Reset VAT status when country or vatId changes ──
  const updateCompanyField = useCallback(
    (key: keyof CompanyFields, value: string) => {
      setCompanyFields((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
      if (key === "vatId" || key === "billingCountry") {
        setVatStatus("idle");
        setVatMessage("");
      }
    },
    []
  );

  // ── VAT Validation ──
  const handleValidateVat = useCallback(async () => {
    const country = companyFields.billingCountry.toUpperCase();
    const vatId = companyFields.vatId.trim();

    if (!country || !vatId) return;

    // Abort previous request
    vatAbortRef.current?.abort();
    const controller = new AbortController();
    vatAbortRef.current = controller;

    setVatStatus("validating");
    setVatMessage("");

    try {
      const res = await fetch("/api/billing/validate-vat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryCode: country, vatId }),
        signal: controller.signal,
      });

      const data = await res.json();

      if (!res.ok) {
        setVatStatus("error");
        setVatMessage(data.error || "Validation failed. Please try again.");
        return;
      }

      if (data.valid) {
        setVatStatus("valid");
        setVatMessage("EU VAT number verified");
        // Auto-fill company name from VIES
        if (data.companyName && !companyFields.companyName) {
          setCompanyFields((prev) => ({
            ...prev,
            companyName: data.companyName,
          }));
        }
      } else {
        setVatStatus("invalid");
        setVatMessage(
          data.warning
            ? "VIES service unavailable. Please try again later."
            : "Invalid VAT number. Please check the country code and VAT number."
        );
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setVatStatus("error");
      setVatMessage("Could not reach validation service. Please try again.");
    }
  }, [companyFields.billingCountry, companyFields.vatId, companyFields.companyName]);

  // ── KvK Lookup ──
  const handleKvkLookup = useCallback(async () => {
    const kvkNumber = companyFields.registrationNumber.replace(/\D/g, "");
    if (kvkNumber.length !== 8) return;

    setKvkStatus("loading");

    try {
      const res = await fetch("/api/billing/kvk-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kvkNumber }),
      });

      const data = await res.json();

      if (data.found) {
        setKvkStatus("found");
        setCompanyFields((prev) => ({
          ...prev,
          companyName: data.companyName || prev.companyName,
        }));
      } else {
        setKvkStatus("not_found");
      }
    } catch {
      setKvkStatus("error");
    }
  }, [companyFields.registrationNumber]);

  // ── Submit to Mollie ──
  const handleSubmit = useCallback(async () => {
    if (!planKey) return;

    // Validate company fields if company
    if (purchaseAs === "company") {
      const errors: Record<string, string> = {};
      if (!companyFields.companyName.trim())
        errors.companyName = "Company name is required";
      if (
        !companyFields.billingCountry.trim() ||
        companyFields.billingCountry.length !== 2
      )
        errors.billingCountry = "Country is required (2-letter code)";
      if (!companyFields.vatId.trim())
        errors.vatId = "VAT number is required";

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
        priceMode: purchaseAs === "company" ? "excl" : "incl",
      };

      if (purchaseAs === "company") {
        body.companyName = companyFields.companyName;
        body.billingCountry = companyFields.billingCountry;
        body.registrationNumber = companyFields.registrationNumber;
        body.vatId = companyFields.vatId;
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

  // ── Computed prices ──
  const prices = planKey
    ? computeClientPrices(
        planKey,
        billingCycle,
        purchaseAs,
        vatStatus,
        companyFields.billingCountry
      )
    : null;

  const isNL = isNlCountry(companyFields.billingCountry);
  const isEU = isEuCountry(companyFields.billingCountry);
  const billingCycleLabel = billingCycle === "monthly" ? "Monthly" : "Annual";
  const planLabel = planKey ? `VexNexa ${planKey}` : "";

  // Country name lookup
  const countryObj = COUNTRIES.find(
    (c) => c.code === companyFields.billingCountry.toUpperCase()
  );

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
              <span className="font-semibold text-sm">{planLabel}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Billing cycle</span>
              <span className="font-semibold text-sm">{billingCycleLabel}</span>
            </div>
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
                      purchaseAs === "individual"
                        ? "text-foreground"
                        : "text-muted-foreground"
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
                      purchaseAs === "company"
                        ? "text-foreground"
                        : "text-muted-foreground"
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
                Enter a valid EU VAT number to calculate VAT correctly. VAT may be removed for eligible EU businesses.
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
                  placeholder="Acme B.V."
                  className={cn("h-10", fieldErrors.companyName && "border-destructive focus-visible:ring-destructive")}
                  disabled={submitting}
                />
                {fieldErrors.companyName && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {fieldErrors.companyName}
                  </p>
                )}
              </div>

              {/* Billing country */}
              <div className="space-y-1.5">
                <Label htmlFor="co-country" className="text-sm">
                  Billing country <span className="text-destructive">*</span>
                </Label>
                <div className="flex gap-2 items-center">
                  <select
                    id="co-country"
                    value={companyFields.billingCountry}
                    onChange={(e) => updateCompanyField("billingCountry", e.target.value)}
                    className={cn(
                      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                      fieldErrors.billingCountry && "border-destructive focus-visible:ring-destructive"
                    )}
                    disabled={submitting}
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                        {c.eu ? " – EU" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                {fieldErrors.billingCountry && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    {fieldErrors.billingCountry}
                  </p>
                )}
              </div>

              {/* VAT Number */}
              {isEU && (
                <div className="space-y-1.5">
                  <Label htmlFor="co-vat" className="text-sm">
                    EU VAT number <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="co-vat"
                      value={companyFields.vatId}
                      onChange={(e) => updateCompanyField("vatId", e.target.value)}
                      placeholder={
                        isNL ? "NL123456789B01" : `${companyFields.billingCountry}...`
                      }
                      className={cn(
                        "h-10 flex-1",
                        vatStatus === "invalid" && "border-destructive focus-visible:ring-destructive",
                        vatStatus === "valid" && "border-green-500 focus-visible:ring-green-500"
                      )}
                      disabled={submitting}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      disabled={
                        !companyFields.vatId.trim() ||
                        vatStatus === "validating" ||
                        submitting
                      }
                      onClick={handleValidateVat}
                      className="h-10 px-4 shrink-0"
                    >
                      {vatStatus === "validating" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verify"
                      )}
                    </Button>
                  </div>

                  {/* VAT status messages */}
                  {vatStatus === "valid" && (
                    <div className="rounded-md bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3">
                      <p className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        EU VAT number verified
                      </p>
                      {!isNL && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1 ml-5.5">
                          VAT will be removed from the invoice
                        </p>
                      )}
                      {isNL && (
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1 ml-5.5">
                          Dutch VAT (21%) still applies for NL companies
                        </p>
                      )}
                    </div>
                  )}
                  {vatStatus === "invalid" && (
                    <div className="rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3">
                      <p className="text-sm text-red-700 dark:text-red-400 flex items-center gap-1.5 font-medium">
                        <XCircle className="w-4 h-4 shrink-0" />
                        Invalid VAT number
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-1 ml-5.5">
                        {vatMessage || "Please check the country code and VAT number."}
                      </p>
                    </div>
                  )}
                  {vatStatus === "error" && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                      <p className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1.5 font-medium">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        Validation error
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 ml-5.5">
                        {vatMessage || "VIES service unavailable. You can still proceed with VAT included."}
                      </p>
                    </div>
                  )}

                  {fieldErrors.vatId && vatStatus === "idle" && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      {fieldErrors.vatId}
                    </p>
                  )}
                </div>
              )}

              {/* Non-EU: Tax ID (optional) */}
              {!isEU && companyFields.billingCountry.length === 2 && (
                <div className="space-y-1.5">
                  <Label htmlFor="co-taxid" className="text-sm">
                    Tax ID (optional)
                  </Label>
                  <Input
                    id="co-taxid"
                    value={companyFields.vatId}
                    onChange={(e) => updateCompanyField("vatId", e.target.value)}
                    placeholder="Tax identification number"
                    className="h-10"
                    disabled={submitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    No VAT applies for non-EU customers
                  </p>
                </div>
              )}

              {/* KvK / Registration number */}
              <div className="space-y-1.5">
                <Label htmlFor="co-reg" className="text-sm">
                  {isNL ? "KvK number" : "Registration number"}{" "}
                  <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="co-reg"
                    value={companyFields.registrationNumber}
                    onChange={(e) => {
                      updateCompanyField("registrationNumber", e.target.value);
                      setKvkStatus("idle");
                    }}
                    placeholder={isNL ? "12345678" : "Registration number"}
                    className="h-10 flex-1"
                    disabled={submitting}
                  />
                  {isNL && (
                    <Button
                      type="button"
                      variant="outline"
                      size="default"
                      disabled={
                        companyFields.registrationNumber.replace(/\D/g, "").length !== 8 ||
                        kvkStatus === "loading" ||
                        submitting
                      }
                      onClick={handleKvkLookup}
                      className="h-10 px-3 shrink-0"
                    >
                      {kvkStatus === "loading" ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Search className="w-3.5 h-3.5 mr-1" />
                          Lookup
                        </>
                      )}
                    </Button>
                  )}
                </div>
                {kvkStatus === "found" && (
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Company details found and applied
                  </p>
                )}
                {kvkStatus === "not_found" && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    KvK number not found
                  </p>
                )}
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

          {/* ── Price Summary ── */}
          {prices && (
            <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-2.5">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Subtotal (ex. VAT)</span>
                <span className="font-medium">{formatEuro(prices.subtotal)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">
                  {prices.isReverseCharge
                    ? "VAT (0%) – Reverse charge"
                    : prices.vatRate > 0
                      ? `VAT (${prices.vatRate}%)`
                      : "No VAT"}
                </span>
                <span className="font-medium">
                  {prices.vatAmount === 0 ? "\u2014" : formatEuro(prices.vatAmount)}
                </span>
              </div>

              {prices.isReverseCharge && (
                <p className="text-xs text-green-600 dark:text-green-400 italic flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  VAT reverse charge applies — you account for VAT
                </p>
              )}

              <div className="border-t border-border pt-2.5 flex justify-between items-center">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-xl font-bold">{formatEuro(prices.total)}</span>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                You will be charged {formatEuro(prices.total)}
                {billingCycle === "monthly" ? "/month" : "/year"} at Mollie checkout
              </p>
            </div>
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
                  Continue to payment
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            {purchaseAs === "company"
              ? "Company details will be saved to your billing profile for future invoices."
              : "You can add company details later in your billing settings."}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
