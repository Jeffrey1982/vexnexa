import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AdminNav } from "@/components/admin/AdminNav";
import UpgradeClient from "./UpgradeClient";

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

export default async function AdminUpgradePage() {
  const user = await requireAdmin();

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={user} />
      <UpgradeClient />
    </div>
  );
}
