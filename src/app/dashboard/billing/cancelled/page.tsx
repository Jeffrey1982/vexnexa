"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  XCircle,
  ArrowLeft,
  RefreshCw,
  HelpCircle,
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

export default function BillingCancelledPage(): JSX.Element {
  const [mounted, setMounted] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const searchParams = useSearchParams();

  const tier = searchParams.get("tier") || "";
  const tierName = TIER_NAMES[tier] || "Assurance";

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
          {/* Cancel Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Payment Cancelled
          </h1>
          <p className="text-muted-foreground mb-8">
            Your payment for {tierName} was not completed.
            No charges have been made to your account.
          </p>

          {/* Info Card */}
          <Card className="mb-8 border-border">
            <CardContent className="pt-6">
              <div className="space-y-4 text-sm text-left">
                <div className="flex items-start gap-3">
                  <HelpCircle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <div className="font-medium text-foreground">Why was my payment cancelled?</div>
                    <div className="text-muted-foreground mt-1">
                      This can happen if you closed the payment window, your bank declined the transaction,
                      or the session timed out. You can try again at any time.
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/dashboard/subscribe-assurance">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Support */}
          <p className="mt-8 text-xs text-muted-foreground">
            Having trouble? Contact us at{" "}
            <a href="mailto:info@vexnexa.com" className="text-primary hover:underline">
              info@vexnexa.com
            </a>
          </p>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
