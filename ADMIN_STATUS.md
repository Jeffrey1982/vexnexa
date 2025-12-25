# VexNexa Admin Panel - Status & Setup Guide

## ✅ Admin Pages Status

### Working Pages (All SEO) ✅
All 6 SEO pages have comprehensive error handling and graceful empty states:
- ✅ `/admin/seo` - Overview (4 functions with try-catch)
- ✅ `/admin/seo/index-health` - P1: Index & Crawl Health (3 functions with try-catch)
- ✅ `/admin/seo/visibility` - P2: Search Visibility (4 functions with try-catch)
- ✅ `/admin/seo/page-quality` - P3+P4: Page Quality (4 functions with try-catch)
- ✅ `/admin/seo/alerts` - Alert Management (3 functions with try-catch)
- ✅ `/admin/seo/settings` - Settings & Configuration (2 functions with try-catch)

**Total: 20 database query functions all wrapped in try-catch for graceful failure**

### Existing Pages (May need migrations)
These pages exist but may show errors if database tables aren't created:
- `/admin` - Dashboard
- `/admin/users` - User Management
- `/admin/health` - System Health
- `/admin/sites` - Site Management
- `/admin/teams` - Team Management
- `/admin/white-label` - Branding
- `/admin/analytics` - Usage Analytics
- `/admin/analytics-advanced` - Advanced Analytics
- `/admin/billing` - Billing Management
- `/admin/payments` - Payment History
- `/admin/upgrade` - Upgrade Management
- `/admin/tickets` - Support Tickets ⚠️ (Error reported)
- `/admin/contact-messages` - Contact Messages
- `/admin/blog` - Blog Management

### Current Error: `/admin/tickets`

**Issue**: Server error when clicking Tickets link

**Root Cause**: Database migration likely not run in production. The `SupportTicket` table exists in schema but may not exist in production database.

**Fix**: Run migrations in production:
```bash
# Via Vercel CLI or database console
npx prisma migrate deploy
```

---

## 🔧 Google Analytics API Setup Requirements

### What You Need:

#### 1. **Google Cloud Project** (Free)
- Go to: https://console.cloud.google.com/
- Create a new project or use existing
- Note your Project ID

#### 2. **Enable APIs** (In Google Cloud Console)

Enable these 3 APIs:
1. **Google Search Console API**
   - https://console.cloud.google.com/apis/library/searchconsole.googleapis.com
   - Click "Enable"

2. **Google Analytics Data API**
   - https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com
   - Click "Enable"

3. **PageSpeed Insights API** (Optional)
   - https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com
   - Click "Enable"

#### 3. **Create Service Account**

1. Go to: **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Name: `vexnexa-seo-automation`
4. Click **Create and Continue**
5. Skip role assignment
6. Click **Done**

#### 4. **Generate JSON Key**

1. Find your service account in the list
2. Click the **three dots** (⋮) > **Manage keys**
3. Click **Add Key > Create new key**
4. Select **JSON** format
5. Click **Create** - a file downloads
6. **Keep this file secure** - never commit to git!

The JSON file looks like:
```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBg...\n-----END PRIVATE KEY-----\n",
  "client_email": "vexnexa-seo-automation@your-project.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  ...
}
```

#### 5. **Grant Permissions**

**For Google Search Console:**
1. Go to: https://search.google.com/search-console
2. Select your property (e.g., `https://www.vexnexa.com`)
3. Click **Settings** (gear icon) > **Users and permissions**
4. Click **Add user**
5. Enter the **client_email** from JSON file
   - Example: `vexnexa-seo-automation@your-project.iam.gserviceaccount.com`
6. Set permission: **Owner** or **Full**
7. Click **Add**

