"use client";

// Force dynamic rendering to prevent caching issues
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client-new";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Plus, Shield } from "lucide-react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

export default function NewDashboardPage() {
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
          router.push("/auth/login?redirect=/dashboard-new");
          return;
        }

        setUser(user);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/auth/login?redirect=/dashboard-new");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/');
      } else if (event === 'SIGNED_IN' && session) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase.auth]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">✅ DASHBOARD IS WORKING!</h1>
            <p className="text-green-600 mt-1 font-semibold">
              New route successful - authentication is working properly!
            </p>
          </div>
          <div className="flex gap-4">
            <Button onClick={() => router.push('/')} variant="outline">
              Home
            </Button>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        {/* Success Message */}
        <Alert className="mb-8 border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            🎉 NEW DASHBOARD ROUTE WORKING! This confirms that the authentication and build system are functioning correctly.
          </AlertDescription>
        </Alert>

        {/* Test Different Routes */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Test Routes</CardTitle>
            <CardDescription>Try accessing the original dashboard to compare</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild>
              <Link href="/dashboard">
                Try Original Dashboard (/dashboard)
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/main-dashboard">
                Try Main Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/app-dashboard">
                Try App Dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle>Authentication Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>✅ Email:</strong> {user.email || 'Not available'}</p>
              <p><strong>✅ User ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{user.id.slice(0, 8)}...</code></p>
              <p><strong>✅ Name:</strong> {user.user_metadata?.first_name || "Not set"} {user.user_metadata?.last_name || ""}</p>
              <p><strong>✅ Account Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
              <p><strong>✅ Authentication:</strong> <span className="text-green-600 font-semibold">WORKING</span></p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}