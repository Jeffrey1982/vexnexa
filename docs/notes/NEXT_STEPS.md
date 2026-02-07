# 🚀 Next Steps - Activate Your Google Health Score System

## ✅ What's Complete

Your Google Health & Visibility Score system is **fully implemented** with:

- ✅ Database schema (10 tables)
- ✅ Google API clients (Search Console, Analytics, PageSpeed)
- ✅ 5 secured cron endpoints
- ✅ Score calculation engine (0-1000 points)
- ✅ Action generator
- ✅ Alert system (6 default rules)
- ✅ 6 admin UI pages with complete error handling
- ✅ Documentation and test scripts

**Environment Variables Configured:**


---

## 📋 Action Items

### 1. Deploy Database Migrations (CRITICAL - Do This First!)

The database tables need to be created in production:

```bash
# Via Vercel CLI
npx prisma migrate deploy
```

Or manually in your PostgreSQL database, run the migration SQL from:
`prisma/migrations/20250101000000_google_health_score/migration.sql`

**This creates 10 tables:**
- `gsc_daily_site_metrics`
- `gsc_daily_query_metrics`
- `gsc_daily_page_metrics`
- `ga4_daily_landing_metrics`
- `pagespeed_daily_metrics`
- `score_daily`
- `score_actions_daily`
- `alerts`
- `alert_rules`
- `watched_pages`

---

### 2. Verify Google API Permissions

Make sure your service account has the correct permissions:

