import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PLAN_NAMES } from "@/lib/billing/plans";
import { User, Mail } from "lucide-react";
import type { User as PrismaUser } from "@prisma/client";

interface UserBasicInfoProps {
  user: PrismaUser;
}

export function UserBasicInfo({ user }: UserBasicInfoProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
              <User className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" />
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <Badge
                  variant={
                    user.plan === 'BUSINESS' ? 'default' :
                    user.plan === 'PRO' ? 'secondary' :
                    user.plan === 'STARTER' ? 'outline' : 'destructive'
                  }
                >
                  {PLAN_NAMES[user.plan as keyof typeof PLAN_NAMES]}
                </Badge>
                <Badge variant={user.subscriptionStatus === 'active' ? 'default' : 'outline'}>
                  {user.subscriptionStatus}
                </Badge>
                {user.isAdmin && (
                  <Badge variant="destructive">Admin</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
