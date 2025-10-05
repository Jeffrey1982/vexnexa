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
import { ArrowLeft, Search, Users, Mail, Building, Calendar, Eye } from "lucide-react";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@tutusporta.com'];
  if (!adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }
  return user;
}

async function getAllUsers() {
  const users = await prisma.user.findMany({
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
      sites: {
        select: {
          _count: {
            select: {
              scans: true
            }
          }
        }
      }
    }
  });

  return users;
}

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await getAllUsers();

  const stats = {
    total: users.length,
    trial: users.filter(u => u.plan === 'TRIAL').length,
    starter: users.filter(u => u.plan === 'STARTER').length,
    pro: users.filter(u => u.plan === 'PRO').length,
    business: users.filter(u => u.plan === 'BUSINESS').length,
    active: users.filter(u => u.subscriptionStatus === 'active').length,
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/admin">
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Admin Dashboard
                </Button>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="text-blue-500" />
                User Management
              </h1>
              <p className="text-gray-600 mt-1">View and manage all platform users</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Trial</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.trial}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Starter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600">{stats.starter}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{stats.pro}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Business</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.business}</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Users ({users.length})</CardTitle>
            <CardDescription>Complete list of all registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead>Scans</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {user.company ? (
                            <>
                              <Building className="w-3 h-3 text-gray-400" />
                              {user.company}
                            </>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </div>
                      </TableCell>
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
                      <TableCell>
                        <span className="font-medium">{user.sites.length}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {user.sites.reduce((sum, site) => sum + site._count.scans, 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          {formatDate(user.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/admin/users/${user.id}`}>
                          <Button size="sm" variant="outline" className="gap-1">
                            <Eye className="w-3 h-3" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
