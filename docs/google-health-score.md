# Google Health & Visibility Score - Setup Guide

## Overview

The VexNexa Google Health & Visibility Score is a **0-1000 scoring system** that tracks your site's SEO performance across 5 pillars:

- **P1: Index & Crawl Health** (250 pts) - Impressions trend, index coverage, crawl errors
- **P2: Search Visibility** (250 pts) - Clicks trend, top queries, average position
- **P3: Engagement & Intent** (200 pts) - CTR quality, engagement rate, returning users
- **P4: Content Performance** (200 pts) - Top pages growth, content depth, conversions
- **P5: Technical Experience** (100 pts) - Core Web Vitals, mobile usability (optional)

The system automatically:
- **Ingests data daily** from Google Search Console, GA4, and PageSpeed Insights
- **Calculates scores** with normalization and trend analysis
- **Generates action items** with severity and impact ratings
- **Creates alerts** for drops, anomalies, and threshold violations

---

## Prerequisites

1. **Google Search Console** - Verified property for your domain
2. **Google Analytics 4** - GA4 property tracking your site
3. **Google Cloud Project** - Service account with API access
4. **PostgreSQL Database** - Migrations already applied
5. **Vercel** (or alternative) - For scheduled cron jobs

---

## Part 1: Google Cloud Service Account Setup

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your **Project ID**

### Step 2: Enable Required APIs

Enable these APIs in your project:

1. **Search Console API**
   - Navigate to: APIs & Services > Library
   - Search for "Google Search Console API"
   - Click **Enable**

2. **Google Analytics Data API**
   - Search for "Google Analytics Data API"
   - Click **Enable**

3. **(Optional) PageSpeed Insights API**
   - Search for "PageSpeed Insights API"
   - Click **Enable**

### Step 3: Create a Service Account

1. Navigate to: **IAM & Admin > Service Accounts**
2. Click **Create Service Account**
3. Fill in details:
   - **Service account name**: `vexnexa-seo-automation`
   - **Service account ID**: Auto-generated
   - **Description**: "Service account for SEO data ingestion"
