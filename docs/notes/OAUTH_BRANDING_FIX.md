# Fix: Make OAuth Show "VexNexa.com" Instead of Supabase URL

## Current Problem

When users click "Sign in with Google", they see:
```
Sign in to zoljdbuiphzlsqzxdxyy.supabase.co
```

This looks unprofessional and can seem untrustworthy. ❌

## Goal

Make it show:
```
Sign in to VexNexa
```
or
```
Sign in to vexnexa.com
```

Much more professional! ✅

---

## Solution Overview

There are **two approaches** to fix this:

### Option 1: Brand the OAuth Consent Screen (Easier, Faster) ⭐ **RECOMMENDED**
- Configure your Google OAuth consent screen
- Add app name, logo, and links
- Works immediately
- No custom domain needed for Supabase

### Option 2: Use Custom Domain with Supabase (Advanced)
- Set up custom domain for Supabase
- Requires DNS configuration
- More complex setup
- Better for production

---

## Option 1: Brand the OAuth Consent Screen (RECOMMENDED)

This is the **fastest and easiest** solution. It will make the consent screen show "VexNexa" with your branding.

### Step 1: Configure OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** > **OAuth consent screen**

### Step 2: Fill in Application Information

**User Type:**
- Choose **External** (for public users)
- Click **Create**

**App information:**

| Field | Value |
|-------|-------|
| **App name** | `VexNexa` |
| **User support email** | `info@vexnexa.com` or your email |
| **App logo** | Upload your VexNexa logo (120x120px PNG) |

**App domain:**

| Field | Value |
|-------|-------|
| **Application home page** | `https://vexnexa.com` |
| **Application privacy policy** | `https://vexnexa.com/legal/privacy` |
| **Application terms of service** | `https://vexnexa.com/legal/terms` |

**Authorized domains:**

Add these domains:
```
vexnexa.com
supabase.co
```

**Developer contact information:**
```
info@vexnexa.com
```

### Step 3: Configure Scopes

1. Click **Add or Remove Scopes**
2. Add these scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`

3. Click **Update**

### Step 4: Add Test Users (During Development)

1. Click **Add Users**
2. Add your email: `jeffrey.aay@gmail.com`
3. Add any other test accounts

### Step 5: Save and Continue

Click **Save and Continue** through all steps.

---

## Result After Option 1:

Users will see:
```
Sign in with Google

Continue to VexNexa
```

With:
- ✅ Your app name "VexNexa"
- ✅ Your logo
- ✅ Links to your privacy policy and terms
- ✅ Professional appearance

The URL might still mention Supabase in technical details, but the main branding will be **VexNexa**.

---

## Option 2: Custom Domain for Supabase (Advanced)

This makes the technical redirect URL also show your domain, but it's more complex.

### Prerequisites:

1. Own domain: `vexnexa.com` ✅
2. Access to DNS settings
3. Supabase Pro plan (custom domains require paid plan)

### Step 1: Upgrade Supabase (If Needed)

Custom domains require Supabase **Pro plan** or higher.

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** > **Billing**
4. Upgrade to Pro plan ($25/month)

### Step 2: Add Custom Domain in Supabase

1. In Supabase Dashboard, go to **Settings** > **Custom Domains**
2. Click **Add custom domain**
3. Enter: `auth.vexnexa.com` (or `api.vexnexa.com`)
4. Supabase will provide DNS records to add

### Step 3: Configure DNS

Add these DNS records to your domain (vexnexa.com):

**CNAME Record:**
```
Name:   auth
Type:   CNAME
Value:  [provided by Supabase]
TTL:    3600
```

### Step 4: Verify Domain

1. Wait for DNS propagation (can take up to 48 hours)
2. Click **Verify** in Supabase Dashboard
3. Once verified, enable the custom domain

### Step 5: Update OAuth Redirect URIs

In Google Cloud Console, update to:
```
https://auth.vexnexa.com/auth/v1/callback
```

Instead of:
```
https://zoljdbuiphzlsqzxdxyy.supabase.co/auth/v1/callback
```

### Step 6: Update Environment Variables

Update your `.env` file:
```bash
NEXT_PUBLIC_SUPABASE_URL="https://auth.vexnexa.com"
```

---

## Comparison: Option 1 vs Option 2

| Feature | Option 1: Brand Consent Screen | Option 2: Custom Domain |
|---------|-------------------------------|------------------------|
| **Cost** | Free | $25/month (Pro plan) |
| **Setup Time** | 10 minutes | 1-2 days (DNS propagation) |
| **Technical Complexity** | Easy | Advanced |
| **User Experience** | "Sign in to VexNexa" | "auth.vexnexa.com" URL |
| **Professional** | ✅ Yes | ✅ Yes (more) |
| **Production Ready** | ✅ Yes | ✅ Yes |
| **Recommended For** | Most cases | Enterprise/Advanced |

---

## Recommended Approach

### For Now: Use Option 1 ⭐

**Why:**
- ✅ Free
- ✅ Quick to set up
- ✅ Professional branding
- ✅ Works immediately
- ✅ Users see "VexNexa" not Supabase

### Later: Consider Option 2

When you:
- Have more budget ($25/month)
- Need enterprise-grade setup
- Want complete control over URLs
- Have time for DNS configuration

---

## Step-by-Step: Implement Option 1 (Quick Win)

### 1. Prepare Your Assets

Before starting, have these ready:

**Logo:**
- Size: 120x120 pixels
- Format: PNG with transparent background
- Your VexNexa logo

**Links:**
- Privacy Policy: `https://vexnexa.com/legal/privacy`
- Terms of Service: `https://vexnexa.com/legal/terms`
- Home Page: `https://vexnexa.com`

