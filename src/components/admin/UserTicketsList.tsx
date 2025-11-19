import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Ticket, ExternalLink } from "lucide-react";
import { formatDate } from "@/lib/format";
import Link from "next/link";
import type { SupportTicket } from "@prisma/client";

interface UserTicketsListProps {
  tickets: (SupportTicket & { _count: { messages: number } })[];
  userId: string;
}

export function UserTicketsList({ tickets, userId }: UserTicketsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ticket className="w-5 h-5" />
          Support Tickets ({tickets.length})
        </CardTitle>
        <CardDescription>User support ticket history</CardDescription>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No support tickets</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Messages</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <TableRow key={ticket.id}>
                  <TableCell className="font-medium max-w-xs truncate">
                    {ticket.subject}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{ticket.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.priority === 'HIGH' ? 'destructive' :
                        ticket.priority === 'MEDIUM' ? 'default' :
                        'outline'
                      }
                    >
                      {ticket.priority}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ticket.status === 'OPEN' ? 'default' :
                        ticket.status === 'IN_PROGRESS' ? 'secondary' :
                        ticket.status === 'RESOLVED' ? 'outline' :
                        'destructive'
                      }
                    >
                      {ticket.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{ticket._count.messages}</TableCell>
                  <TableCell className="text-sm">{formatDate(ticket.updatedAt)}</TableCell>
                  <TableCell>
                    <Link href={`/admin-interface/tickets/${ticket.id}`}>
                      <Button size="sm" variant="ghost">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
