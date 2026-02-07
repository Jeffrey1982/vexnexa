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
      color: 'text-gray-600'
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
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <Icon className={`w-6 h-6 ${link.color} mb-2`} />
                <div className="text-sm font-medium text-gray-900 text-center">
                  {link.label}
                </div>
                <div className="text-xs text-gray-500 text-center mt-1">
                  {link.description}
                </div>
                <ExternalLink className="w-3 h-3 text-gray-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
