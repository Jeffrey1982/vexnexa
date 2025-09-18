"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Users,
  Globe,
  Plus,
  Settings,
  Crown,
  UserCheck,
  Eye
} from "lucide-react";
import { CreateTeamDialog } from "./CreateTeamDialog";
import { TeamSettingsDialog } from "./TeamSettingsDialog";

interface Team {
  id: string;
  name: string;
  description?: string;
  owner: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
  };
  members: Array<{
    id: string;
    role: 'ADMIN' | 'EDITOR' | 'VIEWER';
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  }>;
  sites: Array<{
    id: string;
    url: string;
    createdAt: string;
  }>;
  _count: {
    members: number;
    sites: number;
  };
  createdAt: string;
}

export function TeamList() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const handleTeamCreated = (newTeam: Team) => {
    setTeams([newTeam, ...teams]);
    setCreateDialogOpen(false);
  };

  const handleTeamUpdated = (updatedTeam: Team) => {
    setTeams(teams.map(team =>
      team.id === updatedTeam.id ? updatedTeam : team
    ));
    setSettingsDialogOpen(false);
    setSelectedTeam(null);
  };

  const handleTeamDeleted = (teamId: string) => {
    setTeams(teams.filter(team => team.id !== teamId));
    setSettingsDialogOpen(false);
    setSelectedTeam(null);
  };

  const openSettings = (team: Team) => {
    setSelectedTeam(team);
    setSettingsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Teams</h1>
            <p className="text-muted-foreground">
              Collaborate with your team on accessibility projects
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Team
          </Button>
        </div>

        {teams.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first team to start collaborating on accessibility projects
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teams.map((team) => {
              const userMembership = team.members.find(m => m.user.email === team.owner.email);
              const isOwner = team.owner.id === userMembership?.user.id;
              const userRole = userMembership?.role || 'VIEWER';

              return (
                <Card key={team.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{team.name}</CardTitle>
                        {team.description && (
                          <p className="text-sm text-muted-foreground">
                            {team.description}
                          </p>
                        )}
                      </div>
                      {(isOwner || userRole === 'ADMIN') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openSettings(team)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{team._count.members} members</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Globe className="w-4 h-4 text-muted-foreground" />
                        <span>{team._count.sites} sites</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Your Role</span>
                        <Badge
                          variant="outline"
                          className={getRoleColor(userRole)}
                        >
                          <div className="flex items-center space-x-1">
                            {getRoleIcon(userRole)}
                            <span>{userRole}</span>
                          </div>
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Recent Members</span>
                      </div>
                      <div className="flex -space-x-2">
                        {team.members.slice(0, 5).map((member) => (
                          <Avatar key={member.id} className="w-8 h-8 border-2 border-background">
                            <AvatarFallback className="text-xs">
                              {(member.user.firstName?.[0] || member.user.email[0]).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {team._count.members > 5 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
                            +{team._count.members - 5}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" className="w-full" size="sm">
                        View Team
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CreateTeamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTeamCreated={handleTeamCreated}
      />

      {selectedTeam && (
        <TeamSettingsDialog
          open={settingsDialogOpen}
          onOpenChange={setSettingsDialogOpen}
          team={selectedTeam}
          onTeamUpdated={handleTeamUpdated}
          onTeamDeleted={handleTeamDeleted}
        />
      )}
    </>
  );
}