# Switch Google OAuth to Custom Credentials

Complete guide to switch from Supabase-managed Google OAuth to your own Google Cloud OAuth client.

---

## Overview

**Current Setup:** Supabase-managed OAuth (default)
**Target Setup:** Custom Google OAuth credentials

**Benefits:**
- ✅ Full control over OAuth app branding
- ✅ Custom consent screen with VexNexa branding
- ✅ No dependency on Supabase's OAuth infrastructure
- ✅ Better production control

---

## Prerequisites

1. **Google Cloud Project** (existing or new)
2. **Access to Google Cloud Console**
3. **Supabase Project:** `zoljdbuiphzlsqzxdxyy`
4. **Domain:** `vexnexa.com`

---

## Part 1: Create Google OAuth Client

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create new one: "VexNexa Production")

### Step 2: Enable Google+ API

1. Navigate to **APIs & Services** > **Library**
2. Search for "Google+ API"
3. Click **Enable**
4. Also enable "People API" (recommended)

### Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** > **OAuth consent screen**
2. Choose **External** user type
3. Click **Create**

**App information:**

```
App name: VexNexa
User support email: info@vexnexa.com
App logo: [Upload 120x120px VexNexa logo]
```

**App domain:**

```
Application home page: https://vexnexa.com
Application privacy policy link: https://vexnexa.com/legal/privacy
Application terms of service link: https://vexnexa.com/legal/terms
```

**Authorized domains:**

```
vexnexa.com
supabase.co
```

**Developer contact information:**

```
info@vexnexa.com
```

4. Click **Save and Continue**

### Step 4: Configure Scopes

1. Click **Add or Remove Scopes**
2. Add these scopes:

```
.../auth/userinfo.email
.../auth/userinfo.profile
openid
```

3. Click **Update**
4. Click **Save and Continue**

### Step 5: Add Test Users (Optional - for testing mode)

1. Click **Add Users**
2. Add your email: `jeffrey.aay@gmail.com`
3. Add any other test emails
4. Click **Save and Continue**

### Step 6: Review and Finish

1. Review all settings
2. Click **Back to Dashboard**

---

## Part 2: Create OAuth 2.0 Client ID

### Step 1: Create Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client ID**

### Step 2: Configure Application Type

**Application type:** Web application

**Name:** VexNexa Production OAuth

### Step 3: Add Authorized JavaScript Origins

```
https://vexnexa.com
https://vexnexa.vercel.app
http://localhost:3000
```

### Step 4: Add Authorized Redirect URIs

**IMPORTANT - Use your Supabase project callback URL:**

```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

**Do NOT use vexnexa.com here - this is the Supabase endpoint!**

### Step 5: Create and Save Credentials

1. Click **Create**
2. Copy and save:
   - **Client ID** (starts with something like `123456789-...apps.googleusercontent.com`)
   - **Client Secret** (random string)

**⚠️ CRITICAL: Save these now - you'll need them in the next step!**

---

## Part 3: Configure Supabase to Use Custom Credentials

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `zoljdbuiphzlsqzxdxyy`
3. Navigate to **Authentication** > **Providers**

### Step 2: Find Google Provider

1. Scroll to **Google** in the providers list
2. Click to expand

### Step 3: Switch to Custom Credentials

1. **IMPORTANT:** Look for the toggle or option that says:
   - "Use custom OAuth credentials" or
   - "Enable Google provider"

2. **Enable the provider** if not already enabled

3. Enter your credentials:

   **Client ID:**
   ```
   [Paste your Google OAuth Client ID from Google Cloud Console]
   Example: 123456789-abcdefg.apps.googleusercontent.com
   ```

   **Client Secret:**
   ```
   [Paste your Google OAuth Client Secret from Google Cloud Console]
   Example: GOCSPX-abc123xyz789
   ```

### Step 4: Additional Settings (Optional)

**Skip if prompted for login flow:** No

**Redirect URL (should be pre-filled):**
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

### Step 5: Save Configuration

1. Click **Save**
2. Verify "Google" provider shows as **Enabled** ✅

---

## Part 4: Verify Configuration

### Step 1: Check Redirect URL Alignment

**In Supabase:**
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

**In Google Cloud Console:**
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

✅ These MUST match exactly!

### Step 2: Verify Site URL in Supabase

1. Go to **Authentication** > **URL Configuration**
2. Verify **Site URL:**

```
https://vexnexa.com
```

3. Verify **Redirect URLs:**

```
https://vexnexa.com/**
https://vexnexa.vercel.app/**
http://localhost:3000/**
```

---

## Part 5: Test OAuth Flow

### Test 1: Development Environment

1. Start your local dev server:
   ```bash
   npm run dev
   ```

2. Go to `http://localhost:3000/auth/login`

3. Click **"Sign in with Google"**

4. **Expected behavior:**
   - Redirects to Google OAuth consent screen
   - Shows: **"Continue to VexNexa"** (with your logo)
   - After authorization, redirects back to your app
   - User is logged in ✅

### Test 2: Production Environment

1. Deploy to Vercel (if not already deployed)

2. Go to `https://vexnexa.com/auth/login`

3. Click **"Sign in with Google"**

