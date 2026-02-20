'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PLAN_NAMES } from "@/lib/billing/plans";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { Search, Mail, Building, Calendar, Eye, X } from "lucide-react";
import type { Plan } from "@prisma/client";
import { BulkUserActions } from "./BulkUserActions";

interface UserWithSites {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  plan: Plan;
  subscriptionStatus: string;
  createdAt: Date;
  trialEndsAt: Date | null;
  sites: {
    _count: {
      scans: number;
    };
  }[];
}

interface UserListClientProps {
  users: UserWithSites[];
}

export function UserListClient({ users }: UserListClientProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;

    const query = searchQuery.toLowerCase();
    return users.filter(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = user.email.toLowerCase();
      const company = (user.company || '').toLowerCase();

      return fullName.includes(query) ||
             email.includes(query) ||
             company.includes(query);
    });
  }, [users, searchQuery]);

  // Calculate stats from filtered users
  const stats = useMemo(() => ({
    total: filteredUsers.length,
    trial: filteredUsers.filter(u => u.plan === 'TRIAL').length,
    starter: filteredUsers.filter(u => u.plan === 'STARTER').length,
    pro: filteredUsers.filter(u => u.plan === 'PRO').length,
    business: filteredUsers.filter(u => u.plan === 'BUSINESS').length,
    active: filteredUsers.filter(u => u.subscriptionStatus === 'active').length,
  }), [filteredUsers]);

  return (
    <>
      {/* Search Bar */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or company..."
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-muted-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-muted-foreground mt-2">
              Found {filteredUsers.length} of {users.length} users
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trial</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.trial}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Starter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-600">{stats.starter}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">{stats.pro}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Business</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.business}</div>
          </CardContent>
        </Card>
      </div>

      {/* Bulk Actions */}
      <div className="mb-8">
        <BulkUserActions users={filteredUsers} />
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>
            {searchQuery
              ? `Showing ${filteredUsers.length} of ${users.length} users matching "${searchQuery}"`
              : 'Complete list of all registered users'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-foreground mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {searchQuery
                  ? `No users match "${searchQuery}". Try a different search term.`
                  : 'No users in the system yet.'
                }
              </p>
              {searchQuery && (
                <Button
                  variant="outline"
                  onClick={() => setSearchQuery('')}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
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
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {user.company ? (
                            <>
                              <Building className="w-3 h-3 text-muted-foreground" />
                              {user.company}
                            </>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
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
                          <Calendar className="w-3 h-3 text-muted-foreground" />
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
          )}
        </CardContent>
      </Card>
    </>
  );
}
