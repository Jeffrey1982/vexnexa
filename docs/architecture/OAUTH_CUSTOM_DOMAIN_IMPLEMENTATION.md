# OAuth Custom Domain Implementation

Production-ready code for using `https://vexnexa.com` in Google OAuth instead of Supabase domain.

---

## ✅ Google Login Function

```typescript
const handleOAuthLogin = async (provider: 'google' | 'linkedin') => {
  setLoading(true)
  setError('')

  try {
    const redirect = searchParams.get('redirect') || '/dashboard'
    const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost'
    const origin = isLocalhost
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com')

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?redirect=${encodeURIComponent(redirect)}`
      }
    })

    if (error) throw error
  } catch (error: any) {
    setError(error.message)
    setLoading(false)
  }
}
```

---

## ✅ Callback Handler

**File:** `src/app/auth/callback/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server-new'
import { NextRequest, NextResponse } from 'next/server'
import { ensureUserInDatabase } from '@/lib/user-sync'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(new URL('/auth/login?error=oauth_error', request.url))
  }

  if (code) {
    const supabase = createClient()

    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        return NextResponse.redirect(new URL('/auth/login?error=session_error', request.url))
      }

      if (data.user) {
        await ensureUserInDatabase(data.user)

        const redirect = requestUrl.searchParams.get('redirect') || '/dashboard'

        const hasFirstName = data.user.user_metadata?.first_name || data.user.user_metadata?.given_name
        const hasLastName = data.user.user_metadata?.last_name || data.user.user_metadata?.family_name
        const createdAt = new Date(data.user.created_at).getTime()
        const lastSignIn = new Date(data.user.last_sign_in_at!).getTime()
        const isNewUser = Math.abs(createdAt - lastSignIn) < 1000

        if (isNewUser && (!hasFirstName || !hasLastName)) {
          return NextResponse.redirect(new URL('/onboarding', request.url))
        }

        if (isNewUser) {
          return NextResponse.redirect(new URL('/dashboard?welcome=true', request.url))
        }

        return NextResponse.redirect(new URL(redirect, request.url))
      }
    } catch (exchangeError) {
      return NextResponse.redirect(new URL('/auth/login?error=unexpected_error', request.url))
    }
  }

  return NextResponse.redirect(new URL('/auth/login', request.url))
}
```

---

## Environment Variables

**`.env` and `.env.production`:**

```bash
NEXT_PUBLIC_SITE_URL="https://vexnexa.com"
NEXT_PUBLIC_SUPABASE_URL="https://zoljdbuiphzlsqzxdxyy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

**`.env.local` (development):**

```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://zoljdbuiphzlsqzxdxyy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

---

## Vercel Environment Variables

Add to Vercel Dashboard > Settings > Environment Variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://vexnexa.com` | Production |
| `NEXT_PUBLIC_SITE_URL` | `https://vexnexa.vercel.app` | Preview |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | Development |

---

## Google Cloud Console Configuration

**Authorized redirect URIs:**

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

**Authorized JavaScript origins:**

```
https://vexnexa.com
https://vexnexa.vercel.app
http://localhost:3000
```

---

## Supabase Dashboard Configuration

**Authentication > URL Configuration:**

| Setting | Value |
|---------|-------|
| **Site URL** | `https://vexnexa.com` |
| **Redirect URLs** | `https://vexnexa.com/**`<br>`https://vexnexa.vercel.app/**`<br>`http://localhost:3000/**` |

---

## Production Flow

1. User clicks "Sign in with Google" on `https://vexnexa.com/auth/login`
2. Code executes: `redirectTo: "https://vexnexa.com/auth/callback"`
3. Supabase redirects to Google with this callback URL
4. Google OAuth screen shows: **"Continue to vexnexa.com"** ✅
5. User authorizes
6. Google redirects to Supabase: `https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback`
7. Supabase redirects to: `https://vexnexa.com/auth/callback?code=...`
8. App exchanges code for session
9. User redirected to dashboard

---

## Result

**OAuth consent screen displays:**

```
Continue to vexnexa.com
```

**NOT:**

```
Sign in to zoljdbuiphzlsqzxdxyy.supabase.co
```

✅ Production-ready
✅ Custom domain in OAuth flow
✅ Works on Vercel
