'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, RefreshCw, AlertCircle, ExternalLink, XCircle, DollarSign, Calendar as CalendarIcon, Clock, Zap } from "lucide-react";
import { formatDate } from "@/lib/format";
import { fetchMolliePayments, fetchMollieSubscription, cancelMollieSubscription, processMollieRefund } from "@/app/actions/admin-user";
import { useRouter } from "next/navigation";
import type { User } from "@prisma/client";

interface UserBillingInfoProps {
  user: User;
}

export function UserBillingInfo({ user }: UserBillingInfoProps) {
  const router = useRouter();
  const [payments, setPayments] = useState<any[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refund dialog state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundDescription, setRefundDescription] = useState('');
  const [refunding, setRefunding] = useState(false);

  // Cancel subscription dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [canceling, setCanceling] = useState(false);

  const loadPayments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMolliePayments(user.id);
      if (result.error) {
        setError(result.error);
      } else {
        setPayments(result.payments);
      }
    } catch (err) {
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    if (!user.mollieSubscriptionId) return;

    setSubscriptionLoading(true);
    try {
      const result = await fetchMollieSubscription(user.id);
      if (result.subscription) {
        setSubscription(result.subscription);
      }
    } catch (err) {
      console.error('Failed to load subscription:', err);
    } finally {
      setSubscriptionLoading(false);
    }
  };

  useEffect(() => {
    if (user.mollieCustomerId) {
      loadPayments();
      loadSubscription();
    }
  }, [user.id, user.mollieCustomerId, user.mollieSubscriptionId]);

  const handleRefund = async () => {
    if (!selectedPayment || !refundAmount) return;

    setRefunding(true);
    try {
      await processMollieRefund(
        user.id,
        selectedPayment.id,
        {
          value: refundAmount,
          currency: selectedPayment.amount.currency
        },
        refundDescription
      );
      alert('Refund processed successfully!');
      setRefundDialogOpen(false);
      setRefundAmount('');
      setRefundDescription('');
      setSelectedPayment(null);
      loadPayments();
      router.refresh();
    } catch (error) {
      alert('Failed to process refund: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setRefunding(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }

    setCanceling(true);
    try {
      await cancelMollieSubscription(user.id, cancelReason);
      alert('Subscription canceled successfully!');
      setCancelDialogOpen(false);
      setCancelReason('');
      router.refresh();
    } catch (error) {
      alert('Failed to cancel subscription: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      {subscription && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-600" />
                  Active Subscription
                </CardTitle>
                <CardDescription>Recurring payment details</CardDescription>
              </div>
              <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <XCircle className="w-4 h-4 mr-2" />
                    Cancel Subscription
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel Subscription</DialogTitle>
                    <DialogDescription>
                      This will immediately cancel the user&apos;s subscription. They will lose access at the end of the current billing period.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Reason for Cancellation *</Label>
                      <Textarea
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="e.g., User requested cancellation, Payment issues, etc."
                        rows={3}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleCancelSubscription}
                      disabled={canceling || !cancelReason.trim()}
                    >
                      {canceling ? 'Canceling...' : 'Confirm Cancellation'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <DollarSign className="w-4 h-4" />
                  Amount
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {subscription.amount.currency} {subscription.amount.value} / {subscription.interval}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <CalendarIcon className="w-4 h-4" />
                  Next Payment
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {subscription.nextPaymentDate ? formatDate(new Date(subscription.nextPaymentDate)) : 'N/A'}
                </p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <Clock className="w-4 h-4" />
                  Status
                </div>
                <Badge variant={subscription.status === 'active' ? 'default' : 'outline'}>
                  {subscription.status}
                </Badge>
              </div>
              <div className="bg-white rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                  <CreditCard className="w-4 h-4" />
                  Payment Method
                </div>
                <p className="text-lg font-bold text-gray-900 capitalize">
                  {subscription.method || 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <a
                href={`https://www.mollie.com/dashboard/subscriptions/${subscription.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                View in Mollie Dashboard
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mollie IDs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Mollie Integration
          </CardTitle>
          <CardDescription>Customer and subscription identifiers</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Mollie Customer ID</label>
              <div className="mt-1 flex items-center gap-2">
                {user.mollieCustomerId ? (
                  <>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.mollieCustomerId}</code>
                    <a
                      href={`https://www.mollie.com/dashboard/customers/${user.mollieCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Mollie Subscription ID</label>
              <div className="mt-1 flex items-center gap-2">
                {user.mollieSubscriptionId ? (
                  <>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.mollieSubscriptionId}</code>
                    <a
                      href={`https://www.mollie.com/dashboard/subscriptions/${user.mollieSubscriptionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </div>
            </div>
          </div>

          {user.trialEndsAt && (
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-sm text-orange-800">
                Trial ends: {formatDate(user.trialEndsAt)}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>All Mollie payment transactions</CardDescription>
            </div>
            <Button onClick={loadPayments} disabled={loading} size="sm" variant="outline">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!user.mollieCustomerId ? (
            <p className="text-gray-500 text-center py-8">No Mollie customer ID set</p>
          ) : error ? (
            <div className="flex items-center justify-center gap-2 py-8 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          ) : loading && payments.length === 0 ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto text-gray-400 animate-spin" />
              <p className="text-gray-500 mt-2">Loading payments...</p>
            </div>
          ) : payments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No payment history found</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="text-sm">
                        {payment.paidAt || payment.createdAt}
                      </TableCell>
                      <TableCell className="text-sm">{payment.description}</TableCell>
                      <TableCell className="text-sm font-medium">
                        {payment.amount?.currency} {payment.amount?.value}
                      </TableCell>
                      <TableCell className="text-sm capitalize">
                        {payment.method || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            payment.status === 'paid' ? 'default' :
                            payment.status === 'pending' ? 'outline' :
                            'destructive'
                          }
                        >
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://www.mollie.com/dashboard/payments/${payment.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700"
                            title="View in Mollie"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          {payment.status === 'paid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setRefundAmount(payment.amount?.value || '');
                                setRefundDialogOpen(true);
                              }}
                            >
                              Refund
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment {selectedPayment?.id} ({selectedPayment?.amount?.currency} {selectedPayment?.amount?.value})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Enter amount to refund"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty or enter full amount for complete refund
              </p>
            </div>
            <div>
              <Label>Reason (Optional)</Label>
              <Textarea
                value={refundDescription}
                onChange={(e) => setRefundDescription(e.target.value)}
                placeholder="Reason for refund..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRefund}
              disabled={refunding || !refundAmount}
            >
              {refunding ? 'Processing...' : 'Process Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
