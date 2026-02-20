'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DollarSign,
  RefreshCw,
  XCircle,
  Download,
  Send,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  plan: string;
  subscriptionStatus: string;
  mollieCustomerId?: string | null;
  mollieSubscriptionId?: string | null;
  createdAt: Date | string;
  trialEndsAt?: Date | string | null;
}

interface PaymentManagementClientProps {
  users: User[];
}

export function PaymentManagementClient({ users }: PaymentManagementClientProps) {
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'all' | 'past_due' | 'cancelled'>('all');
  const { toast } = useToast();

  const filteredUsers = users.filter(user => {
    if (selectedTab === 'all') return true;
    if (selectedTab === 'past_due') return user.subscriptionStatus === 'past_due';
    if (selectedTab === 'cancelled') return user.subscriptionStatus === 'canceled';
    return true;
  });

  async function handleRefund(userId: string, amount: string) {
    const confirmed = confirm(`Process refund of $${amount} for this user?`);
    if (!confirmed) return;

    setProcessingUserId(userId);
    try {
      const response = await fetch('/api/admin/process-refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          amount: parseFloat(amount),
          reason: 'Admin manual refund'
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Refund processed',
          description: `$${amount} refunded successfully`
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Refund failed',
        description: error.message
      });
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleCancelSubscription(userId: string) {
    const confirmed = confirm('Cancel this user\'s subscription? They will lose access at the end of the billing period.');
    if (!confirmed) return;

    setProcessingUserId(userId);
    try {
      const response = await fetch('/api/admin/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Subscription cancelled',
          description: 'User subscription has been cancelled'
        });
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Cancellation failed',
        description: error.message
      });
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleRetryPayment(userId: string) {
    setProcessingUserId(userId);
    try {
      const response = await fetch('/api/admin/retry-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Payment retry initiated',
          description: 'Payment retry has been queued'
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Retry failed',
        description: error.message
      });
    } finally {
      setProcessingUserId(null);
    }
  }

  async function handleGenerateInvoice(userId: string) {
    try {
      const response = await fetch(`/api/admin/generate-invoice?userId=${userId}`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${userId}-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Invoice generated',
          description: 'Invoice downloaded successfully'
        });
      } else {
        throw new Error('Failed to generate invoice');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Invoice generation failed',
        description: error.message
      });
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500 text-green-600">Active</Badge>;
      case 'past_due':
        return <Badge variant="outline" className="border-orange-500 text-orange-600">Past Due</Badge>;
      case 'canceled':
        return <Badge variant="outline" className="border-red-500 text-red-600">Cancelled</Badge>;
      case 'trialing':
        return <Badge variant="outline" className="border-blue-500 text-blue-600">Trial</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTab === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('all')}
            >
              All ({users.length})
            </Button>
            <Button
              variant={selectedTab === 'past_due' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('past_due')}
            >
              Past Due ({users.filter(u => u.subscriptionStatus === 'past_due').length})
            </Button>
            <Button
              variant={selectedTab === 'cancelled' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTab('cancelled')}
            >
              Cancelled ({users.filter(u => u.subscriptionStatus === 'canceled').length})
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription Management</CardTitle>
          <CardDescription>Manage subscriptions, refunds, and payment issues</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b dark:border-white/[0.06]">
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="pb-3 font-medium">Customer</th>
                  <th className="pb-3 font-medium">Plan</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Subscription ID</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-white/[0.04]">
                {filteredUsers.map((user) => {
                  const userName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.email;

                  const isProcessing = processingUserId === user.id;

                  return (
                    <tr key={user.id} className="text-sm transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.03] dark:even:bg-white/[0.015]">
                      <td className="py-3">
                        <div>
                          <div className="font-medium text-foreground">{userName}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                        </div>
                      </td>
                      <td className="py-3">
                        <Badge variant="outline">{user.plan}</Badge>
                      </td>
                      <td className="py-3">
                        {getStatusBadge(user.subscriptionStatus)}
                      </td>
                      <td className="py-3">
                        {user.mollieSubscriptionId ? (
                          <div className="text-xs font-mono text-muted-foreground">
                            {user.mollieSubscriptionId.substring(0, 16)}...
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No subscription</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="text-xs text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <Link href={`/admin/users/${user.id}`}>
                            <Button variant="outline" size="sm">
                              View User
                            </Button>
                          </Link>

                          {user.subscriptionStatus === 'past_due' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRetryPayment(user.id)}
                              disabled={isProcessing}
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry Payment
                            </Button>
                          )}

                          {user.subscriptionStatus === 'active' && user.mollieSubscriptionId && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCancelSubscription(user.id)}
                              disabled={isProcessing}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Cancel
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const amount = prompt('Enter refund amount:');
                              if (amount) handleRefund(user.id, amount);
                            }}
                            disabled={isProcessing}
                          >
                            <DollarSign className="w-3 h-3 mr-1" />
                            Refund
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateInvoice(user.id)}
                          >
                            <Download className="w-3 h-3 mr-1" />
                            Invoice
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
