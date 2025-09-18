"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Trash2 } from "lucide-react";

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
}

interface TeamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  onTeamUpdated: (team: any) => void;
  onTeamDeleted: (teamId: string) => void;
}

export function TeamSettingsDialog({
  open,
  onOpenChange,
  team,
  onTeamUpdated,
  onTeamDeleted,
}: TeamSettingsDialogProps) {
  const [name, setName] = useState(team.name);
  const [description, setDescription] = useState(team.description || "");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        onTeamUpdated(data.team);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to update team");
      }
    } catch (err) {
      setError("Failed to update team");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setDeleteLoading(true);

    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onTeamDeleted(team.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete team");
      }
    } catch (err) {
      setError("Failed to delete team");
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading && !deleteLoading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setName(team.name);
        setDescription(team.description || "");
        setError("");
      }
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Team Settings</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter team name"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this team is for..."
                rows={3}
                disabled={loading}
              />
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
                disabled={loading || deleteLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Team
              </Button>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{team.name}&rdquo;? This action cannot be undone.
              All team members will lose access to shared sites.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete Team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}