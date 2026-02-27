# Admin Dashboard — Real-Time Users

## Architecture

The admin users list uses a **server-rendered initial load + client-side polling** pattern:

```
┌──────────────────────────────────────────────────┐
│  AdminUsersPage (Server Component)               │
│  - Fetches users via prisma.user.findMany()      │
│  - Passes as props to client component           │
│  - export const dynamic = 'force-dynamic'        │
└──────────────┬───────────────────────────────────┘
               │ users={initialUsers}
               ▼
┌──────────────────────────────────────────────────┐
│  UserListClient (Client Component)               │
│  - Maintains local users state                   │
│  - Polls GET /api/admin/users every 10s          │
│  - Detects new users → shows toast notification  │
│  - Manual refresh button + pause/resume polling  │
│  - Live indicator (green dot)                    │
└──────────────┬───────────────────────────────────┘
               │ fetch('/api/admin/users', { cache: 'no-store' })
               ▼
┌──────────────────────────────────────────────────┐
│  GET /api/admin/users (Route Handler)            │
│  - Server-only (uses Prisma, not exposed to      │
│    client bundle)                                │
│  - Admin auth check via isAdmin(user.id)         │
│  - export const dynamic = 'force-dynamic'        │
│  - export const revalidate = 0                   │
│  - Returns prisma.user.findMany() with sites     │
└──────────────────────────────────────────────────┘
```

## Why polling instead of Supabase Realtime?

The app uses **Prisma** with a PostgreSQL database, not Supabase's `public.*` tables directly. The `User` table is managed by Prisma ORM. Supabase Realtime requires:
- Tables in `public` schema with RLS enabled
- `supabase.channel().on('postgres_changes', ...)` subscriptions

Since users are stored in a Prisma-managed table (not a Supabase `public.profiles` table), **polling is the pragmatic approach**. It:
- Works with any database setup
- Doesn't require RLS policy changes
- Doesn't expose admin data via Supabase Realtime channels
- Is simple and reliable

### Trade-offs

| Approach | Latency | Complexity | Security |
|----------|---------|------------|----------|
| **Polling (current)** | ~10s | Low | High (server-only auth) |
| Supabase Realtime | ~1s | Medium | Requires RLS for admin |
| Server-Sent Events | ~1s | High | Server-only |

## How new user detection works

1. `UserListClient` maintains a `Set<string>` of known user IDs (`knownIdsRef`)
2. Each poll fetches fresh user list from `/api/admin/users`
3. Any user ID not in `knownIdsRef` is "new" → triggers a toast notification
4. `knownIdsRef` is updated to the fresh set after each poll
5. On initial server render, `knownIdsRef` is populated from the server-provided `initialUsers`

## How user sync works (signup → DB)

When a user signs up:
1. `supabase.auth.signUp()` creates the user in Supabase Auth (`auth.users`)
2. When the user confirms their email and lands on `/auth/callback`:
   - `exchangeCodeForSession()` sets the session
   - `ensureUserInDatabase(data.user)` upserts the user into Prisma `User` table
   - This is when the admin dashboard will see the user (on next poll)
3. If the user signs in directly (email already confirmed):
   - `getCurrentUser()` in `src/lib/auth.ts` also calls `ensureUserInDatabase()` if the user isn't found in the DB

**Key file:** `src/lib/user-sync.ts` — `ensureUserInDatabase()` does a Prisma `upsert` using the user's email as the unique key.

## Caching prevention

| Layer | Setting | File |
|-------|---------|------|
| Admin page server component | `export const dynamic = 'force-dynamic'` | `src/app/admin/users/page.tsx` |
| API route handler | `export const dynamic = 'force-dynamic'` + `export const revalidate = 0` | `src/app/api/admin/users/route.ts` |
| Client fetch | `{ cache: 'no-store' }` | `src/components/admin/UserListClient.tsx` |

## Security

- `/api/admin/users` checks authentication via `supabase.auth.getUser()` and admin status via `isAdmin(user.id)` (checks `prisma.user.isAdmin` field)
- No service_role key is exposed to the client
- Polling runs in the browser but only returns data if the logged-in user is an admin
- The API excludes soft-deleted users (`where: { deletedAt: null }`)

## Files

| File | Description |
|------|-------------|
| `src/app/admin/users/page.tsx` | Server component — initial data fetch |
| `src/components/admin/UserListClient.tsx` | Client component — polling, search, table, toasts |
| `src/app/api/admin/users/route.ts` | API route — admin-only user list (no cache) |
| `src/lib/user-sync.ts` | `ensureUserInDatabase()` — upserts Auth user into Prisma |
| `src/lib/admin.ts` | `isAdmin()` — checks `user.isAdmin` in Prisma |

## Test Plan

### 1. New user appears in admin dashboard

- [ ] Sign up with a new email address
- [ ] Confirm email via link
- [ ] Wait for callback to sync user to DB
- [ ] Admin dashboard updates within 10 seconds (next poll)
- [ ] Toast notification appears: "New user signed up: ..."

### 2. Manual refresh

- [ ] Click "Refresh" button on admin users page
- [ ] Spinner shows on button during fetch
- [ ] User list updates immediately

### 3. Polling pause/resume

- [ ] Click "Pause" → green Live indicator disappears
- [ ] Click "Resume" → polling resumes, Live indicator returns

### 4. No stale data on navigation

- [ ] Navigate away from admin users page and back
- [ ] Server component re-fetches fresh data
- [ ] Client component syncs from new `initialUsers` prop

### 5. Security

- [ ] Visit `/api/admin/users` while not logged in → 401
- [ ] Visit `/api/admin/users` as non-admin user → 403
- [ ] Verify no `SUPABASE_SERVICE_ROLE_KEY` in browser bundle (check page source)

### 6. Soft-deleted users

- [ ] Soft-delete a user via admin panel
- [ ] Verify they no longer appear in the users list
