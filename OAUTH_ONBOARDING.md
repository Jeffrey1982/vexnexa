# OAuth Onboarding Flow

## Overview

When users sign up via OAuth (Google or LinkedIn), they may not have complete profile information. The onboarding flow ensures all users have at minimum a first and last name.

## Why Onboarding is Needed

OAuth providers return different data:

**Google OAuth typically provides:**
- ✅ Email
- ✅ Full name (sometimes split into first/last)
- ✅ Profile picture
- ❌ May not have separate first/last name fields

**LinkedIn OAuth typically provides:**
- ✅ Email
- ✅ Full name
- ✅ Profile picture
- ❌ May not have separate first/last name fields
- ❌ Limited additional data

## Onboarding Trigger

The onboarding page is shown when:

1. User is **new** (first time login)
2. User signed in via **OAuth** (not email/password)
3. User is missing **first name OR last name**

## Onboarding Flow

```
OAuth Callback
  ↓
Is new user?
  ├─ No  → Redirect to /dashboard (or intended page)
  └─ Yes → Check profile completeness
            ↓
            Has firstName AND lastName?
              ├─ Yes → /dashboard?welcome=true
              └─ No  → /onboarding
                       ↓
                       User fills form
                       ↓
                       Clicks "Complete Setup" or "Skip"
                       ↓
                       Profile saved
                       ↓
                       /dashboard?welcome=true
```

## Onboarding Page Features

**Location:** `/onboarding`

**Pre-filled Data:**
- Email (from OAuth, read-only)
- Full name (if available from OAuth)
- Partial first/last name (extracted from full name)

**Required Fields:**
- ✅ First Name
- ✅ Last Name

**Optional Fields:**
- Company
- Job Title
- Phone Number
- Website
- Country

**Preferences:**
- Marketing Emails (opt-in)
- Product Updates (opt-in by default)

**Actions:**
- **Skip for Now** - Go to dashboard with incomplete profile
- **Complete Setup** - Save profile and go to dashboard

## Technical Implementation

### 1. Callback Route Logic

**File:** `src/app/auth/callback/route.ts`

```typescript
if (isNewUser) {
  // Check if profile is complete
  const hasFirstName = data.user.user_metadata?.first_name ||
                       data.user.user_metadata?.given_name
  const hasLastName = data.user.user_metadata?.last_name ||
                      data.user.user_metadata?.family_name

  if (!hasFirstName || !hasLastName) {
    // Redirect to onboarding
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  // Profile complete - go to dashboard
  return NextResponse.redirect(new URL('/dashboard?welcome=true', request.url))
}
```

### 2. Onboarding Page

**File:** `src/app/onboarding/page.tsx`

**Features:**
- Client-side component
- Fetches current user data on mount
- Pre-fills form from OAuth metadata
- Validates name fields (required)
- Updates both Supabase Auth metadata AND database
- Shows trial information
- GDPR-compliant preferences

**API Calls:**
1. `supabase.auth.getUser()` - Get current user
2. `supabase.auth.updateUser()` - Update metadata
3. `PATCH /api/user/profile` - Update database

### 3. Profile API Enhancement

**File:** `src/app/api/user/profile/route.ts`

**New Method:** `PATCH`
- Allows partial profile updates
- Accepts `profileCompleted: true` flag
- No validation of existing fields
- Updates only provided fields

## User Experience

### Scenario 1: Complete OAuth Profile

**Google user with full name:**

1. Click "Sign in with Google"
2. Authorize on Google
3. ✅ Redirected to `/dashboard?welcome=true`
4. See welcome message

**Duration:** ~10 seconds

### Scenario 2: Incomplete OAuth Profile

**LinkedIn user without separated name:**

1. Click "Sign in with LinkedIn"
2. Authorize on LinkedIn
3. ✅ Redirected to `/onboarding`
4. See pre-filled form with parsed name
5. User reviews/edits name fields
6. User optionally adds company, job title, etc.
7. Click "Complete Setup"
8. ✅ Redirected to `/dashboard?welcome=true`

**Duration:** ~30-60 seconds

### Scenario 3: User Skips Onboarding

**User in a hurry:**

1. Lands on `/onboarding`
2. Clicks "Skip for Now"
3. ✅ Redirected to `/dashboard`
4. Can complete profile later from settings

