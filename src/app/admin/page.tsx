import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PLAN_NAMES } from "@/lib/billing/plans";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Search, Users, Crown, TrendingUp } from "lucide-react";

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

// Simple admin check - you can enhance this with a proper admin role system
async function requireAdmin() {
  const user = await requireAuth();

  // For now, check if user is your admin email - replace with your email
  const adminEmails = [
    'jeffrey.aay@gmail.com',
    'admin@tutusporta.com' // Add more admin emails as needed
  ];

  if (!adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

async function getAdminStats() {
  const [
    totalUsers,
    trialUsers,
    starterUsers,
    proUsers,
    businessUsers,
    activeSubscriptions,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: 'TRIAL' } }),
    prisma.user.count({ where: { plan: 'STARTER' } }),
    prisma.user.count({ where: { plan: 'PRO' } }),
    prisma.user.count({ where: { plan: 'BUSINESS' } }),
    prisma.user.count({ where: { subscriptionStatus: 'active' } }),
    prisma.user.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        plan: true,
        subscriptionStatus: true,
        createdAt: true,
        trialEndsAt: true,
        _count: {
          select: {
            sites: true
          }
        }
      }
    })
  ]);

  return {
    totalUsers,
    planBreakdown: {
      TRIAL: trialUsers,
      STARTER: starterUsers,
      PRO: proUsers,
      BUSINESS: businessUsers
    },
    activeSubscriptions,
    recentUsers
  };
}

export default async function AdminDashboard() {
  // Require admin access
  await requireAdmin();

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage users, plans, and subscriptions</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Business Plans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.planBreakdown.BUSINESS}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trial Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.planBreakdown.TRIAL}</div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
              <CardDescription>Current user distribution across plans</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats.planBreakdown).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        plan === 'BUSINESS' ? 'default' :
                        plan === 'PRO' ? 'secondary' :
                        plan === 'STARTER' ? 'outline' : 'destructive'
                      }>
                        {PLAN_NAMES[plan as keyof typeof PLAN_NAMES]}
                      </Badge>
                    </div>
                    <div className="font-semibold">{count} users</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 gap-2">
                <Link href="/admin/users" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="w-4 h-4 mr-2" />
                    Manage All Users
                  </Button>
                </Link>
                <Link href="/admin/upgrade" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Manual User Upgrade
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest user registrations and their current status</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sites</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.company || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge variant={
                        user.plan === 'BUSINESS' ? 'default' :
                        user.plan === 'PRO' ? 'secondary' :
                        user.plan === 'STARTER' ? 'outline' : 'destructive'
                      }>
                        {PLAN_NAMES[user.plan as keyof typeof PLAN_NAMES]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'}>
                        {user.subscriptionStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{user._count.sites}</TableCell>
                    <TableCell>{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/admin/users/${user.id}`}>
                        <Button size="sm" variant="outline">
                          Manage
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}