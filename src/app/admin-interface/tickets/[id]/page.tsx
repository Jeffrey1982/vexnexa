export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, User as UserIcon, Shield } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { AdminTicketActions } from "./AdminTicketActions";
import { AdminReplyForm } from "./AdminReplyForm";

// Admin check
async function requireAdmin() {
  const user = await requireAuth();

  const adminEmails = [
    'jeffrey.aay@gmail.com',
    'admin@vexnexa.com'
  ];

  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }

  return user;
}

async function getTicket(ticketId: string) {
  return await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
          company: true,
          plan: true,
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
  params: Promise<{ id: string }> | { id: string };
};

export default async function AdminTicketDetailPage(props: PageProps) {
  // Await params if it's a Promise (Next.js 15+)
  const params = await Promise.resolve(props.params);

  await requireAdmin();
  const ticket = await getTicket(params.id);

  if (!ticket) {
    redirect('/admin-interface');
  }

  const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin-interface" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Interface
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>{ticket.messages.length} messages</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ticket.messages.map((message) => {
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
                            <span className="text-sm text-gray-500">
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

            {/* Admin Reply Form */}
            <AdminReplyForm ticketId={ticket.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Name</div>
                  <div className="font-medium">{userName}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Email</div>
                  <div className="font-medium">{ticket.user.email}</div>
                </div>
                {ticket.user.company && (
                  <div>
                    <div className="text-sm text-gray-600">Company</div>
                    <div className="font-medium">{ticket.user.company}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600">Plan</div>
                  <Badge variant="outline">{ticket.user.plan}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <AdminTicketActions
              ticketId={ticket.id}
              currentStatus={ticket.status}
              currentPriority={ticket.priority}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
