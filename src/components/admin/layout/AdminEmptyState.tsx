import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyAction {
  label: string;
  onClick?: () => void;
  href?: string;
  variant?: "default" | "outline" | "ghost";
  icon?: LucideIcon;
}

interface AdminEmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main heading */
  title: string;
  /** Description text */
  description: string | React.ReactNode;
  /** Action buttons */
  actions?: EmptyAction[];
  /** Additional help text or tips */
  helpText?: React.ReactNode;
  className?: string;
}

/**
 * AdminEmptyState - Action-oriented empty state component
 *
 * Displays when no data exists, with helpful context and clear actions.
 *
 * @example
 * ```tsx
 * <AdminEmptyState
 *   icon={Ticket}
 *   title="No support tickets yet"
 *   description="Support tickets help you track customer issues and requests."
 *   actions={[
 *     { label: "Create Test Ticket", onClick: () => {}, variant: "default" },
 *     { label: "View Settings", href: "/settings", variant: "outline" },
 *   ]}
 *   helpText="You can also import tickets from your previous support system."
 * />
 * ```
 */
export function AdminEmptyState({
  icon: Icon,
  title,
  description,
  actions = [],
  helpText,
  className,
}: AdminEmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-16 px-4 text-center",
      className
    )}>
      {/* Icon */}
      <div className="mb-6 p-4 bg-gray-100 rounded-full">
        <Icon className="w-12 h-12 text-muted-foreground" />
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-gray-900 dark:text-foreground mb-2">
        {title}
      </h3>

      {/* Description */}
      <div className="text-muted-foreground max-w-md mb-6">
        {typeof description === 'string' ? <p>{description}</p> : description}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {actions.map((action, index) => {
            const ActionIcon = action.icon;
            const buttonContent = (
              <>
                {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
                {action.label}
              </>
            );

            if (action.href) {
              return (
                <Button
                  key={index}
                  variant={action.variant || (index === 0 ? "default" : "outline")}
                  asChild
                >
                  <a href={action.href}>{buttonContent}</a>
                </Button>
              );
            }

            return (
              <Button
                key={index}
                variant={action.variant || (index === 0 ? "default" : "outline")}
                onClick={action.onClick}
              >
                {buttonContent}
              </Button>
            );
          })}
        </div>
      )}

      {/* Help Text */}
      {helpText && (
        <div className="text-sm text-muted-foreground max-w-lg border-t border-gray-200 dark:border-white/[0.06] pt-6">
          {helpText}
        </div>
      )}
    </div>
  );
}
