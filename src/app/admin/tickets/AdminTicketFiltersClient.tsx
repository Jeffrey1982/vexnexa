'use client';

import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AdminFilterBar } from "@/components/admin/layout";

interface AdminTicketFiltersClientProps {
  hasActiveFilters: boolean;
  autoCollapse: boolean;
  currentStatus?: string;
  currentPriority?: string;
}

export function AdminTicketFiltersClient({
  hasActiveFilters,
  autoCollapse,
  currentStatus,
  currentPriority,
}: AdminTicketFiltersClientProps) {
  const router = useRouter();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams();

    // Preserve other filters
    if (key === 'status') {
      if (value !== 'all') params.set('status', value);
      if (currentPriority && currentPriority !== 'all') params.set('priority', currentPriority);
    } else if (key === 'priority') {
      if (currentStatus && currentStatus !== 'all') params.set('status', currentStatus);
      if (value !== 'all') params.set('priority', value);
    }

    const queryString = params.toString();
    router.push(`/admin/tickets${queryString ? `?${queryString}` : ''}`);
  };

  const clearAllFilters = () => {
    router.push('/admin/tickets');
  };

  return (
    <AdminFilterBar
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearAllFilters}
      autoCollapse={autoCollapse}
      defaultCollapsed={autoCollapse}
    >
      <div className="space-y-2">
        <Label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
          Filter by Status
        </Label>
        <Select
          value={currentStatus || 'all'}
          onValueChange={(value) => updateFilter('status', value)}
        >
          <SelectTrigger
            id="status-filter"
            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="priority-filter" className="text-sm font-medium text-gray-700">
          Filter by Priority
        </Label>
        <Select
          value={currentPriority || 'all'}
          onValueChange={(value) => updateFilter('priority', value)}
        >
          <SelectTrigger
            id="priority-filter"
            className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="HIGH">High</SelectItem>
            <SelectItem value="MEDIUM">Medium</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Placeholder for future filters */}
      <div className="space-y-2 opacity-50">
        <Label className="text-sm font-medium text-gray-700">
          Category (Coming Soon)
        </Label>
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
        </Select>
      </div>
    </AdminFilterBar>
  );
}
