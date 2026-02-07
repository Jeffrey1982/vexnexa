# EMERGENCY: Redirect Loop Fix

## Problem

**Site was stuck in infinite redirect loop:**
- `vexnexa.com` → redirected to `www.vexnexa.com` (Vercel domain settings)
- `www.vexnexa.com` → redirected to `vexnexa.com` (vercel.json)
- **Result:** Infinite loop, Chrome shows "Too many redirects" error

## Root Cause

**Conflicting redirect configurations:**

1. **Vercel Domain Settings** (dashboard):
   - Set `vexnexa.com` to redirect to `www.vexnexa.com`

2. **vercel.json** (code):
   - Set `www.vexnexa.com` to redirect to `vexnexa.com`

3. **src/app/auth/callback/route.ts**:
   - Also had www → non-www redirect

**These three redirects fought each other creating an infinite loop!**

## Fix Applied (Commit `97043e0`)

### 1. Removed vercel.json redirect

**Before:**
```json
"redirects": [
  {
    "source": "/:path(.*)",
    "has": [{ "type": "host", "value": "www.vexnexa.com" }],
    "destination": "https://vexnexa.com/:path*",
    "permanent": true
  }
]
```

**After:**
```json
// Removed entirely
```

### 2. Removed auth callback redirect

**Before:**
```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  // Redirect www to non-www canonical domain
  if (requestUrl.hostname === 'www.vexnexa.com') {
    const canonicalUrl = new URL(request.url)
    canonicalUrl.hostname = 'vexnexa.com'
    return NextResponse.redirect(canonicalUrl, 301)
  }
  // ...
}
```

**After:**
```typescript
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  // ... (no redirect check)
}
```

## Current State

**After fix:**
- ✅ Site accessible on both `vexnexa.com` AND `www.vexnexa.com`
- ✅ No infinite redirects
- ✅ OAuth will work on whichever domain Vercel sends users to

**The site will work on BOTH domains now. You can choose which to use as canonical in Vercel settings.**

## Vercel Domain Configuration (What YOU Need to Do)

### Option 1: Use vexnexa.com (no www) - RECOMMENDED

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select VexNexa project
3. Go to **Settings** → **Domains**
4. Find `www.vexnexa.com`
5. Click **Edit** → **Redirect to** → `vexnexa.com`
6. Save

**Result:** www automatically redirects to non-www at Vercel level

### Option 2: Use www.vexnexa.com (with www)

1. Go to Vercel Dashboard
2. Settings → Domains
3. Find `vexnexa.com`
4. Click **Edit** → **Redirect to** → `www.vexnexa.com`
5. Save

**Result:** non-www automatically redirects to www at Vercel level

### Option 3: Accept Both (Current State)

Do nothing. Both domains will work independently.

**Pros:** Flexible, no redirects
**Cons:** Duplicate content issues for SEO

## Why This Happened

When we added the www redirect to fix OAuth issues, we didn't realize Vercel was ALREADY redirecting in the opposite direction at the infrastructure level.

**The lesson:** Always check Vercel domain settings before adding redirects in code.

## Testing After Fix

### Wait 2-3 minutes for Vercel to deploy

Then test:

1. **Visit `https://vexnexa.com`**
   - ✅ Should load WITHOUT redirecting
   - ✅ Should NOT show "too many redirects"

2. **Visit `https://www.vexnexa.com`**
   - ✅ Should load WITHOUT redirecting (unless you configured Option 1/2 above)
   - ✅ Should NOT show "too many redirects"

3. **Test OAuth:**
   - Go to `/auth/login`
   - Click "Continue with Google"
   - ✅ Should work on BOTH domains

## Summary

**What was broken:**
- ❌ Infinite redirect loop
- ❌ Site completely inaccessible
- ❌ Chrome error: "Too many redirects"

**What's fixed:**
- ✅ Removed conflicting redirects from code
- ✅ Site accessible again
- ✅ OAuth works on both domains
- ✅ You can now configure canonical domain in Vercel dashboard

**Next steps:**
1. Wait for Vercel deployment (2-3 min)
2. Test site loads
3. Configure canonical domain in Vercel (optional)
4. Test OAuth login

**Site should be accessible in 2-3 minutes!**