4. **Expected behavior:**
   - Same as development
   - OAuth screen shows **"Continue to vexnexa.com"**
   - Professional VexNexa branding
   - Successful login ✅

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Cause:** Redirect URI in Google doesn't match Supabase callback

**Fix:**
1. Go to Google Cloud Console > Credentials
2. Edit your OAuth client
3. Ensure this EXACT URI is listed:
   ```
   https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
   ```
4. Save and test again

### Error: "invalid_client"

**Cause:** Wrong Client ID or Client Secret in Supabase

**Fix:**
1. Go to Google Cloud Console > Credentials
2. Copy Client ID and Secret again
3. Go to Supabase Dashboard > Authentication > Providers > Google
4. Re-enter credentials exactly as shown
5. Save

### Error: "access_denied"

**Cause:** App is in testing mode and user not added as test user

**Fix:**
1. Go to Google Cloud Console > OAuth consent screen
2. Add user email to Test users
3. OR publish the app (requires verification)

### OAuth consent screen still shows Supabase URL

**Cause:** Need to configure OAuth consent screen branding

**Fix:**
1. Complete Part 1, Step 3 above (OAuth Consent Screen)
2. Add app name, logo, and domains
3. Save changes
4. Test again - should show "VexNexa" now

### "This app isn't verified"

**This is NORMAL for apps in testing mode.**

**Options:**
1. **For testing:** Add users manually to test users list
2. **For production:** Submit app for Google verification
   - Go to OAuth consent screen
   - Click "Publish App"
   - Submit for verification
   - Wait 1-2 weeks for Google review

---

## Verification Checklist

After completing all steps, verify:

### Google Cloud Console:

- [ ] OAuth 2.0 Client created
- [ ] Client ID and Secret obtained
- [ ] Redirect URI: `https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback`
- [ ] Authorized origins include `vexnexa.com`
- [ ] OAuth consent screen configured with VexNexa branding
- [ ] App name: "VexNexa"
- [ ] Logo uploaded
- [ ] Privacy policy and terms links added
- [ ] Authorized domains: `vexnexa.com`, `supabase.co`

### Supabase Dashboard:

- [ ] Google provider enabled
- [ ] Custom Client ID entered
- [ ] Custom Client Secret entered
- [ ] Site URL: `https://vexnexa.com`
- [ ] Redirect URLs configured
- [ ] Changes saved

### Application:

- [ ] Code uses `NEXT_PUBLIC_SITE_URL` env variable
- [ ] OAuth functions force custom domain
- [ ] TypeScript compiles without errors
- [ ] Deployed to production

### Testing:

- [ ] Local dev OAuth works
- [ ] Production OAuth works
- [ ] Consent screen shows "VexNexa"
- [ ] Users can log in successfully
- [ ] Onboarding flow works (if applicable)
- [ ] Dashboard loads after login

---

## Environment Variables Check

Ensure these are set:

**`.env` (local):**
```bash
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SUPABASE_URL="https://zoljdbuiphzlsqzxdxyy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

**Vercel (production):**
```bash
NEXT_PUBLIC_SITE_URL="https://vexnexa.com"
NEXT_PUBLIC_SUPABASE_URL="https://zoljdbuiphzlsqzxdxyy.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"
```

---

## Important Notes

### 1. Supabase Callback URL Never Changes

The OAuth redirect URI in Google will ALWAYS be:
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

Even though users see `vexnexa.com`, the OAuth flow still goes through Supabase's auth endpoint. This is normal and correct.

### 2. Custom Domain vs OAuth Callback

**User-facing redirect (custom domain):**
```
redirectTo: "https://vexnexa.com/auth/callback"
```

**OAuth provider callback (Supabase):**
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

These are DIFFERENT and both are needed.

### 3. Testing Mode Limitations

While in testing mode:
- Only test users can sign in
- Shows "This app isn't verified"
- Limited to 100 users

To remove limitations, submit for Google verification.

---

## Publishing Your App (Optional - For Production)

### When to Publish:

- Ready for public users (not just test users)
- Want to remove "unverified" warning
- Need more than 100 users

### How to Publish:

1. **Complete all required fields in OAuth consent screen**
   - App name ✅
   - User support email ✅
   - App logo ✅
   - App domain ✅
   - Privacy policy ✅
   - Terms of service ✅
   - Authorized domains ✅

2. **Submit for verification**
   - Go to OAuth consent screen
   - Click "Publish App"
   - Fill out verification form
   - Submit

3. **Wait for Google review**
   - Usually takes 1-2 weeks
   - Google may ask for clarifications
   - Once approved, app is verified ✅

---

## Summary

**What you did:**
1. ✅ Created Google Cloud OAuth client
2. ✅ Configured OAuth consent screen with VexNexa branding
3. ✅ Obtained Client ID and Client Secret
4. ✅ Configured Supabase to use custom credentials
5. ✅ Verified redirect URLs match
6. ✅ Tested OAuth flow

**Result:**
- ✅ Full control over OAuth app
- ✅ VexNexa branding on consent screen
- ✅ Professional "Continue to VexNexa" message
- ✅ Custom domain in OAuth flow
- ✅ Production-ready authentication

Your Google OAuth is now using custom credentials and looks professional! 🚀
