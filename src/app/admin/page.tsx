import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLAN_NAMES } from "@/lib/billing/plans";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Users, Crown, TrendingUp, FileText, Ticket, MessageCircle, AlertCircle } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

// Simple admin check
async function requireAdmin() {
  const user = await requireAuth();

  const adminEmails = [
    'jeffrey.aay@gmail.com',
    'admin@vexnexa.com'
  ];

  if (!adminEmails.includes(user.email) && !user.isAdmin) {
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
    recentUsers,
    // Support tickets stats
    totalTickets,
    openTickets,
    inProgressTickets,
    recentTickets
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
    }),
    // Ticket counts
    prisma.supportTicket.count().catch(() => 0),
    prisma.supportTicket.count({ where: { status: 'OPEN' } }).catch(() => 0),
    prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }).catch(() => 0),
    prisma.supportTicket.findMany({
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        _count: {
          select: { messages: true }
        }
      }
    }).catch(() => [])
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
    recentUsers,
    tickets: {
      total: totalTickets,
      open: openTickets,
      inProgress: inProgressTickets,
      recent: recentTickets
    }
  };
}

export default async function AdminDashboard() {
  // Require admin access
  const user = await requireAdmin();

  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Crown className="text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage users, plans, subscriptions, and support</p>
            </div>
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

        {/* Support Tickets Overview - NEW */}
        <Card className="mb-8 border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Ticket className="text-orange-600" />
                  Support Tickets Overview
                </CardTitle>
                <CardDescription>Manage and respond to customer support requests</CardDescription>
              </div>
              <Link href="/admin-interface">
                <Button className="bg-orange-600 hover:bg-orange-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  View All Tickets
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Tickets</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.tickets.total}</p>
                  </div>
                  <Ticket className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Open Tickets</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.tickets.open}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-blue-400" />
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.tickets.inProgress}</p>
                  </div>
                  <MessageCircle className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* Recent Tickets */}
            {stats.tickets.recent.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Tickets</h3>
                <div className="space-y-2">
                  {stats.tickets.recent.map((ticket) => {
                    const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email;
                    return (
                      <Link key={ticket.id} href={`/admin-interface/tickets/${ticket.id}`}>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{ticket.subject}</p>
                              <p className="text-sm text-gray-500">{userName} • {ticket._count.messages} messages</p>
                            </div>
                            <Badge className={
                              ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
                              ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {ticket.status.replace(/_/g, ' ')}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {stats.tickets.total === 0 && (
              <div className="text-center py-8">
                <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No support tickets yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Plan Breakdown and Quick Actions */}
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
                <Link href="/admin/blog" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="w-4 h-4 mr-2" />
                    Manage Blog Posts
                  </Button>
                </Link>
                <Link href="/admin/upgrade" className="w-full">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Manual User Upgrade
                  </Button>
                </Link>
                <Link href="/admin-interface" className="w-full">
                  <Button variant="outline" className="w-full justify-start border-orange-300 text-orange-700 hover:bg-orange-50">
                    <Ticket className="w-4 h-4 mr-2" />
                    Support Tickets
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
