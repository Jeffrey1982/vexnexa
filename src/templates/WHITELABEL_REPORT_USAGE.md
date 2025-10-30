# WhiteLabel Accessibility Report Template - Usage Guide

## 📁 Files Overview

```
src/templates/
├── whitelabel-report-template.html    # Main HTML template with embedded CSS
├── whitelabel-report.interface.ts     # TypeScript data contract
└── WHITELABEL_REPORT_USAGE.md         # This file
```

---

## 🎯 Quick Start

### 1. Import the Data Interface

```typescript
import { ReportData, calculateSeverityPercentages } from './whitelabel-report.interface';
```

### 2. Prepare Your Data

```typescript
const reportData: ReportData = {
  is_whitelabel: true, // Default: true for Pro users
  scan_date: "2025-10-30",
  scan_time: "14:22",
  timezone: "CET",
  scanned_url: "https://example.com",
  total_pages_scanned: 12,
  overall_compliance_percent: 68,
  wcag_level: "WCAG 2.2 AA",
  count_critical: 3,
  count_serious: 7,
  count_moderate: 12,
  count_minor: 5,

  // Calculate percentages for horizontal bars
  ...calculateSeverityPercentages({
    count_critical: 3,
    count_serious: 7,
    count_moderate: 12,
    count_minor: 5
  }),
  // Results in: critical_percent: 11, serious_percent: 26, etc.

  hero_thumbnail_src: undefined, // Optional

  top_recommendations: [
    {
      title: "Add Alternative Text to Images",
      reason: "27 images lack alt text...",
      action: "Add descriptive alt attributes..."
    },
    // ... 2 more (exactly 3 required)
  ],

  issues: [
    // Sorted by severity: Critical → Serious → Moderate → Minor
    {
      issue_title: "Images missing alternative text",
      severity: "Critical",
      wcag_ref_code: "1.1.1",
      wcag_ref_level: "A",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content",
      affected_nodes_count: 27,
      example_selector: "img.product-thumbnail",
      explanation_short: "Screen readers cannot describe images...",
      suggested_fix: "Add descriptive alt attributes...",
    },
    // ... more issues
  ]
};
```

### 3. Render the Template with Handlebars

```typescript
import Handlebars from 'handlebars';
import fs from 'fs';

// Register required Handlebars helpers
Handlebars.registerHelper('filter_severity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity);
});

Handlebars.registerHelper('if_has_severity', function(issues, severity, options) {
  const hasSeverity = issues.some(issue => issue.severity === severity);
  return hasSeverity ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('count_severity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity).length;
});

Handlebars.registerHelper('@index_plus_1', function() {
  return this['@index'] + 1;
});

// Load and compile template
const templateHtml = fs.readFileSync('./whitelabel-report-template.html', 'utf-8');
const template = Handlebars.compile(templateHtml);

// Render with data
const html = template(reportData);
```

### 4. Generate PDF with Puppeteer

```typescript
import puppeteer from 'puppeteer';

async function generatePDF(reportData: ReportData): Promise<Buffer> {
  // Render HTML first
  const html = renderTemplate(reportData);

  // Launch headless browser
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set content
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF with proper settings
  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,  // Essential for colored elements
    preferCSSPageSize: true,
    displayHeaderFooter: false, // Page numbers via @page CSS
    margin: {
      top: '15mm',
      right: '12mm',
      bottom: '15mm',
      left: '12mm'
    }
  });

  await browser.close();
  return pdf;
}
```

---

## 🏷️ WhiteLabel Mode

### What is WhiteLabel Mode?

The `is_whitelabel` flag controls branding visibility:

- **`is_whitelabel: true`** (Default for Pro users):
  - ✅ Zero product branding
  - ✅ No logos, company names, URLs
  - ✅ No branded footers or attribution
  - ✅ Generic "Web Accessibility Compliance Report" title
  - ✅ Neutral page numbers only ("Page 2 of 12")

- **`is_whitelabel: false`** (Optional for free tier):
  - You can modify the template to add branding conditionally

### Current Implementation

The provided template is **100% whitelabel by default**:
- No TutusPorta mentions
- No product URLs or QR codes
- No branded footers
- Only neutral WCAG reference links

