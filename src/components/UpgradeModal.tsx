"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Crown, Zap, AlertTriangle, TrendingUp } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: "UPGRADE_REQUIRED" | "LIMIT_REACHED" | "TRIAL_EXPIRED";
  feature?: string;
  limit?: number;
  current?: number;
}

export function UpgradeModal({
  isOpen,
  onClose,
  reason,
  feature,
  limit,
  current,
}: UpgradeModalProps) {
  const getTitle = () => {
    switch (reason) {
      case "UPGRADE_REQUIRED":
        return t("upgradeRequired.title");
      case "LIMIT_REACHED":
        return t("limitReached.title");
      case "TRIAL_EXPIRED":
        return t("trialExpired.title");
      default:
        return "Upgrade Required";
    }
  };

  const getDescription = () => {
    switch (reason) {
      case "UPGRADE_REQUIRED":
        return t("upgradeRequired.description");
      case "LIMIT_REACHED":
        return t("limitReached.description");
      case "TRIAL_EXPIRED":
        return t("trialExpired.description");
      default:
        return t("upgradeRequired.description");
    }
  };

  const getIcon = () => {
    switch (reason) {
      case "UPGRADE_REQUIRED":
        return <Crown className="h-6 w-6 text-primary" />;
      case "LIMIT_REACHED":
        return <TrendingUp className="h-6 w-6 text-orange-500" />;
      case "TRIAL_EXPIRED":
        return <AlertTriangle className="h-6 w-6 text-red-500" />;
      default:
        return <Crown className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getIcon()}
            {getTitle()}
          </DialogTitle>
          <DialogDescription>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>

        {reason === "LIMIT_REACHED" && limit && current && (
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">{t("limitReached.title")}</span>
              <span className="text-sm font-medium">{current} / {limit}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div 
                className="bg-destructive rounded-full h-2 transition-all"
                style={{ width: `${Math.min(100, (current / limit) * 100)}%` }}
              />
            </div>
          </div>
        )}

        <Alert className="border-primary/20 bg-primary/5">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            {t("upgradeRequired.description")}
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("limitReached.cancelButton")}
          </Button>
          <Button asChild>
            <Link href="/pricing" onClick={onClose}>
              <Crown className="mr-2 h-4 w-4" />
              {t("upgradeRequired.upgradeButton")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}