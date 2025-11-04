"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    // Check if consent has already been given
    const consent = localStorage.getItem("cookie_consent");
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie_consent", "1");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie_consent", "0");
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm",
      className
    )}>
      <Card className="border-border shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Cookie className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-semibold text-sm">Cookies</h3>
                <p className="text-sm text-muted-foreground">
                  {t('message')}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAccept}
                  className="flex-1"
                >
                  {t('accept')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="flex-1"
                >
                  {t('decline')}
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 flex-shrink-0"
              aria-label={t('decline')}
            >
              <X className="w-4 h-4" />
              <span className="sr-only">{t('decline')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}