'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, FileText, MessageSquare, Mail, Settings } from "lucide-react";
import { changeUserPlan, changeUserStatus, addAdminNote, createTicketForUser, sendEmailToUser } from "@/app/actions/admin-user";
import { useRouter } from "next/navigation";
import type { Plan } from "@prisma/client";

interface AdminUserActionsProps {
  userId: string;
  currentPlan: Plan;
  currentStatus: string;
}

export function AdminUserActions({ userId, currentPlan, currentStatus }: AdminUserActionsProps) {
  const router = useRouter();
  const [changePlanOpen, setChangePlanOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [createTicketOpen, setCreateTicketOpen] = useState(false);
  const [sendEmailOpen, setSendEmailOpen] = useState(false);

  const [newPlan, setNewPlan] = useState<Plan>(currentPlan);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'GENERAL' | 'BILLING' | 'TECHNICAL' | 'FEATURE_REQUEST' | 'BUG_REPORT'>('GENERAL');
  const [ticketPriority, setTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  const [loading, setLoading] = useState(false);

  const handleChangePlan = async () => {
    if (!confirm(`Change plan to ${newPlan}?`)) return;
    setLoading(true);
    try {
      await changeUserPlan(userId, newPlan);
      setChangePlanOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to change plan');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!confirm(`Change status to ${newStatus}?`)) return;
    setLoading(true);
    try {
      await changeUserStatus(userId, newStatus);
      setChangeStatusOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to change status');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setLoading(true);
    try {
      await addAdminNote(userId, note);
      setNote('');
      setAddNoteOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketSubject.trim() || !ticketMessage.trim()) {
      alert('Subject and message are required');
      return;
    }
    setLoading(true);
    try {
      const result = await createTicketForUser(userId, ticketSubject, ticketMessage, ticketCategory, ticketPriority);
      setTicketSubject('');
      setTicketMessage('');
      setCreateTicketOpen(false);
      alert(`Ticket created successfully! ID: ${result.ticketId}`);
      router.refresh();
    } catch (error) {
      alert('Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      alert('Subject and message are required');
      return;
    }
    setLoading(true);
    try {
      const result = await sendEmailToUser(userId, emailSubject, emailMessage);
      alert(result.message);
      setEmailSubject('');
      setEmailMessage('');
      setSendEmailOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to send email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Admin Actions
        </CardTitle>
        <CardDescription>Perform administrative actions on this user account</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          {/* Change Plan */}
          <Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Change Plan
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change User Plan</DialogTitle>
                <DialogDescription>
                  Change the subscription plan for this user. Current plan: {currentPlan}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>New Plan</Label>
                  <Select value={newPlan} onValueChange={(value) => setNewPlan(value as Plan)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRIAL">Trial</SelectItem>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="BUSINESS">Business</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChangePlanOpen(false)}>Cancel</Button>
                <Button onClick={handleChangePlan} disabled={loading}>
                  {loading ? 'Changing...' : 'Change Plan'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Change Status */}
          <Dialog open={changeStatusOpen} onOpenChange={setChangeStatusOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Settings className="w-4 h-4" />
                Change Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Subscription Status</DialogTitle>
                <DialogDescription>
                  Change the subscription status. Current status: {currentStatus}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>New Status</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trialing">Trialing</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChangeStatusOpen(false)}>Cancel</Button>
                <Button onClick={handleChangeStatus} disabled={loading}>
                  {loading ? 'Changing...' : 'Change Status'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Note */}
          <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <FileText className="w-4 h-4" />
                Add Note
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Admin Note</DialogTitle>
                <DialogDescription>
                  Add an internal note about this user (not visible to the user)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Note</Label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Enter your note..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddNoteOpen(false)}>Cancel</Button>
                <Button onClick={handleAddNote} disabled={loading || !note.trim()}>
                  {loading ? 'Adding...' : 'Add Note'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Ticket */}
          <Dialog open={createTicketOpen} onOpenChange={setCreateTicketOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                Create Ticket
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>
                  Create a support ticket on behalf of this user
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={ticketSubject}
                    onChange={(e) => setTicketSubject(e.target.value)}
                    placeholder="Ticket subject..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={ticketCategory} onValueChange={(value: any) => setTicketCategory(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GENERAL">General</SelectItem>
                        <SelectItem value="BILLING">Billing</SelectItem>
                        <SelectItem value="TECHNICAL">Technical</SelectItem>
                        <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                        <SelectItem value="BUG_REPORT">Bug Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Priority</Label>
                    <Select value={ticketPriority} onValueChange={(value: any) => setTicketPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low</SelectItem>
                        <SelectItem value="MEDIUM">Medium</SelectItem>
                        <SelectItem value="HIGH">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={ticketMessage}
                    onChange={(e) => setTicketMessage(e.target.value)}
                    placeholder="Ticket message..."
                    rows={6}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateTicketOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateTicket} disabled={loading || !ticketSubject.trim() || !ticketMessage.trim()}>
                  {loading ? 'Creating...' : 'Create Ticket'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Send Email */}
          <Dialog open={sendEmailOpen} onOpenChange={setSendEmailOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Mail className="w-4 h-4" />
                Send Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Send Email to User</DialogTitle>
                <DialogDescription>
                  Send an email to this user (placeholder - implement with your email service)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email subject..."
                  />
                </div>
                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Email message..."
                    rows={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSendEmailOpen(false)}>Cancel</Button>
                <Button onClick={handleSendEmail} disabled={loading || !emailSubject.trim() || !emailMessage.trim()}>
                  {loading ? 'Sending...' : 'Send Email'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
