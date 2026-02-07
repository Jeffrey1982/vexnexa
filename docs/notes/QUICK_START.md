# Quick Start: Activate SEO Health Monitoring

## The Problem
Your SEO dashboard shows "Connect Google Services" because no data has been ingested yet.

## The Solution (2 Clicks!)

### Option 1: Use the Admin Panel (Recommended) ⭐

1. **Wait for deployment** (~3 minutes)
   - Latest commit: `5d28007`
   - Check status: https://vercel.com/jeffreyaay-gmailcoms-projects/vexnexa

2. **Go to SEO Settings**
   - Visit: https://www.vexnexa.com/admin/seo/settings
   - Or click "Settings" in the SEO Health dashboard

3. **Click "Trigger Now"**
   - The button is in the "Manual Data Ingestion" section
   - Wait 2-5 minutes for processing
   - You'll see real-time status for each job

4. **Done!**
   - Visit https://www.vexnexa.com/admin/seo
   - Your dashboard will now show your Health Score

---

### Option 2: Use Command Line (Advanced)

If you prefer the command line:

```bash
# Get your CRON_TOKEN from Vercel
bash scripts/test-cron-auth.sh

# Trigger ingestion
CRON_TOKEN='your_token' bash scripts/trigger-seo-crons.sh
```

---

## What Gets Populated

When you click "Trigger Now", the system:

1. ✅ Fetches yesterday's Google Search Console data
   - Search queries, impressions, clicks, CTR
   - Page indexing status
   - Coverage issues

2. ✅ Fetches Google Analytics 4 data
   - Landing page metrics
   - Engagement time, bounce rate
   - User behavior data

3. ✅ Fetches PageSpeed Insights
   - Core Web Vitals (LCP, FID, CLS)
   - Performance scores
   - Mobile usability

4. ✅ Calculates SEO Health Score (0-1000)
   - Pillar 1: Index & Crawl Health (250 pts)
   - Pillar 2: Search Visibility (250 pts)
   - Pillar 3: Engagement & Intent (250 pts)
   - Pillar 4: Content Performance (150 pts)
   - Pillar 5: Technical Experience (100 pts)

5. ✅ Detects Issues & Creates Alerts
   - Score drops, CTR anomalies, indexing issues
   - Conversion rate drops, visibility issues

---

## What You'll See

After ingestion completes:

### Dashboard: /admin/seo
- **Health Score** (e.g., 782/1000)
- **30-Day Trend** (bar chart)
- **Active Alerts** (if any issues detected)
- **Recommended Actions** (prioritized improvements)

### Detailed Pages:
- **/admin/seo/index-health** - Indexing & crawl metrics
- **/admin/seo/search-performance** - Query rankings & visibility
- **/admin/seo/content-performance** - Landing page effectiveness
- **/admin/seo/page-quality** - Core Web Vitals & speed
- **/admin/seo/alerts** - Issue tracking & resolution

---

## Automated Daily Updates

After initial setup, **everything runs automatically**:

| Time | Job | Purpose |
|------|-----|---------|
| 2:00 AM | Google Search Console | Fetch yesterday's search data |
| 2:15 AM | Google Analytics 4 | Fetch landing page metrics |
| 2:30 AM | Compute Score | Calculate Health Score |
| 2:45 AM | Run Alerts | Detect issues & create alerts |
| 3:00 AM | PageSpeed Insights | Update Core Web Vitals |

You'll wake up to fresh data every morning!

---

## Troubleshooting

### "Trigger Now" button doesn't work
- **Cause**: Deployment not complete
- **Solution**: Wait for Vercel deployment to finish, then refresh

### Jobs fail with "Invalid CRON_TOKEN"
- **Cause**: Environment variable not set correctly
- **Solution**: This shouldn't happen with the button method (it uses internal token)

### Jobs succeed but no data shows
- **Cause**: Database tables may not exist
- **Solution**: Run Prisma migration:
  ```bash
  npx prisma migrate deploy
  ```

### Jobs succeed but scores are 0
- **Cause**: No data available for yesterday
- **Solution**: Normal for new sites. Wait 24 hours for Google to collect data.

---

## Environment Variables (Already Set ✅)

All required variables are configured in Vercel Production:

- ✅ `GSC_SITE_URL` = sc-domain:vexnexa.com
- ✅ `GA4_PROPERTY_ID` = 517433349
- ✅ `GOOGLE_CLIENT_EMAIL` = Service account email
- ✅ `GOOGLE_PRIVATE_KEY` = Service account private key
- ✅ `CRON_TOKEN` = Authentication token for cron jobs
- ✅ `NEXT_PUBLIC_GA4_MEASUREMENT_ID` = G-8RD0R3P0EN

No configuration needed - just click the button!

---

## Need Help?

1. Check deployment: https://vercel.com/jeffreyaay-gmailcoms-projects/vexnexa
2. View full guide: `SEO_SETUP_COMPLETE.md`
3. Check logs in Vercel dashboard for errors

**Ready?** Just click "Trigger Now" in the admin panel! 🚀
