'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export interface TabItem {
  /** Tab identifier */
  value: string;
  /** Tab label */
  label: string;
  /** Optional badge count */
  count?: number;
  /** Tab content */
  content: React.ReactNode;
}

interface AdminContentTabsProps {
  /** Array of tab items */
  tabs: TabItem[];
  /** Currently active tab value */
  defaultValue?: string;
  /** Callback when tab changes */
  onValueChange?: (value: string) => void;
  className?: string;
}

/**
 * AdminContentTabs - Tabbed content navigation
 *
 * Creates consistent tabbed interfaces for segmenting admin content.
 *
 * @example
 * ```tsx
 * <AdminContentTabs
 *   defaultValue="all"
 *   tabs={[
 *     { value: "all", label: "All", count: 42, content: <TicketList /> },
 *     { value: "open", label: "Open", count: 12, content: <TicketList /> },
 *   ]}
 * />
 * ```
 */
export function AdminContentTabs({
  tabs,
  defaultValue,
  onValueChange,
  className,
}: AdminContentTabsProps) {
  return (
    <Tabs
      defaultValue={defaultValue || tabs[0]?.value}
      onValueChange={onValueChange}
      className={cn("w-full", className)}
    >
      <TabsList className="mb-4 bg-white border border-gray-200 dark:border-white/[0.06] p-1">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700 data-[state=active]:shadow-sm"
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                "ml-2 px-2 py-0.5 text-xs rounded-full font-medium",
                "bg-gray-100 text-muted-foreground",
                "data-[state=active]:bg-orange-100 data-[state=active]:text-orange-700"
              )}>
                {tab.count}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-0">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
}
