import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface AdminPageHeaderProps {
  /** Page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional icon to display next to title */
  icon?: LucideIcon;
  /** Icon color class (default: text-orange-500) */
  iconColor?: string;
  /** Primary action button(s) - rendered on the right */
  actions?: React.ReactNode;
  /** Secondary actions - rendered below primary actions on mobile */
  secondaryActions?: React.ReactNode;
  /** Optional breadcrumbs or metadata */
  metadata?: React.ReactNode;
  className?: string;
}

/**
 * AdminPageHeader - Standardized page header with title, actions, and metadata
 *
 * Creates a consistent header across all admin pages with proper hierarchy.
 *
 * @example
 * ```tsx
 * <AdminPageHeader
 *   title="Support Tickets"
 *   subtitle="Manage customer support requests"
 *   icon={Ticket}
 *   actions={
 *     <Button>Create Ticket</Button>
 *   }
 * />
 * ```
 */
export function AdminPageHeader({
  title,
  subtitle,
  icon: Icon,
  iconColor = "text-orange-500",
  actions,
  secondaryActions,
  metadata,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("mb-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Title Section */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            {Icon && <Icon className={cn("w-7 h-7 flex-shrink-0", iconColor)} />}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          )}
          {metadata && (
            <div className="mt-2 text-sm text-muted-foreground">{metadata}</div>
          )}
        </div>

        {/* Actions Section */}
        {(actions || secondaryActions) && (
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            {secondaryActions && (
              <div className="flex gap-2">
                {secondaryActions}
              </div>
            )}
            {actions && (
              <div className="flex gap-2">
                {actions}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
