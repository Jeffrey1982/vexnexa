export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Ticket, MessageSquare } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import DashboardNav from "@/components/dashboard/DashboardNav";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

async function getUserTickets(userId: string) {
  return await prisma.supportTicket.findMany({
    where: { userId },
    include: {
      _count: {
        select: { messages: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
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

export default async function SupportPage() {
  let user;
  try {
    user = await requireAuth();
  } catch {
    redirect("/auth/login?redirect=/dashboard/support");
  }
  const tickets = await getUserTickets(user.id);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardNav user={user} />
      <div className="flex-1">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <Ticket className="text-primary" />
                Support Tickets
              </h1>
              <p className="text-muted-foreground mt-1">View and manage your support requests</p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard">
                <Button variant="outline">← Back to Dashboard</Button>
              </Link>
              <Link href="/dashboard/support/new">
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  New Ticket
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <Card>
          <CardHeader>
            <CardTitle>My Tickets</CardTitle>
            <CardDescription>All your support tickets in one place</CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-12">
                <Ticket className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No tickets yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first support ticket to get help from our team
                </p>
                <Link href="/dashboard/support/new">
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Ticket
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket) => (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">{ticket.subject}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getCategoryDisplay(ticket.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {ticket.status.replace(/_/g, ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span>{ticket._count.messages}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(ticket.updatedAt)}
                        </TableCell>
                        <TableCell>
                          <Link href={`/dashboard/support/${ticket.id}`}>
                            <Button size="sm" variant="outline">
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
      </div>
      </div>
      <DashboardFooter />
    </div>
  );
}
