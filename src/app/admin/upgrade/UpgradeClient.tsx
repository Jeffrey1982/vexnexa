'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PLAN_NAMES } from "@/lib/billing/plans";
import { Search, TrendingUp, CheckCircle, XCircle } from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  plan: string;
  subscriptionStatus: string;
}

export default function AdminUpgradePage() {
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPlan, setNewPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const searchUser = async () => {
    if (!searchEmail.trim()) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/search-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: searchEmail.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setSelectedUser(data.user);
        setNewPlan(data.user.plan);
      } else {
        setMessage({ type: 'error', text: data.error || 'User not found' });
        setSelectedUser(null);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to search user' });
      setSelectedUser(null);
    } finally {
      setLoading(false);
    }
  };

  const upgradePlan = async () => {
    if (!selectedUser || !newPlan) return;

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/upgrade-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          newPlan: newPlan
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully upgraded ${selectedUser.email} to ${PLAN_NAMES[newPlan as keyof typeof PLAN_NAMES]}`
        });
        setSelectedUser(data.user);
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to upgrade user' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upgrade user' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <TrendingUp className="text-blue-500" />
                Manual User Upgrade
              </h1>
              <p className="text-gray-600 mt-1">Search and upgrade user plans manually</p>
            </div>
            
          </div>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ?
                <CheckCircle className="w-4 h-4 text-green-500" /> :
                <XCircle className="w-4 h-4 text-red-500" />
              }
              <AlertDescription className={message.type === 'success' ? 'text-green-700' : 'text-red-700'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* User Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Search User</CardTitle>
            <CardDescription>Enter user email to find and upgrade their plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="user@example.com"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && searchUser()}
                className="flex-1"
              />
              <Button onClick={searchUser} disabled={loading}>
                <Search className="w-4 h-4 mr-2" />
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Details & Upgrade */}
        {selectedUser && (
          <Card>
            <CardHeader>
              <CardTitle>User Details</CardTitle>
              <CardDescription>Current user information and plan upgrade options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-600">Name</label>
                  <div className="text-lg font-semibold">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="text-lg font-semibold">{selectedUser.email}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Company</label>
                  <div className="text-lg font-semibold">{selectedUser.company || 'N/A'}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Current Plan</label>
                  <div>
                    <Badge variant={
                      selectedUser.plan === 'BUSINESS' ? 'default' :
                      selectedUser.plan === 'PRO' ? 'secondary' :
                      selectedUser.plan === 'STARTER' ? 'outline' : 'destructive'
                    }>
                      {PLAN_NAMES[selectedUser.plan as keyof typeof PLAN_NAMES]}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Plan Upgrade */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold mb-4">Upgrade Plan</h4>
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Plan
                    </label>
                    <Select value={newPlan} onValueChange={setNewPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="TRIAL">
                          <div className="flex items-center gap-2">
                            <Badge variant="destructive">Trial</Badge>
                            <span>- Free trial with limitations</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="STARTER">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">Starter</Badge>
                            <span>- €19/month - Basic features</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="PRO">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">Pro</Badge>
                            <span>- €49/month - Advanced features</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="BUSINESS">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">Business</Badge>
                            <span>- €149/month - All features + White label</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={upgradePlan}
                    disabled={loading || !newPlan || newPlan === selectedUser.plan}
                    size="lg"
                  >
                    {loading ? 'Upgrading...' : 'Upgrade Plan'}
                  </Button>
                </div>

                {newPlan && newPlan !== selectedUser.plan && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> This will immediately upgrade the user to {PLAN_NAMES[newPlan as keyof typeof PLAN_NAMES]} and
                      set their subscription status to &apos;active&apos;. They will gain access to all features of the new plan.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}