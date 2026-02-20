import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Activity,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Mail,
  MessageSquare,
  FileText,
  User,
  CreditCard
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { UserAdminEvent, User as PrismaUser, Site, Scan } from "@prisma/client";

interface UserActivityTimelineProps {
  events: UserAdminEvent[];
  user: PrismaUser & {
    sites: (Site & { scans: Scan[] })[];
  };
}

const eventIcons = {
  PLAN_CHANGE: TrendingUp,
  STATUS_CHANGE: CheckCircle,
  PAYMENT_REFUND: CreditCard,
  NOTE_ADDED: FileText,
  TICKET_CREATED: MessageSquare,
  TICKET_CLOSED: CheckCircle,
  CONTACT_CONVERTED: Mail,
  MANUAL_ACTIVATION: User,
  MANUAL_SUSPENSION: AlertCircle,
  EMAIL_SENT: Mail,
};

const eventColors = {
  PLAN_CHANGE: 'text-blue-600 bg-blue-100',
  STATUS_CHANGE: 'text-green-600 bg-green-100',
  PAYMENT_REFUND: 'text-red-600 bg-red-100',
  NOTE_ADDED: 'text-muted-foreground bg-gray-100',
  TICKET_CREATED: 'text-purple-600 bg-purple-100',
  TICKET_CLOSED: 'text-green-600 bg-green-100',
  CONTACT_CONVERTED: 'text-orange-600 bg-orange-100',
  MANUAL_ACTIVATION: 'text-blue-600 bg-blue-100',
  MANUAL_SUSPENSION: 'text-red-600 bg-red-100',
  EMAIL_SENT: 'text-indigo-600 bg-indigo-100',
};

export function UserActivityTimeline({ events, user }: UserActivityTimelineProps) {
  // Combine admin events with user activity
  const combinedTimeline = [
    ...events.map(e => ({
      type: 'admin_event',
      date: e.createdAt,
      data: e
    })),
    {
      type: 'user_created',
      date: user.createdAt,
      data: { description: 'User account created' }
    },
    ...user.sites.map(site => ({
      type: 'site_added',
      date: site.createdAt,
      data: { description: `Added site: ${site.url}`, url: site.url }
    })),
    ...user.sites.flatMap(site =>
      site.scans.slice(0, 5).map(scan => ({
        type: 'scan_run',
        date: scan.createdAt,
        data: {
          description: `Scan completed for ${site.url}`,
          score: scan.score,
          status: scan.status
        }
      }))
    )
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
   .slice(0, 50);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Activity Timeline
        </CardTitle>
        <CardDescription>Recent activity and admin actions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {combinedTimeline.map((item, index) => {
            if (item.type === 'admin_event') {
              const event = item.data as UserAdminEvent;
              const Icon = eventIcons[event.eventType] || Activity;
              const colorClass = eventColors[event.eventType] || 'text-muted-foreground bg-gray-100';

              return (
                <div key={`event-${index}`} className="flex gap-4">
                  <div className={`w-10 h-10 rounded-full ${colorClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground">{event.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(event.createdAt)}</p>
                    {event.metadata && (
                      <div className="mt-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {JSON.stringify(event.metadata)}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (item.type === 'user_created') {
              return (
                <div key={`created-${index}`} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground">User account created</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
                  </div>
                </div>
              );
            } else if (item.type === 'site_added') {
              return (
                <div key={`site-${index}`} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-foreground">{item.data.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
                  </div>
                </div>
              );
            } else if (item.type === 'scan_run') {
              const scanData = item.data as { description: string; score?: number; status?: string };
              return (
                <div key={`scan-${index}`} className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-foreground">{scanData.description}</p>
                      {scanData.score && (
                        <Badge variant={scanData.score >= 80 ? 'default' : 'destructive'}>
                          Score: {scanData.score}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(item.date)}</p>
                  </div>
                </div>
              );
            }
            return null;
          })}
        </div>
      </CardContent>
    </Card>
  );
}