**To add branding for non-whitelabel users**, wrap branding elements in Handlebars conditionals:

```handlebars
{{#unless is_whitelabel}}
  <div class="footer-branding">
    Powered by TutusPorta
  </div>
{{/unless}}
```

---

## 📊 Pure CSS Charts Explained

### 1. Donut Chart (Compliance Score)

**How it works:**
- Uses CSS `conic-gradient` to create a pie/donut chart
- CSS variable `--percentage` controls the fill
- Inner circle created with `::before` pseudo-element

**HTML:**
```html
<div class="donut-chart"
     style="--percentage: 68"
     data-percentage="68">
</div>
```

**CSS:**
```css
.donut-chart {
  background: conic-gradient(
    var(--color-text) calc(var(--percentage) * 1%),
    var(--color-border) calc(var(--percentage) * 1%)
  );
}

.donut-chart::before {
  content: attr(data-percentage) "%";
  /* Creates inner white circle with percentage text */
}
```

**Print-safe:** Works in grayscale by using black/grey tones

**Fallback:** If conic-gradient is not supported (rare), it degrades gracefully to a solid circle

### 2. Horizontal Bar Charts (Severity Distribution)

**How it works:**
- Outer `.severity-bar-track` is the gray container
- Inner `.severity-bar-fill` has dynamic width based on percentage
- No JavaScript required - pure CSS width property

**HTML:**
```html
<div class="severity-bar-row">
  <span class="severity-bar-label">Critical</span>
  <div class="severity-bar-track">
    <div class="severity-bar-fill critical" style="width: 11%;"></div>
  </div>
  <span class="severity-bar-count">3</span>
</div>
```

**CSS:**
```css
.severity-bar-fill {
  height: 100%;
  width: 11%; /* Dynamically set via style attribute */
}

.severity-bar-fill.critical {
  background: var(--color-critical);
}
```

**Calculating percentages:**
```typescript
import { calculateSeverityPercentages } from './whitelabel-report.interface';

const percentages = calculateSeverityPercentages({
  count_critical: 3,
  count_serious: 7,
  count_moderate: 12,
  count_minor: 5
});
// Returns: { critical_percent: 11, serious_percent: 26, ... }
```

**Print-safe:** Colors have sufficient contrast for grayscale printing

---

## 📅 Date/Time Formatting

### Consistent Format Throughout

The template uses a single, international format:

**Format:** `YYYY-MM-DD at HH:MM TZ`

**Example:** `2025-10-30 at 14:22 CET`

**Where it appears:**
1. Executive Summary header (page 1)
2. Detailed Findings section header

**Recommended implementation:**
```typescript
function formatScanDateTime(date: Date, timezone: string) {
  const dateStr = date.toISOString().split('T')[0]; // "2025-10-30"
  const timeStr = date.toTimeString().split(' ')[0].slice(0, 5); // "14:22"
  return {
    scan_date: dateStr,
    scan_time: timeStr,
    timezone: timezone || 'UTC'
  };
}
```

---

## 📸 Working with Screenshots

### Hero Thumbnail (Executive Summary)

```typescript
const reportData: ReportData = {
  // ... other fields
  hero_thumbnail_src: "data:image/png;base64,iVBORw0KGgo...",
  // OR external URL
  hero_thumbnail_src: "https://cdn.example.com/screenshot.png",
  // OR omit for placeholder
  hero_thumbnail_src: undefined,
};
```

**Template behavior:**
- If `hero_thumbnail_src` is provided → shows image
- If `hero_thumbnail_src` is undefined → shows placeholder ("Page screenshot unavailable")

### Issue-Specific Thumbnails

```typescript
{
  issue_title: "Color contrast too low",
  issue_thumbnail_src: "data:image/png;base64,...", // Optional
  // ... other fields
}
```

**Best practices:**
1. Use data URLs for self-contained PDFs
2. Recommended sizes: 800x450px (hero), 600x400px (issue)
3. Compress images (WebP or optimized JPEG/PNG)
4. Test in grayscale print mode

### Capture Screenshots During Scan

