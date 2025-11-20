import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminNav } from "@/components/admin/AdminNav";
import { Users, Crown, UserCheck, Eye, Globe, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }
  return user;
}

async function getTeamsData() {
  const teams = await prisma.team.findMany({
    include: {
      owner: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          plan: true
        }
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      invites: {
        where: {
          acceptedAt: null,
          expiresAt: {
            gte: new Date()
          }
        }
      },
      _count: {
        select: {
          members: true,
          sites: true,
          invites: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const allMembers = await prisma.teamMember.count();
  const allInvites = await prisma.teamInvite.count({
    where: {
      acceptedAt: null,
      expiresAt: {
        gte: new Date()
      }
    }
  });

  const roleDistribution = await prisma.teamMember.groupBy({
    by: ['role'],
    _count: true
  });

  const stats = {
    totalTeams: teams.length,
    totalMembers: allMembers,
    pendingInvites: allInvites,
    avgMembersPerTeam: teams.length > 0 ? (allMembers / teams.length).toFixed(1) : 0,
    roleDistribution: roleDistribution.reduce((acc, curr) => {
      acc[curr.role] = curr._count;
      return acc;
    }, {} as Record<string, number>)
  };

  return {
    teams,
    stats
  };
}

export default async function AdminTeamsPage() {
  const admin = await requireAdmin();
  const { teams, stats } = await getTeamsData();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Crown className="w-3 h-3" />;
      case 'EDITOR':
        return <UserCheck className="w-3 h-3" />;
      default:
        return <Eye className="w-3 h-3" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'EDITOR':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={admin} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
          <p className="text-gray-600 mt-2">Manage all teams and member permissions across the platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold">{stats.totalTeams}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                <div className="text-3xl font-bold text-green-600">{stats.totalMembers}</div>
              </div>
              <div className="text-xs text-gray-500 mt-1">Avg {stats.avgMembersPerTeam} per team</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Pending Invites</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-orange-600" />
                <div className="text-3xl font-bold text-orange-600">{stats.pendingInvites}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Admins</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-600" />
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.roleDistribution.ADMIN || 0}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Editors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <div className="text-3xl font-bold text-blue-600">
                  {stats.roleDistribution.EDITOR || 0}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Teams Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Teams</CardTitle>
            <CardDescription>Complete list of teams with member details and permissions</CardDescription>
          </CardHeader>
          <CardContent>
            {teams.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <div className="font-medium">No teams created yet</div>
                <div className="text-sm">Teams will appear here once users start collaborating</div>
              </div>
            ) : (
              <div className="space-y-6">
                {teams.map((team) => {
                  const ownerName = team.owner.firstName && team.owner.lastName
                    ? `${team.owner.firstName} ${team.owner.lastName}`
                    : team.owner.email;

                  return (
                    <div key={team.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                          {team.description && (
                            <p className="text-sm text-gray-600 mt-1">{team.description}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{team.owner.plan}</Badge>
                            <span className="text-xs text-gray-500">
                              Created {new Date(team.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <Link href={`/admin/users/${team.owner.id}`}>
                          <Button variant="outline" size="sm">
                            View Owner
                          </Button>
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{team._count.members}</div>
                            <div className="text-xs text-gray-500">Members</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <Globe className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{team._count.sites}</div>
                            <div className="text-xs text-gray-500">Sites</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{team._count.invites}</div>
                            <div className="text-xs text-gray-500">Pending Invites</div>
                          </div>
                        </div>
                      </div>

                      {/* Team Owner */}
                      <div className="mb-3 pb-3 border-b">
                        <div className="text-xs font-semibold text-gray-600 mb-2">OWNER</div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{ownerName}</div>
                            <div className="text-xs text-gray-500">{team.owner.email}</div>
                          </div>
                          <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            <Crown className="w-3 h-3 mr-1" />
                            Owner
                          </Badge>
                        </div>
                      </div>

                      {/* Team Members */}
                      {team.members.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-gray-600 mb-2">MEMBERS</div>
                          <div className="space-y-2">
                            {team.members.map((member) => {
                              const memberName = member.user.firstName && member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`
                                : member.user.email;

                              return (
                                <div key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                      <span className="text-xs font-semibold text-gray-600">
                                        {(member.user.firstName?.[0] || member.user.email[0]).toUpperCase()}
                                      </span>
                                    </div>
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">{memberName}</div>
                                      <div className="text-xs text-gray-500">{member.user.email}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge
                                      variant="outline"
                                      className={getRoleColor(member.role)}
                                    >
                                      <div className="flex items-center gap-1">
                                        {getRoleIcon(member.role)}
                                        <span>{member.role}</span>
                                      </div>
                                    </Badge>
                                    <Link href={`/admin/users/${member.user.id}`}>
                                      <Button variant="ghost" size="sm">
                                        <ExternalLink className="w-3 h-3" />
                                      </Button>
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Pending Invites */}
                      {team.invites.length > 0 && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-semibold text-gray-600 mb-2">PENDING INVITES</div>
                          <div className="space-y-2">
                            {team.invites.map((invite) => (
                              <div key={invite.id} className="flex items-center justify-between py-2 px-3 bg-orange-50 rounded-lg">
                                <div className="text-sm text-gray-900">{invite.email}</div>
                                <Badge variant="outline" className="border-orange-500 text-orange-600">
                                  <ExternalLink className="w-3 h-3 mr-1" />
                                  {invite.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
