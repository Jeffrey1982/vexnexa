# Test Your Resend Email Setup

## Quick Test

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Test email endpoint**:
   Visit: http://localhost:3000/api/test-resend?email=YOUR_EMAIL@gmail.com

   Or use curl:
   ```bash
   curl "http://localhost:3000/api/test-resend?email=YOUR_EMAIL@gmail.com"
   ```

3. **Test newsletter signup**:
   - Go to your homepage footer
   - Enter your email
   - Click subscribe
   - Check your inbox

## What Changed

✅ All emails now send from `onboarding@resend.dev` (Resend's test domain)
✅ No domain verification needed - works immediately
✅ Updated in all files:
   - src/lib/email.ts
   - src/app/api/lead/route.ts
   - src/app/api/test-resend/route.ts
   - All other test routes

## Why This Works

**Before**: You were sending from `support@vexnexa.com` (unverified domain)
- Resend blocked emails because vexnexa.com wasn't verified
- No DNS records (SPF/DKIM) configured

**Now**: Using `onboarding@resend.dev` (Resend's pre-verified domain)
- Works instantly, no setup needed
- Good for testing and development
- Can handle any volume

## Production Setup (When Ready)

To use your own domain `support@vexnexa.com`:

1. Go to https://resend.com/domains
2. Add domain: `vexnexa.com`
3. Add these DNS records to your domain provider:
   - **TXT** record for SPF
   - **TXT** or **CNAME** for DKIM
   - **CNAME** for Return-Path
4. Wait 5-10 minutes for verification
5. Change all `onboarding@resend.dev` back to `support@vexnexa.com`

## Check If It's Working

After testing, you should see:
- ✅ Success response with email ID
- ✅ Email in your inbox (check spam if not in inbox)
- ✅ Console logs showing "Email sent successfully"

## Troubleshooting

If still not working:

1. **Check Resend API key is active**:
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer YOUR_RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"from":"onboarding@resend.dev","to":["YOUR_EMAIL"],"subject":"Test","html":"<p>Test</p>"}'
   ```

2. **Check Resend dashboard**: https://resend.com/emails
   - See all sent emails
   - Check delivery status
   - View any errors

3. **Check server logs** for error messages
