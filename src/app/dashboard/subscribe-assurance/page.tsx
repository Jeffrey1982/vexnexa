"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield,
  Check,
  ArrowLeft,
  Loader2,
  Globe,
  Bell,
  BarChart3,
  Clock,
} from "lucide-react";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";
import { createClient } from "@/lib/supabase/client-new";
import { useEffect } from "react";

type BillingCycle = "monthly" | "semiannual" | "annual";
type AssuranceTier = "BASIC" | "PRO" | "PUBLIC_SECTOR";

interface PlanConfig {
  tier: AssuranceTier;
  name: string;
  description: string;
  domains: number;
  monthly: number;
  semiannual: number;
  annual: number;
  features: string[];
  popular?: boolean;
}

const PLANS: PlanConfig[] = [
  {
    tier: "BASIC",
    name: "Basic",
    description: "Perfect for single websites and small projects",
    domains: 1,
    monthly: 9.99,
    semiannual: 55.99,
    annual: 101.99,
    features: [
      "1 domain monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "12-month scan history",
      "Up to 5 email recipients",
    ],
  },
  {
    tier: "PRO",
    name: "Pro",
    description: "Ideal for agencies and multi-site organizations",
    domains: 5,
    monthly: 24.99,
    semiannual: 137.99,
    annual: 254.99,
    popular: true,
    features: [
      "Up to 5 domains monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "12-month scan history",
      "Up to 5 email recipients",
      "Priority support",
    ],
  },
  {
    tier: "PUBLIC_SECTOR",
    name: "Public Sector",
    description: "Built for schools, governments, and public institutions",
    domains: 20,
    monthly: 49.99,
    semiannual: 275.99,
    annual: 509.99,
    features: [
      "Up to 20 domains monitored",
      "Weekly or biweekly scans",
      "Email alerts on score drops",
      "WCAG 2.1 AA compliance tracking",
      "Custom score thresholds (60-100)",
      "12-month scan history",
      "Up to 5 email recipients",
      "Dedicated support",
    ],
  },
];

function formatEuro(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(amount);
}

function getPrice(plan: PlanConfig, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return plan.monthly;
    case "semiannual":
      return plan.semiannual;
    case "annual":
      return plan.annual;
  }
}

function getPerMonth(plan: PlanConfig, cycle: BillingCycle): number {
  switch (cycle) {
    case "monthly":
      return plan.monthly;
    case "semiannual":
      return plan.semiannual / 6;
    case "annual":
      return plan.annual / 12;
  }
}

export default function SubscribeAssurancePage(): JSX.Element {
  const router = useRouter();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("monthly");
  const [loadingTier, setLoadingTier] = useState<AssuranceTier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authUser, setAuthUser] = useState<any>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setAuthUser(user);
    };
    getUser();
  }, [supabase]);

  const handleSubscribe = async (tier: AssuranceTier): Promise<void> => {
    setLoadingTier(tier);
    setError(null);

    try {
      const res = await fetch("/api/assurance/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingCycle }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 flex flex-col">
      <DashboardNav user={authUser} />
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Back Link */}
          <div className="mb-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </div>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 text-white shadow-lg mb-4">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">
              Accessibility Assurance
            </h1>
            <p className="mt-3 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Automated accessibility monitoring for your websites. Get alerted
              when scores drop and track WCAG compliance over time.
            </p>
          </div>

          {/* Features Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              {
                icon: Globe,
                title: "Domain Monitoring",
                desc: "Monitor multiple domains automatically",
              },
              {
                icon: Clock,
                title: "Scheduled Scans",
                desc: "Weekly or biweekly automated scans",
              },
              {
                icon: Bell,
                title: "Smart Alerts",
                desc: "Email alerts when scores drop",
              },
              {
                icon: BarChart3,
                title: "Compliance Tracking",
                desc: "12-month WCAG compliance history",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex items-start gap-3 p-4 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700"
              >
                <feature.icon className="w-5 h-5 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                    {feature.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {feature.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
              {(
                [
                  { value: "monthly" as const, label: "Monthly", badge: "" },
                  { value: "semiannual" as const, label: "6 Months", badge: "Save 7-8%" },
                  { value: "annual" as const, label: "Annual", badge: "Save 15%" },
                ]
              ).map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBillingCycle(option.value)}
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    billingCycle === option.value
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {option.label}
                  {option.badge && billingCycle !== option.value && (
                    <span className="absolute -top-2 -right-2 px-1.5 py-0.5 text-[10px] font-semibold bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 rounded-full">
                      {option.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan) => {
              const price = getPrice(plan, billingCycle);
              const perMonth = getPerMonth(plan, billingCycle);
              const isLoading = loadingTier === plan.tier;

              return (
                <Card
                  key={plan.tier}
                  className={`relative flex flex-col ${
                    plan.popular
                      ? "border-teal-500 dark:border-teal-400 shadow-lg ring-1 ring-teal-500/20"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-teal-600 hover:bg-teal-600 text-white">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {formatEuro(billingCycle === "monthly" ? price : perMonth)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          /month
                        </span>
                      </div>
                      {billingCycle !== "monthly" && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {formatEuro(price)} billed{" "}
                          {billingCycle === "semiannual"
                            ? "every 6 months"
                            : "annually"}
                        </p>
                      )}
                    </div>

                    {/* Features */}
                    <ul className="space-y-2.5 mb-6 flex-1">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                        >
                          <Check className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <Button
                      onClick={() => handleSubscribe(plan.tier)}
                      disabled={isLoading || loadingTier !== null}
                      className={`w-full ${
                        plan.popular
                          ? "bg-teal-600 hover:bg-teal-700 text-white"
                          : ""
                      }`}
                      variant={plan.popular ? "default" : "outline"}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Redirecting to payment...
                        </>
                      ) : (
                        `Get ${plan.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* FAQ / Info */}
          <div className="mt-12 max-w-2xl mx-auto text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              All plans include a secure payment via Mollie. You can cancel
              anytime with a 7-day grace period. Prices are in EUR and exclude
              VAT where applicable.
            </p>
          </div>
        </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
