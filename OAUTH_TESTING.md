# OAuth Testing Guide

Quick testing guide for Google and LinkedIn OAuth flows in VexNexa.

## Pre-Testing Checklist

Before testing, ensure:

- [ ] Supabase project is created
- [ ] OAuth providers are enabled in Supabase Dashboard
- [ ] Google OAuth credentials are configured
- [ ] LinkedIn OAuth credentials are configured
- [ ] Development server is running (`npm run dev`)
- [ ] Environment variables are set correctly

## Test Scenarios

### 1. Login with Google

**Steps:**
1. Navigate to `http://localhost:3000/auth/login`
2. Click "Google" button
3. Select/login with Google account
4. Verify redirect to dashboard
5. Check user is created in database

**Expected Results:**
- Redirected to Google OAuth consent screen
- After consent, redirected to `/dashboard`
- User record created in Supabase Auth
- User record synced to Prisma database
- User metadata populated from Google profile

**What to Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;

-- In your database (via Prisma Studio or SQL)
SELECT * FROM "User" ORDER BY "createdAt" DESC LIMIT 1;
```

### 2. Sign Up with LinkedIn

**Steps:**
1. Navigate to `http://localhost:3000/auth/register`
2. Click "LinkedIn" button
3. Login/authorize with LinkedIn account
4. Verify redirect to dashboard with welcome message
5. Check user is created in database

**Expected Results:**
- Redirected to LinkedIn OAuth consent screen
- After consent, redirected to `/dashboard?welcome=true`
- User record created in both Supabase and database
- User metadata populated from LinkedIn profile
- Welcome email sent (if configured)

### 3. Existing User Login

**Steps:**
1. After creating account with OAuth
2. Logout
3. Click same OAuth provider button
4. Should login without re-consent
5. Redirected to dashboard

**Expected Results:**
- Quick redirect (no consent screen)
- Logged in immediately
- Session restored

### 4. Error Handling

**Test Error Scenarios:**

**A. User Cancels OAuth:**
1. Click OAuth button
2. Cancel/close OAuth popup
3. Should stay on login page
4. No error message (expected behavior)

**B. Invalid OAuth Configuration:**
1. Temporarily disable provider in Supabase
2. Try to login
3. Should see error message
4. Re-enable provider

**C. Network Issues:**
1. Disconnect internet
2. Try OAuth login
3. Should see appropriate error

## Verification Checklist

After successful OAuth login, verify:

### Database Sync
- [ ] User exists in `auth.users` (Supabase)
- [ ] User exists in `User` table (Prisma)
- [ ] User ID matches between tables
- [ ] Email is populated correctly
- [ ] Name fields are populated from OAuth provider
- [ ] `plan` is set to "TRIAL"
- [ ] `subscriptionStatus` is "trialing"
- [ ] `trialEndsAt` is set (14 days from now)

### Session State
- [ ] User can access protected routes (`/dashboard`)
- [ ] User profile displays correctly
- [ ] Logout works correctly
- [ ] Session persists on page refresh

### User Metadata

Check what metadata is available from each provider:

**Google provides:**
- `email`
- `name` (full name)
- `avatar_url` (profile picture)
- `email_verified`

**LinkedIn provides:**
- `email`
- `name` (full name)
- `avatar_url` (profile picture)
- May include: `picture`, `sub`, `email_verified`

## Common Issues & Solutions

### Issue: "OAuth provider not enabled"

**Solution:**
- Go to Supabase Dashboard > Authentication > Providers
- Ensure Google/LinkedIn is toggled ON
- Check Client ID and Secret are entered correctly
- Save changes

### Issue: "Redirect URI mismatch"

**Solution:**
- Check OAuth app redirect URI: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
- Verify in Google Console / LinkedIn app settings
- Must match exactly (no trailing slash)

### Issue: "User not syncing to database"

**Solution:**
- Check `src/app/auth/callback/route.ts` logs in terminal
- Verify `ensureUserInDatabase()` function is working
- Check Prisma schema and database connection
- Look for error logs in server console

### Issue: "Session not persisting"

**Solution:**
- Check browser cookies are enabled
- Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
- Clear browser cache and cookies
- Try incognito/private mode

### Issue: "LinkedIn OAuth not working"

**Solution:**
- Ensure "Sign In with LinkedIn" product is approved
- In Supabase, use "LinkedIn (OIDC)" NOT legacy LinkedIn
- Verify redirect URI in LinkedIn app matches Supabase
- Check app is not in development mode restrictions

## Testing in Production

Before deploying to production:

1. **Update OAuth redirect URIs:**
   - Add production URLs to Google Console
   - Add production URLs to LinkedIn app
   - Update Supabase redirect URLs

2. **Test production OAuth:**
   ```
   https://your-domain.com/auth/login
   ```

3. **Verify production database sync:**
   - Test login on production
   - Check production database for user
   - Verify session cookies work over HTTPS

4. **Monitor for errors:**
   - Check server logs
   - Monitor Supabase logs
   - Set up error tracking (Sentry, etc.)

## Manual Testing Script

Use this script to systematically test:

```bash
# 1. Start development server
npm run dev

# 2. Open browser to login page
open http://localhost:3000/auth/login

# 3. Test Google OAuth
# - Click Google button
# - Login with test account
# - Verify redirect to dashboard
# - Check terminal for sync logs

# 4. Logout
# Navigate to http://localhost:3000/auth/logout

# 5. Test LinkedIn OAuth
# - Go to registration page
# - Click LinkedIn button
# - Login with test account
# - Verify redirect to dashboard with welcome

# 6. Check database
npx prisma studio
# - Open User table
# - Verify new users exist
# - Check all fields populated correctly

# 7. Test existing user login
# - Logout
# - Login with same OAuth provider
# - Should be instant (no consent)

# 8. Test error scenarios
# - Try with disabled provider
# - Cancel OAuth popup
# - Verify error handling
```

## Success Criteria

OAuth implementation is successful when:

✅ Users can sign up with Google
✅ Users can sign up with LinkedIn
✅ Users can login with Google
✅ Users can login with LinkedIn
✅ User data syncs to database automatically
✅ Sessions persist across page refreshes
✅ Logout works correctly
✅ Error states are handled gracefully
✅ Works in both development and production
✅ No console errors or warnings
✅ User experience is smooth and fast

## Next Steps After Testing

Once OAuth is tested and working:

1. Monitor user signups via OAuth
2. Track which provider is most popular
3. Consider adding more providers based on user requests
4. Implement OAuth profile picture sync
5. Add social login analytics

## Support

If you encounter issues not covered here:
- Check Supabase Auth logs
- Review server console output
- Check browser console for errors
- Verify OAuth app configurations
- Test with different browsers/accounts
