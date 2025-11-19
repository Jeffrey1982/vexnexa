'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, Mail, X, MessageSquare } from "lucide-react";
import { formatDate } from "@/lib/format";
import { convertContactToTicket } from "@/app/actions/admin-user";
import { useRouter } from "next/navigation";
import type { ContactMessage } from "@prisma/client";

interface ContactMessagesTableProps {
  messages: ContactMessage[];
}

export function ContactMessagesTable({ messages }: ContactMessagesTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [converting, setConverting] = useState(false);

  // Filter messages
  const filteredMessages = useMemo(() => {
    let filtered = messages;

    // Status filter
    if (statusFilter === 'replied') {
      filtered = filtered.filter(m => m.replied);
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(m => !m.replied);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query) ||
        m.message.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [messages, searchQuery, statusFilter]);

  const handleViewMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    setViewDialogOpen(true);
  };

  const handleConvertToTicket = (message: ContactMessage) => {
    setSelectedMessage(message);
    setConvertDialogOpen(true);
  };

  const handleConfirmConvert = async () => {
    if (!selectedMessage) return;

    setConverting(true);
    try {
      await convertContactToTicket(selectedMessage.id);
      alert('Contact message converted to support ticket successfully!');
      setConvertDialogOpen(false);
      setSelectedMessage(null);
      router.refresh();
    } catch (error) {
      alert('Failed to convert message: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setConverting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Contact Messages</CardTitle>
          <CardDescription>
            {filteredMessages.length} of {messages.length} messages
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or message..."
                className="pl-10"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Messages</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Messages Table */}
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages found</h3>
              <p className="text-gray-600">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No contact form submissions yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Message Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(message.createdAt)}
                      </TableCell>
                      <TableCell className="font-medium">{message.name}</TableCell>
                      <TableCell className="text-sm">{message.email}</TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {message.message}
                      </TableCell>
                      <TableCell>
                        {message.replied ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Replied
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewMessage(message)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {!message.replied && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConvertToTicket(message)}
                            >
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Convert
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Message Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message Details</DialogTitle>
            <DialogDescription>
              Received on {selectedMessage && formatDate(selectedMessage.createdAt)}
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-600">Name</Label>
                  <p className="font-medium mt-1">{selectedMessage.name}</p>
                </div>
                <div>
                  <Label className="text-gray-600">Email</Label>
                  <p className="font-medium mt-1">{selectedMessage.email}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Message</Label>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="whitespace-pre-wrap text-sm">{selectedMessage.message}</p>
                </div>
              </div>
              <div>
                <Label className="text-gray-600">Status</Label>
                <div className="mt-1">
                  {selectedMessage.replied ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Replied
                    </Badge>
                  ) : (
                    <Badge variant="outline">Not replied yet</Badge>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            {selectedMessage && !selectedMessage.replied && (
              <Button onClick={() => {
                setViewDialogOpen(false);
                handleConvertToTicket(selectedMessage);
              }}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Convert to Ticket
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Ticket Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Support Ticket</DialogTitle>
            <DialogDescription>
              Create a support ticket from this contact message. The message sender will be found or created as a user.
            </DialogDescription>
          </DialogHeader>
          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <Label>From</Label>
                <p className="text-sm mt-1">
                  {selectedMessage.name} ({selectedMessage.email})
                </p>
              </div>
              <div>
                <Label>Message Preview</Label>
                <div className="mt-1 p-3 bg-gray-50 rounded border text-sm">
                  {selectedMessage.message.substring(0, 200)}
                  {selectedMessage.message.length > 200 && '...'}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmConvert} disabled={converting}>
              {converting ? 'Converting...' : 'Convert to Ticket'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
