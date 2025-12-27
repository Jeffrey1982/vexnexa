/**
 * Test Google API Integration
 * Run with: npx tsx scripts/test-google-integration.ts
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { validateGoogleCredentials } from '../src/lib/google/auth';
import { fetchGSCSiteMetrics, getYesterday } from '../src/lib/google/search-console';
import { fetchGA4LandingPageMetrics } from '../src/lib/google/analytics';


async function testGoogleIntegration() {
  console.log('🔍 Testing Google API Integration...\n');

  // Test 1: Validate credentials
  console.log('1️⃣ Validating Google credentials...');
  const validation = await validateGoogleCredentials();
  if (!validation.valid) {
    console.error('❌ Invalid credentials:', validation.error);
    process.exit(1);
  }
  console.log('✅ Credentials valid\n');

  // Test 2: Test Search Console API
  console.log('2️⃣ Testing Google Search Console API...');
  const siteUrl = process.env.GSC_SITE_URL;
  if (!siteUrl) {
    console.error('❌ GSC_SITE_URL not configured');
    process.exit(1);
  }

  try {
    const yesterday = getYesterday();
    const gscMetrics = await fetchGSCSiteMetrics(siteUrl, yesterday, yesterday);
    console.log('✅ Search Console connected');
    console.log(`   Site: ${siteUrl}`);
    console.log(`   Date: ${yesterday}`);
    console.log(`   Impressions: ${gscMetrics.impressions.toLocaleString()}`);
    console.log(`   Clicks: ${gscMetrics.clicks.toLocaleString()}`);
    console.log(`   CTR: ${(gscMetrics.ctr * 100).toFixed(2)}%`);
    console.log(`   Position: ${gscMetrics.position.toFixed(1)}\n`);
  } catch (error) {
    console.error('❌ Search Console error:', error instanceof Error ? error.message : error);
    console.log('   Note: This might be normal if data is not yet available for yesterday\n');
  }

  // Test 3: Test Analytics Data API (GA4)
  console.log('3️⃣ Testing Google Analytics Data API (GA4)...');
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) {
    console.error('❌ GA4_PROPERTY_ID not configured');
    process.exit(1);
  }

  try {
    const yesterday = getYesterday();
    const ga4Metrics = await fetchGA4LandingPageMetrics(propertyId, yesterday, yesterday, 10);
    console.log('✅ Analytics Data API connected');
    console.log(`   Property ID: ${propertyId}`);
    console.log(`   Date: ${yesterday}`);
    console.log(`   Landing pages fetched: ${ga4Metrics.length}`);
    if (ga4Metrics.length > 0) {
      console.log(`   Top page: ${ga4Metrics[0].landingPage}`);
      console.log(`   Sessions: ${ga4Metrics[0].organicSessions.toLocaleString()}\n`);
    }
  } catch (error) {
    console.error('❌ Analytics Data API error:', error instanceof Error ? error.message : error);
    console.log('   Note: This might be normal if data is not yet available for yesterday\n');
  }

  console.log('✅ Integration test complete!\n');
  console.log('Next steps:');
  console.log('1. Run database migrations: npx prisma migrate deploy');
  console.log('2. Trigger data ingestion: curl -X POST https://your-domain.com/api/cron/ingest-gsc -H "X-CRON-TOKEN: $CRON_TOKEN"');
  console.log('3. Calculate scores: curl -X POST https://your-domain.com/api/cron/compute-score -H "X-CRON-TOKEN: $CRON_TOKEN"');
  console.log('4. View dashboard: https://your-domain.com/admin/seo');
}

testGoogleIntegration().catch(console.error);
