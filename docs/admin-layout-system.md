# VexNexa Admin Layout System

## Overview

The Admin Layout System provides a set of reusable, accessible UI components designed to create consistent, professional admin interfaces across all VexNexa modules (Support, Users, Business, Health, etc.).

## Design Principles

1. **Professional & Operational** - Dense, information-rich layouts that prioritize function over form
2. **Consistent Hierarchy** - Clear visual hierarchy with emphasized primary metrics and actions
3. **Action-Oriented** - Empty states and CTAs guide users toward productive actions
4. **Accessible** - WCAG-compliant with strong focus states and keyboard navigation
5. **Responsive** - Mobile-first design that scales to desktop admin workflows

## Core Components

### AdminPageShell

The root container for all admin pages. Provides consistent padding and background treatment.

```tsx
import { AdminPageShell } from '@/components/admin/layout';

<AdminPageShell>
  {/* Your page content */}
</AdminPageShell>
```

**Props:**
- `children`: React.ReactNode - Page content
- `className?`: string - Additional CSS classes
- `dense?`: boolean - Reduce padding for denser layouts (default: false)

---

### AdminPageHeader

Standardized page header with title, subtitle, actions, and metadata.

```tsx
import { AdminPageHeader } from '@/components/admin/layout';
import { Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';

<AdminPageHeader
  title="Support Tickets"
  subtitle="Manage and respond to customer support requests"
  icon={Ticket}
  actions={
    <>
      <Button>Create Ticket</Button>
      <Button variant="outline">Settings</Button>
    </>
  }
/>
```

**Props:**
- `title`: string - Page title (required)
- `subtitle?`: string - Optional description
- `icon?`: LucideIcon - Icon to display next to title
- `iconColor?`: string - Icon color class (default: "text-orange-500")
- `actions?`: React.ReactNode - Primary action buttons
- `secondaryActions?`: React.ReactNode - Secondary actions
- `metadata?`: React.ReactNode - Optional breadcrumbs or metadata
- `className?`: string

---

### AdminKpiGrid

Display KPI cards in a responsive grid with support for emphasizing primary metrics.

```tsx
import { AdminKpiGrid, type KpiCardData } from '@/components/admin/layout';

const kpis: KpiCardData[] = [
  {
    label: "Open Tickets",
    value: 42,
    valueColor: "text-blue-600",
    primary: true, // Emphasized with ring and gradient
    subtitle: "Requires attention"
  },
  {
    label: "Resolved",
    value: 128,
    valueColor: "text-green-600"
  }
];

<AdminKpiGrid kpis={kpis} columns={4} />
```

**Props:**
- `kpis`: KpiCardData[] - Array of KPI data (required)
- `columns?`: 2 | 3 | 4 | 5 | 6 - Desktop columns (default: 4)
- `className?`: string

**KpiCardData Interface:**
```tsx
interface KpiCardData {
  label: string;           // KPI label
  value: string | number;  // KPI value
  icon?: LucideIcon;       // Optional icon
  valueColor?: string;     // Value color class
  primary?: boolean;       // Mark as primary for emphasis
  subtitle?: string;       // Optional context
  trend?: {                // Optional trend indicator
    value: string;
    direction: 'up' | 'down' | 'neutral';
  };
}
```

---

### AdminFilterBar

Collapsible filter controls with auto-collapse when no data exists.

```tsx
import { AdminFilterBar } from '@/components/admin/layout';
import { Select } from '@/components/ui/select';

<AdminFilterBar
  hasActiveFilters={!!statusFilter}
  onClearFilters={() => clearFilters()}
  autoCollapse={dataLength === 0}
>
  <div className="space-y-2">
    <Label>Status</Label>
    <Select>...</Select>
  </div>
  <div className="space-y-2">
    <Label>Priority</Label>
    <Select>...</Select>
  </div>
</AdminFilterBar>
```

**Props:**
- `children`: React.ReactNode - Filter controls (required)
- `hasActiveFilters?`: boolean - Whether filters are active
- `onClearFilters?`: () => void - Clear filters callback
- `autoCollapse?`: boolean - Auto-collapse when no data
- `defaultCollapsed?`: boolean - Start collapsed
- `disabled?`: boolean - Disable all filters
- `className?`: string

