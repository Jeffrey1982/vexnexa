import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { UserBasicInfo } from "@/components/admin/UserBasicInfo";
import { UserBillingInfo } from "@/components/admin/UserBillingInfo";
import { UserTicketsList } from "@/components/admin/UserTicketsList";
import { UserContactMessages } from "@/components/admin/UserContactMessages";
import { UserActivityTimeline } from "@/components/admin/UserActivityTimeline";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminNotesViewer } from "@/components/admin/AdminNotesViewer";
import { UserUsageAnalytics } from "@/components/admin/UserUsageAnalytics";
import { UserScanHistory } from "@/components/admin/UserScanHistory";
import { OverageBillingManager } from "@/components/admin/OverageBillingManager";
import { ENTITLEMENTS } from "@/lib/billing/plans";

export const dynamic = 'force-dynamic';
async function getUserDetails(userId: string) {
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const [user, tickets, contactMessages, adminEvents, adminNotes, allScans, currentMonthScans, previousMonthScans, teamMembersCount] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        sites: {
          orderBy: { createdAt: 'desc' },
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 10
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
    prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { messages: true }
        }
      }
    }),
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
    prisma.userAdminEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    }),
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
    }),
    prisma.scan.findMany({
      where: {
        site: {
          userId: userId
        }
      },
      include: {
        site: {
          select: {
            id: true,
            url: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.scan.findMany({
      where: {
        site: { userId },
        createdAt: { gte: firstDayOfMonth }
      },
      select: {
        id: true,
        elementsScanned: true
      }
    }),
    prisma.scan.findMany({
      where: {
        site: { userId },
        createdAt: {
          gte: lastMonth,
          lte: lastMonthEnd
        }
      },
      select: {
        elementsScanned: true
      }
    }),
    Promise.resolve(1)
  ]);

  const currentMonthPages = currentMonthScans.reduce((sum, scan) => sum + (scan.elementsScanned || 0), 0);
  const previousMonthPages = previousMonthScans.reduce((sum, scan) => sum + (scan.elementsScanned || 0), 0);

  const plan = (user?.plan || 'TRIAL') as keyof typeof ENTITLEMENTS;
  const entitlements = ENTITLEMENTS[plan];
  const overageData = {
    sites: Math.max(0, (user?.sites?.length || 0) - entitlements.sites),
    pages: Math.max(0, currentMonthPages - entitlements.pagesPerMonth),
    users: Math.max(0, teamMembersCount - entitlements.users)
  };

  return {
    user,
    tickets,
    contactMessages,
    adminEvents,
    adminNotes,
    allScans,
    currentMonthScans: currentMonthScans.length,
    currentMonthPages,
    previousMonthPages,
    teamMembersCount,
    overageData
  };
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const {
    user,
    tickets,
    contactMessages,
    adminEvents,
    adminNotes,
    allScans,
    currentMonthScans,
    currentMonthPages,
    previousMonthPages,
    teamMembersCount,
    overageData
  } = await getUserDetails(id);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
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

      <div className="max-w-7xl mx-auto p-6">
        <Link href="/admin/users">
          <Button variant="ghost" size="sm" className="gap-2 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to All Users
          </Button>
        </Link>

        <div className="space-y-6">
          <UserBasicInfo user={user} />

          <AdminUserActions
            userId={user.id}
            currentPlan={user.plan}
            currentStatus={user.subscriptionStatus}
          />

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="usage">Usage & Analytics</TabsTrigger>
              <TabsTrigger value="scans">Scan History</TabsTrigger>
              <TabsTrigger value="billing">Overage Billing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <UserBillingInfo user={user} />
                  <UserTicketsList tickets={tickets} userId={user.id} />
                </div>
                <div className="space-y-6">
                  <UserContactMessages
                    contactMessages={contactMessages}
                    userEmail={user.email}
                  />
                  <AdminNotesViewer notes={adminNotes} />
                  <UserActivityTimeline events={adminEvents} user={user} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="usage" className="space-y-6 mt-6">
              <UserUsageAnalytics
                user={user}
                sites={user.sites}
                currentMonthScans={currentMonthScans}
                currentMonthPages={currentMonthPages}
                previousMonthPages={previousMonthPages}
                teamMembersCount={teamMembersCount}
              />
            </TabsContent>

            <TabsContent value="scans" className="space-y-6 mt-6">
              <UserScanHistory
                scans={allScans}
                userId={user.id}
              />
            </TabsContent>

            <TabsContent value="billing" className="space-y-6 mt-6">
              <OverageBillingManager
                userId={user.id}
                userEmail={user.email}
                currentOverage={overageData}
                appliedCredits={0}
                customAdjustments={[]}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
