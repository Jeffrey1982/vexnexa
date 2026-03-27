'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  FileText,
  TrendingUp,
  Home,
  Menu,
  X,
  LogOut,
  Ticket,
  Mail,
  BarChart3,
  DollarSign,
  Activity,
  Globe,
  Palette,
  UserCog,
  ChevronDown,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client-new';
import VexnexaLogo from '@/components/brand/VexnexaLogo';

interface AdminNavProps {
  user?: {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
}

interface NavGroup {
  label: string;
  icon: any;
  items: NavItem[];
}

export function AdminNav({ user }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const supabase = createClient();

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const isGroupActive = (items: NavItem[]) => {
    return items.some(item => isActive(item.href));
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

  // Primary navigation items (always visible)
  const primaryNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/health', label: 'Health', icon: Activity },
  ];

  // Grouped navigation items (in dropdowns)
  const navGroups: NavGroup[] = [
    {
      label: 'Resources',
      icon: Globe,
      items: [
        { href: '/admin/sites', label: 'Sites', icon: Globe },
        { href: '/admin/teams', label: 'Teams', icon: UserCog },
        { href: '/admin/white-label', label: 'Branding', icon: Palette },
      ]
    },
    {
      label: 'Business',
      icon: BarChart3,
      items: [
        { href: '/admin/analytics', label: 'Usage Analytics', icon: BarChart3 },
        { href: '/admin/analytics-advanced', label: 'Advanced Analytics', icon: TrendingUp },
        { href: '/admin/billing', label: 'Billing', icon: DollarSign },
        { href: '/admin/upgrade', label: 'Upgrades', icon: TrendingUp },
      ]
    },
    {
      label: 'Mail',
      icon: Mail,
      items: [
        { href: '/admin/email', label: 'Email Overview', icon: Mail },
        { href: '/admin/email/logs', label: 'Message Logs', icon: Mail },
        { href: '/admin/email/health', label: 'Delivery Health', icon: Activity },
        { href: '/admin/email/events', label: 'Webhook Events', icon: Activity },
        { href: '/admin/email/send-test', label: 'Send Test', icon: Mail },
      ]
    },
    {
      label: 'Support',
      icon: Ticket,
      items: [
        { href: '/admin/support/tickets', label: 'Tickets', icon: Ticket },
        { href: '/admin/support/messages', label: 'Messages', icon: Mail },
        { href: '/admin/support/contact-logs', label: 'Contact Form Logs', icon: FileText },
        { href: '/admin/blog', label: 'Blog', icon: FileText },
      ]
    },
  ];

  const userName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.email;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-primary to-blue-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/admin" className="flex items-center gap-3 group">
              <div className="bg-white rounded-lg p-1.5 shadow-md transition-transform group-hover:scale-105">
                <VexnexaLogo size={36} />
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold tracking-tight text-white">
                  Admin Panel
                </div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:gap-1">
              {/* Primary Items */}
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                      active
                        ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}

              {/* Grouped Items with Dropdowns */}
              {navGroups.map((group) => {
                const Icon = group.icon;
                const active = isGroupActive(group.items);
                const isOpen = openDropdown === group.label;

                return (
                  <div
                    key={group.label}
                    className="relative"
                    onMouseEnter={() => setOpenDropdown(group.label)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      onClick={() => setOpenDropdown(isOpen ? null : group.label)}
                      className={cn(
                        'inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                        active
                          ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{group.label}</span>
                      <ChevronDown className={cn(
                        "w-3 h-3 transition-transform",
                        isOpen && "rotate-180"
                      )} />
                    </button>

                    {/* Dropdown Menu */}
                    {isOpen && (
                      <div
                        className="absolute top-full left-0 pt-1 w-48 z-50"
                      >
                        <div className="bg-white rounded-lg shadow-xl border border-gray-200 dark:border-white/[0.06] overflow-hidden"
                        >
                        {group.items.map((item) => {
                          const ItemIcon = item.icon;
                          const itemActive = isActive(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                'flex items-center gap-3 px-4 py-3 text-sm transition-colors',
                                itemActive
                                  ? 'bg-primary/10 font-medium text-primary dark:bg-primary/20'
                                  : 'text-gray-700 dark:text-muted-foreground hover:bg-gray-50'
                              )}
                              onClick={() => setOpenDropdown(null)}
                            >
                              <ItemIcon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 hover:text-white"
              >
                <Home className="w-4 h-4 mr-2" />
                My Dashboard
              </Button>
            </Link>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-lg text-sm border border-white/20">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium hidden xl:inline">{userName}</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
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
        <div className="border-t border-white/20 bg-gradient-to-b from-primary to-blue-600 lg:hidden">
          <div className="px-4 py-3 space-y-1">
            {/* Primary Items */}
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-all',
                    active
                      ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}

            {/* Grouped Items */}
            {navGroups.map((group) => {
              const Icon = group.icon;
              const active = isGroupActive(group.items);
              return (
                <div key={group.label} className="space-y-1">
                  <div className={cn(
                    'flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                    'mt-3 text-white/70'
                  )}>
                    <Icon className="w-3 h-3" />
                    {group.label}
                  </div>
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const itemActive = isActive(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-6 py-2 text-sm font-medium rounded-lg transition-all',
                          itemActive
                            ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm'
                            : 'text-white/80 hover:bg-white/10 hover:text-white'
                        )}
                      >
                        <ItemIcon className="w-4 h-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}

            {/* Mobile user info and actions */}
            <div className="pt-3 mt-3 border-t border-white/20 space-y-2">
              <div className="px-3 py-2 text-sm text-white font-medium bg-white/10 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  {userName}
                </div>
              </div>

              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
                >
                  <Home className="w-4 h-4 mr-2" />
                  My Dashboard
                </Button>
              </Link>

              <Button
                onClick={handleSignOut}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-white hover:bg-white/10 hover:text-white"
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
