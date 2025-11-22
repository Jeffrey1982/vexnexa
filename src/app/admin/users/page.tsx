import { prisma } from "@/lib/prisma";
import { Users } from "lucide-react";
import { UserListClient } from "@/components/admin/UserListClient";

export const dynamic = 'force-dynamic';

async function getAllUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      company: true,
      plan: true,
      subscriptionStatus: true,
      createdAt: true,
      trialEndsAt: true,
      sites: {
        select: {
          _count: {
            select: {
              scans: true
            }
          }
        }
      }
    }
  });

  return users;
}

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                  <Users className="text-blue-500" />
                  User Management
                </h1>
                <p className="text-gray-600 mt-1">View and manage all platform users</p>
              </div>
            </div>
          </div>

          {/* Client-side search and table */}
          <UserListClient users={users} />
        </div>
      </div>
    </div>
  );
}
