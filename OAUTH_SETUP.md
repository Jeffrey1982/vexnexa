# OAuth Setup Guide for VexNexa

This guide will help you configure Google and LinkedIn OAuth authentication for your VexNexa platform.

## Overview

OAuth providers already implemented in the UI:
- ✅ Google OAuth
- ✅ LinkedIn OAuth

## Prerequisites

- Active Supabase project
- Access to Google Cloud Console
- Access to LinkedIn Developer Portal

---

## 1. Supabase Configuration

### Step 1: Access Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** > **Providers**

### Step 2: Configure Redirect URLs

In your Supabase project settings, add these redirect URLs:

**Development:**
```
http://localhost:3000/auth/callback
```

**Production:**
```
https://your-domain.com/auth/callback
```

---

## 2. Google OAuth Setup

### Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth 2.0 Client ID**
5. Configure the OAuth consent screen:
   - **Application name**: VexNexa
   - **User support email**: Your email
   - **Authorized domains**: Add your domain
   - **Developer contact**: Your email

### Step 2: Configure OAuth Client

1. **Application type**: Web application
2. **Name**: VexNexa Web Client
3. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://your-domain.com
   ```
4. **Authorized redirect URIs**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

   **How to find YOUR-PROJECT-REF:**
   - In Supabase Dashboard > Settings > API
   - Look at your Project URL: `https://[PROJECT-REF].supabase.co`
   - Copy the PROJECT-REF part

5. Click **Create** and save:
   - Client ID
   - Client Secret

### Step 3: Enable in Supabase

1. In Supabase Dashboard > Authentication > Providers
2. Find **Google** and enable it
3. Enter your:
   - **Client ID** (from Google)
   - **Client Secret** (from Google)
4. Click **Save**

---

## 3. LinkedIn OAuth Setup

### Step 1: Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create app**
3. Fill in the details:
   - **App name**: VexNexa
   - **LinkedIn Page**: Your company page (create one if needed)
   - **Privacy policy URL**: `https://your-domain.com/legal/privacy`
   - **App logo**: Upload your logo
4. Click **Create app**

### Step 2: Configure OAuth Settings

1. In your LinkedIn app, go to the **Auth** tab
2. Add **Redirect URLs**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

   Replace `[YOUR-PROJECT-REF]` with your Supabase project reference (same as Google setup)

3. Request access to **Sign In with LinkedIn** product:
   - Go to **Products** tab
   - Find "Sign In with LinkedIn"
   - Click **Request access**
   - Wait for approval (usually instant for basic access)

### Step 3: Get Credentials

1. In the **Auth** tab, find:
   - **Client ID**
   - **Client Secret**
2. Save these credentials

### Step 4: Enable in Supabase

1. In Supabase Dashboard > Authentication > Providers
2. Find **LinkedIn** (labeled as "LinkedIn (OIDC)")
3. Enable it
4. Enter your:
   - **Client ID** (from LinkedIn)
   - **Client Secret** (from LinkedIn)
5. Click **Save**

---

## 4. Testing OAuth Flows

### Test Locally

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/auth/login`

3. Click on the Google or LinkedIn buttons

4. Complete the OAuth flow

5. You should be redirected to `/dashboard` after successful authentication

### Verify User Data

After successful login, check that user data is properly synced:

1. Check Supabase Auth Users table
2. Check your database `User` table (Prisma)
3. Verify user metadata is populated

---

## 5. Environment Variables

No additional environment variables are needed! OAuth is configured entirely through the Supabase Dashboard.

Your existing `.env` should have:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 6. User Sync & Database

The OAuth callback automatically syncs users to your database using `ensureUserInDatabase()` function.

When a user signs in via OAuth:

1. Supabase creates the auth user
2. Callback route exchanges code for session
3. `ensureUserInDatabase()` creates/updates database record
4. User metadata is synced from OAuth provider
5. **Profile completion check:**
   - If user has first & last name → redirect to dashboard
   - If user is missing name → redirect to `/onboarding`
6. User completes profile (if needed)
7. User redirected to dashboard

## 6.1 Onboarding Flow for OAuth Users

OAuth providers (Google, LinkedIn) may not always provide complete name information. The onboarding flow handles this:

**Flow:**
```
OAuth Login
  ↓
Callback receives user data
  ↓
Has firstName AND lastName?
  ├─ Yes → /dashboard?welcome=true
  └─ No  → /onboarding
           ↓
           User completes profile
           ↓
           /dashboard?welcome=true
```

**Onboarding Page (`/onboarding`):**
- Pre-fills data from OAuth provider (name, email)
- Requests: First Name*, Last Name* (required)
- Optional: Company, Job Title, Phone, Website, Country
- Communication preferences (marketing, product updates)
- "Skip for Now" option (redirects to dashboard)
- "Complete Setup" saves and redirects to dashboard

---

## 7. Customizing OAuth Buttons

OAuth buttons are already styled in:
- `src/components/auth/ModernLoginForm.tsx`
- `src/components/auth/ModernRegistrationForm.tsx`

To customize the appearance, edit the button components directly.

---

## 8. Troubleshooting

### "OAuth provider not enabled"

- Verify provider is enabled in Supabase Dashboard
- Check Client ID and Secret are correctly entered
- Ensure redirect URLs match exactly

### "Redirect URI mismatch"

- Check redirect URI in provider console matches Supabase callback URL
- Format should be: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- No trailing slashes

### "User data not syncing to database"

- Check `src/app/auth/callback/route.ts` logs
- Verify `ensureUserInDatabase()` function is working
- Check Prisma schema matches Supabase user metadata

### "LinkedIn Sign In not available"

- Ensure you've requested access to "Sign In with LinkedIn" product
- Wait for approval (check Products tab in LinkedIn app)
- Use "LinkedIn (OIDC)" provider in Supabase, not legacy LinkedIn

---

## 9. Production Deployment

### Before going live:

1. **Update OAuth redirect URIs** in both Google and LinkedIn consoles:
   ```
   https://[PROJECT-REF].supabase.co/auth/v1/callback
   ```

2. **Update authorized origins** in Google:
   ```
   https://your-production-domain.com
   ```

3. **Add production redirect URL** in Supabase:
   ```
   https://your-production-domain.com/auth/callback
   ```

4. **Test OAuth flows** on production domain

5. **Verify user sync** is working in production database

---

## 10. Security Best Practices

✅ **Do:**
- Store OAuth secrets securely in Supabase Dashboard (never in code)
- Use HTTPS in production
- Validate redirect URLs
- Implement rate limiting on auth endpoints
- Monitor failed login attempts

❌ **Don't:**
- Commit OAuth credentials to git
- Use HTTP in production
- Allow unlimited redirect URLs
- Skip email verification for sensitive operations

---

## Summary

Once configured, users can:
- Sign in with Google (one click)
- Sign in with LinkedIn (one click)
- Sign up with email/password (traditional)
- All authentication flows redirect to dashboard
- User data automatically syncs to database

Your OAuth implementation is production-ready! 🚀
