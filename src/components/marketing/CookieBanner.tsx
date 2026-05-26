"use client";

import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface CookieBannerProps {
  className?: string;
}

export function CookieBanner({ className }: CookieBannerProps) {
  const t = useTranslations('cookie');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    try {
      const consent = localStorage.getItem("cookie_consent");
      if (!consent) {
        const timeout = window.setTimeout(() => setIsVisible(true), 3500);
        return () => window.clearTimeout(timeout);
      }
    } catch {
      // localStorage unavailable (Safari Private Browsing)
      const timeout = window.setTimeout(() => setIsVisible(true), 3500);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  const handleAccept = () => {
    try { localStorage.setItem("cookie_consent", "1"); } catch {}
    setIsVisible(false);
  };

  const handleDecline = () => {
    try { localStorage.setItem("cookie_consent", "0"); } catch {}
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <aside aria-label="Cookie consent" className={cn(
      "fixed inset-x-3 bottom-3 z-50 md:left-auto md:right-4 md:max-w-sm",
      className
    )}>
      <div className="rounded-xl border border-border bg-card/95 p-3 shadow-[0_18px_45px_-24px_rgba(15,15,15,0.45)] backdrop-blur md:p-4">
        <div className="grid grid-cols-[auto_1fr_auto] items-start gap-2.5 md:gap-3">
          <Cookie className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground md:h-5 md:w-5" />

          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-5">Cookies</h3>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground md:text-sm">
              {t('message')}
            </p>
          </div>

          <button
            type="button"
            onClick={handleDismiss}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label={t('decline')}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('decline')}</span>
          </button>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2 md:mt-3">
          <button
            type="button"
            onClick={handleAccept}
            className="inline-flex min-h-9 items-center justify-center rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('accept')}
          </button>
          <button
            type="button"
            onClick={handleDecline}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {t('decline')}
          </button>
        </div>
      </div>
    </aside>
  );
}
