import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import BlogManagement from "@/components/admin/BlogManagement";

export const dynamic = 'force-dynamic';

// Simple admin check
async function requireAdmin() {
  const user = await requireAuth();

  const adminEmails = [
    'jeffrey.aay@gmail.com',
    'admin@vexnexa.com'
  ];

  if (!adminEmails.includes(user.email)) {
    redirect('/dashboard');
  }

  return user;
}

export default async function AdminBlogPage() {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BlogManagement />
      </div>
    </div>
  );
}