## Data Flow

### Initial OAuth Data
```json
{
  "user_metadata": {
    "name": "John Doe",
    "email": "john@example.com",
    "avatar_url": "https://..."
  }
}
```

### After Onboarding
```json
{
  "user_metadata": {
    "name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Inc",
    "job_title": "Developer",
    "phone_number": "+31612345678",
    "website": "https://example.com",
    "country": "Netherlands",
    "marketing_emails": false,
    "product_updates": true
  }
}
```

### Database Record
```typescript
{
  id: "uuid",
  email: "john@example.com",
  firstName: "John",
  lastName: "Doe",
  company: "Acme Inc",
  jobTitle: "Developer",
  phoneNumber: "+31612345678",
  website: "https://example.com",
  country: "Netherlands",
  plan: "TRIAL",
  subscriptionStatus: "trialing",
  trialEndsAt: Date + 14 days,
  profileCompleted: true,
  marketingEmails: false,
  productUpdates: true,
  createdAt: Date,
  updatedAt: Date
}
```

## Edge Cases Handled

### 1. User Refreshes During Onboarding
- ✅ Data persists (fetched from Supabase on mount)
- ✅ Form pre-fills again
- ✅ No data loss

### 2. User Navigates Away
- ✅ Can return to `/onboarding` manually
- ✅ Profile remains incomplete
- ✅ Can skip anytime

### 3. Database Sync Fails
- ✅ User can still use the app (auth works)
- ✅ Can retry profile save
- ✅ Error message shown

### 4. Name Already Split by Provider
- ✅ Form pre-fills correctly
- ✅ User can edit if needed
- ✅ No duplicate prompts

### 5. User Manually Navigates to /onboarding
- ✅ Works for any user
- ✅ Shows current profile data
- ✅ Can update profile

## Skip vs Complete

### Skip Behavior
- User record created with `profileCompleted: false`
- Can still use all features
- May see profile completion prompt later
- Can complete from account settings

### Complete Behavior
- User record updated with all data
- `profileCompleted: true` flag set
- Welcome email sent (if configured)
- Better personalization in app

## Metrics to Track

Suggested analytics for onboarding:

1. **Completion Rate**
   - % of users who complete vs skip
   - Average time on onboarding page

2. **OAuth Provider Split**
   - Which provider has more complete data
   - Which provider users prefer

3. **Profile Completeness**
   - % of users with all optional fields
   - Most commonly filled optional fields

4. **Drop-off Points**
   - Users who close during onboarding
   - Fields users struggle with

## Future Enhancements

Potential improvements:

1. **Profile Picture Upload**
   - Allow users to change OAuth avatar
   - Upload custom profile picture

2. **Team Invitation During Onboarding**
   - Ask if user wants to invite team members
   - Pre-populate team settings

3. **Initial Site Setup**
   - Ask for website URL to scan
   - Trigger first scan during onboarding

4. **Preferences Quiz**
   - Ask about accessibility goals
   - Customize dashboard based on answers

5. **Video Tutorial**
   - Show quick product tour
   - Highlight key features

## Testing Checklist

Before deploying:

- [ ] Test Google OAuth with complete profile
- [ ] Test Google OAuth with incomplete profile
- [ ] Test LinkedIn OAuth with complete profile
- [ ] Test LinkedIn OAuth with incomplete profile
- [ ] Test skip functionality
- [ ] Test form validation (empty names)
- [ ] Test form validation (invalid names)
- [ ] Test profile update API
- [ ] Test redirect to dashboard after completion
- [ ] Test refresh during onboarding
- [ ] Test back button during onboarding
- [ ] Test with different screen sizes
- [ ] Test with dark mode
- [ ] Verify database updates correctly
- [ ] Verify Supabase metadata updates

## Summary

The onboarding flow ensures:
- ✅ All users have complete name data
- ✅ Smooth OAuth signup experience
- ✅ Optional detailed profile collection
- ✅ GDPR-compliant preferences
- ✅ Flexible skip option
- ✅ Professional, branded UI
- ✅ Mobile responsive
- ✅ Accessible (WCAG compliant)

Users get started in seconds, with the option to provide more details for a personalized experience.
