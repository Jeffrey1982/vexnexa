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
// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic';

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
  const stats = await getAdminStats();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[var(--surface-0)]">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
                <Crown className="text-yellow-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-muted-foreground mt-1">Manage users, plans, subscriptions, and support</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-400/10">
                  <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Subscriptions</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 dark:bg-emerald-400/10">
                  <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-emerald-600 dark:text-emerald-400">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Business Plans</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-400/10">
                  <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">{stats.planBreakdown.BUSINESS}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Trial Users</CardTitle>
                <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-orange-50 dark:bg-orange-400/10">
                  <AlertCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl lg:text-4xl font-extrabold tracking-tight text-orange-600 dark:text-orange-400">{stats.planBreakdown.TRIAL}</div>
            </CardContent>
          </Card>
        </div>

        {/* Support Tickets Overview */}
        <Card className="mb-8 border-2 border-orange-200 dark:border-orange-400/20 bg-gradient-to-br from-orange-50 to-yellow-50 dark:from-orange-500/[0.07] dark:to-yellow-500/[0.03]">
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
              <div className="bg-white dark:bg-[var(--surface-2)] rounded-xl p-4 shadow-sm dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tickets</p>
                    <p className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-foreground">{stats.tickets.total}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06]">
                    <Ticket className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[var(--surface-2)] rounded-xl p-4 shadow-sm dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Tickets</p>
                    <p className="text-3xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{stats.tickets.open}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-400/10">
                    <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-[var(--surface-2)] rounded-xl p-4 shadow-sm dark:shadow-none dark:ring-1 dark:ring-inset dark:ring-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                    <p className="text-3xl font-extrabold tracking-tight text-yellow-600 dark:text-yellow-400">{stats.tickets.inProgress}</p>
                  </div>
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-400/10">
                    <MessageCircle className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Tickets */}
            {stats.tickets.recent.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-muted-foreground mb-3">Recent Tickets</h3>
                <div className="space-y-2">
                  {stats.tickets.recent.map((ticket) => {
                    const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email;
                    return (
                      <Link key={ticket.id} href={`/admin-interface/tickets/${ticket.id}`}>
                        <div className="bg-white dark:bg-[var(--surface-2)] p-3 rounded-lg border border-gray-200 dark:border-white/[0.06] hover:border-orange-300 dark:hover:border-orange-400/30 hover:shadow-sm dark:hover:bg-[var(--surface-3)] transition-all cursor-pointer">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-foreground truncate">{ticket.subject}</p>
                              <p className="text-sm text-muted-foreground">{userName} • {ticket._count.messages} messages</p>
                            </div>
                            <Badge className={
                              ticket.status === 'OPEN' ? 'bg-blue-100 text-blue-800 dark:text-blue-300' :
                              ticket.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800 dark:text-yellow-300' :
                              ticket.status === 'RESOLVED' ? 'bg-green-100 text-green-800 dark:text-green-300' :
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
                <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No support tickets yet</p>
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
                  <Button variant="outline" className="w-full justify-start border-orange-300 dark:border-orange-500/50 text-orange-700 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10">
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
                        <div className="font-medium text-foreground">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">{user.email}</div>
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
