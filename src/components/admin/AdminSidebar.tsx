'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Globe,
  Activity,
  BarChart3,
  TrendingUp,
  DollarSign,
  Ticket,
  Mail,
  FileText,
  Palette,
  UserCog,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Search,
  Database,
  Eye,
  Award,
  Bell,
  Settings as SettingsIcon,
  ScrollText,
  HeartPulse,
  Webhook,
  ShieldBan,
  LayoutTemplate,
  SendHorizonal,
  ServerCog,
  MessageSquare,
  ClipboardList,
  Inbox,
  Megaphone,
  Building2,
  Upload,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function AdminSidebar() {
  const pathname = usePathname();
  // Keep all groups permanently expanded for better UX in sidebar
  const [expandedGroups] = useState<string[]>(['Resources', 'Business', 'Mail', 'Outreach', 'Support', 'SEO Health']);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/');
  };

  const isGroupActive = (items: NavItem[]) => {
    return items.some(item => isActive(item.href));
  };

  // Groups are always expanded, no toggle needed
  // const toggleGroup = (label: string) => {
  //   console.log('[AdminSidebar] Toggling group:', label);
  //   setExpandedGroups(prev => {
  //     const newGroups = prev.includes(label)
  //       ? prev.filter(g => g !== label)
  //       : [...prev, label];
  //     console.log('[AdminSidebar] New expanded groups:', newGroups);
  //     return newGroups;
  //   });
  // };

  // Primary navigation items (always visible)
  const primaryNavItems: NavItem[] = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/health', label: 'Health', icon: Activity },
  ];

  // Grouped navigation items
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
        { href: '/admin/payments', label: 'Payments', icon: DollarSign },
        { href: '/admin/upgrade', label: 'Upgrades', icon: TrendingUp },
        { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
        { href: '/admin/assurance-schedules', label: 'Assurance Schedules', icon: Calendar },
      ]
    },
    {
      label: 'SEO Health',
      icon: Search,
      items: [
        { href: '/admin/seo', label: 'Overview', icon: Search },
        { href: '/admin/seo/index-health', label: 'Index Health', icon: Database },
        { href: '/admin/seo/visibility', label: 'Visibility', icon: Eye },
        { href: '/admin/seo/page-quality', label: 'Page Quality', icon: Award },
        { href: '/admin/seo/alerts', label: 'Alerts', icon: Bell },
        { href: '/admin/seo/settings', label: 'Settings', icon: SettingsIcon },
      ]
    },
    {
      label: 'Mail',
      icon: Mail,
      items: [
        { href: '/admin/email', label: 'Email Overview', icon: Mail },
        { href: '/admin/email/logs', label: 'Message Logs', icon: ScrollText },
        { href: '/admin/email/health', label: 'Delivery Health', icon: HeartPulse },
        { href: '/admin/email/events', label: 'Webhook Events', icon: Webhook },
        { href: '/admin/email/suppressions', label: 'Suppressions', icon: ShieldBan },
        { href: '/admin/email/templates', label: 'Templates', icon: LayoutTemplate },
        { href: '/admin/email/send-test', label: 'Send Test', icon: SendHorizonal },
        { href: '/admin/email/domains', label: 'Domains & DNS', icon: ServerCog },
      ]
    },
    {
      label: 'Outreach',
      icon: Megaphone,
      items: [
        { href: '/admin/outreach', label: 'Overview', icon: Megaphone },
        { href: '/admin/outreach/companies', label: 'Companies', icon: Building2 },
        { href: '/admin/outreach/contacts', label: 'Contacts', icon: Users },
        { href: '/admin/outreach/import', label: 'Import CSV', icon: Upload },
        { href: '/admin/outreach/campaigns', label: 'Campaigns', icon: SendHorizonal },
      ]
    },
    {
      label: 'Support',
      icon: Ticket,
      items: [
        { href: '/admin/support/tickets', label: 'Tickets', icon: Ticket },
        { href: '/admin/support/messages', label: 'Messages', icon: Inbox },
        { href: '/admin/support/contact-logs', label: 'Contact Form Logs', icon: ClipboardList },
        { href: '/admin/blog', label: 'Blog', icon: FileText },
      ]
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full relative z-10">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200 dark:border-border">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
              <path d="M2 8 L12 20 L22 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="text-gray-900 dark:text-foreground font-bold text-lg">VexNexa</div>
            <div className="text-muted-foreground dark:text-muted-foreground text-xs">Admin Panel</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Primary Items */}
        <div className="px-3 space-y-1">
          {primaryNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-all',
                  active
                    ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 shadow-sm'
                    : 'text-foreground/80 hover:bg-gray-50 dark:hover:bg-muted'
                )}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Grouped Items */}
        <div className="mt-6 space-y-1">
          {navGroups.map((group) => {
            const Icon = group.icon;
            const isExpanded = expandedGroups.includes(group.label);
            const active = isGroupActive(group.items);

            return (
              <div key={group.label}>
                <div
                  className={cn(
                    'w-full flex items-center gap-3 px-6 py-2.5 text-sm font-semibold',
                    active ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className="w-4 h-4 flex-shrink-0" />
                </div>

                {isExpanded && (
                  <div className="mt-1 space-y-1">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const itemActive = isActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileOpen(false)}
                          aria-current={itemActive ? 'page' : undefined}
                          className={cn(
                            'flex items-center gap-3 px-12 py-2 text-sm font-medium rounded-lg transition-all mx-3',
                            itemActive
                              ? 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400'
                              : 'text-muted-foreground hover:bg-gray-50 dark:hover:bg-muted hover:text-gray-900 dark:text-foreground dark:hover:text-foreground'
                          )}
                        >
                          <ItemIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 bg-white dark:bg-card rounded-lg shadow-lg border border-gray-200 dark:border-border"
      >
        {mobileOpen ? (
          <X className="w-5 h-5 text-muted-foreground" />
        ) : (
          <Menu className="w-5 h-5 text-muted-foreground" />
        )}
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 pointer-events-auto"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        id="admin-sidebar"
        role="navigation"
        aria-label="Admin navigation"
        className={cn(
          'fixed top-0 left-0 z-50 h-screen bg-white dark:bg-[var(--surface-1)] border-r border-gray-200 dark:border-white/[0.06] transition-transform pointer-events-auto',
          'w-72',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
