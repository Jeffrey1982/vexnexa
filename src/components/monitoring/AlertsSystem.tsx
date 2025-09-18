"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bell,
  Mail,
  MessageSquare,
  Webhook,
  Settings,
  Plus,
  Trash2,
  Edit,
  Clock,
  CheckCircle,
  AlertTriangle,
  Send
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  triggers: {
    scoreDropThreshold: number;
    newViolationsThreshold: number;
    complianceThreshold: number;
    severityLevels: string[];
  };
  channels: {
    email: boolean;
    inApp: boolean;
    webhook: boolean;
    slack: boolean;
  };
  recipients: {
    emails: string[];
    webhookUrl?: string;
    slackWebhook?: string;
  };
  cooldownMinutes: number;
  lastTriggered?: Date;
  totalAlertsSent: number;
}

interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: Date;
  message: string;
  channels: string[];
  successful: boolean;
  errorMessage?: string;
}

interface AlertsSystemProps {
  className?: string;
}

export function AlertsSystem({ className }: AlertsSystemProps) {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [alertHistory, setAlertHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [testingRule, setTestingRule] = useState<string | null>(null);

  const [newRule, setNewRule] = useState<Partial<AlertRule>>({
    name: '',
    description: '',
    enabled: true,
    triggers: {
      scoreDropThreshold: 15,
      newViolationsThreshold: 10,
      complianceThreshold: 70,
      severityLevels: ['major', 'critical']
    },
    channels: {
      email: true,
      inApp: true,
      webhook: false,
      slack: false
    },
    recipients: {
      emails: []
    },
    cooldownMinutes: 60
  });

  useEffect(() => {
    fetchAlertData();
  }, []);

  const fetchAlertData = async () => {
    try {
      const [rulesResponse, historyResponse] = await Promise.all([
        fetch('/api/monitoring/alerts/rules'),
        fetch('/api/monitoring/alerts/history')
      ]);

      if (rulesResponse.ok) {
        const rulesData = await rulesResponse.json();
        setAlertRules(rulesData.rules);
      }

      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setAlertHistory(historyData.history);
      }
    } catch (error) {
      console.error('Failed to fetch alert data:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveAlertRule = async (rule: Partial<AlertRule>) => {
    try {
      const response = await fetch('/api/monitoring/alerts/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rule)
      });

      if (response.ok) {
        await fetchAlertData();
        setNewRule({
          name: '',
          description: '',
          enabled: true,
          triggers: {
            scoreDropThreshold: 15,
            newViolationsThreshold: 10,
            complianceThreshold: 70,
            severityLevels: ['major', 'critical']
          },
          channels: {
            email: true,
            inApp: true,
            webhook: false,
            slack: false
          },
          recipients: {
            emails: []
          },
          cooldownMinutes: 60
        });
      }
    } catch (error) {
      console.error('Failed to save alert rule:', error);
    }
  };

  const updateAlertRule = async (id: string, updates: Partial<AlertRule>) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/rules/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        await fetchAlertData();
        setEditingRule(null);
      }
    } catch (error) {
      console.error('Failed to update alert rule:', error);
    }
  };

  const deleteAlertRule = async (id: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/rules/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchAlertData();
      }
    } catch (error) {
      console.error('Failed to delete alert rule:', error);
    }
  };

  const testAlertRule = async (id: string) => {
    setTestingRule(id);
    try {
      const response = await fetch(`/api/monitoring/alerts/test/${id}`, {
        method: 'POST'
      });

      if (response.ok) {
        await fetchAlertData();
      }
    } catch (error) {
      console.error('Failed to test alert rule:', error);
    } finally {
      setTestingRule(null);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'inApp': return <Bell className="w-4 h-4" />;
      case 'webhook': return <Webhook className="w-4 h-4" />;
      case 'slack': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  if (loading) {
    return (
      <div className={cn("space-y-6", className)}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Alert Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Rules</p>
                <p className="text-2xl font-bold text-blue-600">
                  {alertRules.filter(rule => rule.enabled).length}
                </p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alerts Today</p>
                <p className="text-2xl font-bold text-green-600">
                  {alertHistory.filter(alert =>
                    new Date(alert.triggeredAt).toDateString() === new Date().toDateString()
                  ).length}
                </p>
              </div>
              <Send className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {alertHistory.length > 0
                    ? Math.round((alertHistory.filter(alert => alert.successful).length / alertHistory.length) * 100)
                    : 0}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Failed Alerts</p>
                <p className="text-2xl font-bold text-red-600">
                  {alertHistory.filter(alert => !alert.successful).length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alert Rules Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            Alert Rules
          </CardTitle>
          <CardDescription>
            Configure automated alerts for accessibility regressions and compliance issues
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertRules.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Alert Rules Configured</h3>
              <p className="text-muted-foreground mb-6">
                Create your first alert rule to get notified about accessibility regressions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">{rule.name}</h4>
                        <Badge variant={rule.enabled ? "default" : "secondary"}>
                          {rule.enabled ? "Active" : "Disabled"}
                        </Badge>
                        {rule.lastTriggered && (
                          <Badge variant="outline" className="text-xs">
                            Last: {formatTimestamp(rule.lastTriggered)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {rule.description}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Score drop: ≥{rule.triggers.scoreDropThreshold}pts</span>
                        <span>New violations: ≥{rule.triggers.newViolationsThreshold}</span>
                        <span>Compliance: <{rule.triggers.complianceThreshold}%</span>
                        <span>Cooldown: {rule.cooldownMinutes}min</span>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        {Object.entries(rule.channels)
                          .filter(([_, enabled]) => enabled)
                          .map(([channel]) => (
                            <div key={channel} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {getChannelIcon(channel)}
                              <span className="capitalize">{channel}</span>
                            </div>
                          ))
                        }
                      </div>

                      {rule.totalAlertsSent > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {rule.totalAlertsSent} alert{rule.totalAlertsSent > 1 ? 's' : ''} sent
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => testAlertRule(rule.id)}
                        disabled={testingRule === rule.id}
                        className="text-xs"
                      >
                        {testingRule === rule.id ? 'Testing...' : 'Test'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRule(rule)}
                        className="text-xs"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteAlertRule(rule.id)}
                        className="text-xs text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Create New Rule Form */}
          <div className="mt-8 p-4 border rounded-lg bg-muted/30">
            <h4 className="font-medium mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New Alert Rule
            </h4>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ruleName">Rule Name</Label>
                <Input
                  id="ruleName"
                  value={newRule.name}
                  onChange={(e) => setNewRule(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Critical Regression Alerts"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cooldown">Cooldown (minutes)</Label>
                <Input
                  id="cooldown"
                  type="number"
                  value={newRule.cooldownMinutes}
                  onChange={(e) => setNewRule(prev => ({ ...prev, cooldownMinutes: parseInt(e.target.value) }))}
                  min="5"
                  max="1440"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRule.description}
                  onChange={(e) => setNewRule(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Notify team when critical accessibility regressions are detected"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Score Drop Threshold</Label>
                <Input
                  type="number"
                  value={newRule.triggers?.scoreDropThreshold}
                  onChange={(e) => setNewRule(prev => ({
                    ...prev,
                    triggers: { ...prev.triggers!, scoreDropThreshold: parseInt(e.target.value) }
                  }))}
                  min="1"
                  max="50"
                />
              </div>

              <div className="space-y-2">
                <Label>New Violations Threshold</Label>
                <Input
                  type="number"
                  value={newRule.triggers?.newViolationsThreshold}
                  onChange={(e) => setNewRule(prev => ({
                    ...prev,
                    triggers: { ...prev.triggers!, newViolationsThreshold: parseInt(e.target.value) }
                  }))}
                  min="1"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Compliance Threshold (%)</Label>
                <Input
                  type="number"
                  value={newRule.triggers?.complianceThreshold}
                  onChange={(e) => setNewRule(prev => ({
                    ...prev,
                    triggers: { ...prev.triggers!, complianceThreshold: parseInt(e.target.value) }
                  }))}
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-2">
                <Label>Email Recipients</Label>
                <Input
                  value={newRule.recipients?.emails?.join(', ')}
                  onChange={(e) => setNewRule(prev => ({
                    ...prev,
                    recipients: {
                      ...prev.recipients!,
                      emails: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                    }
                  }))}
                  placeholder="admin@company.com, team@company.com"
                />
              </div>

              <div className="space-y-3 md:col-span-2">
                <Label>Notification Channels</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={newRule.channels?.email}
                      onCheckedChange={(checked) => setNewRule(prev => ({
                        ...prev,
                        channels: { ...prev.channels!, email: checked }
                      }))}
                    />
                    <Mail className="w-4 h-4" />
                    Email
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={newRule.channels?.inApp}
                      onCheckedChange={(checked) => setNewRule(prev => ({
                        ...prev,
                        channels: { ...prev.channels!, inApp: checked }
                      }))}
                    />
                    <Bell className="w-4 h-4" />
                    In-App
                  </label>
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={newRule.channels?.webhook}
                      onCheckedChange={(checked) => setNewRule(prev => ({
                        ...prev,
                        channels: { ...prev.channels!, webhook: checked }
                      }))}
                    />
                    <Webhook className="w-4 h-4" />
                    Webhook
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button
                onClick={() => saveAlertRule(newRule)}
                disabled={!newRule.name || !newRule.description}
              >
                Create Alert Rule
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alert History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-green-600" />
            Alert History
          </CardTitle>
          <CardDescription>
            Recent alert notifications and delivery status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {alertHistory.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Alerts Sent Yet</h3>
              <p className="text-muted-foreground">
                Alert history will appear here once rules start triggering.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {alertHistory.slice(0, 20).map((alert) => (
                <div
                  key={alert.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    alert.successful ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm">{alert.ruleName}</p>
                        <Badge variant={alert.successful ? "default" : "destructive"} className="text-xs">
                          {alert.successful ? "Delivered" : "Failed"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{formatTimestamp(alert.triggeredAt)}</span>
                        <span>•</span>
                        <span>Channels: {alert.channels.join(', ')}</span>
                      </div>
                      {alert.errorMessage && (
                        <p className="text-xs text-red-600 mt-1">Error: {alert.errorMessage}</p>
                      )}
                    </div>
                    {alert.successful ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}