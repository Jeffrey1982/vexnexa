export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { TicketReplyForm } from "./TicketReplyForm";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

async function getTicket(ticketId: string, userId: string) {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      messages: {
        include: {
          senderUser: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  // Check if user owns this ticket
  if (ticket.userId !== userId) {
    return null;
  }

  return ticket;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800';
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-800';
    case 'LOW':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getCategoryDisplay(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

type PageProps = {
  params: Promise<{ ticketId: string }> | { ticketId: string };
};

export default async function TicketDetailPage(props: PageProps) {
  // Await params if it's a Promise (Next.js 15+)
  const params = await Promise.resolve(props.params);

  const user = await requireAuth();
  const ticket = await getTicket(params.ticketId, user.id);

  if (!ticket) {
    redirect('/dashboard/support');
  }

  const canReply = ticket.status !== 'CLOSED';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/support" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Tickets
          </Link>
        </div>

        {/* Ticket Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl">{ticket.subject}</CardTitle>
                <CardDescription className="mt-2 flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Created {formatDate(ticket.createdAt)}
                  </span>
                  <span>•</span>
                  <span>Last updated {formatDate(ticket.updatedAt)}</span>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status.replace(/_/g, ' ')}
              </Badge>
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority} Priority
              </Badge>
              <Badge variant="outline">
                {getCategoryDisplay(ticket.category)}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Conversation</CardTitle>
            <CardDescription>{ticket.messages.length} messages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ticket.messages.map((message, index) => {
                const isAdmin = message.senderType === 'ADMIN';
                const senderName = message.senderUser
                  ? `${message.senderUser.firstName || ''} ${message.senderUser.lastName || ''}`.trim() || message.senderUser.email
                  : 'System';

                return (
                  <div
                    key={message.id}
                    className={`flex gap-4 ${isAdmin ? 'bg-blue-50' : 'bg-white'} p-4 rounded-lg border ${
                      isAdmin ? 'border-blue-200' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isAdmin ? 'bg-blue-600' : 'bg-gray-600'
                      }`}>
                        {isAdmin ? (
                          <Shield className="w-5 h-5 text-white" />
                        ) : (
                          <UserIcon className="w-5 h-5 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-2">
                        <span className="font-semibold text-gray-900">
                          {isAdmin ? 'Support Team' : senderName}
                        </span>
                        {isAdmin && (
                          <Badge variant="secondary" className="text-xs">
                            Admin
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap break-words">
                        {message.message}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reply Form */}
        {canReply ? (
          <TicketReplyForm ticketId={ticket.id} />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              This ticket is closed and cannot receive new messages.
            </CardContent>
          </Card>
        )}
      </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
