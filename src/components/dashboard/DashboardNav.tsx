'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Globe,
  Settings,
  Users,
  ChevronDown,
  CreditCard,
  Bell,
  Palette,
  Home,
  Menu,
  X,
  LogOut,
  Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client-new';
import { LanguageSelector } from '@/components/LanguageSelector';

interface DashboardNavProps {
  user?: {
    email?: string;
    user_metadata?: {
      full_name?: string;
      avatar_url?: string;
      is_admin?: boolean;
    };
  } | null;
}

export default function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
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

  const mainNavItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/scans', label: 'Scans', icon: Search },
    { href: '/sites', label: 'Sites', icon: Globe },
    { href: '/teams', label: 'Teams', icon: Users },
  ];

  const settingsItems = [
    { href: '/settings/billing', label: 'Billing', icon: CreditCard },
    { href: '/settings/notifications', label: 'Notifications', icon: Bell },
    { href: '/settings/white-label', label: 'White Label', icon: Palette },
  ];

  return (
    <nav className="border-b border-border/50 glass shadow-elegant sticky top-0 z-50 transition-all duration-200">
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Desktop Nav */}
          <div className="flex">
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center shadow-elegant group-hover:scale-105 transition-all duration-300 group-hover:shadow-soft">
                <span className="text-primary-foreground font-bold text-base">T</span>
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-xl group-hover:text-primary transition-colors duration-200">VexNexa</span>
                <span className="text-xs text-muted-foreground -mt-0.5">by Vexnexa</span>
                <span className="text-[10px] text-muted-foreground/80 -mt-0.5">Your Secure Path to Accessibility</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:items-center md:space-x-8">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 relative py-2',
                      'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-primary/80 after:transition-all after:duration-200 after:rounded-full',
                      isActive(item.href)
                        ? 'text-primary after:w-full'
                        : 'text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}

              {/* Settings Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setSettingsOpen(!settingsOpen)}
                  className={cn(
                    'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 relative py-2',
                    pathname?.startsWith('/settings')
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                  <ChevronDown className={cn(
                    "w-3 h-3 transition-transform duration-200",
                    settingsOpen && "rotate-180"
                  )} />
                </button>

                {settingsOpen && (
                  <div className="absolute left-0 mt-2 w-52 glass rounded-lg shadow-elegant border border-border/50 py-2 overflow-hidden">
                    {settingsItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSettingsOpen(false)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200',
                            isActive(item.href)
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Admin Link (if admin) */}
              {user?.user_metadata?.is_admin && (
                <Link
                  href="/admin"
                  className={cn(
                    'inline-flex items-center gap-2 text-sm font-medium transition-all duration-200 relative py-2',
                    'after:absolute after:bottom-0 after:left-0 after:h-0.5 after:bg-gradient-to-r after:from-primary after:to-primary/80 after:transition-all after:duration-200 after:rounded-full',
                    isActive('/admin')
                      ? 'text-primary after:w-full'
                      : 'text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full'
                  )}
                >
                  <Shield className="w-4 h-4" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Right side - Language, User info and Sign out */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <LanguageSelector />
            {user && (
              <div className="text-sm text-muted-foreground font-medium">
                {user.user_metadata?.full_name || user.email}
              </div>
            )}
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="sm"
              className="flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 focus:outline-none transition-colors"
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
        <div className="md:hidden border-t border-border/50 glass">
          <div className="px-4 pt-4 pb-3 space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-base font-medium rounded-md',
                    isActive(item.href)
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            {/* Settings Section */}
            <div className="pt-2 border-t border-gray-200">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Settings
              </div>
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center px-3 py-2 text-base font-medium rounded-md',
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Admin Link (mobile) */}
            {user?.user_metadata?.is_admin && (
              <div className="pt-2 border-t border-gray-200">
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center px-3 py-2 text-base font-medium rounded-md',
                    isActive('/admin')
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Shield className="w-5 h-5 mr-3" />
                  Admin
                </Link>
              </div>
            )}

            {/* Language Selector (mobile) */}
            <div className="pt-4 border-t border-gray-200">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                Language
              </div>
              <div className="px-3">
                <LanguageSelector />
              </div>
            </div>

            {/* User info and sign out (mobile) */}
            {user && (
              <div className="pt-4 border-t border-gray-200">
                <div className="px-3 py-2 text-sm text-gray-700">
                  {user.user_metadata?.full_name || user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
