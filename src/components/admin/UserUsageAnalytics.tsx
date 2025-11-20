"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { ENTITLEMENTS, OVERFLOW_PRICING } from "@/lib/billing/plans";

interface Site {
  id: string;
  url: string;
  createdAt: Date | string;
  scans: Array<{
    id: string;
    status: string;
    createdAt: Date | string;
  }>;
}

interface UserUsageAnalyticsProps {
  user: {
    id: string;
    plan: string;
    email: string;
    createdAt: Date | string;
  };
  sites: Site[];
  currentMonthScans: number;
  currentMonthPages: number;
  previousMonthPages: number;
  teamMembersCount: number;
}

export function UserUsageAnalytics({
  user,
  sites,
  currentMonthScans,
  currentMonthPages,
  previousMonthPages,
  teamMembersCount
}: UserUsageAnalyticsProps) {
  const plan = user.plan as keyof typeof ENTITLEMENTS;
  const entitlements = ENTITLEMENTS[plan] || ENTITLEMENTS.TRIAL;

  // Calculate usage percentages
  const sitesUsage = sites.length;
  const sitesPercent = Math.min((sitesUsage / entitlements.sites) * 100, 100);
  const sitesOverage = Math.max(0, sitesUsage - entitlements.sites);

  const pagesPercent = Math.min((currentMonthPages / entitlements.pagesPerMonth) * 100, 100);
  const pagesOverage = Math.max(0, currentMonthPages - entitlements.pagesPerMonth);

  const usersPercent = Math.min((teamMembersCount / entitlements.users) * 100, 100);
  const usersOverage = Math.max(0, teamMembersCount - entitlements.users);

  // Calculate overflow charges
  const siteOverflowCost = sitesOverage * OVERFLOW_PRICING.extraSite.amount;
  const pageOverflowCost = pagesOverage * OVERFLOW_PRICING.extraPage.amount;
  const userOverflowCost = usersOverage * OVERFLOW_PRICING.extraUser.amount;
  const totalOverflowCost = siteOverflowCost + pageOverflowCost + userOverflowCost;

  // Calculate trend
  const pagesTrend = previousMonthPages > 0
    ? ((currentMonthPages - previousMonthPages) / previousMonthPages) * 100
    : 0;

  const getStatusColor = (percent: number) => {
    if (percent >= 100) return "text-red-600";
    if (percent >= 80) return "text-orange-600";
    return "text-green-600";
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) return <Badge variant="destructive">Over Limit</Badge>;
    if (percent >= 80) return <Badge variant="outline" className="border-orange-500 text-orange-600">Warning</Badge>;
    return <Badge variant="outline" className="border-green-500 text-green-600">Healthy</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usage Analytics</CardTitle>
            <CardDescription>Current billing period usage vs. entitlements</CardDescription>
          </div>
          {totalOverflowCost > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Estimated Overflow</div>
              <div className="text-2xl font-bold text-red-600">€{totalOverflowCost.toFixed(2)}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sites Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Websites</span>
              {getStatusBadge(sitesPercent)}
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(sitesPercent)}`}>
              {sitesUsage} / {entitlements.sites}
              {sitesOverage > 0 && ` (+${sitesOverage} over)`}
            </span>
          </div>
          <Progress value={sitesPercent} className={sitesPercent >= 100 ? "bg-red-100" : ""} />
          {sitesOverage > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Overage charge: €{siteOverflowCost.toFixed(2)}/month</span>
            </div>
          )}
        </div>

        {/* Pages Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Pages Scanned (This Month)</span>
              {getStatusBadge(pagesPercent)}
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(pagesPercent)}`}>
              {currentMonthPages.toLocaleString()} / {entitlements.pagesPerMonth.toLocaleString()}
              {pagesOverage > 0 && ` (+${pagesOverage.toLocaleString()} over)`}
            </span>
          </div>
          <Progress value={pagesPercent} className={pagesPercent >= 100 ? "bg-red-100" : ""} />
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{currentMonthScans} scans this month</span>
            <div className="flex items-center gap-1">
              {pagesTrend > 0 ? (
                <TrendingUp className="w-3 h-3 text-red-500" />
              ) : pagesTrend < 0 ? (
                <TrendingDown className="w-3 h-3 text-green-500" />
              ) : (
                <Minus className="w-3 h-3 text-gray-400" />
              )}
              <span>{Math.abs(pagesTrend).toFixed(1)}% vs last month</span>
            </div>
          </div>
          {pagesOverage > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Overage charge: €{pageOverflowCost.toFixed(2)} this month</span>
            </div>
          )}
        </div>

        {/* Team Members Usage */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Team Members</span>
              {getStatusBadge(usersPercent)}
            </div>
            <span className={`text-sm font-semibold ${getStatusColor(usersPercent)}`}>
              {teamMembersCount} / {entitlements.users}
              {usersOverage > 0 && ` (+${usersOverage} over)`}
            </span>
          </div>
          <Progress value={usersPercent} className={usersPercent >= 100 ? "bg-red-100" : ""} />
          {usersOverage > 0 && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4" />
              <span>Overage charge: €{userOverflowCost.toFixed(2)}/month</span>
            </div>
          )}
        </div>

        {/* Summary */}
        {totalOverflowCost > 0 && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Total Estimated Overflow Charges</div>
                <div className="text-xs text-gray-500">Will be added to next invoice</div>
              </div>
              <div className="text-2xl font-bold text-red-600">€{totalOverflowCost.toFixed(2)}</div>
            </div>
          </div>
        )}

        {sitesPercent >= 80 || pagesPercent >= 80 || usersPercent >= 80 ? (
          <div className="pt-4 border-t bg-orange-50 -mx-6 -mb-6 px-6 py-4 rounded-b-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-orange-900">Proactive Support Opportunity</div>
                <div className="text-xs text-orange-700 mt-1">
                  Customer is approaching or exceeding plan limits. Consider reaching out to:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {sitesPercent >= 80 && <li>Discuss upgrading for more website slots</li>}
                    {pagesPercent >= 80 && <li>Optimize scanning strategy or upgrade plan</li>}
                    {usersPercent >= 80 && <li>Add more team member seats</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
