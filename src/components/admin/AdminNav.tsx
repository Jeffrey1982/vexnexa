'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Shield,
  Home,
  Menu,
  X,
  LogOut,
  Ticket
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client-new';

interface AdminNavProps {
  user?: {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const supabase = createClient();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

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

  const adminNavItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/blog', label: 'Blog', icon: FileText },
    { href: '/admin/upgrade', label: 'Upgrades', icon: TrendingUp },
    { href: '/admin-interface', label: 'Support', icon: Ticket },
  ];

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email;

  return (
    <nav className="border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/admin" className="flex items-center gap-2">
              <div className="h-8 w-8 bg-gray-900 rounded flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900 hidden sm:block">Admin</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded',
                      active
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xl:inline">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <Home className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded text-sm">
              <span className="text-gray-600 hidden xl:inline">{userName}</span>
            </div>
            <Button onClick={handleSignOut} variant="ghost" size="sm">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded text-gray-600 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-1">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded',
                    active
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile user info and actions */}
            <div className="pt-3 mt-3 border-t space-y-2">
              <div className="px-3 py-2 text-sm text-gray-600">
                {userName}
              </div>

              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>

              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