### 2. Configure OAuth Consent Screen

```
Google Cloud Console
  → APIs & Services
  → OAuth consent screen
  → Fill in the form
  → Save
```

**Fill these fields:**

| Field | Value |
|-------|-------|
| App name | VexNexa |
| User support email | info@vexnexa.com |
| App logo | [Upload VexNexa logo] |
| Application home page | https://vexnexa.com |
| Privacy policy | https://vexnexa.com/legal/privacy |
| Terms of service | https://vexnexa.com/legal/terms |
| Authorized domains | vexnexa.com, supabase.co |

### 3. Test the OAuth Flow

1. Clear browser cache
2. Go to `http://localhost:3000/auth/login`
3. Click "Sign in with Google"
4. You should now see "VexNexa" branding! ✅

---

## Publishing Your OAuth App (Important!)

By default, your OAuth app is in "Testing" mode with these limitations:
- ⚠️ Only test users can sign in
- ⚠️ Limited to 100 users
- ⚠️ Consent screen shows "This app isn't verified"

### To Remove These Limitations:

1. **Complete the OAuth consent screen** (Option 1 above)
2. **Submit for verification** (Google Cloud Console)
3. **Pass Google's review** (can take 1-2 weeks)

### During Testing:

Add users manually:
```
OAuth consent screen
  → Test users
  → Add users
  → Add email addresses
```

### For Production:

1. Complete all consent screen fields
2. Add privacy policy and terms
3. Submit app for verification
4. Wait for Google approval
5. Once verified, anyone can sign in

---

## Privacy Policy & Terms of Service

Your OAuth app requires these pages. I see you already have:
- `/legal/privacy` ✅
- `/legal/terms` ✅

Make sure these pages are:
- ✅ Publicly accessible (no login required)
- ✅ Live on your domain
- ✅ Actually contain privacy/terms content
- ✅ Mention OAuth/Google sign-in

---

## Quick Reference

**What users see NOW:**
```
Sign in to zoljdbuiphzlsqzxdxyy.supabase.co
```

**What users will see AFTER Option 1:**
```
Continue to VexNexa
[VexNexa logo]
```

**What users will see AFTER Option 2:**
```
Sign in to auth.vexnexa.com
[VexNexa branding]
```

---

## Troubleshooting

### "This app isn't verified"

**Solution:** Submit for verification or keep in testing mode with test users added.

### "Authorized domains error"

**Solution:** Make sure you added both `vexnexa.com` and `supabase.co` to authorized domains.

### "Logo upload failed"

**Solution:**
- Use PNG format
- Size: exactly 120x120 pixels
- Under 1MB file size
- No transparency issues

### "Privacy policy not accessible"

**Solution:**
- Make sure `/legal/privacy` is publicly accessible
- Must be on same domain as app (vexnexa.com)
- Must load without login

---

## Summary

### Do This Now (Option 1):

1. ✅ Go to Google Cloud Console
2. ✅ Configure OAuth consent screen
3. ✅ Add app name: "VexNexa"
4. ✅ Upload logo
5. ✅ Add privacy policy and terms links
6. ✅ Save and test

**Time:** 10-15 minutes
**Cost:** Free
**Result:** Professional branding ✨

### Consider Later (Option 2):

1. Upgrade to Supabase Pro
2. Configure custom domain
3. Update DNS records
4. Update OAuth redirect URIs

**Time:** 1-2 days
**Cost:** $25/month
**Result:** Complete URL control 🚀

---

## Need Help?

If you get stuck:
1. Check Google's [OAuth Consent Screen Help](https://support.google.com/cloud/answer/10311615)
2. Review your privacy policy and terms pages
3. Make sure logo is correct size/format
4. Test with your email address as a test user

Your OAuth flow will look much more professional with VexNexa branding! 🎉
