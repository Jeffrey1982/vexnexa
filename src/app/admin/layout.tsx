import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { MainNav } from "@/components/admin/MainNav";

// Admin authorization check using database-driven RBAC
async function requireAdmin() {
  const user = await requireAuth();

  // Admin emails whitelist as fallback
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];

  // Check if user has admin role from database OR is in admin emails list
  if (!user.isAdmin && !adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col lg:ml-72 overflow-hidden">
        {/* Top Navigation Bar */}
        <MainNav user={user} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
