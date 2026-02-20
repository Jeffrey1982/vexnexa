"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Shield,
  ArrowRight,
  Calendar,
  Globe,
  Bell,
} from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { createClient } from "@/lib/supabase/client-new";
import { useSearchParams } from "next/navigation";

const TIER_NAMES: Record<string, string> = {
  BASIC: "Basic",
  PRO: "Pro",
  PUBLIC_SECTOR: "Public Sector",
};

const CYCLE_LABELS: Record<string, string> = {
  monthly: "Monthly",
  semiannual: "Every 6 months",
  annual: "Annual",
};

export default function BillingSuccessPage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const searchParams = useSearchParams();

  const tier = searchParams.get("tier") || "BASIC";
  const cycle = searchParams.get("cycle") || "monthly";
  const tierName = TIER_NAMES[tier] || tier;
  const cycleLabel = CYCLE_LABELS[cycle] || cycle;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));
  }, [mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="h-16 border-b border-border" />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-muted/30 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={authUser} />
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full text-center">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Payment Successful
          </h1>
          <p className="text-muted-foreground mb-8">
            Your Assurance <span className="font-semibold text-foreground">{tierName}</span> subscription
            ({cycleLabel}) is now active.
          </p>

          {/* Subscription Card */}
          <Card className="mb-8 border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-400 font-medium mb-4">
                <CheckCircle2 className="w-5 h-5" />
                Subscription Activated
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-muted-foreground">Plan</div>
                <div className="font-medium text-foreground text-right">Assurance {tierName}</div>
                <div className="text-muted-foreground">Billing</div>
                <div className="font-medium text-foreground text-right">{cycleLabel}</div>
                <div className="text-muted-foreground">Status</div>
                <div className="font-medium text-green-600 dark:text-green-400 text-right">Active</div>
              </div>
            </CardContent>
          </Card>

          {/* Next Steps */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Next Steps</h2>
            <div className="space-y-3">
              {[
                {
                  icon: Globe,
                  title: "Add your domains",
                  desc: "Set up the websites you want to monitor",
                },
                {
                  icon: Calendar,
                  title: "Configure scan schedule",
                  desc: "Choose when and how often scans run",
                },
                {
                  icon: Bell,
                  title: "Set up alerts",
                  desc: "Get notified when accessibility scores change",
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <step.icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground text-sm">{step.title}</div>
                    <div className="text-xs text-muted-foreground">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/assurance">
                Go to Assurance Settings
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                Back to Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