4. Click **Create and Continue**
5. Skip granting roles (we'll add permissions directly in GSC/GA4)
6. Click **Done**

### Step 4: Generate Service Account Key

1. Find your newly created service account
2. Click the **three dots** > **Manage keys**
3. Click **Add Key > Create new key**
4. Select **JSON** format
5. Click **Create** - a JSON file will download
6. **IMPORTANT**: Keep this file secure. Never commit it to git.

The JSON file contains:
```json
{
  "type": "service_account",
  "project_id": "your-project-id",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "vexnexa-seo-automation@your-project.iam.gserviceaccount.com",
  ...
}
```

You'll need:
- `client_email` → `GOOGLE_CLIENT_EMAIL`
- `private_key` → `GOOGLE_PRIVATE_KEY`

---

## Part 2: Grant Service Account Access

### Grant Search Console Access

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Select your property
3. Navigate to **Settings** (gear icon) > **Users and permissions**
4. Click **Add user**
5. Enter the **service account email** (from JSON file)
6. Set permission to **Owner** or **Full**
7. Click **Add**

### Grant GA4 Access

1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your **GA4 property**
3. Navigate to **Admin** (gear icon, bottom left)
4. Under **Property**, click **Property Access Management**
5. Click **+** (Add users)
6. Enter the **service account email**
7. Select **Viewer** role (minimum required)
8. Click **Add**

### Find Your GA4 Property ID

1. In GA4 Admin, click **Property Settings**
2. Copy the **Property ID** (format: `123456789`)
3. You'll need this for `GA4_PROPERTY_ID`

---

## Part 3: Environment Variables

Create or update your `.env.local` (development) and add these to Vercel (production):

### Required Variables

```bash
# Google Search Console
GSC_SITE_URL=https://www.vexnexa.com
# Must match exactly as registered in Search Console (include https:// and www if applicable)

# Google Analytics 4
GA4_PROPERTY_ID=123456789
# Find in GA4 Admin > Property Settings

# Service Account Credentials
GOOGLE_CLIENT_EMAIL=vexnexa-seo-automation@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhk...\n-----END PRIVATE KEY-----\n"
# IMPORTANT: Keep the \n newlines. In Vercel, paste the entire key with quotes.

# Cron Security
CRON_TOKEN=your-random-secure-token-here
# Generate with: openssl rand -base64 32
```

### Optional Variables

```bash
# PageSpeed Insights (optional - enables P5 scoring)
PAGESPEED_API_KEY=your-pagespeed-api-key
# Get from: https://console.cloud.google.com/apis/credentials
# Create API key > Restrict to PageSpeed Insights API

# Data Volume Limits (optional - defaults shown)
GSC_QUERY_LIMIT=500      # Top N queries per day
GSC_PAGE_LIMIT=500       # Top N pages per day
GA4_LANDING_LIMIT=500    # Top N landing pages per day
```

### Setting Environment Variables in Vercel

1. Go to your Vercel project
2. Navigate to **Settings > Environment Variables**
3. Add each variable:
   - **Key**: Variable name (e.g., `GSC_SITE_URL`)
   - **Value**: Variable value
   - **Environments**: Select Production, Preview, Development
4. Click **Save**

**IMPORTANT for `GOOGLE_PRIVATE_KEY`**:
- Paste the **entire key** including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Keep the `\n` newline characters (don't replace with actual newlines)
- Wrap in double quotes: `"-----BEGIN PRIVATE KEY-----\n..."`

---

## Part 4: Database Setup

The migrations should already be applied. Verify with:

```bash
npx prisma migrate status
```

If needed, run migrations:

```bash
npx prisma migrate deploy
```

This creates 10 tables:
- `gsc_daily_site_metrics`, `gsc_daily_query_metrics`, `gsc_daily_page_metrics`
- `ga4_daily_landing_metrics`
- `pagespeed_daily_metrics`
- `score_daily`, `score_actions_daily`
- `alerts`, `alert_rules`, `watched_pages`

---

## Part 5: Default Alert Rules

The system includes 6 default monitoring rules. Insert them manually or via SQL:

```sql
INSERT INTO alert_rules (type, enabled, severity, thresholds, lookback_days, description)
VALUES
  (
    'SCORE_DROP_7D',
    true,
    'high',
    '{"min_drop": 50}'::jsonb,
    7,
    'Alert when total score drops by 50+ points over 7 days'
  ),
  (
    'PILLAR_DROP',
    true,
    'high',
    '{"min_pct_drop": 0.15}'::jsonb,
    7,
    'Alert when any pillar drops by 15%+ over 7 days'
  ),
  (
    'VISIBILITY_IMPRESSIONS_DROP',
    true,
    'high',
    '{"min_pct_drop": 0.20}'::jsonb,
    7,
    'Alert when impressions drop by 20%+ over 7 days'
  ),
  (
    'CTR_ANOMALY',
    true,
    'medium',
    '{"min_impressions": 1000, "ctr_ratio": 0.5}'::jsonb,
    1,
    'Alert when pages with high impressions have CTR < 50% of expected'
  ),
  (
    'FUNNEL_CONV_DROP',
    true,
    'high',
    '{"min_pct_drop": 0.25}'::jsonb,
    7,
    'Alert when conversion rate drops by 25%+ over 7 days'
  );
```

Edit thresholds in `/admin/seo/settings` after first run.

---

## Part 6: Cron Jobs Setup

### Option A: Vercel Cron (Recommended)

Create `vercel.json` in your project root:

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

**Schedule Explanation** (UTC times):
- `0 2 * * *` - Ingest GSC at 2:00 AM daily
- `15 2 * * *` - Ingest GA4 at 2:15 AM daily
- `30 2 * * *` - Ingest PageSpeed at 2:30 AM daily (optional)
- `45 2 * * *` - Compute score at 2:45 AM daily
- `0 3 * * *` - Run alerts at 3:00 AM daily

Vercel automatically adds the `X-CRON-TOKEN` header matching your environment variable.

### Option B: External Cron (GitHub Actions, etc.)

Send POST requests with the `X-CRON-TOKEN` header:

```bash
curl -X POST https://your-site.com/api/cron/ingest-gsc \
  -H "X-CRON-TOKEN: your-token-here"
```

Example GitHub Actions workflow:

```yaml
name: SEO Ingestion
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

jobs:
  ingest:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Ingestion
        run: |
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/ingest-gsc \
            -H "X-CRON-TOKEN: ${{ secrets.CRON_TOKEN }}"
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/ingest-ga4 \
            -H "X-CRON-TOKEN: ${{ secrets.CRON_TOKEN }}"
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/compute-score \
            -H "X-CRON-TOKEN: ${{ secrets.CRON_TOKEN }}"
          curl -X POST ${{ secrets.SITE_URL }}/api/cron/run-alerts \
            -H "X-CRON-TOKEN: ${{ secrets.CRON_TOKEN }}"
```

---

## Part 7: Testing & First Run

### Manual Trigger (Development)

Test each endpoint locally:

```bash
# Set X-CRON-TOKEN header to match your .env.local
export CRON_TOKEN="your-token-here"

# Trigger ingestion
curl -X POST http://localhost:3000/api/cron/ingest-gsc \
  -H "X-CRON-TOKEN: $CRON_TOKEN"

curl -X POST http://localhost:3000/api/cron/ingest-ga4 \
  -H "X-CRON-TOKEN: $CRON_TOKEN"

# Compute score
curl -X POST http://localhost:3000/api/cron/compute-score \
  -H "X-CRON-TOKEN: $CRON_TOKEN"

# Run alerts
curl -X POST http://localhost:3000/api/cron/run-alerts \
  -H "X-CRON-TOKEN: $CRON_TOKEN"
```

### Verify Data

1. Check database for data:
```sql
SELECT * FROM gsc_daily_site_metrics ORDER BY date DESC LIMIT 1;
SELECT * FROM ga4_daily_landing_metrics ORDER BY date DESC LIMIT 1;
SELECT * FROM score_daily ORDER BY date DESC LIMIT 1;
```

2. Visit `/admin/seo` - you should see:
   - Total score (0-1000)
   - Pillar breakdown
   - 30-day trend chart
   - Latest alerts (if any)
   - Top action items

### Monitor Logs

Check Vercel logs for errors:
- Vercel Dashboard > Your Project > Logs
- Filter by function: `/api/cron/*`

Common issues:
- **401 errors**: Check `CRON_TOKEN` matches
- **403 errors**: Service account lacks GSC/GA4 permissions
- **Empty data**: Verify `GSC_SITE_URL` and `GA4_PROPERTY_ID` are correct
- **Private key errors**: Check `GOOGLE_PRIVATE_KEY` has `\n` preserved

---

## Part 8: Optional PageSpeed Setup

To enable P5 (Technical Experience scoring):

### Get PageSpeed API Key

1. Go to [Google Cloud Console > Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **Create Credentials > API Key**
3. Restrict the key:
   - Click **Edit API key**
   - Under **API restrictions**, select **Restrict key**
   - Choose **PageSpeed Insights API**
4. Copy the API key

### Add to Environment

```bash
PAGESPEED_API_KEY=AIza...your-key-here
```

### Add Watched Pages

Insert pages to monitor (optional - system will use top GSC pages if empty):

```sql
INSERT INTO watched_pages (url, label, active)
VALUES
  ('https://www.vexnexa.com/', 'Homepage', true),
  ('https://www.vexnexa.com/about', 'About Page', true),
  ('https://www.vexnexa.com/contact', 'Contact Page', true);
```

Or manage via UI at `/admin/seo/settings`

---

## Troubleshooting

### Issue: "CRON_TOKEN mismatch"
- Verify `CRON_TOKEN` in environment matches header value
- Redeploy after changing environment variables

### Issue: "Service account unauthorized"
- Confirm service account email added to GSC with Owner permissions
- Confirm service account added to GA4 with Viewer permissions
- Wait 10 minutes for permissions to propagate

### Issue: "Private key error"
- Ensure `GOOGLE_PRIVATE_KEY` includes full key with headers
- Check `\n` characters are preserved (not replaced with actual newlines)
- In Vercel, paste as: `"-----BEGIN PRIVATE KEY-----\nMIIEv...\n-----END PRIVATE KEY-----\n"`

### Issue: "No data in database"
- Verify `GSC_SITE_URL` exactly matches Search Console property (https://www.example.com vs https://example.com)
- Check `GA4_PROPERTY_ID` is numeric ID from GA4 settings
- Ensure cron jobs ran successfully (check logs)
- GSC data has 2-3 day delay - run ingestion for yesterday's date

### Issue: "Score is 0"
- Requires at least 7 days of historical data for trend calculations
- Run ingestion for multiple days to build baseline
- Check `score_daily` table has data
- Review Vercel function logs for calculation errors

---

## Architecture Reference

### Data Flow

```
Daily at 2 AM UTC:
1. /api/cron/ingest-gsc → Fetches GSC data → gsc_daily_* tables
2. /api/cron/ingest-ga4 → Fetches GA4 data → ga4_daily_landing_metrics
3. /api/cron/ingest-pagespeed → Fetches CWV → pagespeed_daily_metrics (optional)
4. /api/cron/compute-score → Calculates score → score_daily, score_actions_daily
5. /api/cron/run-alerts → Checks rules → alerts table
```

### Score Calculation

Each pillar:
1. Fetches current day + 7-day historical average
2. Calculates growth/decline trends using `pctChange()`
3. Normalizes metrics to 0-1 using `normLinear()` or `normLog()`
4. Multiplies by max points per component
5. Sums to pillar total (P1: 250, P2: 250, P3: 200, P4: 200, P5: 100)

Total score = P1 + P2 + P3 + P4 + P5 = 1000 max

### Alert System

1. Loads enabled rules from `alert_rules`
2. For each rule, checks threshold conditions
3. Creates alert in `alerts` table if violated
4. Deduplicates: no duplicate alerts for same entity within 24 hours
5. UI displays active alerts at `/admin/seo/alerts`

---

## Support

For issues or questions:
- Check `/admin/seo/settings` for configuration status
- Review Vercel function logs for errors
- Verify all environment variables are set correctly
- Ensure service account has proper permissions

---

## Summary Checklist

- [ ] Google Cloud project created
- [ ] Search Console API, GA4 Data API enabled
- [ ] Service account created with JSON key downloaded
- [ ] Service account added to GSC (Owner) and GA4 (Viewer)
- [ ] Environment variables set in Vercel (production) and `.env.local` (dev)
- [ ] Database migrations applied
- [ ] Default alert rules inserted
- [ ] Vercel Cron configured in `vercel.json`
- [ ] First manual test run successful
- [ ] Data visible in `/admin/seo` dashboard
- [ ] (Optional) PageSpeed API key configured
- [ ] (Optional) Watched pages added

**Estimated setup time**: 30-45 minutes

Once complete, the system runs fully automated with daily ingestion, scoring, and alerting.
