import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { UserBasicInfo } from "@/components/admin/UserBasicInfo";
import { UserBillingInfo } from "@/components/admin/UserBillingInfo";
import { UserTicketsList } from "@/components/admin/UserTicketsList";
import { UserContactMessages } from "@/components/admin/UserContactMessages";
import { UserActivityTimeline } from "@/components/admin/UserActivityTimeline";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminNotesViewer } from "@/components/admin/AdminNotesViewer";

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const user = await requireAuth();
  const adminEmails = ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'];
  if (!adminEmails.includes(user.email) && !user.isAdmin) {
    redirect('/dashboard');
  }
  return user;
}

async function getUserDetails(userId: string) {
  // Fetch user with all related data
  const [user, tickets, contactMessages, adminEvents, adminNotes] = await Promise.all([
    // User with sites and scans
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          orderBy: { createdAt: 'desc' },
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 10 // Latest 10 scans per site for timeline
            },
            _count: {
              select: {
                scans: true
              }
            }
          }
        }
      }
    }),

    // Support tickets
    prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    }),

    // Contact messages (if user exists)
    prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    }).then(async (u) => {
      if (!u) return [];
      return prisma.contactMessage.findMany({
        where: { email: u.email },
        orderBy: { createdAt: 'desc' }
      });
    }),

    // Admin events
    prisma.userAdminEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),

    // Admin notes
    prisma.adminUserNote.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: {
          select: {
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })
  ]);

  return {
    user,
    tickets,
    contactMessages,
    adminEvents,
    adminNotes
  };
}

export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  const { user, tickets, contactMessages, adminEvents, adminNotes } = await getUserDetails(params.id);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AdminNav user={admin} />
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="p-12 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
              <p className="text-gray-600 mb-6">The requested user could not be found.</p>
              <Link href="/admin/users">
                <Button>Back to Users</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav user={admin} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to All Users
          </Button>
        </Link>

        <div className="space-y-6">
          {/* User Basic Info */}
          <UserBasicInfo user={user} />

          {/* Admin Actions */}
          <AdminUserActions
            userId={user.id}
            currentPlan={user.plan}
            currentStatus={user.subscriptionStatus}
          />

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Billing Info */}
              <UserBillingInfo user={user} />

              {/* Support Tickets */}
              <UserTicketsList tickets={tickets} userId={user.id} />
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Contact Messages */}
              <UserContactMessages
                contactMessages={contactMessages}
                userEmail={user.email}
              />

              {/* Admin Notes */}
              <AdminNotesViewer notes={adminNotes} />

              {/* Activity Timeline */}
              <UserActivityTimeline events={adminEvents} user={user} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
