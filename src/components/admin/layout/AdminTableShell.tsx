import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AdminTableShellProps {
  /** Table title */
  title: string;
  /** Optional description/count */
  description?: string;
  /** Action buttons for table header */
  actions?: React.ReactNode;
  /** Table content */
  children: React.ReactNode;
  /** Optional footer for pagination */
  footer?: React.ReactNode;
  /** Reduce padding for denser tables */
  dense?: boolean;
  className?: string;
}

/**
 * AdminTableShell - Wrapper for admin data tables
 *
 * Provides consistent table layout with header, actions, and optional footer.
 *
 * @example
 * ```tsx
 * <AdminTableShell
 *   title="Support Tickets"
 *   description="24 tickets found"
 *   actions={<Button size="sm">Export</Button>}
 *   dense
 * >
 *   <Table>...</Table>
 * </AdminTableShell>
 * ```
 */
export function AdminTableShell({
  title,
  description,
  actions,
  children,
  footer,
  dense = false,
  className,
}: AdminTableShellProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between space-y-0",
        dense ? "pb-3" : "pb-4"
      )}>
        <div className="flex-1">
          <CardTitle className={cn(
            dense ? "text-base" : "text-lg"
          )}>
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="mt-1">
              {description}
            </CardDescription>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 ml-4">
            {actions}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn(
        dense ? "p-0" : "pt-0"
      )}>
        {children}
      </CardContent>
      {footer && (
        <div className="border-t bg-gray-50 dark:bg-white/[0.03] px-6 py-4">
          {footer}
        </div>
      )}
    </Card>
  );
}
