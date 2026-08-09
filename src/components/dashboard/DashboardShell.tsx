'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  LayoutDashboard,
  Search,
  Globe,
  Shield,
  Users,
  MessageCircle,
  CreditCard,
  Bell,
  Palette,
  Home,
  Menu,
  X,
  LogOut,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client-new';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import VexnexaLogo from '@/components/brand/VexnexaLogo';
import type { Branding } from '@/lib/branding';

export interface ShellUser {
  email: string;
  name: string | null;
  isAdmin: boolean;
}

interface DashboardShellProps {
  user: ShellUser | null;
  branding: Branding;
  children: React.ReactNode;
}

interface NavItem {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavGroup {
  labelKey: string | null;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    labelKey: null,
    items: [{ href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, exact: true }],
  },
  {
    labelKey: 'groups.workspace',
    items: [
      { href: '/scans', labelKey: 'nav.scans', icon: Search },
      { href: '/sites', labelKey: 'nav.sites', icon: Globe },
    ],
  },
  {
    labelKey: 'groups.monitoring',
    items: [{ href: '/dashboard/assurance', labelKey: 'nav.assurance', icon: Shield }],
  },
  {
    labelKey: 'groups.organization',
    items: [
      { href: '/teams', labelKey: 'nav.teams', icon: Users },
      { href: '/dashboard/support', labelKey: 'nav.support', icon: MessageCircle },
    ],
  },
  {
    labelKey: 'groups.settings',
    items: [
      { href: '/settings/billing', labelKey: 'nav.billing', icon: CreditCard },
      { href: '/settings/notifications', labelKey: 'nav.notifications', icon: Bell },
      { href: '/settings/white-label', labelKey: 'nav.whiteLabel', icon: Palette },
    ],
  },
];

const ADMIN_GROUP: NavGroup = {
  labelKey: 'groups.admin',
  items: [
    { href: '/admin', labelKey: 'nav.admin', icon: ShieldCheck },
    { href: '/admin/support/tickets', labelKey: 'nav.supportAdmin', icon: MessageCircle },
  ],
};

function initialsFor(user: ShellUser): string {
  if (user.name) {
    const parts = user.name.trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }
  return user.email.slice(0, 2).toUpperCase();
}

function BrandMark({ branding, compact = false }: { branding: Branding; compact?: boolean }) {
  if (branding.isWhiteLabel && branding.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={branding.logoUrl}
        alt={branding.companyName}
        className={cn('object-contain', compact ? 'h-8 max-w-[140px]' : 'h-9 max-w-[170px]')}
      />
    );
  }
  if (branding.isWhiteLabel) {
    return (
      <span className="font-display text-lg font-bold tracking-tight text-foreground truncate">
        {branding.companyName}
      </span>
    );
  }
  return <VexnexaLogo size={compact ? 36 : 42} />;
}

