'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  Award,
  BarChart3,
  Bell,
  Calendar,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  DollarSign,
  Eye,
  FileText,
  Globe,
  LayoutDashboard,
  Menu,
  Palette,
  Radar,
  Search,
  Settings as SettingsIcon,
  Ticket,
  TrendingUp,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import VexnexaLogo from '@/components/brand/VexnexaLogo';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  items: NavItem[];
}

const primaryNavItems: NavItem[] = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/scans', label: 'Scans', icon: Radar },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/sites', label: 'Sites', icon: Globe },
];

const navGroups: NavGroup[] = [
  {
    label: 'Insights',
    icon: BarChart3,
    items: [
      { href: '/admin/analytics', label: 'Usage Analytics', icon: BarChart3 },
      { href: '/admin/analytics-advanced', label: 'Advanced Analytics', icon: TrendingUp },
      { href: '/admin/health', label: 'Customer Health', icon: Activity },
      { href: '/admin/api-logs', label: 'API Logs', icon: Database },
      { href: '/admin/system-health', label: 'System Health', icon: Activity },
    ],
  },
  {
    label: 'Business',
    icon: DollarSign,
    items: [
      { href: '/admin/billing', label: 'Billing', icon: DollarSign },
      { href: '/admin/payments', label: 'Payments', icon: DollarSign },
      { href: '/admin/upgrade', label: 'Upgrades', icon: TrendingUp },
      { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
      { href: '/admin/assurance-schedules', label: 'Assurance Schedules', icon: Calendar },
    ],
  },
  {
    label: 'SEO',
    icon: Search,
    items: [
      { href: '/admin/seo', label: 'Overview', icon: Search },
      { href: '/admin/seo/index-health', label: 'Index Health', icon: Database },
      { href: '/admin/seo/visibility', label: 'Visibility', icon: Eye },
      { href: '/admin/seo/page-quality', label: 'Page Quality', icon: Award },
      { href: '/admin/seo/alerts', label: 'Alerts', icon: Bell },
      { href: '/admin/seo/settings', label: 'Settings', icon: SettingsIcon },
    ],
  },
  {
    label: 'Workspace',
    icon: UserCog,
    items: [
      { href: '/admin/teams', label: 'Teams', icon: UserCog },
      { href: '/admin/white-label', label: 'Branding', icon: Palette },
      { href: '/admin/deleted-items', label: 'Deleted Items', icon: ClipboardList },
      { href: '/admin/audit-logs', label: 'Audit Logs', icon: ClipboardList },
    ],
  },
  {
    label: 'Support',
    icon: Ticket,
    items: [
      { href: '/admin/support/tickets', label: 'Tickets', icon: Ticket },
      { href: '/admin/support/messages', label: 'Messages', icon: ClipboardList },
      { href: '/admin/support/contact-logs', label: 'Contact Logs', icon: ClipboardList },
      { href: '/admin/contact-messages', label: 'Contact Messages', icon: ClipboardList },
      { href: '/admin/blog', label: 'Blog', icon: FileText },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeGroups = useMemo(
    () => navGroups.filter((group) => group.items.some((item) => pathname === item.href || pathname?.startsWith(item.href + '/'))).map((group) => group.label),
    [pathname]
  );
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Insights', 'Business', 'Support']);

  const openGroups = useMemo(() => Array.from(new Set([...expandedGroups, ...activeGroups])), [expandedGroups, activeGroups]);

  const isActive = (path: string) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }

    return pathname === path || pathname?.startsWith(path + '/');
  };

  const toggleGroup = (label: string) => {
    setExpandedGroups((current) =>
      current.includes(label) ? current.filter((item) => item !== label) : [...current, label]
    );
  };

  const NavLink = ({ item, inset = false }: { item: NavItem; inset?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.href);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl text-sm font-medium transition-all',
          inset ? 'mx-3 px-4 py-2' : 'px-3 py-2.5',
          active
            ? 'bg-teal-500 text-slate-950 shadow-sm'
            : 'text-slate-200 hover:bg-white/10 hover:text-white'
        )}
      >
        {active && <span className="absolute left-0 top-2 bottom-2 w-1 rounded-full bg-[#0A0F1E]/70" />}
        <Icon className={cn('h-4 w-4 shrink-0', !inset && 'h-5 w-5')} />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  const SidebarContent = () => (
    <div className="relative z-10 flex h-full flex-col">
      <div className="border-b border-white/10 p-4">
        <div className="flex items-center gap-3">
          <VexnexaLogo size={42} className="[&_span]:!text-white" />
          <div className="min-w-0">
            <div className="font-bold text-lg text-white">Admin</div>
            <div className="text-xs text-slate-300">Control Center</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <div className="space-y-1">
          {primaryNavItems.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </div>

        <div className="my-4 h-px bg-white/10" />

        <div className="space-y-1">
          {navGroups.map((group) => {
            const Icon = group.icon;
            const expanded = openGroups.includes(group.label);
            const active = activeGroups.includes(group.label);

            return (
              <div key={group.label}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  aria-expanded={expanded}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all',
                    active ? 'text-teal-300' : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{group.label}</span>
                  {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                </button>

                {expanded && (
                  <div className="mt-1 space-y-1 pb-2">
                    {group.items.map((item) => (
                      <NavLink key={item.href} item={item} inset />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </nav>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar"
        className="fixed left-4 top-4 z-[60] rounded-xl border border-gray-200 bg-white p-2 shadow-lg lg:hidden dark:border-border dark:bg-card"
      >
        {mobileOpen ? <X className="h-5 w-5 text-muted-foreground" /> : <Menu className="h-5 w-5 text-muted-foreground" />}
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 pointer-events-auto lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        id="admin-sidebar"
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-72 border-r border-white/10 bg-[#0A0F1E] transition-transform pointer-events-auto',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
