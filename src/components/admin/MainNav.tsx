'use client';

import Link from 'next/link';
import { Home, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client-new';

interface MainNavProps {
  user?: {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export function MainNav({ user }: MainNavProps) {
  const supabase = createClient();

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      await supabase.auth.signOut();
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/';
    }
  };

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email;

  return (
    <nav className="sticky top-0 z-20 border-b bg-white shadow-sm">
      <div className="flex justify-between items-center h-16 px-6">
        {/* Left side - could add breadcrumbs or page title here */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            Admin Panel
          </div>
        </div>

        {/* Right side - User info and actions */}
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:text-gray-900"
            >
              <Home className="w-4 h-4 mr-2" />
              My Dashboard
            </Button>
          </Link>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg text-sm border border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-700 font-medium">{userName}</span>
          </div>

          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
