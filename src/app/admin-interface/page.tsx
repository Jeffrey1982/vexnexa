export const dynamic = 'force-dynamic';

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, MessageSquare, Plus, Settings, BookOpen, Download } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/format";
import { AdminNav } from "@/components/admin/AdminNav";
import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminEmptyState,
  AdminTableShell,
  AdminContentTabs,
  type KpiCardData,
  type TabItem,
} from "@/components/admin/layout";
import { AdminInterfaceFiltersClient } from "./AdminInterfaceFiltersClient";
import { CreateTestTicketButtonInterface } from "./CreateTestTicketButtonInterface";

// Admin check
async function requireAdmin() {
  try {
    const user = await requireAuth();

    // Check if user is admin
    const adminEmails = [
      'jeffrey.aay@gmail.com',
      'admin@vexnexa.com'
    ];

    if (!adminEmails.includes(user.email) && !user.isAdmin) {
      redirect('/dashboard');
    }

    return user;
  } catch (error) {
    console.error('Admin auth error:', error);
    redirect('/auth/login');
  }
}

async function getAllTickets(filters?: {
  status?: string;
  priority?: string;
}) {
  try {
    const where: any = {};

    if (filters?.status && filters.status !== 'all') {
      where.status = filters.status;
    }

    if (filters?.priority && filters.priority !== 'all') {
      where.priority = filters.priority;
    }

    return await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return [];
  }
}

