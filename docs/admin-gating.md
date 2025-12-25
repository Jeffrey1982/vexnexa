# VexNexa Admin Gating System

## Overview

The VexNexa admin panel uses a **server-side authentication and authorization system** that gates all `/admin/*` routes without requiring Row Level Security (RLS) in Supabase. All authorization checks happen server-side in Next.js, making it secure and straightforward to manage.

## Architecture

### Authentication Flow

```
User Request → Supabase Auth Check → Admin Authorization Check → Allow/Deny
                     ↓                         ↓
              getCurrentUser()          requireAdmin()
                     ↓                         ↓
           User authenticated?        Has admin privileges?
                     ↓                         ↓
                  YES/NO                    YES/NO
                     ↓                         ↓
              Throw error              Redirect to /unauthorized
```

### Key Components

1. **`lib/auth.ts`** - Centralized authentication and authorization logic
2. **`app/admin/layout.tsx`** - Server-side layout that enforces admin access
3. **`app/unauthorized/page.tsx`** - User-friendly unauthorized page
4. **Environment Variables** - Admin email allowlist configuration

## How It Works

### 1. Authentication (Supabase)

All admin routes require the user to be authenticated via Supabase Auth. The `getCurrentUser()` function:

- Checks for a valid Supabase session
- Retrieves user data from both Supabase and Prisma database
- Returns unified user object with admin status

**Location:** `src/lib/auth.ts:getCurrentUser()`

### 2. Authorization (Admin Check)

The `requireAdmin()` function determines admin status using **TWO methods**:

#### Method A: Supabase User Metadata (Recommended)

Set `is_admin: true` in the user's `user_metadata` field in Supabase Auth.

**Pros:**
- Scalable and database-driven
- Can be managed programmatically
- Persists across sessions
- No code changes needed

**Cons:**
- Requires Supabase dashboard or API access

#### Method B: Email Allowlist (Fallback)

Add email addresses to the `ADMIN_EMAILS` environment variable.

**Pros:**
- Simple and immediate
- No database changes required
- Good for initial setup

**Cons:**
- Requires redeployment for changes
- Not scalable for many admins

**Location:** `src/lib/auth.ts:requireAdmin()`

### 3. Server-Side Enforcement

The `/admin` layout calls `requireAdmin()` on every request:

```typescript
// src/app/admin/layout.tsx
export default async function AdminLayout({ children }) {
  const user = await requireAdmin(); // ← Server-side check

  return (
    <div>
      <AdminSidebar />
      <MainNav user={user} />
      {children}
    </div>
  );
}
```

**Key Security Properties:**
- ✅ Runs on server (not client)
- ✅ Executes on every page load
- ✅ Redirects before rendering admin UI
- ✅ No client-side bypass possible

## Adding an Admin User

### Option A: Set User Metadata in Supabase (Recommended)

1. **Via Supabase Dashboard:**
   ```
   1. Go to Authentication → Users
   2. Find the user
   3. Click to edit
   4. Scroll to "User Metadata"
   5. Add field: is_admin = true
   6. Save
   ```

2. **Via Supabase SQL:**
   ```sql
   UPDATE auth.users
   SET raw_user_meta_data =
     raw_user_meta_data || '{"is_admin": true}'::jsonb
   WHERE email = 'admin@example.com';
   ```

3. **Via Supabase JavaScript SDK:**
   ```javascript
   import { createClient } from '@supabase/supabase-js';

   const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

   await supabase.auth.admin.updateUserById(userId, {
     user_metadata: { is_admin: true }
   });
   ```

### Option B: Add to Email Allowlist

1. **Local Development:**
   ```bash
   # .env.local
   ADMIN_EMAILS=admin@vexnexa.com,jeffrey.aay@gmail.com,your-email@example.com
   ```

2. **Production (Vercel):**
   ```
   1. Go to Vercel project settings
   2. Navigate to Environment Variables
   3. Add: ADMIN_EMAILS = email1@example.com,email2@example.com
   4. Redeploy the application
   ```

3. **Production (Other Hosts):**
   Add `ADMIN_EMAILS` environment variable through your hosting provider's dashboard or deployment configuration.

## Environment Variables

### Required Variables

| Variable | Purpose | Example | Required |
|----------|---------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGc...` | Yes |

### Optional Variables

| Variable | Purpose | Default | Format |
|----------|---------|---------|--------|
| `ADMIN_EMAILS` | Email allowlist for admins | `jeffrey.aay@gmail.com,admin@vexnexa.com` | Comma-separated emails |

### Example `.env.local`

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Access (Optional)
ADMIN_EMAILS=admin@vexnexa.com,jeffrey.aay@gmail.com,your-email@example.com
```

## Security Considerations

### What We Do

