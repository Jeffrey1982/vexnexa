'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, FileText, MessageSquare, Mail, Settings, Ban, UserX, PlayCircle, Trash2 } from "lucide-react";
import { changeUserPlan, changeUserStatus, addAdminNote, createTicketForUser, sendEmailToUser, suspendUser, reactivateUser, deleteUser } from "@/app/actions/admin-user";
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
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [newPlan, setNewPlan] = useState<Plan>(currentPlan);
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [note, setNote] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketCategory, setTicketCategory] = useState<'GENERAL' | 'BILLING' | 'TECHNICAL' | 'FEATURE_REQUEST' | 'BUG_REPORT'>('GENERAL');
  const [ticketPriority, setTicketPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<'temporary' | 'permanent'>('temporary');
  const [reactivateReason, setReactivateReason] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const [loading, setLoading] = useState(false);

  const isSuspended = currentStatus === 'suspended';

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

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      alert('Reason is required');
      return;
    }
    if (!confirm(`${suspendDuration === 'permanent' ? 'Permanently ban' : 'Suspend'} this user account?`)) return;
    setLoading(true);
    try {
      await suspendUser(userId, suspendReason, suspendDuration);
      alert('User account suspended successfully');
      setSuspendReason('');
      setSuspendOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to suspend user');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async () => {
    if (!confirm('Reactivate this user account?')) return;
    setLoading(true);
    try {
      await reactivateUser(userId, reactivateReason);
      alert('User account reactivated successfully');
      setReactivateReason('');
      setReactivateOpen(false);
      router.refresh();
    } catch (error) {
      alert('Failed to reactivate user');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      alert('Reason is required');
      return;
    }
    if (!confirm('⚠️ DANGER: This will permanently delete this user account and all related data. This action CANNOT be undone. Are you absolutely sure?')) return;
    if (!confirm('Type YES to confirm deletion (this is your final warning)')) return;
    setLoading(true);
    try {
      await deleteUser(userId, deleteReason);
      alert('User account deleted successfully');
      router.push('/admin/users');
    } catch (error) {
      alert('Failed to delete user: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
                  Send an email to this user
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

          {/* Suspend/Ban User */}
          {!isSuspended && (
            <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Ban className="w-4 h-4" />
                  Suspend User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Suspend User Account</DialogTitle>
                  <DialogDescription>
                    Suspend or permanently ban this user account. They will lose access immediately.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Duration</Label>
                    <Select value={suspendDuration} onValueChange={(value: any) => setSuspendDuration(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="temporary">Temporary Suspension</SelectItem>
                        <SelectItem value="permanent">Permanent Ban</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Reason *</Label>
                    <Textarea
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="e.g., Terms of service violation, payment fraud, etc."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSuspendOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleSuspend} disabled={loading || !suspendReason.trim()}>
                    {loading ? 'Suspending...' : `${suspendDuration === 'permanent' ? 'Ban' : 'Suspend'} User`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Reactivate User */}
          {isSuspended && (
            <Dialog open={reactivateOpen} onOpenChange={setReactivateOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2">
                  <PlayCircle className="w-4 h-4" />
                  Reactivate User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reactivate User Account</DialogTitle>
                  <DialogDescription>
                    Restore access to this suspended user account.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Reason (Optional)</Label>
                    <Textarea
                      value={reactivateReason}
                      onChange={(e) => setReactivateReason(e.target.value)}
                      placeholder="e.g., Issue resolved, payment received, etc."
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setReactivateOpen(false)}>Cancel</Button>
                  <Button onClick={handleReactivate} disabled={loading}>
                    {loading ? 'Reactivating...' : 'Reactivate User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete User */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" className="gap-2">
                <Trash2 className="w-4 h-4" />
                Delete User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="text-red-600">⚠️ Danger Zone - Delete User</DialogTitle>
                <DialogDescription>
                  This will <strong>permanently delete</strong> this user account and ALL related data including sites, scans, tickets, and payments. This action <strong>CANNOT be undone</strong>.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800 font-medium">What will be deleted:</p>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    <li>• User account and profile</li>
                    <li>• All websites and scans</li>
                    <li>• Support tickets and messages</li>
                    <li>• Admin notes and events</li>
                    <li>• Mollie subscription (if active)</li>
                  </ul>
                </div>
                <div>
                  <Label>Reason for Deletion *</Label>
                  <Textarea
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="e.g., User requested account deletion, GDPR compliance, etc."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={loading || !deleteReason.trim()}>
                  {loading ? 'Deleting...' : 'Permanently Delete User'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
