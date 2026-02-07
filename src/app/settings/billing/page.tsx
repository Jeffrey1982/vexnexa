"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  Crown,
  Zap,
  RefreshCw,
  Users,
  Globe,
  FileText,
  Check,
  X,
  BarChart3,
} from "lucide-react";
import { PLAN_NAMES, formatPrice, ENTITLEMENTS } from "@/lib/billing/plans";
import { ExtraSeatsCard } from "@/components/billing/ExtraSeatsCard";
import { ScanPackagesCard } from "@/components/billing/ScanPackagesCard";
import { AddOnType } from "@prisma/client";

interface UserData {
  id: string;
  email: string;
  plan: "TRIAL" | "STARTER" | "PRO" | "BUSINESS";
  subscriptionStatus: string;
  trialEndsAt?: string;
}

interface UsageData {
  pages: number;
  sites: number;
  period: string;
}

interface ActualUsageData {
  sites: number;
  scansThisMonth: number;
  teamMembers: number;
}

interface AddOnData {
  id: string;
  type: AddOnType;
  quantity: number;
  status: string;
  totalPrice: number;
}

interface EntitlementsData {
  pagesPerMonth: number;
  users: number;
  sites: number;
  pdf: boolean;
  word: boolean;
  schedule: boolean;
  crawl: boolean;
  integrations: string[];
  whiteLabel?: boolean;
  base: {
    pagesPerMonth: number;
    users: number;
  };
  addOns: {
    pagesPerMonth: number;
    users: number;
  };
}

