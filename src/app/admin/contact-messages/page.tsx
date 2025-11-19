import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { redirect } from "next/navigation";
import { ContactMessagesTable } from "@/components/admin/ContactMessagesTable";
import { Mail } from "lucide-react";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }
  return user;
}

async function getAllContactMessages() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return messages;
}

async function getStats() {
  const [total, replied, pending] = await Promise.all([
    prisma.contactMessage.count(),
    prisma.contactMessage.count({
      where: { replied: true }
    }),
    prisma.contactMessage.count({
      where: { replied: false }
    })
  ]);

  return { total, replied, pending };
}

export default async function ContactMessagesPage() {
  const user = await requireAdmin();
  const messages = await getAllContactMessages();
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Mail className="text-blue-500" />
              Contact Form Submissions
            </h1>
            <p className="text-gray-600 mt-1">View and manage all contact form submissions</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Messages</div>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Replied</div>
              <div className="text-3xl font-bold text-green-600">{stats.replied}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-600 mb-1">Pending</div>
              <div className="text-3xl font-bold text-orange-600">{stats.pending}</div>
            </div>
          </div>

          {/* Messages Table */}
          <ContactMessagesTable messages={messages} />
        </div>
      </div>
    </div>
  );
}