```typescript
import puppeteer from 'puppeteer';

async function capturePageScreenshot(url: string): Promise<string> {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 900 });
  await page.goto(url, { waitUntil: 'networkidle2' });

  const screenshot = await page.screenshot({
    type: 'png',
    encoding: 'base64',
    fullPage: false
  });

  await browser.close();
  return `data:image/png;base64,${screenshot}`;
}
```

---

## 🎨 Customizing Colors

### CSS Variables

Located at the top of the template:

```css
:root {
  --color-critical: #dc2626;      /* Red */
  --color-serious: #ea580c;       /* Orange */
  --color-moderate: #d97706;      /* Yellow */
  --color-minor: #6b7280;         /* Gray */
  --color-text: #111827;          /* Text */
  --color-link: #2563eb;          /* Links */
  /* ... more */
}
```

### Per-Client Customization

To customize colors per client:

```typescript
function applyClientTheme(html: string, theme: ClientTheme): string {
  return html.replace(':root {', `:root {
    --color-critical: ${theme.criticalColor};
    --color-serious: ${theme.seriousColor};
    --color-link: ${theme.linkColor};
  `);
}
```

---

## 🖨️ Print Optimization

### Page Break Control

The template uses CSS classes:

```html
<div class="page-break"></div>        <!-- Force page break -->
<div class="avoid-break">...</div>    <!-- Keep together -->
```

### Print Styles Included

```css
@media print {
  body {
    print-color-adjust: exact;  /* Force colors in print */
  }

  a[href]::after {
    content: " (" attr(href) ")";  /* Show URLs */
  }
}
```

### Page Numbers

Controlled via `@page` CSS:

```css
@page {
  margin: 15mm 12mm;
  @bottom-center {
    content: "Page " counter(page) " of " counter(pages);
  }
}
```

**Result:** Neutral page numbers like "Page 2 of 12" (no branding)

---

## 🔧 Required Handlebars Helpers

### Register These Before Compiling

```typescript
import Handlebars from 'handlebars';

// Filter issues by severity
Handlebars.registerHelper('filter_severity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity);
});

// Check if severity exists
Handlebars.registerHelper('if_has_severity', function(issues, severity, options) {
  const hasSeverity = issues.some(issue => issue.severity === severity);
  return hasSeverity ? options.fn(this) : options.inverse(this);
});

// Count issues by severity
Handlebars.registerHelper('count_severity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity).length;
});

// Array index + 1 (for numbering)
Handlebars.registerHelper('@index_plus_1', function() {
  return this['@index'] + 1;
});
```

---

## 📋 Template Placeholders Reference

### Executive Summary Fields

| Placeholder | Type | Example | Required |
|------------|------|---------|----------|
| `{{scanned_url}}` | string | `https://example.com` | ✅ |
| `{{scan_date}}` | string | `2025-10-30` | ✅ |
| `{{scan_time}}` | string | `14:22` | ✅ |
| `{{timezone}}` | string | `CET` | ✅ |
| `{{total_pages_scanned}}` | number | `12` | ✅ |
| `{{overall_compliance_percent}}` | number | `68` | ✅ |
| `{{wcag_level}}` | string | `WCAG 2.2 AA` | ✅ |
| `{{count_critical}}` | number | `3` | ✅ |
| `{{count_serious}}` | number | `7` | ✅ |
| `{{count_moderate}}` | number | `12` | ✅ |
| `{{count_minor}}` | number | `5` | ✅ |
| `{{critical_percent}}` | number | `11` | ✅ |
| `{{serious_percent}}` | number | `26` | ✅ |
| `{{moderate_percent}}` | number | `44` | ✅ |
| `{{minor_percent}}` | number | `19` | ✅ |
| `{{hero_thumbnail_src}}` | string? | `data:image/...` | ❌ |

### Top Recommendations (Array of 3)

| Placeholder | Type | Required |
|------------|------|----------|
| `{{this.title}}` | string | ✅ |
| `{{this.reason}}` | string | ✅ |
| `{{this.action}}` | string | ✅ |

### Issue Fields (Array)

| Placeholder | Type | Required |
|------------|------|----------|
| `{{this.issue_title}}` | string | ✅ |
| `{{this.severity}}` | enum | ✅ |
| `{{this.wcag_ref_code}}` | string | ✅ |
| `{{this.wcag_ref_level}}` | enum | ✅ |
| `{{this.wcag_ref_url}}` | string | ✅ |
| `{{this.affected_nodes_count}}` | number | ✅ |
| `{{this.explanation_short}}` | string | ✅ |
| `{{this.suggested_fix}}` | string | ✅ |
| `{{this.example_selector}}` | string? | ❌ |
| `{{this.example_snippet}}` | string? | ❌ |
| `{{this.issue_thumbnail_src}}` | string? | ❌ |

---

## ✅ Validation & Error Handling

### Validate Data Before Rendering

```typescript
import { validateReportData, calculateSeverityPercentages } from './whitelabel-report.interface';

function generateReport(data: Partial<ReportData>) {
  // Calculate percentages
  const percentages = calculateSeverityPercentages(data);
  const completeData = { ...data, ...percentages };

  // Validate
  if (!validateReportData(completeData)) {
    throw new Error('Invalid report data structure');
  }

  // Render
  return renderTemplate(completeData);
}
```

### Required Fields Checklist

- ✅ All date/time fields present (`scan_date`, `scan_time`, `timezone`)
- ✅ Compliance percentage is 0-100
- ✅ All severity counts are non-negative
- ✅ Severity percentages calculated (using helper function)
- ✅ Exactly 3 top recommendations
- ✅ Issues array is not empty
- ✅ All issues have required fields
- ✅ WCAG URLs are valid

---

## 🚀 Complete Integration Example

### Next.js API Route

```typescript
// app/api/reports/whitelabel-pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generateWhitelabelPDF } from '@/lib/pdf-generator';
import { ReportData, calculateSeverityPercentages } from '@/templates/whitelabel-report.interface';

export async function POST(req: NextRequest) {
  const scanData = await req.json();

  // Transform scan results into ReportData
  const reportData: ReportData = {
    is_whitelabel: true,
    scan_date: new Date().toISOString().split('T')[0],
    scan_time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    timezone: 'UTC',
    scanned_url: scanData.url,
    total_pages_scanned: scanData.pages.length,
    overall_compliance_percent: scanData.score,
    wcag_level: "WCAG 2.2 AA",
    count_critical: scanData.criticalCount,
    count_serious: scanData.seriousCount,
    count_moderate: scanData.moderateCount,
    count_minor: scanData.minorCount,
    ...calculateSeverityPercentages({
      count_critical: scanData.criticalCount,
      count_serious: scanData.seriousCount,
      count_moderate: scanData.moderateCount,
      count_minor: scanData.minorCount
    }),
    hero_thumbnail_src: scanData.screenshot,
    top_recommendations: generateTopRecommendations(scanData.issues),
    issues: transformIssues(scanData.issues)
  };

  // Generate PDF
  const pdfBuffer = await generateWhitelabelPDF(reportData);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="accessibility-report-${reportData.scan_date}.pdf"`,
    },
  });
}
```

---

## 🔍 Troubleshooting

### Issue: Donut chart not displaying

**Solution:** Ensure CSS variable is set correctly:
```html
<div class="donut-chart" style="--percentage: 68"></div>
```

### Issue: Horizontal bars all show 0% width

**Solution:** Check that severity percentages are calculated:
```typescript
const percentages = calculateSeverityPercentages(reportData);
```

### Issue: Page breaks in wrong places

**Solution:** Add `class="avoid-break"` to keep sections together

### Issue: Colors don't print

**Solution:** Ensure Puppeteer has `printBackground: true`

### Issue: Template variables not replaced

**Solution:** Verify Handlebars helpers are registered before compiling

---

## 📝 Changelog

### v2.0.0 (2025-10-30)
- Pure CSS donut chart for compliance score (no JavaScript)
- Horizontal bar charts for severity distribution
- Separate timezone field for international support
- Whitelabel by default (is_whitelabel: true)
- Print-optimized with proper page breaks
- Grayscale-friendly color scheme
- System font stack (no external fonts)

---

## 📄 License

Internal TutusPorta template - Proprietary
Not for redistribution outside organization
