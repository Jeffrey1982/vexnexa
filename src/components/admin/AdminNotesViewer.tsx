import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, User } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { AdminUserNote } from "@prisma/client";

interface AdminNotesViewerProps {
  notes: (AdminUserNote & {
    admin?: {
      email: string;
      firstName: string | null;
      lastName: string | null;
    } | null;
  })[];
}

export function AdminNotesViewer({ notes }: AdminNotesViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Admin Notes ({notes.length})
        </CardTitle>
        <CardDescription>Internal notes not visible to the user</CardDescription>
      </CardHeader>
      <CardContent>
        {notes.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No admin notes yet</p>
            <p className="text-sm text-muted-foreground mt-1">Use the &quot;Add Note&quot; action to create internal notes</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const adminName = note.admin
                ? `${note.admin.firstName || ''} ${note.admin.lastName || ''}`.trim() || note.admin.email
                : 'Unknown Admin';

              return (
                <div
                  key={note.id}
                  className="border border-gray-200 dark:border-white/[0.06] rounded-lg p-4 bg-gray-50 dark:bg-white/[0.03] hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-foreground">{adminName}</p>
                        <p className="text-xs text-muted-foreground">{formatDate(note.createdAt)}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Internal
                    </Badge>
                  </div>
                  <div className="mt-3 pl-10">
                    <p className="text-sm text-gray-700 dark:text-muted-foreground whitespace-pre-wrap">{note.note}</p>
                  </div>
                  {note.updatedAt.getTime() !== note.createdAt.getTime() && (
                    <p className="text-xs text-muted-foreground mt-2 pl-10">
                      Last edited: {formatDate(note.updatedAt)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