---

### AdminEmptyState

Action-oriented empty state with helpful context and clear CTAs.

```tsx
import { AdminEmptyState } from '@/components/admin/layout';
import { Ticket, Plus, Settings } from 'lucide-react';

<AdminEmptyState
  icon={Ticket}
  title="No support tickets yet"
  description="Support tickets help you track and resolve customer issues efficiently."
  actions={[
    {
      label: "Create Test Ticket",
      onClick: () => openDialog(),
      variant: "default",
      icon: Plus
    },
    {
      label: "View Settings",
      href: "/settings",
      variant: "outline",
      icon: Settings
    }
  ]}
  helpText="You can also import tickets from your previous support system."
/>
```

**Props:**
- `icon`: LucideIcon - Icon to display (required)
- `title`: string - Main heading (required)
- `description`: string | React.ReactNode - Description text (required)
- `actions?`: EmptyAction[] - Action buttons
- `helpText?`: React.ReactNode - Additional help text
- `className?`: string

---

### AdminTableShell

Wrapper for admin data tables with header, actions, and optional footer.

```tsx
import { AdminTableShell } from '@/components/admin/layout';
import { Table } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

<AdminTableShell
  title="Support Tickets"
  description="24 tickets found"
  actions={
    <Button size="sm" variant="outline">
      <Download className="w-4 h-4 mr-2" />
      Export
    </Button>
  }
  dense
>
  <Table>
    {/* Table content */}
  </Table>
</AdminTableShell>
```

**Props:**
- `title`: string - Table title (required)
- `description?`: string - Optional count/description
- `actions?`: React.ReactNode - Header action buttons
- `children`: React.ReactNode - Table content (required)
- `footer?`: React.ReactNode - Optional pagination footer
- `dense?`: boolean - Reduce padding
- `className?`: string

---

### AdminContentTabs

Tabbed content navigation for segmenting admin data.

```tsx
import { AdminContentTabs, type TabItem } from '@/components/admin/layout';

const tabs: TabItem[] = [
  {
    value: "all",
    label: "All Tickets",
    count: 42,
    content: <TicketList filter="all" />
  },
  {
    value: "open",
    label: "Open",
    count: 12,
    content: <TicketList filter="open" />
  }
];

<AdminContentTabs
  tabs={tabs}
  defaultValue="all"
  onValueChange={(value) => handleTabChange(value)}
/>
```

**Props:**
- `tabs`: TabItem[] - Array of tab items (required)
- `defaultValue?`: string - Initially active tab
- `onValueChange?`: (value: string) => void - Tab change callback
- `className?`: string

---

## Complete Page Example

Here's how to build a complete admin page using the layout system:

```tsx
import {
  AdminPageShell,
  AdminPageHeader,
  AdminKpiGrid,
  AdminFilterBar,
  AdminEmptyState,
  AdminTableShell,
  AdminContentTabs,
  type KpiCardData,
  type TabItem,
} from '@/components/admin/layout';
import { Button } from '@/components/ui/button';
import { Settings, Plus } from 'lucide-react';

export default async function AdminUsersPage() {
  const stats = await getUserStats();
  const users = await getUsers();

  const kpis: KpiCardData[] = [
    {
      label: "Active Users",
      value: stats.active,
      primary: true,
      valueColor: "text-green-600"
    },
    {
      label: "Pending",
      value: stats.pending,
      valueColor: "text-yellow-600"
    },
    {
      label: "Total",
      value: stats.total,
      valueColor: "text-gray-900"
    }
  ];

  return (
    <AdminPageShell>
      <AdminPageHeader
        title="Users"
        subtitle="Manage user accounts and permissions"
        icon={Users}
        actions={
          <>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </>
        }
      />

      <AdminKpiGrid kpis={kpis} columns={3} />

      <AdminFilterBar
        hasActiveFilters={hasFilters}
        onClearFilters={clearFilters}
        autoCollapse={users.length === 0}
      >
        {/* Filter controls */}
      </AdminFilterBar>

      <AdminTableShell
        title="User List"
        description={`${users.length} users`}
        dense
      >
        {users.length === 0 ? (
          <AdminEmptyState
            icon={Users}
            title="No users yet"
            description="Start by creating your first user account."
            actions={[
              {
                label: "Create User",
                onClick: () => openDialog(),
                icon: Plus
              }
            ]}
          />
        ) : (
          <Table>{/* User table */}</Table>
        )}
      </AdminTableShell>
    </AdminPageShell>
  );
}
```