export default function DashboardShell({ user, branding, children }: DashboardShellProps) {
  const pathname = usePathname();
  const t = useTranslations('dashboardShell');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Close overlays on navigation
  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Close user menu on outside click / Escape
  useEffect(() => {
    if (!userMenuOpen && !mobileOpen) return;
    const onClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [userMenuOpen, mobileOpen]);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname?.startsWith(item.href + '/');

  const handleSignOut = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
      }
      await supabase.auth.signOut();
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/';
    } catch {
      window.location.href = '/';
    }
  };

  const groups = user?.isAdmin ? [...NAV_GROUPS, ADMIN_GROUP] : NAV_GROUPS;

  const sidebarNav = (
    <nav aria-label={t('mainNavLabel')} className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
      {groups.map((group, gi) => (
        <div key={gi}>
          {group.labelKey && (
            <p className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {t(group.labelKey)}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 shrink-0 transition-colors',
                        active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                      )}
                    />
                    <span className="truncate">{t(item.labelKey)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const sidebarFooter = (
    <div className="border-t border-border/60 px-4 py-3 space-y-2">
      <Link
        href="/"
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
        {t('nav.home')}
      </Link>
      {branding.isWhiteLabel && (
        <p className="text-[11px] text-muted-foreground/60">
          {t('poweredBy')}{' '}
          <span className="font-semibold text-muted-foreground/80">VexNexa</span>
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col fixed inset-y-0 left-0 z-40 w-64 border-r border-border/60 bg-card">
        <div className="flex h-16 items-center px-5 border-b border-border/60">
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <BrandMark branding={branding} />
          </Link>
        </div>
        {sidebarNav}
        {sidebarFooter}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative flex w-72 max-w-[85vw] flex-col bg-card border-r border-border/60 shadow-elegant">
            <div className="flex h-16 items-center justify-between px-4 border-b border-border/60">
              <BrandMark branding={branding} compact />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label={t('closeMenu')}
                className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebarNav}
            {sidebarFooter}
          </div>
        </div>
      )}

      {/* Main column */}
      <div className="lg:pl-64 flex min-h-screen flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 border-b border-border/60 glass">
          <div className="flex h-full items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label={t('openMenu')}
                className="lg:hidden rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <Link href="/dashboard" className="lg:hidden flex items-center min-w-0">
                <BrandMark branding={branding} compact />
              </Link>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <LanguageSelector />
              <ThemeToggle />
              {user && (
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setUserMenuOpen((o) => !o)}
                    aria-expanded={userMenuOpen}
                    aria-haspopup="menu"
                    className="flex items-center gap-2 rounded-full p-1 pr-2 hover:bg-muted transition-colors"
                  >
                    <span
                      aria-hidden="true"
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold"
                    >
                      {initialsFor(user)}
                    </span>
                    <span className="hidden sm:block max-w-[140px] truncate text-sm font-medium text-foreground">
                      {user.name || user.email}
                    </span>
                    <ChevronDown
                      className={cn(
                        'hidden sm:block h-3.5 w-3.5 text-muted-foreground transition-transform',
                        userMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-60 rounded-xl border border-border/60 bg-popover shadow-soft py-2 overflow-hidden"
                    >
                      <div className="px-4 py-2 border-b border-border/60">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.name || user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          href="/settings/billing"
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <CreditCard className="h-4 w-4" />
                          {t('nav.billing')}
                        </Link>
                        <Link
                          href="/settings/notifications"
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Bell className="h-4 w-4" />
                          {t('nav.notifications')}
                        </Link>
                        <Link
                          href="/settings/white-label"
                          role="menuitem"
                          className="flex items-center gap-3 px-4 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Palette className="h-4 w-4" />
                          {t('nav.whiteLabel')}
                        </Link>
                      </div>
                      <div className="border-t border-border/60 pt-1">
                        <button
                          onClick={handleSignOut}
                          role="menuitem"
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          {t('signOut')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main id="main-content" tabIndex={-1} className="flex-1">
          {children}
        </main>

        {/* Slim footer */}
        <footer className="border-t border-border/60 py-4 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              © {new Date().getFullYear()} {branding.companyName}
              {branding.footerText ? ` — ${branding.footerText}` : ''}
            </p>
            {branding.isWhiteLabel ? (
              branding.supportEmail && (
                <a
                  href={`mailto:${branding.supportEmail}`}
                  className="hover:text-foreground transition-colors"
                >
                  {branding.supportEmail}
                </a>
              )
            ) : (
              <div className="flex items-center gap-4">
                <Link href="/legal/privacy" className="hover:text-foreground transition-colors">
                  {t('footer.privacy')}
                </Link>
                <Link href="/legal/terms" className="hover:text-foreground transition-colors">
                  {t('footer.terms')}
                </Link>
                <Link href="/contact" className="hover:text-foreground transition-colors">
                  {t('footer.contact')}
                </Link>
              </div>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
