"use client";

/**
 * CompanyDetailsModal — collects company billing fields before Mollie redirect.
 *
 * Opens when user clicks "Verder naar betaling" in excl-VAT or company-purchase mode.
 * Fields are required and validated before allowing submission.
 * Pre-fills from existing billing profile when available.
 */

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ArrowRight, Building2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CompanyFields {
  companyName: string;
  billingCountry: string;
  registrationNumber: string;
  vatId: string;
}

interface CompanyDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with validated fields when user submits */
  onSubmit: (fields: CompanyFields) => Promise<void>;
  /** Whether the submit action is in progress */
  submitting?: boolean;
  /** Server-side error to display */
  serverError?: string | null;
}

/** Validate fields, return error map (empty = valid) */
function validateFields(fields: CompanyFields): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!fields.companyName.trim()) errors.companyName = "Bedrijfsnaam is verplicht";
  if (!fields.billingCountry.trim() || fields.billingCountry.length !== 2)
    errors.billingCountry = "Landcode is verplicht (bijv. NL)";
  if (!fields.registrationNumber.trim())
    errors.registrationNumber =
      fields.billingCountry === "NL"
        ? "KvK-nummer is verplicht"
        : "Registratienummer is verplicht";
  if (!fields.vatId.trim()) errors.vatId = "BTW-nummer is verplicht";
  return errors;
}

export function CompanyDetailsModal({
  open,
  onOpenChange,
  onSubmit,
  submitting = false,
  serverError = null,
}: CompanyDetailsModalProps): JSX.Element {
  const [fields, setFields] = useState<CompanyFields>({
    companyName: "",
    billingCountry: "NL",
    registrationNumber: "",
    vatId: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [profileLoaded, setProfileLoaded] = useState(false);

  // Pre-fill from billing profile
  useEffect(() => {
    if (!open || profileLoaded) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/billing/profile");
        if (!res.ok) return;
        const { profile } = await res.json();
        if (cancelled || !profile) return;
        setFields((prev) => ({
          companyName: profile.companyName || prev.companyName,
          billingCountry: profile.countryCode || prev.billingCountry,
          registrationNumber:
            profile.registrationNumber || profile.kvkNumber || prev.registrationNumber,
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

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setFieldErrors({});
      setProfileLoaded(false);
    }
  }, [open]);

  const updateField = useCallback(
    (key: keyof CompanyFields, value: string) => {
      setFields((prev) => ({ ...prev, [key]: value }));
      setFieldErrors((prev) => {
        if (!prev[key]) return prev;
        const next = { ...prev };
        delete next[key];
        return next;
      });
    },
    []
  );

  const handleSubmit = async () => {
    const errors = validateFields(fields);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    await onSubmit(fields);
  };

  const isNL = fields.billingCountry.toUpperCase() === "NL";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Bedrijfsgegevens nodig voor excl. btw
          </DialogTitle>
          <DialogDescription>
            Vul dit in om excl. btw af te rekenen en correcte facturatie te krijgen.
          </DialogDescription>
        </DialogHeader>

        {serverError && (
          <Alert variant="destructive" className="my-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4 py-2">
          {/* Company name */}
          <div className="space-y-1.5">
            <Label htmlFor="cdm-company" className="text-sm">
              Bedrijfsnaam *
            </Label>
            <Input
              id="cdm-company"
              value={fields.companyName}
              onChange={(e) => updateField("companyName", e.target.value)}
              placeholder="Acme B.V."
              className={cn("h-9", fieldErrors.companyName && "border-destructive")}
              disabled={submitting}
            />
            {fieldErrors.companyName && (
              <p className="text-xs text-destructive">{fieldErrors.companyName}</p>
            )}
          </div>

          {/* Billing country */}
          <div className="space-y-1.5">
            <Label htmlFor="cdm-country" className="text-sm">
              Land (ISO2) *
            </Label>
            <Input
              id="cdm-country"
              value={fields.billingCountry}
              onChange={(e) =>
                updateField("billingCountry", e.target.value.toUpperCase().slice(0, 2))
              }
              placeholder="NL"
              maxLength={2}
              className={cn(
                "h-9 w-24 uppercase",
                fieldErrors.billingCountry && "border-destructive"
              )}
              disabled={submitting}
            />
            {fieldErrors.billingCountry && (
              <p className="text-xs text-destructive">{fieldErrors.billingCountry}</p>
            )}
          </div>

          {/* Registration number */}
          <div className="space-y-1.5">
            <Label htmlFor="cdm-reg" className="text-sm">
              {isNL ? "KvK-nummer" : "Chamber of Commerce / Registration number"} *
            </Label>
            <Input
              id="cdm-reg"
              value={fields.registrationNumber}
              onChange={(e) => updateField("registrationNumber", e.target.value)}
              placeholder={isNL ? "12345678" : "Registration number"}
              className={cn(
                "h-9",
                fieldErrors.registrationNumber && "border-destructive"
              )}
              disabled={submitting}
            />
            {fieldErrors.registrationNumber && (
              <p className="text-xs text-destructive">
                {fieldErrors.registrationNumber}
              </p>
            )}
          </div>

          {/* VAT number */}
          <div className="space-y-1.5">
            <Label htmlFor="cdm-vat" className="text-sm">
              BTW-nummer *
            </Label>
            <Input
              id="cdm-vat"
              value={fields.vatId}
              onChange={(e) => updateField("vatId", e.target.value)}
              placeholder="NL123456789B01"
              className={cn("h-9", fieldErrors.vatId && "border-destructive")}
              disabled={submitting}
            />
            {fieldErrors.vatId && (
              <p className="text-xs text-destructive">{fieldErrors.vatId}</p>
            )}
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground">
          Gegevens worden opgeslagen in je factuurprofiel voor toekomstige facturen.
        </p>

        <DialogFooter className="flex gap-2 sm:gap-0 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Annuleren
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Bezig...
              </>
            ) : (
              <>
                Verder naar betaling
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
