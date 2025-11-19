'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, RefreshCw, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/format";
import { fetchMolliePayments } from "@/app/actions/admin-user";
import type { User } from "@prisma/client";

interface UserBillingInfoProps {
  user: User;
}

export function UserBillingInfo({ user }: UserBillingInfoProps) {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  useEffect(() => {
    if (user.mollieCustomerId) {
      loadPayments();
    }
  }, [user.id, user.mollieCustomerId]);

  return (
    <div className="space-y-6">
      {/* Subscription Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription & Billing
          </CardTitle>
          <CardDescription>Mollie integration and payment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-600">Mollie Customer ID</label>
              <div className="mt-1">
                {user.mollieCustomerId ? (
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.mollieCustomerId}</code>
                ) : (
                  <span className="text-gray-500">Not set</span>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Mollie Subscription ID</label>
              <div className="mt-1">
                {user.mollieSubscriptionId ? (
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.mollieSubscriptionId}</code>
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
              <CardDescription>Mollie payment transactions</CardDescription>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
