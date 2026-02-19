import { requireAdmin } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MainNav } from "@/components/admin/MainNav";

/**
 * Admin Layout - Server-side gated layout for all /admin/* routes
 *
 * Security:
 * - Requires authentication via Supabase
 * - Requires admin privileges (user_metadata.is_admin OR email allowlist)
 * - Redirects to /unauthorized if not authorized
 * - All checks happen server-side
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side admin check - will redirect if unauthorized
  const user = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-72 overflow-hidden pt-14 lg:pt-0">
        {/* Top Navigation Bar */}
        <MainNav user={user} />

        {/* Page Content */}
        <main id="main-content" className="flex-1 overflow-y-auto bg-gray-50 dark:bg-background" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