**For Google Analytics 4:**
1. Go to: https://analytics.google.com/
2. Select your **GA4 property**
3. Click **Admin** (gear icon, bottom left)
4. Under **Property**, click **Property Access Management**
5. Click **+** (Add users)
6. Enter the same **client_email**
7. Select role: **Viewer** (minimum required)
8. Uncheck "Notify user by email" (it's a service account)
9. Click **Add**

#### 6. **Find Your IDs**

**GA4 Property ID:**
1. In GA4 Admin > **Property Settings**
2. Copy the **Property ID** (numeric, e.g., `123456789`)

**Search Console Site URL:**
1. In Search Console, note your exact property URL
2. Must include protocol and www if applicable
   - Example: `https://www.vexnexa.com` or `https://vexnexa.com`

---

## 📝 Environment Variables to Set

Add these in **Vercel Dashboard > Settings > Environment Variables**:

### Required (5 variables):

```bash
# Search Console
GSC_SITE_URL=https://www.vexnexa.com
# IMPORTANT: Must match EXACTLY as shown in Search Console

# Google Analytics 4
GA4_PROPERTY_ID=123456789
# Numeric ID from GA4 > Admin > Property Settings

# Service Account Authentication
GOOGLE_CLIENT_EMAIL=vexnexa-seo-automation@your-project-123456.iam.gserviceaccount.com
# From JSON file: client_email

GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n"
# From JSON file: private_key
# IMPORTANT: Keep the \n characters - do NOT replace with actual newlines
# Wrap entire key in double quotes

# Cron Job Security
CRON_TOKEN=your-random-secure-token-here
# Generate with: openssl rand -base64 32
# Or use: https://generate-secret.vercel.app/32
```

### Optional (4 variables):

```bash
# PageSpeed Insights (enables P5 scoring)
PAGESPEED_API_KEY=AIzaSyA...your-api-key
# Get from: Google Cloud Console > Credentials > Create API Key

# Data Volume Limits (defaults shown)
GSC_QUERY_LIMIT=500      # Top N queries per day
GSC_PAGE_LIMIT=500       # Top N pages per day
GA4_LANDING_LIMIT=500    # Top N landing pages per day
```

---

## 🚀 How to Set Environment Variables in Vercel

1. Go to: https://vercel.com/your-username/vexnexa
2. Click **Settings** tab
3. Click **Environment Variables** in left sidebar
4. For each variable:
   - **Key**: Variable name (e.g., `GSC_SITE_URL`)
   - **Value**: Variable value
   - **Environments**: Check ✓ Production, Preview, Development
   - Click **Save**

### ⚠️ CRITICAL: Setting GOOGLE_PRIVATE_KEY

When pasting the private key:
- **DO** paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- **DO** keep the `\n` characters (they should appear as literal `\n`, not actual line breaks)
- **DO** wrap in double quotes: `"-----BEGIN..."`
- **DON'T** format or prettify the key
- **DON'T** remove the `\n` characters

Example (truncated):
```
"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG...\n-----END PRIVATE KEY-----\n"
```

After adding all variables, **redeploy** your site for changes to take effect.

---

## 📅 Setting Up Cron Jobs

### Option A: Vercel Cron (Easiest)

Create/update `vercel.json` in project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/ingest-gsc",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/ingest-ga4",
      "schedule": "15 2 * * *"
    },
    {
      "path": "/api/cron/ingest-pagespeed",
      "schedule": "30 2 * * *"
    },
    {
      "path": "/api/cron/compute-score",
      "schedule": "45 2 * * *"
    },
    {
      "path": "/api/cron/run-alerts",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Schedule explanation** (times in UTC):
- `0 2 * * *` = 2:00 AM daily - Ingest GSC data
- `15 2 * * *` = 2:15 AM daily - Ingest GA4 data
- `30 2 * * *` = 2:30 AM daily - Ingest PageSpeed (optional)
- `45 2 * * *` = 2:45 AM daily - Calculate scores
- `0 3 * * *` = 3:00 AM daily - Check alerts

Commit `vercel.json` and push. Vercel automatically configures the cron jobs.

### Option B: Manual Testing (Development)

Test each endpoint manually with curl:

```bash
# Set your CRON_TOKEN
TOKEN="your-cron-token-here"

# Test GSC ingestion
curl -X POST https://www.vexnexa.com/api/cron/ingest-gsc \
  -H "X-CRON-TOKEN: $TOKEN"

# Test GA4 ingestion
curl -X POST https://www.vexnexa.com/api/cron/ingest-ga4 \
  -H "X-CRON-TOKEN: $TOKEN"

# Test score calculation
curl -X POST https://www.vexnexa.com/api/cron/compute-score \
  -H "X-CRON-TOKEN: $TOKEN"

# Test alert engine
curl -X POST https://www.vexnexa.com/api/cron/run-alerts \
  -H "X-CRON-TOKEN: $TOKEN"
```

---

## ✅ Quick Checklist

- [ ] Google Cloud Project created
- [ ] 3 APIs enabled (Search Console, Analytics Data, PageSpeed)
- [ ] Service account created
- [ ] JSON key file downloaded
- [ ] Service account added to Search Console (Owner)
- [ ] Service account added to GA4 (Viewer)
- [ ] GA4 Property ID found
- [ ] 5 required env vars set in Vercel
- [ ] Optional env vars set (if using PageSpeed)
- [ ] `vercel.json` cron config added
- [ ] Committed and pushed to trigger deployment
- [ ] Tested manually with curl (optional)
- [ ] Checked `/admin/seo` dashboard for data

---

## 🐛 Troubleshooting

### Issue: `/admin/tickets` shows error

**Solution**: Run database migrations in production
```bash
npx prisma migrate deploy
```

### Issue: "CRON_TOKEN mismatch"

**Solution**: Verify `CRON_TOKEN` in Vercel matches the header value

### Issue: "Service account unauthorized"

**Solution**:
1. Wait 10 minutes for permissions to propagate
2. Verify service account email is correct
3. Check permissions are Owner (GSC) and Viewer (GA4)

### Issue: "Private key error"

**Solution**: Ensure `GOOGLE_PRIVATE_KEY` has:
- Full key including BEGIN/END headers
- `\n` characters preserved
- Wrapped in double quotes

### Issue: "No data in `/admin/seo`"

**Possible causes**:
1. Cron jobs haven't run yet (wait until scheduled time or trigger manually)
2. Environment variables not set correctly
3. Service account lacks permissions
4. `GSC_SITE_URL` doesn't match exactly (check https vs http, www vs non-www)

### Issue: "GSC data has 2-3 day delay"

**This is normal**: Google Search Console data is published with a 2-3 day lag. The system ingests "yesterday's" data, which is the most recent available.

---

## 📚 Documentation

Full setup guide: `docs/google-health-score.md`

For questions or issues, check Vercel function logs:
- Vercel Dashboard > Your Project > Logs
- Filter by: `/api/cron/*`

---

**Estimated Setup Time**: 30-45 minutes

Once configured, the system runs fully automated with daily ingestion, scoring, and alerting!
