'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Megaphone,
  Building2,
  Users,
  Send,
  Upload,
  UserMinus,
  ArrowRight,
} from 'lucide-react';
import { fetchOutreachStats } from './actions';

interface Stats {
  companies: number;
  contacts: number;
  campaigns: number;
  unsubscribes: number;
}

export default function OutreachDashboard() {
  const [stats, setStats] = useState<Stats>({ companies: 0, contacts: 0, campaigns: 0, unsubscribes: 0 });

  useEffect(() => {
    fetchOutreachStats().then((r) => {
      if (r.ok && r.data) setStats(r.data as Stats);
    });
  }, []);

  const kpis: { label: string; value: number; icon: React.ReactNode; color: string; href: string }[] = [
    { label: 'Companies', value: stats.companies, icon: <Building2 className="h-5 w-5" />, color: 'text-blue-500', href: '/admin/outreach/companies' },
    { label: 'Contacts', value: stats.contacts, icon: <Users className="h-5 w-5" />, color: 'text-green-500', href: '/admin/outreach/contacts' },
    { label: 'Campaigns', value: stats.campaigns, icon: <Send className="h-5 w-5" />, color: 'text-orange-500', href: '/admin/outreach/campaigns' },
    { label: 'Unsubscribes', value: stats.unsubscribes, icon: <UserMinus className="h-5 w-5" />, color: 'text-red-500', href: '/admin/outreach/contacts' },
  ];

  const quickActions: { label: string; description: string; icon: React.ReactNode; href: string }[] = [
    { label: 'Import Contacts', description: 'Upload a CSV file with companies and contacts', icon: <Upload className="h-5 w-5" />, href: '/admin/outreach/import' },
    { label: 'New Campaign', description: 'Create and send a new email campaign', icon: <Send className="h-5 w-5" />, href: '/admin/outreach/campaigns/new' },
    { label: 'Manage Companies', description: 'View and edit your company database', icon: <Building2 className="h-5 w-5" />, href: '/admin/outreach/companies' },
    { label: 'Manage Contacts', description: 'View, filter, and edit contacts', icon: <Users className="h-5 w-5" />, href: '/admin/outreach/contacts' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-[var(--vn-primary)]" />
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Outreach</h1>
          <p className="text-muted-foreground text-sm">Manage companies, contacts, and email campaigns</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href}>
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="pt-5 pb-4 px-4 flex flex-col items-center text-center gap-1">
                <span className={kpi.color}>{kpi.icon}</span>
                <span className="text-2xl font-bold font-display">{kpi.value}</span>
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quickActions.map((action) => (
          <Link key={action.label} href={action.href}>
            <Card className="rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-[var(--vn-primary)]">
                  {action.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm">{action.label}</h3>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