async function getTicketStats() {
  try {
    const [total, open, inProgress, resolved, closed] = await Promise.all([
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ]);

    return { total, open, inProgress, resolved, closed };
  } catch (error) {
    console.error('Error fetching stats:', error);
    return { total: 0, open: 0, inProgress: 0, resolved: 0, closed: 0 };
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800 border-gray-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'MEDIUM':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'LOW':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
}

function getCategoryDisplay(category: string) {
  return category.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
}

type PageProps = {
  searchParams: Promise<{ status?: string; priority?: string }> | { status?: string; priority?: string };
};

export default async function AdminInterfacePage(props: PageProps) {
  const searchParams = await Promise.resolve(props.searchParams);
  const user = await requireAdmin();

  const stats = await getTicketStats();
  const allTickets = await getAllTickets();
  const filteredTickets = await getAllTickets({
    status: searchParams.status,
    priority: searchParams.priority,
  });

  // Prepare KPI data with emphasis on Open tickets
  const kpis: KpiCardData[] = [
    {
      label: "Open Tickets",
      value: stats.open,
      valueColor: "text-blue-600",
      primary: true,
      subtitle: "Requires attention",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      valueColor: "text-yellow-600",
    },
    {
      label: "Resolved",
      value: stats.resolved,
      valueColor: "text-green-600",
    },
    {
      label: "Closed",
      value: stats.closed,
      valueColor: "text-gray-600",
    },
    {
      label: "Total",
      value: stats.total,
      valueColor: "text-gray-900",
    },
  ];

  // Filter tickets by status for tabs
  const openTickets = allTickets.filter(t => t.status === 'OPEN');
  const inProgressTickets = allTickets.filter(t => t.status === 'IN_PROGRESS');
  const resolvedTickets = allTickets.filter(t => t.status === 'RESOLVED');
  const closedTickets = allTickets.filter(t => t.status === 'CLOSED');

  // Render ticket table
  const renderTicketTable = (tickets: typeof allTickets) => {
    if (tickets.length === 0) {
      return (
        <AdminEmptyState
          icon={Ticket}
          title="No support tickets yet"
          description={
            <div className="space-y-2">
              <p>Support tickets help you track and resolve customer issues efficiently.</p>
              <p className="text-sm">Each ticket includes customer details, priority level, and conversation history.</p>
            </div>
          }
          actions={[
            {
              label: "Create Test Ticket",
              variant: "default",
              icon: Plus,
              onClick: () => {},
            },
            {
              label: "View Settings",
              variant: "outline",
              icon: Settings,
              href: "/admin/settings",
            },
            {
              label: "Learn More",
              variant: "ghost",
              icon: BookOpen,
              href: "/docs/support",
            },
          ]}
          helpText={
            <p>
              You can also import existing tickets from your previous support system or
              integrate with popular helpdesk platforms.
            </p>
          }
        />
      );
    }

    return (
      <div className="rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead className="font-semibold">User</TableHead>
              <TableHead className="font-semibold">Subject</TableHead>
              <TableHead className="font-semibold">Category</TableHead>
              <TableHead className="font-semibold">Priority</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Messages</TableHead>
              <TableHead className="font-semibold">Updated</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const userName = `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email;

              return (
                <TableRow key={ticket.id} className="hover:bg-gray-50/50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{userName}</div>
                      <div className="text-sm text-gray-500">{ticket.user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs">
                    <div className="truncate" title={ticket.subject}>
                      {ticket.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border">
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
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">{ticket._count.messages}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {formatDate(ticket.updatedAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/admin-interface/tickets/${ticket.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200"
                      >
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  // Prepare tab data
  const tabs: TabItem[] = [
    {
      value: "all",
      label: "All Tickets",
      count: allTickets.length,
      content: (
        <AdminTableShell
          title="All Support Tickets"
          description={`${allTickets.length} total ticket${allTickets.length !== 1 ? 's' : ''}`}
          actions={
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
          }
          dense
        >
          {renderTicketTable(allTickets)}
        </AdminTableShell>
      ),
    },
    {
      value: "open",
      label: "Open",
      count: openTickets.length,
      content: (
        <AdminTableShell
          title="Open Tickets"
          description={`${openTickets.length} ticket${openTickets.length !== 1 ? 's' : ''} awaiting response`}
          dense
        >
          {renderTicketTable(openTickets)}
        </AdminTableShell>
      ),
    },
    {
      value: "in_progress",
      label: "In Progress",
      count: inProgressTickets.length,
      content: (
        <AdminTableShell
          title="In Progress Tickets"
          description={`${inProgressTickets.length} ticket${inProgressTickets.length !== 1 ? 's' : ''} being worked on`}
          dense
        >
          {renderTicketTable(inProgressTickets)}
        </AdminTableShell>
      ),
    },
    {
      value: "resolved",
      label: "Resolved",
      count: resolvedTickets.length,
      content: (
        <AdminTableShell
          title="Resolved Tickets"
          description={`${resolvedTickets.length} ticket${resolvedTickets.length !== 1 ? 's' : ''} marked as resolved`}
          dense
        >
          {renderTicketTable(resolvedTickets)}
        </AdminTableShell>
      ),
    },
    {
      value: "closed",
      label: "Closed",
      count: closedTickets.length,
      content: (
        <AdminTableShell
          title="Closed Tickets"
          description={`${closedTickets.length} ticket${closedTickets.length !== 1 ? 's' : ''} completed`}
          dense
        >
          {renderTicketTable(closedTickets)}
        </AdminTableShell>
      ),
    },
  ];

  const hasActiveFilters = !!(searchParams.status || searchParams.priority);

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />

      <div className="max-w-7xl mx-auto">
        <AdminPageShell>
          {/* Page Header with Actions */}
          <AdminPageHeader
            title="Support Tickets"
            subtitle="Manage and respond to customer support requests"
            icon={Ticket}
            actions={
              <>
                <CreateTestTicketButtonInterface />
                <Button variant="outline" className="gap-2">
                  <Settings className="w-4 h-4" />
                  Settings
                </Button>
              </>
            }
          />

          {/* KPI Grid */}
          <AdminKpiGrid kpis={kpis} columns={5} />

          {/* Filters (collapsed when no tickets) */}
          <AdminInterfaceFiltersClient
            hasActiveFilters={hasActiveFilters}
            autoCollapse={allTickets.length === 0}
            currentStatus={searchParams.status}
            currentPriority={searchParams.priority}
          />

          {/* Content Tabs */}
          <AdminContentTabs tabs={tabs} defaultValue="all" />
        </AdminPageShell>
      </div>
    </div>
  );
}
