import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, CreditCard, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentManagementClient } from "@/components/admin/PaymentManagementClient";
import { MollieQuickLinks } from "@/components/admin/MollieQuickLinks";

export const dynamic = 'force-dynamic';
async function getPaymentData() {
  // Get users with their subscription status
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      plan: true,
      subscriptionStatus: true,
      mollieCustomerId: true,
      mollieSubscriptionId: true,
      createdAt: true,
      trialEndsAt: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const stats = {
    totalSubscriptions: users.filter(u => u.mollieSubscriptionId).length,
    activeSubscriptions: users.filter(u => u.subscriptionStatus === 'active').length,
    pastDue: users.filter(u => u.subscriptionStatus === 'past_due').length,
    cancelled: users.filter(u => u.subscriptionStatus === 'canceled').length,
    trials: users.filter(u => u.subscriptionStatus === 'trialing').length
  };

  return {
    users,
    stats
  };
}

export default async function AdminPaymentsPage() {
  const { users, stats } = await getPaymentData();

  return (
    <div className="min-h-screen bg-gray-50">

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment & Subscription Management</h1>
          <p className="text-gray-600 mt-2">Manage subscriptions, process refunds, and handle payment issues</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Subscriptions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold">{stats.totalSubscriptions}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Active</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Past Due</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.pastDue}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Cancelled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div className="text-3xl font-bold text-red-600">{stats.cancelled}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Trials</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600" />
                <div className="text-3xl font-bold text-purple-600">{stats.trials}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mollie Quick Links */}
        <div className="mb-8">
          <MollieQuickLinks />
        </div>

        {/* Payment Management Client Component */}
        <PaymentManagementClient users={users} />
      </div>
    </div>
  );
}