✅ **Server-side checks** - All authorization happens in Next.js server components
✅ **Session validation** - Supabase session checked on every request
✅ **Redirect on failure** - Unauthorized users cannot see admin UI
✅ **Audit logging** - Unauthorized attempts are logged to console
✅ **Environment-based** - Admin list can be different per environment

### What We Don't Do (By Design)

⚠️ **No RLS policies** - Authorization is handled in application code, not database
⚠️ **No client-side checks** - Admin status is never exposed to client JavaScript
⚠️ **No role tables** - Simplified approach using metadata + allowlist

### Limitations

1. **No RLS means API routes need their own checks**
   - Always call `requireAdmin()` in API routes that should be admin-only
   - Example:
     ```typescript
     // src/app/api/admin/users/route.ts
     import { requireAdmin } from '@/lib/auth';

     export async function GET() {
       await requireAdmin(); // ← Add this
       // ... rest of API logic
     }
     ```

2. **Email allowlist requires redeployment**
   - Prefer user_metadata method for production
   - Use email allowlist for development/initial setup

3. **No granular permissions**
   - All admins have full access
   - Future: Add role-based permissions if needed

## Testing Admin Access

### Test as Admin

1. Sign in with an admin email (from `ADMIN_EMAILS`)
2. Navigate to `/admin`
3. Should see admin dashboard

### Test as Non-Admin

1. Sign in with a regular user account
2. Navigate to `/admin`
3. Should redirect to `/unauthorized`

### Test Unauthenticated

1. Sign out completely
2. Navigate to `/admin`
3. Should redirect to `/auth/login?redirect=/admin`

## Admin Routes

All routes under `/admin/*` are automatically protected by the admin layout.

### Current Admin Sections

```
/admin                    → Dashboard overview
/admin/users              → User management
/admin/health             → System health monitoring

/admin/seo                → SEO Health overview
/admin/seo/index-health   → Index coverage
/admin/seo/visibility     → Search visibility
/admin/seo/page-quality   → Page quality metrics
/admin/seo/alerts         → SEO alerts
/admin/seo/settings       → SEO settings

/admin/tickets            → Support tickets
/admin/contact-messages   → Contact form messages
/admin/blog               → Blog management

/admin/analytics          → Usage analytics
/admin/billing            → Billing management
/admin/payments           → Payment tracking
```

### Separate Admin Routes (Need Manual Gating)

Some admin routes exist outside `/admin/*` and need manual checks:

- `/admin-interface` - Already uses `requireAdmin()` ✓

If you create API routes for admin functions, always add:
```typescript
await requireAdmin();
```

## Troubleshooting

### "Authentication required" error

**Cause:** User not signed in to Supabase
**Fix:** Sign in at `/auth/login`

### Redirects to `/unauthorized`

**Cause:** User is authenticated but not an admin
**Fix:**
- Add user's email to `ADMIN_EMAILS` OR
- Set `is_admin: true` in Supabase user_metadata

### Changes to `ADMIN_EMAILS` not working

**Cause:** Environment variable not reloaded
**Fix:**
- Local: Restart Next.js dev server
- Production: Redeploy application

### Admin check not working in API routes

**Cause:** API route missing `requireAdmin()` call
**Fix:** Add `await requireAdmin()` at the top of the API handler

## Code Reference

### Check Admin Status

```typescript
import { requireAdmin, isAdmin } from '@/lib/auth';

// Enforce admin access (redirects if not admin)
const user = await requireAdmin();

// Check admin status (returns boolean)
const userIsAdmin = await isAdmin();
```

### Protect a Page

```typescript
// src/app/admin/custom-page/page.tsx
import { requireAdmin } from '@/lib/auth';

export default async function CustomAdminPage() {
  const user = await requireAdmin(); // ← Enforces admin access

  return (
    <div>
      <h1>Admin Page</h1>
      <p>Welcome, {user.email}</p>
    </div>
  );
}
```

### Protect an API Route

```typescript
// src/app/api/admin/custom/route.ts
import { requireAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  await requireAdmin(); // ← Enforces admin access

  return NextResponse.json({ success: true });
}
```

## Future Enhancements

Potential improvements (not currently implemented):

1. **Role-Based Access Control (RBAC)**
   - Different permission levels (viewer, editor, admin)
   - Granular permissions per section
   - Stored in database table

2. **Audit Logging**
   - Track all admin actions
   - Store in database for compliance

3. **Session Management**
   - Admin session timeout
   - Force re-authentication for sensitive actions

4. **Two-Factor Authentication**
   - Require 2FA for admin accounts
   - Integration with Supabase MFA

## Support

For questions or issues with admin access:

1. Check environment variables are set correctly
2. Verify Supabase authentication is working
3. Check server logs for authorization errors
4. Review this documentation

For code changes or issues, refer to:
- `src/lib/auth.ts` - Core authentication logic
- `src/app/admin/layout.tsx` - Admin layout gating
- `src/app/unauthorized/page.tsx` - Unauthorized page
