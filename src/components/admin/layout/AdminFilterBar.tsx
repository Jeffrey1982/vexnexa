'use client';

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface AdminFilterBarProps {
  /** Filter controls to render */
  children: React.ReactNode;
  /** Whether filters are currently active */
  hasActiveFilters?: boolean;
  /** Callback when filters are cleared */
  onClearFilters?: () => void;
  /** Auto-collapse when no data exists */
  autoCollapse?: boolean;
  /** Start in collapsed state */
  defaultCollapsed?: boolean;
  /** Disable all filters */
  disabled?: boolean;
  className?: string;
}

/**
 * AdminFilterBar - Collapsible filter controls
 *
 * Provides a consistent filter interface with collapse/expand functionality.
 * Can auto-collapse when no data exists.
 *
 * @example
 * ```tsx
 * <AdminFilterBar
 *   hasActiveFilters={!!status}
 *   onClearFilters={() => router.push('/admin/tickets')}
 *   autoCollapse={tickets.length === 0}
 * >
 *   <Select>...</Select>
 * </AdminFilterBar>
 * ```
 */
export function AdminFilterBar({
  children,
  hasActiveFilters = false,
  onClearFilters,
  autoCollapse = false,
  defaultCollapsed = false,
  disabled = false,
  className,
}: AdminFilterBarProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed || autoCollapse);

  return (
    <Card className={cn(
      "mb-6 transition-all",
      disabled && "opacity-60",
      className
    )}>
      <CardContent className="pt-4 pb-4">
        {/* Filter Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-sm font-medium text-gray-700 hover:text-gray-900 -ml-2"
            >
              {isCollapsed ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronUp className="w-4 h-4 mr-1" />
              )}
              Filters
            </Button>
            {hasActiveFilters && !isCollapsed && (
              <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                Active
              </span>
            )}
          </div>

          {hasActiveFilters && onClearFilters && !isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-sm text-gray-600 hover:text-gray-900"
              disabled={disabled}
            >
              <X className="w-4 h-4 mr-1" />
              Clear all
            </Button>
          )}
        </div>

        {/* Filter Controls */}
        {!isCollapsed && (
          <div className={cn(
            "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2",
            disabled && "pointer-events-none opacity-50"
          )}>
            {children}
          </div>
        )}

        {/* Collapsed State Message */}
        {isCollapsed && autoCollapse && (
          <p className="text-sm text-gray-500 pt-1">
            Filters available when data is present
          </p>
        )}
      </CardContent>
    </Card>
  );
}
