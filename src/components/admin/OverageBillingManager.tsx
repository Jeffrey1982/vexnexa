"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AlertTriangle, DollarSign, TrendingUp, Gift, Save } from "lucide-react";
import { OVERFLOW_PRICING } from "@/lib/billing/plans";
import { useToast } from "@/hooks/use-toast";

interface OverageData {
  sites: number;
  pages: number;
  users: number;
}

interface OverageBillingManagerProps {
  userId: string;
  userEmail: string;
  currentOverage: OverageData;
  appliedCredits?: number;
  customAdjustments?: Array<{
    id: string;
    amount: number;
    reason: string;
    createdAt: string;
  }>;
}

export function OverageBillingManager({
  userId,
  userEmail,
  currentOverage,
  appliedCredits = 0,
  customAdjustments = []
}: OverageBillingManagerProps) {
  const { toast } = useToast();
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Calculate overflow costs
  const siteOverflowCost = currentOverage.sites * OVERFLOW_PRICING.extraSite.amount;
  const pageOverflowCost = currentOverage.pages * OVERFLOW_PRICING.extraPage.amount;
  const userOverflowCost = currentOverage.users * OVERFLOW_PRICING.extraUser.amount;
  const subtotal = siteOverflowCost + pageOverflowCost + userOverflowCost;
  const totalAfterCredits = Math.max(0, subtotal - appliedCredits);

  const handleApplyCredit = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast({ variant: "destructive", title: "Please enter a valid credit amount" });
      return;
    }

    if (!creditReason.trim()) {
      toast({ variant: "destructive", title: "Please provide a reason for this credit" });
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch("/api/admin/apply-overage-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: parseFloat(creditAmount),
          reason: creditReason
        })
      });

      if (!response.ok) throw new Error("Failed to apply credit");

      toast({ title: "Credit applied successfully" });
      setCreditAmount("");
      setCreditReason("");
      window.location.reload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  const handleWaiveOverage = async () => {
    if (!confirm(`Are you sure you want to waive all overage charges (€${subtotal.toFixed(2)}) for ${userEmail}?`)) {
      return;
    }

    setIsApplying(true);
    try {
      const response = await fetch("/api/admin/waive-overage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          amount: subtotal
        })
      });

      if (!response.ok) throw new Error("Failed to waive overage");

      toast({ title: "Overage waived successfully" });
      window.location.reload();
    } catch (error) {
      toast({ variant: "destructive", title: "Error" });
      console.error(error);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Overage Billing</CardTitle>
            <CardDescription>Manage overflow charges for plan limit overages</CardDescription>
          </div>
          {subtotal > 0 && (
            <div className="text-right">
              <div className="text-sm text-gray-500">Current Overage</div>
              <div className="text-2xl font-bold text-orange-600">€{subtotal.toFixed(2)}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overage Breakdown */}
        <div className="space-y-3">
          <div className="font-medium text-sm text-gray-700">Overage Breakdown</div>

          {currentOverage.sites > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Extra Websites</div>
                <div className="text-xs text-gray-600">
                  {currentOverage.sites} site{currentOverage.sites !== 1 ? 's' : ''} × €{OVERFLOW_PRICING.extraSite.amount.toFixed(2)}
                </div>
              </div>
              <div className="text-lg font-bold text-orange-600">
                €{siteOverflowCost.toFixed(2)}
              </div>
            </div>
          )}

          {currentOverage.pages > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Extra Pages Scanned</div>
                <div className="text-xs text-gray-600">
                  {currentOverage.pages.toLocaleString()} pages × €{OVERFLOW_PRICING.extraPage.amount.toFixed(4)}
                </div>
              </div>
              <div className="text-lg font-bold text-orange-600">
                €{pageOverflowCost.toFixed(2)}
              </div>
            </div>
          )}

          {currentOverage.users > 0 && (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="text-sm font-medium">Extra Team Members</div>
                <div className="text-xs text-gray-600">
                  {currentOverage.users} user{currentOverage.users !== 1 ? 's' : ''} × €{OVERFLOW_PRICING.extraUser.amount.toFixed(2)}
                </div>
              </div>
              <div className="text-lg font-bold text-orange-600">
                €{userOverflowCost.toFixed(2)}
              </div>
            </div>
          )}

          {subtotal === 0 && (
            <div className="text-center py-6 text-gray-500">
              <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <div className="text-sm font-medium">No Current Overages</div>
              <div className="text-xs">Customer is within plan limits</div>
            </div>
          )}
        </div>

        {subtotal > 0 && (
          <>
            {/* Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Overage Subtotal</span>
                <span className="font-medium">€{subtotal.toFixed(2)}</span>
              </div>
              {appliedCredits > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Applied Credits</span>
                  <span className="font-medium text-green-600">-€{appliedCredits.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total Due</span>
                <span className={totalAfterCredits > 0 ? "text-orange-600" : "text-green-600"}>
                  €{totalAfterCredits.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Apply Credit Section */}
            <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Gift className="w-4 h-4" />
                <span>Apply Credit or Adjustment</span>
              </div>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="creditAmount">Credit Amount (€)</Label>
                  <Input
                    id="creditAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={creditAmount}
                    onChange={(e) => setCreditAmount(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="creditReason">Reason</Label>
                  <Textarea
                    id="creditReason"
                    placeholder="e.g., First-time overage courtesy credit, Customer satisfaction adjustment..."
                    value={creditReason}
                    onChange={(e) => setCreditReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleApplyCredit}
                    disabled={isApplying}
                    className="flex-1"
                    size="sm"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Apply Credit
                  </Button>
                  <Button
                    onClick={handleWaiveOverage}
                    disabled={isApplying}
                    variant="outline"
                    size="sm"
                  >
                    Waive All
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Adjustment History */}
        {customAdjustments.length > 0 && (
          <div className="border-t pt-4">
            <div className="text-sm font-medium mb-3">Adjustment History</div>
            <div className="space-y-2">
              {customAdjustments.map((adj) => (
                <div key={adj.id} className="flex items-start justify-between p-2 bg-gray-50 rounded text-sm">
                  <div className="flex-1">
                    <div className="font-medium">€{adj.amount.toFixed(2)} credit applied</div>
                    <div className="text-xs text-gray-600">{adj.reason}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(adj.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warning Message */}
        {totalAfterCredits > 50 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-orange-900">High Overage Alert</div>
                <div className="text-xs text-orange-700 mt-1">
                  Customer has significant overage charges (€{totalAfterCredits.toFixed(2)}). Consider:
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    <li>Reaching out proactively to explain charges</li>
                    <li>Suggesting a plan upgrade to reduce overage costs</li>
                    <li>Offering a one-time courtesy credit for first overage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
