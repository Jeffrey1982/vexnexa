"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download,
  Calendar,
  Users,
  Code,
  Eye,
  Wrench
} from 'lucide-react';

interface Issue {
  id: string;
  rule: string;
  description: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  effort: 'low' | 'medium' | 'high';
  category: 'color' | 'keyboard' | 'content' | 'structure' | 'multimedia' | 'forms';
  elementsAffected: number;
  estimatedHours: number;
  dependencies: string[];
  businessValue: number;
  wcagLevel: 'A' | 'AA' | 'AAA';
  testability: 'automated' | 'manual' | 'both';
  assignee?: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'blocked';
  dueDate?: Date;
}

interface RemediationMatrixProps {
  issues: Issue[];
  onUpdateIssue: (issueId: string, updates: Partial<Issue>) => void;
  className?: string;
}

export function RemediationMatrix({ issues, onUpdateIssue, className }: RemediationMatrixProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'effort' | 'impact' | 'business-value'>('priority');
  const [filterImpact, setFilterImpact] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'matrix' | 'kanban' | 'timeline'>('matrix');

  const categories = ['all', 'color', 'keyboard', 'content', 'structure', 'multimedia', 'forms'];
  const impacts = ['all', 'critical', 'serious', 'moderate', 'minor'];
  const statuses = ['all', 'not-started', 'in-progress', 'completed', 'blocked'];

  const filteredAndSortedIssues = useMemo(() => {
    let filtered = issues.filter(issue => {
      const matchesSearch = issue.rule.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           issue.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesImpact = filterImpact === 'all' || issue.impact === filterImpact;
      const matchesCategory = filterCategory === 'all' || issue.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;

      return matchesSearch && matchesImpact && matchesCategory && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const impactWeight = { critical: 4, serious: 3, moderate: 2, minor: 1 };
          const effortWeight = { low: 3, medium: 2, high: 1 };
          const aPriority = impactWeight[a.impact] * effortWeight[a.effort];
          const bPriority = impactWeight[b.impact] * effortWeight[b.effort];
          return bPriority - aPriority;
        case 'effort':
          const effortOrder = { low: 1, medium: 2, high: 3 };
          return effortOrder[a.effort] - effortOrder[b.effort];
        case 'impact':
          const impactOrder = { critical: 4, serious: 3, moderate: 2, minor: 1 };
          return impactOrder[b.impact] - impactOrder[a.impact];
        case 'business-value':
          return b.businessValue - a.businessValue;
        default:
          return 0;
      }
    });

    return filtered;
  }, [issues, sortBy, filterImpact, filterCategory, filterStatus, searchTerm]);

  const getPriorityScore = (issue: Issue) => {
    const impactWeight = { critical: 4, serious: 3, moderate: 2, minor: 1 };
    const effortWeight = { low: 3, medium: 2, high: 1 };
    return (impactWeight[issue.impact] * effortWeight[issue.effort]) + (issue.businessValue / 10);
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'critical': return 'bg-red-500';
      case 'serious': return 'bg-orange-500';
      case 'moderate': return 'bg-yellow-500';
      case 'minor': return 'bg-gray-500';
      default: return 'bg-gray-300';
    }
  };

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'low': return 'text-green-600 bg-green-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'high': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'color': return <Eye className="h-4 w-4" />;
      case 'keyboard': return <Code className="h-4 w-4" />;
      case 'content': return <Target className="h-4 w-4" />;
      case 'structure': return <Wrench className="h-4 w-4" />;
      case 'multimedia': return <Users className="h-4 w-4" />;
      case 'forms': return <Zap className="h-4 w-4" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const handleIssueSelect = (issueId: string) => {
    setSelectedIssues(prev =>
      prev.includes(issueId)
        ? prev.filter(id => id !== issueId)
        : [...prev, issueId]
    );
  };

  const handleBulkStatusUpdate = (status: Issue['status']) => {
    selectedIssues.forEach(issueId => {
      onUpdateIssue(issueId, { status });
    });
    setSelectedIssues([]);
  };

  const exportTasks = () => {
    const csvContent = filteredAndSortedIssues.map(issue =>
      `"${issue.rule}","${issue.description}","${issue.impact}","${issue.effort}","${issue.status}","${issue.estimatedHours}"`
    ).join('\n');

    const blob = new Blob([`Rule,Description,Impact,Effort,Status,Hours\n${csvContent}`], {
      type: 'text/csv;charset=utf-8;'
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'accessibility-remediation-plan.csv';
    link.click();
  };

  const renderMatrixView = () => (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 p-2 text-left">
                <Checkbox
                  checked={selectedIssues.length === filteredAndSortedIssues.length}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedIssues(filteredAndSortedIssues.map(i => i.id));
                    } else {
                      setSelectedIssues([]);
                    }
                  }}
                />
              </th>
              <th className="border border-gray-200 p-2 text-left">Priority</th>
              <th className="border border-gray-200 p-2 text-left">Issue</th>
              <th className="border border-gray-200 p-2 text-left">Impact</th>
              <th className="border border-gray-200 p-2 text-left">Effort</th>
              <th className="border border-gray-200 p-2 text-left">Category</th>
              <th className="border border-gray-200 p-2 text-left">Status</th>
              <th className="border border-gray-200 p-2 text-left">Hours</th>
              <th className="border border-gray-200 p-2 text-left">Business Value</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedIssues.map((issue, index) => (
              <motion.tr
                key={issue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`hover:bg-gray-50 ${selectedIssues.includes(issue.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="border border-gray-200 p-2">
                  <Checkbox
                    checked={selectedIssues.includes(issue.id)}
                    onCheckedChange={() => handleIssueSelect(issue.id)}
                  />
                </td>
                <td className="border border-gray-200 p-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${getImpactColor(issue.impact)}`} />
                    <span className="font-semibold">{getPriorityScore(issue).toFixed(1)}</span>
                  </div>
                </td>
                <td className="border border-gray-200 p-2">
                  <div>
                    <div className="font-semibold text-sm">{issue.rule}</div>
                    <div className="text-xs text-gray-600 truncate max-w-xs">
                      {issue.description}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {issue.elementsAffected} elements affected
                    </div>
                  </div>
                </td>
                <td className="border border-gray-200 p-2">
                  <Badge
                    variant={issue.impact === 'critical' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {issue.impact}
                  </Badge>
                </td>
                <td className="border border-gray-200 p-2">
                  <Badge className={`capitalize ${getEffortColor(issue.effort)}`}>
                    {issue.effort}
                  </Badge>
                </td>
                <td className="border border-gray-200 p-2">
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(issue.category)}
                    <span className="text-sm capitalize">{issue.category}</span>
                  </div>
                </td>
                <td className="border border-gray-200 p-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(issue.status)}
                    <Select
                      value={issue.status}
                      onValueChange={(value: Issue['status']) =>
                        onUpdateIssue(issue.id, { status: value })
                      }
                    >
                      <SelectTrigger className="w-24 h-6 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not-started">Not Started</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </td>
                <td className="border border-gray-200 p-2 text-center">
                  {issue.estimatedHours}h
                </td>
                <td className="border border-gray-200 p-2 text-center">
                  <div className="text-sm font-semibold">{issue.businessValue}</div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderKanbanView = () => {
    const columns = [
      { status: 'not-started', title: 'To Do', color: 'bg-gray-50' },
      { status: 'in-progress', title: 'In Progress', color: 'bg-blue-50' },
      { status: 'blocked', title: 'Blocked', color: 'bg-red-50' },
      { status: 'completed', title: 'Completed', color: 'bg-green-50' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {columns.map(column => {
          const columnIssues = filteredAndSortedIssues.filter(issue => issue.status === column.status);

          return (
            <div key={column.status} className={`p-4 rounded-lg ${column.color}`}>
              <h4 className="font-semibold mb-3 flex items-center justify-between">
                {column.title}
                <Badge variant="outline">{columnIssues.length}</Badge>
              </h4>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {columnIssues.map((issue, index) => (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-white rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleIssueSelect(issue.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className={`w-2 h-2 rounded-full ${getImpactColor(issue.impact)} mt-1`} />
                      <Badge className={`text-xs ${getEffortColor(issue.effort)}`}>
                        {issue.effort}
                      </Badge>
                    </div>
                    <div className="font-semibold text-sm mb-1">{issue.rule}</div>
                    <div className="text-xs text-gray-600 mb-2">
                      {issue.description.length > 60
                        ? `${issue.description.substring(0, 60)}...`
                        : issue.description}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{issue.elementsAffected} elements</span>
                      <span>{issue.estimatedHours}h</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const stats = useMemo(() => {
    const total = issues.length;
    const completed = issues.filter(i => i.status === 'completed').length;
    const inProgress = issues.filter(i => i.status === 'in-progress').length;
    const blocked = issues.filter(i => i.status === 'blocked').length;
    const totalHours = issues.reduce((sum, issue) => sum + issue.estimatedHours, 0);
    const completedHours = issues
      .filter(i => i.status === 'completed')
      .reduce((sum, issue) => sum + issue.estimatedHours, 0);

    return {
      total,
      completed,
      inProgress,
      blocked,
      notStarted: total - completed - inProgress - blocked,
      completionRate: (completed / total) * 100,
      totalHours,
      completedHours,
      remainingHours: totalHours - completedHours
    };
  }, [issues]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Remediation Priority Matrix
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportTasks}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardTitle>
        <CardDescription>
          Strategic prioritization and tracking of accessibility improvements
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Issues</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
            <div className="text-sm text-gray-600">Blocked</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{stats.remainingHours}</div>
            <div className="text-sm text-gray-600">Hours Left</div>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <Input
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-48"
            />
          </div>

          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="priority">Priority</SelectItem>
              <SelectItem value="impact">Impact</SelectItem>
              <SelectItem value="effort">Effort</SelectItem>
              <SelectItem value="business-value">Business Value</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterImpact} onValueChange={setFilterImpact}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {impacts.map(impact => (
                <SelectItem key={impact} value={impact}>
                  {impact === 'all' ? 'All Impacts' : impact}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status === 'all' ? 'All Status' : status.replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Actions */}
        {selectedIssues.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <span className="text-sm font-medium">{selectedIssues.length} issues selected</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleBulkStatusUpdate('in-progress')}
              >
                Start Progress
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('completed')}
              >
                Mark Complete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleBulkStatusUpdate('blocked')}
              >
                Block
              </Button>
            </div>
          </motion.div>
        )}

        {/* View Tabs */}
        <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="matrix">Matrix View</TabsTrigger>
            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="mt-6">
            {renderMatrixView()}
          </TabsContent>

          <TabsContent value="kanban" className="mt-6">
            {renderKanbanView()}
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              Timeline view - Coming soon
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}