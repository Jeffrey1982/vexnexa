import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Bell, Palette, Settings as SettingsIcon } from 'lucide-react';
import Link from 'next/link';

export default async function SettingsPage() {
  const user = await requireAuth();

  const settingsPages = [
    {
      title: 'Billing',
      description: 'Manage your subscription, payment methods, and billing history',
      href: '/settings/billing',
      icon: CreditCard,
      color: 'text-blue-600'
    },
    {
      title: 'Notifications',
      description: 'Configure email notifications, alerts, and preferences',
      href: '/settings/notifications',
      icon: Bell,
      color: 'text-green-600'
    },
    {
      title: 'White Label',
      description: 'Customize branding, logos, and appearance for your account',
      href: '/settings/white-label',
      icon: Palette,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          </div>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {settingsPages.map((setting) => {
            const Icon = setting.icon;
            return (
              <Card
                key={setting.href}
                className="hover:shadow-lg transition-shadow cursor-pointer"
              >
                <Link href={setting.href}>
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className={`w-6 h-6 ${setting.color}`} />
                      <CardTitle>{setting.title}</CardTitle>
                    </div>
                    <CardDescription>{setting.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full">
                      Manage {setting.title}
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>

        {/* Additional Settings Sections */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-4">Account Information</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Email</span>
                  <span className="font-medium">{user.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Name</span>
                  <span className="font-medium">
                    {user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.firstName || 'Not set'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
