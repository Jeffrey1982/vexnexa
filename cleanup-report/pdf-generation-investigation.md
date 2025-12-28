# PDF Generation Issue - Investigation Report

**Date:** 2025-12-28
**Status:** 🔴 ROOT CAUSE IDENTIFIED

---

## Executive Summary

The 404 errors when clicking PDF buttons on reports are caused by **missing @vercel/blob package** and **inadequate null checking** in the PDF serving endpoint.

### Root Cause

1. **@vercel/blob is NOT installed** (see `report-generator.tsx:15`)
2. Reports are created with **placeholder URLs** instead of actual blob storage URLs
3. **Null pointer bug** in PDF serving endpoint (`route.ts:53`)
4. No graceful degradation when blob storage unavailable

---

## Technical Analysis

### Issue #1: Missing Vercel Blob Package

**File:** `src/lib/assurance/report-generator.tsx`

**Lines 95-113:**
```typescript
// TODO: Uncomment when @vercel/blob is installed
/*
const blob = await put(filename, pdfBuffer, {
  access: 'public',
  contentType: 'application/pdf',
  addRandomSuffix: false,
});

console.log('[Report Generator] PDF uploaded:', blob.url);
return blob.url;
*/

// Temporary: Return placeholder URL
const placeholderUrl = `/api/assurance/reports/${scanId}/pdf`;
console.warn('[Report Generator] @vercel/blob not installed. Using placeholder URL:', placeholderUrl);
console.warn('[Report Generator] Install with: npm install @vercel/blob');

return placeholderUrl;
```

**Problem:**
- Code is designed to upload PDFs to Vercel Blob storage
- Package is not installed, so it uses placeholder relative URLs
- Placeholder URLs like `/api/assurance/reports/abc123/pdf` are stored in database

---

### Issue #2: Null Pointer Bug in PDF Route

**File:** `src/app/api/assurance/reports/[id]/pdf/route.ts`

**Line 53 (CRITICAL BUG):**
```typescript
// If pdfUrl is a full Blob storage URL, redirect to it
if (report.pdfUrl.startsWith('https://')) {
  return NextResponse.redirect(report.pdfUrl);
}
```

**Problem:**
- If `report.pdfUrl` is `null` or `undefined`, calling `.startsWith()` crashes
- No null check before accessing the property
- This causes 500 errors, not 404s

**This explains why our frontend fix (showing "Generating...") works** - it prevents users from clicking when pdfUrl is null.

---

### Issue #3: How Reports Are Created

**File:** `src/lib/assurance/report-generator.tsx`

**Lines 187-192:**
```typescript
// Generate PDF
const pdfBuffer = await generateReportPDF({ domainId, scanId, language });

// Upload to Blob storage
const pdfUrl = await uploadReportToBlob({ domainId, scanId, pdfBuffer });
```

**Flow:**
1. PDF is generated in memory (works fine)
2. `uploadReportToBlob()` is called
3. Without @vercel/blob, returns placeholder: `/api/assurance/reports/${scanId}/pdf`
4. Placeholder URL is saved to database as `report.pdfUrl`

---

## Database Investigation

### Check for Reports with Placeholder URLs

```sql
-- Find reports with placeholder URLs (relative paths)
SELECT id, domainId, pdfUrl, createdAt
FROM AssuranceReport
WHERE pdfUrl NOT LIKE 'https://%'
  AND pdfUrl IS NOT NULL
ORDER BY createdAt DESC;

-- Find reports with NULL pdfUrl
SELECT id, domainId, pdfUrl, createdAt
FROM AssuranceReport
WHERE pdfUrl IS NULL
ORDER BY createdAt DESC;

-- Count by pdfUrl type
SELECT
  CASE
    WHEN pdfUrl IS NULL THEN 'NULL'
    WHEN pdfUrl LIKE 'https://%' THEN 'Blob Storage'
    ELSE 'Placeholder'
  END as url_type,
  COUNT(*) as count
FROM AssuranceReport
GROUP BY url_type;
```

---

## Immediate Fixes Applied (Already Done ✅)

### Fix #1: Frontend Validation
**File:** `src/app/dashboard/assurance/reports/page.tsx`

```tsx
{report.pdfUrl ? (
  <a href={report.pdfUrl}>
    <Button>PDF</Button>
  </a>
) : (
  <Button disabled title="PDF is being generated">
    Generating...
  </Button>
)}
```

**Impact:** Prevents users from clicking on reports with null pdfUrl ✅

