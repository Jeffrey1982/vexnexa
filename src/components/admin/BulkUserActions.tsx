'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  CheckSquare,
  Square,
  Mail,
  CreditCard,
  TrendingUp,
  Download,
  Upload,
  Loader2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  plan: string;
  subscriptionStatus: string;
  createdAt: Date | string;
}

interface BulkUserActionsProps {
  users: User[];
}

export function BulkUserActions({ users }: BulkUserActionsProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  const handleBulkEmail = async () => {
    if (selectedUsers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No users selected',
        description: 'Please select at least one user to send emails.'
      });
      return;
    }

    const subject = prompt('Enter email subject:');
    if (!subject) return;

    const message = prompt('Enter email message:');
    if (!message) return;

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          subject,
          message
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Emails sent successfully',
          description: `Sent to ${data.sent} users`
        });
        setSelectedUsers(new Set());
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to send emails',
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkPlanChange = async () => {
    if (selectedUsers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No users selected'
      });
      return;
    }

    const newPlan = prompt('Enter new plan (TRIAL, STARTER, PRO, BUSINESS):');
    if (!newPlan || !['TRIAL', 'STARTER', 'PRO', 'BUSINESS'].includes(newPlan)) {
      toast({
        variant: 'destructive',
        title: 'Invalid plan',
        description: 'Must be TRIAL, STARTER, PRO, or BUSINESS'
      });
      return;
    }

    if (!confirm(`Change ${selectedUsers.size} user(s) to ${newPlan} plan?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/bulk-plan-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          newPlan
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Plans updated successfully',
          description: `Updated ${data.updated} users to ${newPlan}`
        });
        setSelectedUsers(new Set());
        window.location.reload();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to update plans',
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCredit = async () => {
    if (selectedUsers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No users selected'
      });
      return;
    }

    const amount = prompt('Enter credit amount (e.g., 10 for $10):');
    if (!amount || isNaN(parseFloat(amount))) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount'
      });
      return;
    }

    const note = prompt('Enter credit note (reason):') || 'Bulk credit applied';

    if (!confirm(`Apply $${amount} credit to ${selectedUsers.size} user(s)?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch('/api/admin/bulk-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIds: Array.from(selectedUsers),
          amount: parseFloat(amount),
          note
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Credits applied successfully',
          description: `Applied $${amount} credit to ${data.applied} users`
        });
        setSelectedUsers(new Set());
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Failed to apply credits',
        description: error.message
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportCSV = () => {
    if (selectedUsers.size === 0) {
      toast({
        variant: 'destructive',
        title: 'No users selected'
      });
      return;
    }

    const selectedData = users.filter(u => selectedUsers.has(u.id));
    const csv = [
      ['Email', 'First Name', 'Last Name', 'Plan', 'Status', 'Created At'].join(','),
      ...selectedData.map(u => [
        u.email,
        u.firstName || '',
        u.lastName || '',
        u.plan,
        u.subscriptionStatus,
        new Date(u.createdAt).toISOString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export successful',
      description: `Exported ${selectedUsers.size} users to CSV`
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              {selectedUsers.size > 0
                ? `${selectedUsers.size} user(s) selected`
                : 'Select users to perform bulk actions'}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
          >
            {selectedUsers.size === users.length ? (
              <>
                <Square className="w-4 h-4 mr-2" />
                Deselect All
              </>
            ) : (
              <>
                <CheckSquare className="w-4 h-4 mr-2" />
                Select All
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6 pb-6 border-b">
          <Button
            onClick={handleBulkEmail}
            disabled={selectedUsers.size === 0 || isProcessing}
            variant="outline"
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Mail className="w-4 h-4 mr-2" />
            )}
            Send Email
          </Button>

          <Button
            onClick={handleBulkPlanChange}
            disabled={selectedUsers.size === 0 || isProcessing}
            variant="outline"
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Change Plan
          </Button>

          <Button
            onClick={handleBulkCredit}
            disabled={selectedUsers.size === 0 || isProcessing}
            variant="outline"
            size="sm"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CreditCard className="w-4 h-4 mr-2" />
            )}
            Apply Credit
          </Button>

          <Button
            onClick={handleExportCSV}
            disabled={selectedUsers.size === 0}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* User List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {users.map((user) => {
            const isSelected = selectedUsers.has(user.id);
            const userName = user.firstName && user.lastName
              ? `${user.firstName} ${user.lastName}`
              : user.email;

            return (
              <div
                key={user.id}
                className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                role="button"
                tabIndex={0}
                onClick={() => toggleUser(user.id)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleUser(user.id); } }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{userName}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{user.plan}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      user.subscriptionStatus === 'active'
                        ? 'border-green-500 text-green-600'
                        : user.subscriptionStatus === 'trialing'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-gray-500 text-muted-foreground'
                    }
                  >
                    {user.subscriptionStatus}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
