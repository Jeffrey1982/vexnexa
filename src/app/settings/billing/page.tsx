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
  RefreshCw
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

export default function BillingPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
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

  // Get used seats (from teams)
  const usedSeats = 1; // At minimum, the owner uses 1 seat. TODO: Count actual team members

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Facturering & Abonnement</h1>
          <p className="text-muted-foreground">Beheer je abonnement en betalingen</p>
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
              Huidig Plan
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
                    ? `Trial ${isTrialExpired ? "verlopen" : `eindigt ${new Date(user.trialEndsAt!).toLocaleDateString()}`}`
                    : `${formatPrice(user.plan as any)} per maand`
                  }
                </p>
              </div>
              
              {user.plan !== "TRIAL" && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Volgende factuur</p>
                  <p className="font-semibold">
                    {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {/* Plan Features */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Pagina&apos;s/maand</p>
                <p className="font-semibold">{planEntitlements.pagesPerMonth.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Websites</p>
                <p className="font-semibold">{planEntitlements.sites}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Word export</p>
                <p className="font-semibold">{planEntitlements.word ? "✅" : "❌"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Scheduling</p>
                <p className="font-semibold">{planEntitlements.schedule ? "✅" : "❌"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage */}
        {usage && entitlements && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Gebruik ({usage.period})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Pagina&apos;s gescand</span>
                    <span className="text-sm font-medium">
                      {usage.pages.toLocaleString()} / {entitlements.pagesPerMonth.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, (usage.pages / entitlements.pagesPerMonth) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Websites</span>
                    <span className="text-sm font-medium">
                      {usage.sites} / {entitlements.sites}
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min(100, (usage.sites / entitlements.sites) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extra Seats - Show to everyone */}
        {entitlements && (
          <ExtraSeatsCard
            baseSeats={entitlements.base.users}
            extraSeats={entitlements.addOns.users}
            usedSeats={usedSeats}
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
                <CardTitle>Plan Wijzigen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upgrade naar een hoger plan voor meer functionaliteit
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
                      Pro - {formatPrice("PRO")} (Populair)
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
                Betaalmethode
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {user.subscriptionStatus === "active" 
                  ? "Beheer je betaalmethode via Mollie"
                  : "Stel een betaalmethode in voor abonnementen"
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
                Betaalmethode instellen
              </Button>
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          {user.subscriptionStatus === "active" && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-destructive">Abonnement opzeggen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Je abonnement wordt direct geannuleerd en je wordt teruggeschakeld naar het gratis trial plan.
                    </p>
                  </div>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        Abonnement opzeggen
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Abonnement opzeggen?</DialogTitle>
                        <DialogDescription>
                          Weet je zeker dat je je {PLAN_NAMES[user.plan]} abonnement wilt opzeggen? 
                          Je wordt direct teruggeschakeld naar het gratis trial plan met beperkte functionaliteit.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="outline">Annuleren</Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleCancelSubscription}
                          disabled={actionLoading === "cancel"}
                        >
                          {actionLoading === "cancel" ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : null}
                          Ja, opzeggen
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
                Vragen over facturering?
              </p>
              <Button variant="outline" asChild>
                <Link href="/contact">
                  Contact opnemen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}