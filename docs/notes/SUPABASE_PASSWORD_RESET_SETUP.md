# Supabase Password Reset Configuration Guide

## 🎯 Goal
Make password reset emails redirect to `https://vexnexa.com/auth/reset-password` instead of homepage.

---

## ⚙️ Step 1: Configure Site URL (CRITICAL!)

Go to your Supabase Dashboard:
```
https://supabase.com/dashboard/project/zoljdbuiphzlsqzxdxyy/settings/auth
```

### Site URL Configuration

**Location:** Settings → Auth → URL Configuration

**Set the following:**

```
Site URL: https://vexnexa.com
```

**Additional Redirect URLs (add these):**
```
https://vexnexa.com/auth/callback
https://vexnexa.com/auth/reset-password
https://vexnexa.com/dashboard
https://vexnexa.vercel.app
https://vexnexa.vercel.app/auth/callback
https://vexnexa.vercel.app/auth/reset-password
```

Click **"Save"** at the bottom!

---

## 📧 Step 2: Verify Email Template Settings

**Location:** Settings → Auth → Email Templates → Password Recovery

**Check these settings:**

1. **Subject:** "Reset je VexNexa wachtwoord"
2. **Template:** Should use your custom template from `supabase/templates/recovery.html`

### Important: Upload Custom Template

The local template file (`supabase/templates/recovery.html`) is only for local development.

**For Production, you need to:**

1. Go to: Authentication → Email Templates → Password Recovery
2. Click "Edit template"
3. **Copy the content from:** `E:\tutusporta\supabase\templates\recovery.html`
4. **Paste it** into the Supabase Dashboard editor
5. Click **"Save"**

---

## 🔄 Step 3: Test the Configuration

### Method 1: Request Password Reset

1. Go to: https://vexnexa.com/simple-login
2. Click "Forgot password?"
3. Enter your email
4. Click "Send Reset Link"

### Method 2: Check Email

Check your inbox for the email from `noreply@vexnexa.com`

**Expected email:**
- Subject: "Reset je VexNexa wachtwoord"
- From: VexNexa <noreply@vexnexa.com>
- Contains a button: "🔐 Wachtwoord opnieuw instellen"
- Contains debug info showing redirect URL

### Method 3: Click the Link

Click the reset button or link in the email.

**Expected behavior:**
- ✅ Redirect to: `https://vexnexa.com/auth/reset-password`
- ✅ Shows password reset form
- ❌ NOT homepage

**If it still goes to homepage, check browser console:**
1. Press F12 to open DevTools
2. Go to Console tab
3. Look for logs starting with `[Callback]` or `[ResetPassword]`
4. Copy and share the logs

---

## 🔍 Troubleshooting

### Issue: Link goes to homepage

**Possible causes:**

1. **Site URL not set correctly**
   - Go to Settings → Auth → URL Configuration
   - Verify Site URL is `https://vexnexa.com`
   - NOT `http://localhost:3000`

2. **Redirect URL not whitelisted**
   - Go to Settings → Auth → URL Configuration
   - Add `https://vexnexa.com/auth/callback` to Additional Redirect URLs

3. **Email template not updated**
   - Go to Authentication → Email Templates
   - Verify the template has been saved in production

4. **Cache issue**
   - Clear browser cache
   - Try incognito/private window
   - Request a new password reset email

### Issue: Email not received

**Check:**

1. **SMTP configured?**
   - Go to Settings → Auth → SMTP Settings
   - Verify Resend SMTP is configured

2. **Check spam folder**
   - Look for email from `noreply@vexnexa.com`

3. **Domain verified in Resend?**
   - Go to https://resend.com/domains
   - Verify `vexnexa.com` has green checkmark

### Issue: "Session expired" error

**This means:**
- The password reset link has expired (1 hour limit)
- OR the session wasn't created properly

**Solution:**
1. Request a new password reset
2. Click the link within 1 hour
3. Don't refresh the page multiple times

---

## 🧪 Debug Mode

The updated email template includes debug information. When you receive the email, check the debug section:

```
Debug: Email type = recovery
Token expiry = 1 hour
Redirect = /auth/reset-password
```

This confirms Supabase knows it's a password reset email.

---

## 📝 Expected Flow

```
User Flow:
1. Click "Forgot password?" on login page
2. Enter email → Submit
3. Receive email from noreply@vexnexa.com
4. Click "🔐 Wachtwoord opnieuw instellen" button
5. Redirect to https://vexnexa.com/auth/callback?code=xxx&type=recovery
6. Callback processes code, creates session
7. Redirect to https://vexnexa.com/auth/reset-password
8. User enters new password
9. Redirect to https://vexnexa.com/dashboard
```

---

## 🚀 Quick Checklist

Before testing, verify:

- [ ] Site URL = `https://vexnexa.com` in Supabase Dashboard
- [ ] `https://vexnexa.com/auth/callback` in Additional Redirect URLs
- [ ] `https://vexnexa.com/auth/reset-password` in Additional Redirect URLs
- [ ] SMTP configured with Resend
- [ ] Domain verified in Resend
- [ ] Email template uploaded to Supabase Dashboard
- [ ] Tested in incognito window (no cache)

---

## 💡 Still Not Working?

If after following all steps it still goes to homepage:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Request password reset
4. Click email link
5. Copy ALL console logs
6. Check Network tab for any failed requests
7. Share the logs for debugging

The logs will show exactly what URL Supabase is redirecting to and why.

---

## 📞 Need Help?

If you're stuck, check:
- Supabase logs: https://supabase.com/dashboard/project/zoljdbuiphzlsqzxdxyy/logs/explorer
- Browser console (F12)
- Network tab to see redirects

---

**Last Updated:** 2025-01-19
**Template Version:** 2.0 (with debug info)
