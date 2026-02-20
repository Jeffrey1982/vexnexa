'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, CreditCard, Users as UsersIcon, BarChart3, Settings } from 'lucide-react';

export function MollieQuickLinks() {
  const links = [
    {
      href: 'https://www.mollie.com/dashboard/payments',
      label: 'Payments',
      description: 'View all transactions',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      href: 'https://www.mollie.com/dashboard/subscriptions',
      label: 'Subscriptions',
      description: 'Manage recurring billing',
      icon: UsersIcon,
      color: 'text-green-600'
    },
    {
      href: 'https://www.mollie.com/dashboard/analytics',
      label: 'Analytics',
      description: 'Revenue insights',
      icon: BarChart3,
      color: 'text-purple-600'
    },
    {
      href: 'https://www.mollie.com/dashboard/settings',
      label: 'Settings',
      description: 'Configure payment methods',
      icon: Settings,
      color: 'text-muted-foreground'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <span className="font-bold text-black dark:text-white">Mollie</span>
              Quick Links
            </CardTitle>
            <CardDescription>Access Mollie dashboard directly</CardDescription>
          </div>
          <a
            href="https://www.mollie.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            Open Dashboard
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center p-4 rounded-xl border border-border/50 dark:border-white/[0.06] hover:border-primary/30 dark:hover:border-primary/30 bg-card dark:bg-[var(--surface-2)] hover:bg-muted/50 dark:hover:bg-[var(--surface-3)] transition-all duration-200 group dark:ring-1 dark:ring-inset dark:ring-white/[0.04] dark:hover:ring-white/[0.08] focus-visible:ring-2 focus-visible:ring-primary"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 dark:bg-white/[0.06] mb-2 group-hover:scale-105 transition-transform duration-200">
                  <Icon className={`w-5 h-5 ${link.color} dark:opacity-90`} />
                </div>
                <div className="text-sm font-medium text-foreground text-center">
                  {link.label}
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {link.description}
                </div>
                <ExternalLink className="w-3 h-3 text-muted-foreground mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