## Visual Design System

### Spacing Scale
- **Page padding**: `p-6` (default) or `p-4` (dense)
- **Component gap**: `mb-6` between major sections
- **Card padding**: Consistent with shadcn/ui Card component
- **Table density**: Reduced padding in admin context

### Color Palette
- **Primary (Orange)**: `bg-orange-50`, `text-orange-600`, `border-orange-200`
- **Success**: `text-green-600`
- **Warning**: `text-yellow-600`
- **Danger**: `text-red-600`
- **Info**: `text-blue-600`
- **Neutral**: `text-gray-600`, `bg-gray-50`

### Typography
- **Page Title**: `text-2xl sm:text-3xl font-bold`
- **Section Title**: `text-lg font-semibold`
- **KPI Value**: `text-2xl font-bold` (primary: `text-3xl`)
- **Body**: `text-sm` or `text-base`
- **Labels**: `text-sm font-medium`

### Accessibility Features
- All interactive elements have `:focus-visible` states with ring
- Keyboard navigation supported throughout
- ARIA labels on icon-only buttons
- Color contrast meets WCAG AA standards
- Screen reader-friendly empty states

## Applying to Other Modules

### Users Module
```tsx
// src/app/admin/users/page.tsx
<AdminPageShell>
  <AdminPageHeader title="Users" icon={Users} actions={<CreateUserButton />} />
  <AdminKpiGrid kpis={userKpis} columns={4} />
  <AdminFilterBar>...</AdminFilterBar>
  <AdminTableShell title="User List" dense>...</AdminTableShell>
</AdminPageShell>
```

### Health Module
```tsx
// src/app/admin/health/page.tsx
<AdminPageShell>
  <AdminPageHeader title="System Health" icon={Activity} />
  <AdminKpiGrid kpis={healthKpis} columns={6} />
  <AdminContentTabs tabs={healthTabs} />
</AdminPageShell>
```

### Business/Analytics Module
```tsx
// src/app/admin/analytics/page.tsx
<AdminPageShell>
  <AdminPageHeader title="Analytics" icon={BarChart3} actions={<ExportButton />} />
  <AdminKpiGrid kpis={analyticsKpis} columns={4} />
  <AdminFilterBar>...</AdminFilterBar>
  {/* Charts and data visualizations */}
</AdminPageShell>
```

## Migration Guide

### Before (Old Pattern)
```tsx
<div className="p-6">
  <div className="mb-8">
    <h1 className="text-3xl font-bold">...</h1>
  </div>
  <div className="grid grid-cols-5 gap-4">
    <Card>...</Card>
  </div>
  <Card className="mt-6">
    <CardHeader>...</CardHeader>
  </Card>
</div>
```

### After (New Pattern)
```tsx
<AdminPageShell>
  <AdminPageHeader title="..." />
  <AdminKpiGrid kpis={...} />
  <AdminTableShell title="...">...</AdminTableShell>
</AdminPageShell>
```

## Best Practices

1. **Always use AdminPageShell** as the root container
2. **Emphasize one primary KPI** per page using `primary: true`
3. **Auto-collapse filters** when no data exists
4. **Provide helpful empty states** with clear actions
5. **Use tabs** to segment large datasets by status/category
6. **Keep actions visible** in page header, not buried in content
7. **Maintain consistent spacing** using the built-in margins
8. **Test keyboard navigation** and screen reader compatibility

## Component File Locations

```
src/components/admin/layout/
├── index.ts                    # Barrel export
├── AdminPageShell.tsx
├── AdminPageHeader.tsx
├── AdminKpiGrid.tsx
├── AdminFilterBar.tsx
├── AdminEmptyState.tsx
├── AdminTableShell.tsx
└── AdminContentTabs.tsx
```

## Support

For questions or issues with the Admin Layout System, please contact the VexNexa development team or open an issue in the project repository.
