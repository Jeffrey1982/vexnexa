# Quick Fixes for Broken Links

## Fix 1: /settings Link (2 locations)

### File: src/app/dashboard-client/page.tsx

**Line 204:** Change this:
```typescript
<Link href="/settings">
```

**To:**
```typescript
<Link href="/settings/billing">
```

### File: src/app/main-dashboard/page.tsx

**Line 106:** Change this:
```typescript
<Link href="/settings">
```

**To:**
```typescript
<Link href="/settings/billing">
```

---

## Fix 2: /home Link (1 location)

### File: src/lib/ai-insights.ts

**Line 113:** Change this:
```typescript
<a href="/home" role="menuitem">Home</a>
```

**To:**
```typescript
<a href="/" role="menuitem">Home</a>
```

---

## Alternative: Create Settings Landing Page

Instead of changing links to `/settings/billing`, you can create a settings landing page:

### Create: src/app/settings/page.tsx

```typescript
import { requireAuth } from '@/lib/auth';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Bell, Palette } from 'lucide-react';

export default async function SettingsPage() {
  await requireAuth();

  const settingsSections = [
    {
      title: 'Billing',
      description: 'Manage your subscription, payment methods, and billing history',
      href: '/settings/billing',
      icon: CreditCard,
    },
    {
      title: 'Notifications',
      description: 'Configure email and in-app notification preferences',
      href: '/settings/notifications',
      icon: Bell,
    },
    {
      title: 'White Label',
      description: 'Customize branding and white label settings',
      href: '/settings/white-label',
      icon: Palette,
    },
  ];

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full transition-all hover:shadow-md hover:border-primary/50">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle>{section.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>{section.description}</CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
```

This provides a better user experience by showing all available settings options.
