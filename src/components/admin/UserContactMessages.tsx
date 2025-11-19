'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MessageSquare, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/format";
import { convertContactToTicket } from "@/app/actions/admin-user";
import { useRouter } from "next/navigation";
import type { ContactMessage } from "@prisma/client";

interface UserContactMessagesProps {
  contactMessages: ContactMessage[];
  userEmail: string;
}

export function UserContactMessages({ contactMessages, userEmail }: UserContactMessagesProps) {
  const router = useRouter();
  const [converting, setConverting] = useState<string | null>(null);

  const handleConvertToTicket = async (contactId: string) => {
    if (!confirm('Convert this contact message to a support ticket?')) return;

    setConverting(contactId);
    try {
      const result = await convertContactToTicket(contactId);
      if (result.success) {
        alert(`Successfully converted to ticket #${result.ticketId}`);
        router.refresh();
      }
    } catch (error) {
      alert('Failed to convert to ticket');
    } finally {
      setConverting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Contact Messages ({contactMessages.length})
        </CardTitle>
        <CardDescription>Messages from contact form ({userEmail})</CardDescription>
      </CardHeader>
      <CardContent>
        {contactMessages.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No contact messages</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Message Preview</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contactMessages.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell className="text-sm">{formatDate(contact.createdAt)}</TableCell>
                  <TableCell className="font-medium">{contact.name}</TableCell>
                  <TableCell className="max-w-md">
                    <p className="text-sm text-gray-600 truncate">{contact.message}</p>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        contact.status === 'replied' ? 'default' :
                        contact.status === 'read' ? 'secondary' :
                        'outline'
                      }
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {contact.status !== 'replied' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleConvertToTicket(contact.id)}
                        disabled={converting === contact.id}
                      >
                        <ArrowRight className="w-4 h-4 mr-1" />
                        {converting === contact.id ? 'Converting...' : 'To Ticket'}
                      </Button>
                    )}
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