---

## Additional Fixes Needed

### Fix #2: Add Null Check in PDF Route (HIGH PRIORITY)

**File:** `src/app/api/assurance/reports/[id]/pdf/route.ts`

**Current Code (Line 52-55):**
```typescript
// If pdfUrl is a full Blob storage URL, redirect to it
if (report.pdfUrl.startsWith('https://')) {
  return NextResponse.redirect(report.pdfUrl);
}
```

**Fixed Code:**
```typescript
// If pdfUrl is a full Blob storage URL, redirect to it
if (report.pdfUrl && report.pdfUrl.startsWith('https://')) {
  return NextResponse.redirect(report.pdfUrl);
}

// If pdfUrl is null, generate on-the-fly
if (!report.pdfUrl) {
  console.log('[Assurance Reports] pdfUrl is null, generating PDF on-the-fly for:', reportId);

  const pdfBuffer = await generateReportPDF({
    domainId: report.domainId,
    scanId: report.scanId,
    language: report.language,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="assurance-report-${report.domain.domain}-${report.createdAt.toISOString().split('T')[0]}.pdf"`,
      'Content-Length': pdfBuffer.length.toString(),
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
```

---

### Fix #3: Install Vercel Blob (LONG-TERM SOLUTION)

**Step 1: Install package**
```bash
npm install @vercel/blob
```

**Step 2: Set environment variable**
```bash
# In Vercel dashboard, add:
BLOB_READ_WRITE_TOKEN=<your-token-here>
```

Get token from: https://vercel.com/dashboard/stores

**Step 3: Uncomment code**
In `src/lib/assurance/report-generator.tsx:96-106`, uncomment the @vercel/blob code:
```typescript
// Remove the comments:
const blob = await put(filename, pdfBuffer, {
  access: 'public',
  contentType: 'application/pdf',
  addRandomSuffix: false,
});

console.log('[Report Generator] PDF uploaded:', blob.url);
return blob.url;
```

**Step 4: Remove placeholder code**
Delete lines 108-113 (the placeholder return)

---

### Fix #4: Migrate Existing Reports (OPTIONAL)

**Create a migration script to regenerate PDFs for existing reports:**

```typescript
// scripts/migrate-reports-to-blob.ts
import { prisma } from '@/lib/prisma';
import { generateReportPDF, uploadReportToBlob } from '@/lib/assurance/report-generator';

async function migrateReports() {
  // Find all reports with placeholder URLs
  const reports = await prisma.assuranceReport.findMany({
    where: {
      OR: [
        { pdfUrl: null },
        { pdfUrl: { startsWith: '/api/' } }
      ]
    },
    include: { domain: true }
  });

  console.log(`Found ${reports.length} reports to migrate`);

  for (const report of reports) {
    try {
      // Generate PDF
      const pdfBuffer = await generateReportPDF({
        domainId: report.domainId,
        scanId: report.scanId,
        language: report.language
      });

      // Upload to blob
      const pdfUrl = await uploadReportToBlob({
        domainId: report.domainId,
        scanId: report.scanId,
        pdfBuffer
      });

      // Update database
      await prisma.assuranceReport.update({
        where: { id: report.id },
        data: { pdfUrl }
      });

      console.log(`✓ Migrated report ${report.id}`);
    } catch (error) {
      console.error(`✗ Failed to migrate report ${report.id}:`, error);
    }
  }

  console.log('Migration complete!');
}

