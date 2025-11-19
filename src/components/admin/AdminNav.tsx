'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  MessageCircle,
  Settings,
  Shield,
  Home,
  Menu,
  X,
  LogOut,
  Crown,
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
    { href: '/admin-interface', label: 'Support Tickets', icon: Ticket },
  ];

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email;

  return (
    <nav className="border-b border-border/50 bg-gradient-to-r from-yellow-50 to-orange-50 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link href="/admin" className="flex items-center space-x-3 group">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-all duration-300">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl text-gray-900">Admin Portal</span>
                <span className="text-xs text-gray-600">VexNexa Management</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:space-x-2">
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      active
                        ? 'bg-white text-orange-600 shadow-md'
                        : 'text-gray-700 hover:bg-white/50 hover:text-orange-600'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="border-orange-300 text-orange-700 hover:bg-orange-50">
                <Home className="w-4 h-4 mr-2" />
                User Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg shadow-sm">
              <Shield className="w-5 h-5 text-yellow-600" />
              <div className="text-sm">
                <div className="font-medium text-gray-900">{userName}</div>
                <div className="text-xs text-gray-500">Administrator</div>
              </div>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-white/50 focus:outline-none transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-orange-200 bg-white/95 backdrop-blur">
          <div className="px-4 pt-4 pb-3 space-y-2">
            {adminNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-base font-medium rounded-lg transition-colors',
                    active
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}

            {/* Mobile user info and actions */}
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <div className="px-4 py-2 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-yellow-600" />
                  <span className="text-xs text-gray-500">Administrator</span>
                </div>
                <div className="text-sm font-medium text-gray-900">{userName}</div>
              </div>

              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full justify-start border-orange-300 text-orange-700">
                  <Home className="w-4 h-4 mr-2" />
                  User Dashboard
                </Button>
              </Link>

              <button
                onClick={handleSignOut}
                className="flex items-center w-full px-4 py-3 text-base font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