**In Google Search Console** (https://search.google.com/search-console):
- Property: `https://www.vexnexa.com/`
- User: Your `GOOGLE_CLIENT_EMAIL`
- Permission: **Owner** (or Full)

**In Google Analytics 4** (https://analytics.google.com/):
- Property: `517433349`
- User: Your `GOOGLE_CLIENT_EMAIL`
- Permission: **Viewer** (minimum)

---

### 3. Trigger Initial Data Ingestion

Once migrations are deployed, trigger the first ingestion:

**Method A: Using curl**

```bash
# Set your CRON_TOKEN (get it from Vercel env vars)
export CRON_TOKEN="your-actual-token"

# Step 1: Ingest Google Search Console data
curl -X POST https://www.vexnexa.com/api/cron/ingest-gsc \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json"

# Step 2: Ingest Google Analytics 4 data
curl -X POST https://www.vexnexa.com/api/cron/ingest-ga4 \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json"

# Step 3: Calculate health scores
curl -X POST https://www.vexnexa.com/api/cron/compute-score \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json"

# Step 4: Initialize alert system
curl -X POST https://www.vexnexa.com/api/cron/run-alerts \
  -H "X-CRON-TOKEN: $CRON_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "date": "2025-12-25",
  "metrics": {
    "site": {
      "impressions": 1234,
      "clicks": 56,
      "ctr": 0.045,
      "position": 12.3
    },
    "queriesCount": 500,
    "pagesCount": 500
  },
  "duration": 2345
}
```

**Method B: Using the script** (requires bash)

```bash
export CRON_TOKEN="your-actual-token"
bash scripts/trigger-ingestion.sh https://www.vexnexa.com
```

---

### 4. View Your Dashboard

Visit: **https://www.vexnexa.com/admin/seo**

You should see:
- ✅ Total health score (0-1000)
- ✅ 5 pillar scores (P1-P5)
- ✅ 30-day score trend chart
- ✅ Active alerts (if any)
- ✅ Recommended actions

**Sub-pages:**
- `/admin/seo/index-health` - P1: Index & Crawl Health
- `/admin/seo/visibility` - P2: Search Visibility
- `/admin/seo/page-quality` - P3+P4: Engagement & Content
- `/admin/seo/alerts` - Alert Management
- `/admin/seo/settings` - Configuration

---

### 5. Set Up Automated Daily Ingestion

#### Option A: Vercel Cron (Recommended)

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

Then commit and push:

```bash
git add vercel.json
git commit -m "feat(cron): add Vercel cron schedule for SEO health ingestion"
git push
```

Vercel will automatically configure the cron jobs to run daily:
- 2:00 AM UTC - Ingest GSC data
- 2:15 AM UTC - Ingest GA4 data
- 2:45 AM UTC - Calculate scores
- 3:00 AM UTC - Check alerts

#### Option B: External Cron Service

Use a service like cron-job.org or EasyCron to hit your endpoints daily with the `X-CRON-TOKEN` header.

---

## 🔍 Verification Checklist

After completing the steps above, verify everything works:

- [ ] Database migrations deployed successfully
- [ ] Service account has Owner permission in GSC
- [ ] Service account has Viewer permission in GA4
- [ ] First ingestion completed without errors
- [ ] Dashboard shows health score (not "—")
- [ ] Can see data in all 6 admin pages
- [ ] Score trend chart appears (may be single point at first)
- [ ] Vercel cron configured (if using)

---

## 📊 Understanding Your Score

### Score Breakdown

Your total score (0-1000) is composed of 5 weighted pillars:

**P1: Index & Crawl Health (0-250)**
- Impressions Trend: Are you getting more visibility? (100 pts)
- Index Coverage: Are pages being indexed? (100 pts)
- Crawl Errors: Are there critical issues? (50 pts)

**P2: Search Visibility (0-250)**
- Clicks Trend: Are you getting more traffic? (100 pts)
- Top Queries Performance: Ranking in top 10? (100 pts)
- Average Position: Overall ranking quality (50 pts)

**P3: Engagement & Intent (0-200)**
- CTR Quality: Do users click your results? (80 pts)
- Engagement Rate: Do users engage with content? (80 pts)
- Returning Users: Are users coming back? (40 pts)

**P4: Content Performance (0-200)**
- Top Pages Growth: Are top pages growing? (80 pts)
- Content Depth: Is engagement time good? (80 pts)
- Conversion Quality: Are users converting? (40 pts)

**P5: Technical Experience (0-100)**
- Core Web Vitals: LCP, CLS, FID passing? (60 pts)
- Mobile Usability: Mobile experience good? (40 pts)

### Score Ranges

- **750-1000**: 🟢 Excellent - Your SEO is in great shape
- **500-750**: 🟡 Good - Some areas need attention
- **250-500**: 🟠 Fair - Significant improvements needed
- **0-250**: 🔴 Poor - Critical issues require immediate action

---

## 🐛 Troubleshooting

### Issue: Dashboard shows "—" for all scores

**Cause**: No data ingested yet

**Solution**:
1. Check database migrations are deployed
2. Trigger manual ingestion (see Step 3 above)
3. Check Vercel function logs for errors

### Issue: "CRON_TOKEN mismatch" error

**Cause**: Token in header doesn't match environment variable

**Solution**:
1. Get exact `CRON_TOKEN` value from Vercel dashboard
2. Make sure no extra spaces or quotes
3. Token is case-sensitive

### Issue: "Invalid credentials" or "Unauthorized" errors

**Cause**: Service account doesn't have proper permissions

**Solution**:
1. Verify service account email is correct in both GSC and GA4
2. Check permissions are Owner (GSC) and Viewer (GA4)
3. Wait 10 minutes for permissions to propagate
4. Verify `GOOGLE_PRIVATE_KEY` contains `\n` characters (literal backslash-n, not actual newlines)

### Issue: "No data available" in Google APIs

**Cause**: Google has 2-3 day data lag

**Solution**:
- This is normal - GSC data is published with a delay
- Wait 24 hours and check again
- The system ingests "yesterday's" data, which is the most recent available

### Issue: Database connection errors

**Cause**: Missing `DIRECT_URL` or migrations not run

**Solution**:
1. Check `DATABASE_URL` and `DIRECT_URL` in Vercel
2. Run `npx prisma migrate deploy`
3. Verify database is accessible

---

## 📈 What Happens Next

Once set up:

1. **Daily at 2:00 AM UTC**: System fetches yesterday's GSC data
2. **Daily at 2:15 AM UTC**: System fetches yesterday's GA4 data
3. **Daily at 2:45 AM UTC**: System calculates new health score
4. **Daily at 3:00 AM UTC**: System checks alert rules and creates notifications

You'll be able to:
- Monitor your 0-1000 health score daily
- Track 5 pillar scores individually
- See 30-day score trends
- Get actionable recommendations
- Receive alerts for critical issues
- Identify low-performing pages/queries
- Track Core Web Vitals (if PageSpeed enabled)

---

## 🆘 Need Help?

- **Full Documentation**: See `GOOGLE_HEALTH_SCORE_COMPLETE.md`
- **Setup Guide**: See `ADMIN_STATUS.md`
- **Test Script**: Run `npx tsx scripts/test-google-integration.ts` (locally with env vars)
- **Trigger Script**: Use `scripts/trigger-ingestion.sh`

---

## 🎯 Quick Start Commands

```bash
# 1. Deploy migrations
npx prisma migrate deploy

# 2. Set your cron token
export CRON_TOKEN="your-token-from-vercel"

# 3. Trigger first ingestion
curl -X POST https://www.vexnexa.com/api/cron/ingest-gsc -H "X-CRON-TOKEN: $CRON_TOKEN"
curl -X POST https://www.vexnexa.com/api/cron/ingest-ga4 -H "X-CRON-TOKEN: $CRON_TOKEN"
curl -X POST https://www.vexnexa.com/api/cron/compute-score -H "X-CRON-TOKEN: $CRON_TOKEN"

# 4. View dashboard
open https://www.vexnexa.com/admin/seo
```

---

**Status**: ✅ Ready to activate - Just run the migrations and trigger ingestion!