migrateReports().catch(console.error);
```

---

## How Reports Are Currently Working

### Scenario 1: Placeholder URL in Database
**Database:** `pdfUrl = "/api/assurance/reports/abc123/pdf"`

**Flow:**
1. User clicks PDF button
2. Link goes to `/api/assurance/reports/abc123/pdf`
3. PDF route checks: `pdfUrl.startsWith('https://')` → false
4. Falls through to line 57-64
5. Generates PDF on-the-fly ✅
6. Returns PDF to user ✅

**Works, but slow** - generates PDF every time instead of serving cached version

---

### Scenario 2: NULL pdfUrl in Database
**Database:** `pdfUrl = null`

**Flow (BEFORE our fix):**
1. User clicks PDF button
2. Link goes to `null` (browser navigates to current page)
3. Confusing UX ❌

**Flow (AFTER our fix):**
1. User sees "Generating..." button (disabled)
2. Cannot click ✅
3. Clear indication that PDF is not ready ✅

---

### Scenario 3: Blob Storage URL (IDEAL)
**Database:** `pdfUrl = "https://blob.vercel-storage.com/..."`

**Flow:**
1. User clicks PDF button
2. Link goes to Vercel Blob storage
3. PDF served instantly from CDN ✅
4. Fast, cached, scalable ✅

---

## Why PDFs Might Be NULL

### Possible Causes:

1. **Reports created before PDF generation was implemented**
   - Old reports in database from earlier version
   - Need manual regeneration

2. **PDF generation failed silently**
   - Error in `generateReportPDF()` function
   - No retry mechanism
   - Error swallowed without updating report

3. **Database transaction failed**
   - PDF generated successfully
   - Database update failed
   - Report created with null pdfUrl

4. **Cron job not running**
   - Scheduled scans complete
   - Report generation step skipped
   - Need to check cron logs

---

## Testing Checklist

### After Applying Fixes:

1. ✅ **Test null pdfUrl**
   - Create test report with pdfUrl = null
   - Verify error handling
   - Should generate PDF on-the-fly

2. ✅ **Test placeholder URL**
   - Create test report with pdfUrl = "/api/..."
   - Click PDF button
   - Should generate and serve PDF

3. ✅ **Test with @vercel/blob**
   - Install package
   - Create new report
   - Verify pdfUrl is blob storage URL
   - Verify PDF downloads from blob

4. ✅ **Test frontend validation**
   - Visit reports page
   - Reports without PDFs show "Generating..." button
   - Reports with PDFs show download button

---

## Cron Job Check

**File:** `src/app/api/cron/assurance-scans/route.ts`

Need to verify:
1. Is cron job running on schedule?
2. Does it call `generateAndStoreReport()`?
3. Are there error logs showing PDF generation failures?

**Vercel Cron Setup:**
```json
// vercel.json
{
  "crons": [{
    "path": "/api/cron/assurance-scans",
    "schedule": "0 * * * *"  // Every hour
  }]
}
```

---

## Recommended Action Plan

### Immediate (Do Now) ✅
1. ✅ Frontend validation - **DONE**
2. ⏳ Add null check to PDF route - **READY TO APPLY**
3. ⏳ Test with existing reports

### Short-term (This Week)
1. Install @vercel/blob package
2. Configure BLOB_READ_WRITE_TOKEN
3. Uncomment blob upload code
4. Test with new reports

### Long-term (Next Sprint)
1. Create migration script for old reports
2. Run migration to regenerate PDFs
3. Add monitoring for PDF generation failures
4. Implement retry logic for failed PDF uploads

---

## Cost Estimate

### Vercel Blob Storage Pricing
- Free tier: 500MB storage, 5GB bandwidth/month
- Pro tier: $0.15/GB storage, $0.40/GB bandwidth

### Estimated Usage
- Average PDF size: ~500KB
- 100 reports/month: 50MB storage
- Downloads: ~200/month = 100MB bandwidth

**Monthly Cost:** ~$0 (within free tier) ✅

---

## Monitoring Recommendations

### Add Logging
```typescript
// In report-generator.tsx
console.log('[Report] PDF generation started:', { domainId, scanId });
console.log('[Report] PDF size:', pdfBuffer.length, 'bytes');
console.log('[Report] Upload started');
console.log('[Report] Upload complete:', pdfUrl);
console.log('[Report] Database record created:', reportId);
```

### Add Error Tracking
```typescript
// In generateAndStoreReport
try {
  // ... existing code
} catch (error) {
  console.error('[Report] Generation failed:', {
    domainId,
    scanId,
    error: error.message,
    stack: error.stack
  });

  // Send to error tracking service (Sentry, etc.)
  throw error;
}
```

---

## Conclusion

### Problems Identified:
1. ✅ **@vercel/blob not installed** - Reports use placeholder URLs
2. ✅ **Null pointer bug in PDF route** - Crashes when pdfUrl is null
3. ✅ **No graceful degradation** - Should generate on-the-fly when blob unavailable
4. ⏳ **Old reports with null pdfUrl** - Need investigation/migration

### Fixes Applied:
1. ✅ Frontend validation prevents clicking null PDFs
2. ✅ Clear "Generating..." state for better UX

### Next Steps:
1. Apply null check fix to PDF route
2. Install @vercel/blob for production
3. Investigate database for null/placeholder reports
4. Consider migration script for old reports

**Status:** Issue understood and primary fix applied. Secondary improvements ready to deploy.