function UsageBar({ label, used, limit, icon: Icon }: { label: string; used: number; limit: number; icon: React.ElementType }) {
  const percentage = Math.min(100, (used / limit) * 100);
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Icon className="h-4 w-4" />
          {label}
        </span>
        <span className={`text-sm font-medium ${isAtLimit ? "text-destructive" : isNearLimit ? "text-amber-600" : ""}`}>
          {used.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-secondary rounded-full h-2">
        <div
          className={`rounded-full h-2 transition-all ${isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary"}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function FeatureRow({ label, included }: { label: string; included: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm">{label}</span>
      {included ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground" />
      )}
    </div>
  );
}

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [actualUsage, setActualUsage] = useState<ActualUsageData | null>(null);
  const [entitlements, setEntitlements] = useState<EntitlementsData | null>(null);
  const [addOns, setAddOns] = useState<AddOnData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load real billing and usage data from API
  const loadUserData = async () => {
    try {
      const response = await fetch("/api/billing");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load billing data");
      }

      setUser({
        id: data.user.id,
        email: data.user.email,
        plan: data.user.plan,
        subscriptionStatus: data.user.subscriptionStatus,
        trialEndsAt: data.user.trialEndsAt,
      });

      setUsage({
        pages: data.usage.pages,
        sites: data.usage.sites,
        period: data.usage.period,
      });

      setActualUsage(data.actualUsage);
      setEntitlements(data.entitlements);
      setAddOns(data.addOns || []);

      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load billing data");
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, []);

  const handleCancelSubscription = async () => {
    setActionLoading("cancel");
    setError(null);

    try {
      const response = await fetch("/api/billing/cancel", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel subscription");
      }

      setSuccess("Subscription cancelled successfully");
      // Refresh user data
      setUser(prev => prev ? { ...prev, subscriptionStatus: "canceled", plan: "TRIAL" } : null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel subscription");
    }

    setActionLoading(null);
  };

  const handleChangePlan = async (newPlan: string) => {
    setActionLoading(`change-${newPlan}`);
    setError(null);

    try {
      const response = await fetch("/api/billing/change-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to change plan");
      }

      if (data.needCheckout) {
        // Redirect to checkout
        window.location.href = data.checkoutUrl;
      } else {
        setSuccess(`Successfully upgraded to ${newPlan} plan`);
        // Refresh user data
        setUser(prev => prev ? { ...prev, plan: newPlan as any, subscriptionStatus: "active" } : null);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to change plan");
    }

    setActionLoading(null);
  };

  const handleResetPaymentMethod = async () => {
    setActionLoading("reset-payment");
    setError(null);

    try {
      const response = await fetch("/api/billing/payment-method/reset", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset payment method");
      }

      // Redirect to payment setup
      window.location.href = data.url;

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset payment method");
    }

    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>Failed to load user data</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const planEntitlements = ENTITLEMENTS[user.plan];
  const isTrialExpired = user.trialEndsAt && new Date(user.trialEndsAt) < new Date();

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription and payments</p>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-2xl font-bold">{PLAN_NAMES[user.plan]}</h3>
                  <Badge
                    variant={user.subscriptionStatus === "active" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {user.subscriptionStatus === "active" && <CheckCircle className="h-3 w-3 mr-1" />}
                    {user.subscriptionStatus === "canceled" && <XCircle className="h-3 w-3 mr-1" />}
                    {user.subscriptionStatus}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {user.plan === "TRIAL"
                    ? `Trial ${isTrialExpired ? "expired" : `ends ${new Date(user.trialEndsAt!).toLocaleDateString()}`}`
                    : `${formatPrice(user.plan as any)} per month`
                  }
                </p>
              </div>

              {user.plan !== "TRIAL" && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Next invoice</p>
                  <p className="font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        {usage && entitlements && actualUsage && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Usage ({usage.period})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <UsageBar
                  label="Sites"
                  used={actualUsage.sites}
                  limit={entitlements.sites}
                  icon={Globe}
                />
                <UsageBar
                  label="Pages scanned"
                  used={usage.pages}
                  limit={entitlements.pagesPerMonth}
                  icon={FileText}
                />
                <UsageBar
                  label="Team members"
                  used={actualUsage.teamMembers}
                  limit={entitlements.users}
                  icon={Users}
                />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <Zap className="h-4 w-4" />
                      Scans this month
                    </span>
                    <span className="text-sm font-medium">
                      {actualUsage.scansThisMonth.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">Total scan runs across all sites</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Features */}
        {entitlements && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Plan Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                <FeatureRow label="PDF export" included={entitlements.pdf} />
                <FeatureRow label="Word export" included={entitlements.word} />
                <FeatureRow label="Scheduling" included={entitlements.schedule} />
                <FeatureRow label="Site crawling" included={entitlements.crawl} />
                <FeatureRow label="White label" included={!!entitlements.whiteLabel} />
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm">Integrations</span>
                  {entitlements.integrations.length > 0 ? (
                    <span className="text-sm text-muted-foreground">
                      {entitlements.integrations.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(", ")}
                    </span>
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extra Seats - Show to everyone */}
        {entitlements && actualUsage && (
          <ExtraSeatsCard
            baseSeats={entitlements.base.users}
            extraSeats={entitlements.addOns.users}
            usedSeats={actualUsage.teamMembers}
            addOns={addOns}
            onRefresh={loadUserData}
            isTrial={user.plan === "TRIAL"}
          />
        )}

        {/* Scan Packages - Show to everyone */}
        {usage && entitlements && (
          <ScanPackagesCard
            baseScans={entitlements.base.pagesPerMonth}
            extraScans={entitlements.addOns.pagesPerMonth}
            usedScans={usage.pages}
            currentPeriod={usage.period}
            addOns={addOns}
            onRefresh={loadUserData}
            isTrial={user.plan === "TRIAL"}
          />
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Upgrade Plan */}
          {(user.plan === "TRIAL" || user.subscriptionStatus !== "canceled") ? (
            <Card>
              <CardHeader>
                <CardTitle>Change Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade to a higher plan for more features
                </p>

                <div className="space-y-2">
                  {user.plan !== "STARTER" && (
                    <Button
                      onClick={() => handleChangePlan("STARTER")}
                      disabled={actionLoading === "change-STARTER"}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      {actionLoading === "change-STARTER" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Starter - {formatPrice("STARTER")}
                    </Button>
                  )}

                  {user.plan !== "PRO" && (
                    <Button
                      onClick={() => handleChangePlan("PRO")}
                      disabled={actionLoading === "change-PRO"}
                      className="w-full justify-start"
                      variant={user.plan === "TRIAL" ? "default" : "outline"}
                    >
                      {actionLoading === "change-PRO" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Crown className="mr-2 h-4 w-4" />
                      Pro - {formatPrice("PRO")} (Popular)
                    </Button>
                  )}

                  {user.plan !== "BUSINESS" && (
                    <Button
                      onClick={() => handleChangePlan("BUSINESS")}
                      disabled={actionLoading === "change-BUSINESS"}
                      className="w-full justify-start"
                      variant="outline"
                    >
                      {actionLoading === "change-BUSINESS" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Business - {formatPrice("BUSINESS")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {user.subscriptionStatus === "active"
                  ? "Manage your payment method via Mollie"
                  : "Set up a payment method for subscriptions"
                }
              </p>

              <Button
                onClick={handleResetPaymentMethod}
                disabled={actionLoading === "reset-payment"}
                variant="outline"
                className="w-full"
              >
                {actionLoading === "reset-payment" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Set up payment method
              </Button>
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          {user.subscriptionStatus === "active" && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-destructive">Cancel Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Your subscription will be cancelled immediately and you will be downgraded to the free trial plan.
                    </p>
                  </div>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        Cancel Subscription
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Cancel subscription?</DialogTitle>
                        <DialogDescription>
                          Are you sure you want to cancel your {PLAN_NAMES[user.plan]} subscription?
                          You will be immediately downgraded to the free trial plan with limited features.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button
                          variant="destructive"
                          onClick={handleCancelSubscription}
                          disabled={actionLoading === "cancel"}
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Yes, cancel
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Support */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                Questions about billing?
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact Us
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
