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
import { ArrowLeft, Mail, Building, Calendar, Globe, TrendingUp, Activity } from "lucide-react";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@tutusporta.com'];
  if (!adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }
  return user;
}

async function getUserDetails(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      sites: {
        orderBy: { createdAt: 'desc' },
        take: 10
      },
      scans: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          site: true
        }
      }
    }
  });

  return user;
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  await requireAdmin();
  const user = await getUserDetails(params.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
              <p className="text-gray-600 mb-6">The requested user could not be found.</p>
              <Link href="/admin/users">
                <Button>Back to Users</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <Link href="/admin/users">
            <Button variant="ghost" size="sm" className="gap-2 mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to All Users
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.firstName} {user.lastName}
          </h1>
          <p className="text-gray-600 flex items-center gap-2 mt-1">
            <Mail className="w-4 h-4" />
            {user.email}
          </p>
        </div>

        {/* User Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={
                user.plan === 'BUSINESS' ? 'default' :
                user.plan === 'PRO' ? 'secondary' :
                user.plan === 'STARTER' ? 'outline' : 'destructive'
              } className="text-base">
                {PLAN_NAMES[user.plan as keyof typeof PLAN_NAMES]}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'} className="text-base">
                {user.subscriptionStatus}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Sites</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{user.sites.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{user.scans.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>User information and account status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600">Email</label>
                <div className="mt-1 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user.email}</span>
                  {user.emailConfirmed && (
                    <Badge variant="outline" className="text-xs">Verified</Badge>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Company</label>
                <div className="mt-1 flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{user.company || 'N/A'}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Account Created</label>
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{formatDate(user.createdAt)}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Last Login</label>
                <div className="mt-1 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">
                    {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never'}
                  </span>
                </div>
              </div>

              {user.trialEndsAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Trial Ends</label>
                  <div className="mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900">{formatDate(user.trialEndsAt)}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">User ID</label>
                <div className="mt-1">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">{user.id}</code>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sites */}
        <Card>
          <CardHeader>
            <CardTitle>Sites ({user.sites.length})</CardTitle>
            <CardDescription>Websites tracked by this user</CardDescription>
          </CardHeader>
          <CardContent>
            {user.sites.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No sites yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>URL</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead>Last Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.sites.map((site) => (
                    <TableRow key={site.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          <a
                            href={site.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {site.url}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(site.createdAt)}</TableCell>
                      <TableCell>
                        {site.lastScannedAt ? formatDate(site.lastScannedAt) : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Scans */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Scans (Last 10)</CardTitle>
            <CardDescription>Latest accessibility scans performed</CardDescription>
          </CardHeader>
          <CardContent>
            {user.scans.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No scans yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Site</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Scanned</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {user.scans.map((scan) => (
                    <TableRow key={scan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-400" />
                          {scan.site?.url || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          (scan.score || 0) >= 90 ? 'default' :
                          (scan.score || 0) >= 70 ? 'secondary' : 'destructive'
                        }>
                          {scan.score || 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {scan.issuesFound || 0}
                        </span>
                      </TableCell>
                      <TableCell>{formatDate(scan.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Actions</CardTitle>
            <CardDescription>Manage this user's account</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Link href={`/admin/upgrade?userId=${user.id}`}>
                <Button variant="outline" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Upgrade Plan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
