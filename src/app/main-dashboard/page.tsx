"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function MainDashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          // Not authenticated, redirect to login
          router.push("/auth/login?redirect=/main-dashboard");
          return;
        }

        setUser(user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/auth/login?redirect=/main-dashboard");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, supabase.auth]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p>Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back, {user.user_metadata?.first_name || user.email || 'User'}
          </p>
        </div>

        {/* Success Message */}
        <Card className="mb-8 bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Success!</h2>
              <p className="text-green-700">
                Authentication is working! You are successfully logged in and can access the dashboard.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with VexNexa</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button asChild className="h-24 flex-col">
                <Link href="/sites/new">
                  <Plus className="h-6 w-6 mb-2" />
                  Add Website
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-24 flex-col">
                <Link href="/analytics">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  View Analytics
                </Link>
              </Button>
              <Button variant="outline" asChild className="h-24 flex-col">
                <Link href="/settings">
                  <TrendingUp className="h-6 w-6 mb-2" />
                  Settings
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>User Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Email:</strong> {user.email || 'Not available'}</p>
              <p><strong>User ID:</strong> {user.id}</p>
              <p><strong>First Name:</strong> {user.user_metadata?.first_name || "Not set"}</p>
              <p><strong>Last Name:</strong> {user.user_metadata?.last_name || "Not set"}</p>
            </div>
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.push("/");
                }}
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}