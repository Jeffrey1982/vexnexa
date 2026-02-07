# Fix: OAuth redirect_uri_mismatch Error

## Error You're Seeing:
```
Error 400: redirect_uri_mismatch
Toegang geblokkeerd: het verzoek van deze app is ongeldig
```

## Root Cause:
The redirect URI configured in your Google Cloud Console doesn't match the one Supabase is sending to Google.

## Your Supabase Project Details:
- **Project URL**: `https://zoljdbuiphzlsqzxdxyy.supabase.co`
- **Project Ref**: `zoljdbuiphzlsqzxdxyy`

## Required Google OAuth Redirect URI:

You need to add this **EXACT** URL to your Google Cloud Console:

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

## Step-by-Step Fix:

### 1. Go to Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one if you haven't)
3. Go to **APIs & Services** > **Credentials**

### 2. Find Your OAuth 2.0 Client ID

1. Look for your OAuth 2.0 Client ID in the list
2. Click on it to edit

### 3. Add the Correct Redirect URI

In the **Authorized redirect URIs** section, add:

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

**Important Notes:**
- ✅ Use `https://` (not `http://`)
- ✅ No trailing slash at the end
- ✅ Must be exactly `zoljdbuiphzlsqzxdxyy.supabase.co`
- ✅ Path must be `/auth/v1/callback`

### 4. Also Add Development URLs (Optional but Recommended)

For local testing, also add:

```
http://localhost:3000/auth/callback
http://127.0.0.1:3000/auth/callback
```

**Note**: These are for your local app, not Supabase callbacks.

### 5. Save Changes

Click **Save** at the bottom of the page.

---

## Full Configuration Example:

Your Google OAuth Client should have:

**Application type:** Web application

**Authorized JavaScript origins:**
```
http://localhost:3000
https://your-production-domain.com
```

**Authorized redirect URIs:**
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

---

## Configure in Supabase Dashboard

### 1. Go to Supabase Dashboard

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `zoljdbuiphzlsqzxdxyy`
3. Go to **Authentication** > **Providers**

### 2. Enable Google Provider

1. Find **Google** in the list
2. Toggle it **ON**
3. Enter your Google OAuth credentials:
   - **Client ID**: (from Google Cloud Console)
   - **Client Secret**: (from Google Cloud Console)

### 3. Verify Site URL

1. In Supabase, go to **Authentication** > **URL Configuration**
2. Set **Site URL** to:
   ```
   http://localhost:3000
   ```
   (for development)

   Or for production:
   ```
   https://your-production-domain.com
   ```

3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   https://your-production-domain.com/auth/callback
   ```

### 4. Save Configuration

Click **Save** in Supabase.

---

## Test the OAuth Flow

1. **Clear browser cache and cookies**
2. Go to `http://localhost:3000/auth/login`
3. Click **"Sign in with Google"**
4. Should redirect to Google OAuth consent screen
5. After authorizing, should redirect back to your app

---

## Common Mistakes to Avoid:

❌ **Wrong URL format**:
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/callback  ❌ (missing /v1/)
https://supabase.co/auth/v1/callback                     ❌ (missing project ref)
http://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback ❌ (http instead of https)
```

✅ **Correct URL**:
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

---

## Debugging Tips

### Check the Error URL

When you get the error, look at the URL in your browser. It might show:

```
redirect_uri=https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

This is the exact URI you need to add to Google Cloud Console.

### Verify in Google Cloud Console

1. Go to your OAuth Client settings
2. Scroll to **Authorized redirect URIs**
3. Make sure the exact URI is listed
4. No extra spaces or characters

### Check Supabase Logs

1. In Supabase Dashboard > **Authentication** > **Logs**
2. Look for OAuth errors
3. Check if the redirect URI is correct

---

## Quick Checklist:

- [ ] Google Cloud Console has correct redirect URI
- [ ] Supabase Google provider is enabled
- [ ] Client ID and Secret are entered in Supabase
- [ ] Site URL is configured in Supabase
- [ ] Browser cache is cleared
- [ ] Testing with the correct URL (localhost or production)

---

## Still Having Issues?

### Double-Check Everything:

1. **Google Cloud Console**:
   - Correct project selected?
   - OAuth 2.0 Client ID created?
   - Redirect URI exactly matches?
   - Changes saved?

2. **Supabase Dashboard**:
   - Correct project selected?
   - Google provider enabled?
   - Client ID/Secret correct?
   - No extra spaces in credentials?

3. **Your App**:
   - `.env` file has correct `NEXT_PUBLIC_SUPABASE_URL`?
   - Development server restarted after env changes?
   - Using correct domain (localhost vs production)?

---

## Expected Behavior After Fix:

1. ✅ Click "Sign in with Google"
2. ✅ Redirect to Google OAuth consent screen
3. ✅ Select Google account
4. ✅ Redirect back to your app
5. ✅ User logged in and redirected to dashboard (or onboarding)

---

## Production Setup

When deploying to production (e.g., Vercel):

### 1. Add Production Redirect URI to Google:

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

(Same URI works for both development and production!)

### 2. Update Supabase Site URL:

Change from:
```
http://localhost:3000
```

To your production domain:
```
https://your-app.vercel.app
```

### 3. Add Production Redirect URL in Supabase:

```
https://your-app.vercel.app/auth/callback
```

---

## Summary

**The Fix:**
Add this exact URI to Google Cloud Console → OAuth Client → Authorized redirect URIs:

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

**Then:**
- Save in Google Cloud Console
- Clear browser cache
- Test OAuth login again

That's it! The error should be resolved.
