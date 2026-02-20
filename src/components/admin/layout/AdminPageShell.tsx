import { cn } from "@/lib/utils";

interface AdminPageShellProps {
  children: React.ReactNode;
  className?: string;
  /** Reduce padding for denser layouts */
  dense?: boolean;
}

/**
 * AdminPageShell - Standard page wrapper for admin pages
 *
 * Provides consistent padding and background treatment.
 * Use this as the root container for all admin pages.
 *
 * @example
 * ```tsx
 * <AdminPageShell>
 *   <AdminPageHeader title="Users" />
 *   {content}
 * </AdminPageShell>
 * ```
 */
export function AdminPageShell({ children, className, dense = false }: AdminPageShellProps) {
  return (
    <div className={cn(
      "min-h-full bg-gray-50 dark:bg-white/[0.03]",
      dense ? "p-4" : "p-6",
      className
    )}>
      {children}
    </div>
  );
}
