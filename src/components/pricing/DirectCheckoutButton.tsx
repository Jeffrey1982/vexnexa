"use client";

import { useState } from "react";
import type { ComponentProps, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { localizeApiError } from "@/lib/localized-api-error";

export function DirectCheckoutButton(props: {
  endpoint: "/api/billing/create-audit-payment" | "/api/billing/create-addon-payment";
  payload: Record<string, unknown>;
  children: ReactNode;
  variant?: ComponentProps<typeof Button>["variant"];
  className?: string;
  buttonClassName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tCommon = useTranslations("common");
  const tError = useTranslations("apiErrors");

  const handleCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(props.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props.payload),
      });

      if (res.status === 401) {
        window.location.href = `/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        setError(localizeApiError(tError, data, "checkoutFailed"));
        setLoading(false);
        return;
      }

      const checkoutUrl = data.checkoutUrl || data.url;
      if (!checkoutUrl) {
        setError(tError("checkoutFailed"));
        setLoading(false);
        return;
      }

      window.location.href = checkoutUrl;
    } catch {
      setError(tError("network"));
      setLoading(false);
    }
  };

  return (
    <div className={props.className}>
      <Button
        className={`w-full ${props.buttonClassName ?? ""}`}
        variant={props.variant ?? "outline"}
        onClick={handleCheckout}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {tCommon("loading")}
          </>
        ) : (
          props.children
        )}
      </Button>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}
