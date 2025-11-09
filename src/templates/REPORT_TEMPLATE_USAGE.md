# WhiteLabel Accessibility Report Template - Usage Guide

## 📁 Files Overview

```
src/templates/
├── report-template.html           # Main HTML template with embedded CSS
├── report-template.interface.ts   # TypeScript data contract
└── REPORT_TEMPLATE_USAGE.md       # This file
```

---

## 🎯 Quick Start

### 1. Import the Data Interface

```typescript
import { ReportData, exampleReportData } from './report-template.interface';
```

### 2. Prepare Your Data

```typescript
const reportData: ReportData = {
  is_whitelabel: true, // Set to true for Pro users
  scan_date: "2025-10-30",
  scan_time: "14:05 CET",
  scanned_url: "https://example.com",
  total_pages_scanned: 12,
  overall_compliance_percent: 68,
  wcag_level: "WCAG 2.1 AA",
  count_critical: 3,
  count_serious: 7,
  count_moderate: 12,
  count_minor: 5,
  hero_thumbnail_src: undefined, // Optional

  top_recommendations: [
    {
      title: "Add Alternative Text to Images",
      reason: "27 images lack alt text...",
      action: "Add descriptive alt attributes..."
    },
    // ... 2 more
  ],

  issues: [
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

### 3. Render the Template

The template uses **Handlebars-style placeholders** (`{{variable}}`). You can use any templating engine:

#### Option A: Using Handlebars (Recommended)

```typescript
import Handlebars from 'handlebars';
import fs from 'fs';

// Register helper functions for severity filtering
Handlebars.registerHelper('filterBySeverity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity);
});

Handlebars.registerHelper('hasIssuesWithSeverity', function(issues, severity) {
  return issues.some(issue => issue.severity === severity);
});

Handlebars.registerHelper('countBySeverity', function(issues, severity) {
  return issues.filter(issue => issue.severity === severity).length;
});

// Load and compile template
const templateHtml = fs.readFileSync('./report-template.html', 'utf-8');
const template = Handlebars.compile(templateHtml);

// Render with data
const html = template(reportData);

// Save or convert to PDF
fs.writeFileSync('output-report.html', html);
```

#### Option B: Using Puppeteer to Generate PDF

```typescript
import puppeteer from 'puppeteer';

async function generatePDF(reportData: ReportData) {
  // Render HTML first (using Handlebars or similar)
  const html = renderTemplate(reportData);

  // Launch headless browser
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set content
  await page.setContent(html, { waitUntil: 'networkidle0' });

  // Generate PDF
  await page.pdf({
    path: 'accessibility-report.pdf',
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '15mm',
      bottom: '20mm',
      left: '15mm'
    }
  });

  await browser.close();
}
```

#### Option C: Using @react-pdf/renderer (Next.js)

```typescript
import { renderToStream } from '@react-pdf/renderer';
// You'd need to convert the HTML template to React components first
```

---

## 🏷️ WhiteLabel Mode

### What is WhiteLabel Mode?

When `is_whitelabel: true`, the template automatically:
- ✅ Removes all product branding
- ✅ Removes company logos, names, URLs
- ✅ Removes footer attribution
- ✅ Provides a completely neutral, professional report

### How to Toggle

```typescript
// For Pro/Enterprise users (whitelabel)
const reportData: ReportData = {
  is_whitelabel: true,
  // ... rest of data
};

// For free/basic users (branded)
const reportData: ReportData = {
  is_whitelabel: false,
  // ... rest of data
  // Add branding fields if needed
};
```

### Current Implementation

The provided template is **already 100% whitelabel** by default:
- No VexNexa logos or mentions
- No product URLs
- No branded footers
- Generic "Web Accessibility Compliance Report" title

**Note:** If you want to add branding for non-whitelabel users, you can modify the template to conditionally show branding when `is_whitelabel: false`.

---

## 📸 Working with Screenshots

### Hero Thumbnail (Executive Summary)

```typescript
const reportData: ReportData = {
  // ... other fields
  hero_thumbnail_src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  // OR
  hero_thumbnail_src: "https://cdn.example.com/screenshots/page-thumbnail.png",
  // OR leave undefined for placeholder
  hero_thumbnail_src: undefined,
};
```

### Issue-Specific Thumbnails

```typescript
{
  issue_title: "Color contrast too low",
  // ... other fields
  issue_thumbnail_src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
}
```

### Best Practices

1. **Use data URLs** for embedded images (self-contained PDF)
2. **Optimize image size**: Recommended max 800x450px for hero, 600x400px for issue thumbnails
3. **Compress images**: Use WebP or optimized JPEG/PNG
4. **Fallback gracefully**: Template shows placeholder if image is missing

### Capture Screenshots in Your Scan Pipeline

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
    fullPage: false // Just viewport
  });

  await browser.close();

  return `data:image/png;base64,${screenshot}`;
}
```

---

## 🎨 Customizing Colors & Styling

### CSS Variables (at top of template)

```css
:root {
  --color-critical: #dc2626;      /* Red for critical issues */
  --color-serious: #ea580c;       /* Orange for serious */
  --color-moderate: #d97706;      /* Yellow for moderate */
  --color-minor: #6b7280;         /* Gray for minor */

  --color-text-primary: #111827;  /* Main text color */
  --color-link: #2563eb;          /* Link color */

  /* Spacing, fonts, etc. */
}
```

### Customization Example

To change the color scheme to match your client's brand:

```css
:root {
  --color-critical: #e11d48;      /* Client's red */
  --color-link: #7c3aed;          /* Client's purple */
  /* ... etc */
}
```

**Note:** These changes apply to all reports. For per-client customization, consider passing CSS variables as part of the `ReportData` interface.

---

## 📄 Template Placeholders Reference

### Executive Summary Fields

| Placeholder | Type | Example | Required |
|------------|------|---------|----------|
| `{{scanned_url}}` | string | `https://example.com` | ✅ |
| `{{scan_date}}` | string | `2025-10-30` | ✅ |
| `{{scan_time}}` | string | `14:05 CET` | ✅ |
| `{{total_pages_scanned}}` | number | `12` | ✅ |
| `{{overall_compliance_percent}}` | number | `68` | ✅ |
| `{{wcag_level}}` | string | `WCAG 2.1 AA` | ✅ |
| `{{count_critical}}` | number | `3` | ✅ |
| `{{count_serious}}` | number | `7` | ✅ |
| `{{count_moderate}}` | number | `12` | ✅ |
| `{{count_minor}}` | number | `5` | ✅ |
| `{{hero_thumbnail_src}}` | string? | `data:image/...` | ❌ |

### Top Recommendations (Array of 3)

| Placeholder | Type | Example | Required |
|------------|------|---------|----------|
| `{{this.title}}` | string | `Add Alt Text to Images` | ✅ |
| `{{this.reason}}` | string | `27 images lack alt text...` | ✅ |
| `{{this.action}}` | string | `Add descriptive alt attributes...` | ✅ |

### Issue Fields (Array)

| Placeholder | Type | Example | Required |
|------------|------|---------|----------|
| `{{this.issue_title}}` | string | `Images missing alt text` | ✅ |
| `{{this.severity}}` | enum | `Critical` | ✅ |
| `{{this.wcag_ref_code}}` | string | `1.1.1` | ✅ |
| `{{this.wcag_ref_level}}` | enum | `AA` | ✅ |
| `{{this.wcag_ref_url}}` | string | `https://w3.org/...` | ✅ |
| `{{this.affected_nodes_count}}` | number | `27` | ✅ |
| `{{this.explanation_short}}` | string | `Screen readers cannot...` | ✅ |
| `{{this.suggested_fix}}` | string | `Add descriptive alt...` | ✅ |
| `{{this.example_selector}}` | string? | `img.product` | ❌ |
| `{{this.example_snippet}}` | string? | `<img src="..." alt="">` | ❌ |
| `{{this.issue_thumbnail_src}}` | string? | `data:image/...` | ❌ |

---

## 🖨️ Print & PDF Best Practices

### CSS Print Styles

The template includes `@media print` styles:
- Removes shadows for cleaner print
- Forces exact color reproduction
- Adds page break control
- Formats links with URLs in print

### Page Break Control

```html
<div class="page-break"></div>        <!-- Force page break -->
<div class="avoid-break">...</div>    <!-- Prevent content splitting -->
```

### PDF Generation Settings

When using Puppeteer:

```typescript
await page.pdf({
  format: 'A4',                   // Or 'Letter' for US
  printBackground: true,          // Include background colors
  preferCSSPageSize: true,        // Respect @page CSS
  displayHeaderFooter: false,     // No header/footer (whitelabel)
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  }
});
```

---

## 🔧 Integration Examples

### Next.js API Route

```typescript
// app/api/reports/pdf/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/pdf-generator';
import { ReportData } from '@/templates/report-template.interface';

export async function POST(req: NextRequest) {
  const reportData: ReportData = await req.json();

  // Generate PDF
  const pdfBuffer = await generatePDF(reportData);

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="accessibility-report-${reportData.scan_date}.pdf"`,
    },
  });
}
```

### React Component (for preview)

```typescript
import { ReportData } from '@/templates/report-template.interface';

export function ReportPreview({ data }: { data: ReportData }) {
  return (
    <div className="report-preview">
      <iframe
        srcDoc={renderTemplate(data)}
        style={{ width: '100%', height: '100vh', border: 'none' }}
        title="Report Preview"
      />
    </div>
  );
}
```

---

## ✅ Validation & Error Handling

### Validate Data Before Rendering

```typescript
import { validateReportData } from './report-template.interface';

function generateReport(data: Partial<ReportData>) {
  if (!validateReportData(data)) {
    throw new Error('Invalid report data structure');
  }

  // Data is valid, proceed with rendering
  return renderTemplate(data);
}
```

### Required Fields Checklist

Before rendering, ensure:
- ✅ `is_whitelabel` is boolean
- ✅ `scan_date` is valid ISO date string
- ✅ `overall_compliance_percent` is 0-100
- ✅ `top_recommendations` has exactly 3 items
- ✅ `issues` array is not empty
- ✅ All issues have required fields
- ✅ WCAG URLs are valid and accessible

---

## 🚀 Performance Optimization

### 1. Cache Rendered Templates

```typescript
const templateCache = new Map<string, HandlebarsTemplateDelegate>();

function getCompiledTemplate() {
  if (!templateCache.has('report-template')) {
    const html = fs.readFileSync('./report-template.html', 'utf-8');
    templateCache.set('report-template', Handlebars.compile(html));
  }
  return templateCache.get('report-template')!;
}
```

### 2. Optimize Image Loading

- Use lazy loading for issue thumbnails
- Compress images before embedding
- Consider using thumbnail service (e.g., Cloudinary)

### 3. Batch PDF Generation

For multiple reports, reuse Puppeteer browser instance:

```typescript
const browser = await puppeteer.launch();

for (const reportData of reports) {
  const page = await browser.newPage();
  // ... generate PDF
  await page.close();
}

await browser.close();
```

---

## 📊 Example: Complete Workflow

```typescript
import { ReportData, sortIssuesBySeverity } from './report-template.interface';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import fs from 'fs';

async function generateAccessibilityReport(scanResults: any): Promise<Buffer> {
  // 1. Transform scan results into ReportData format
  const reportData: ReportData = {
    is_whitelabel: true,
    scan_date: new Date().toISOString().split('T')[0],
    scan_time: new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    }),
    scanned_url: scanResults.url,
    total_pages_scanned: scanResults.pages.length,
    overall_compliance_percent: scanResults.score,
    wcag_level: "WCAG 2.1 AA",
    count_critical: scanResults.criticalCount,
    count_serious: scanResults.seriousCount,
    count_moderate: scanResults.moderateCount,
    count_minor: scanResults.minorCount,
    hero_thumbnail_src: await captureScreenshot(scanResults.url),
    top_recommendations: generateTopRecommendations(scanResults.issues),
    issues: sortIssuesBySeverity(transformIssues(scanResults.issues))
  };

  // 2. Register Handlebars helpers
  registerHandlebarsHelpers();

  // 3. Compile template
  const templateHtml = fs.readFileSync('./report-template.html', 'utf-8');
  const template = Handlebars.compile(templateHtml);

  // 4. Render HTML
  const html = template(reportData);

  // 5. Generate PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
  });

  await browser.close();

  return pdfBuffer;
}

function registerHandlebarsHelpers() {
  Handlebars.registerHelper('filterBySeverity', (issues, severity) =>
    issues.filter(i => i.severity === severity)
  );

  Handlebars.registerHelper('hasIssuesWithSeverity', (issues, severity) =>
    issues.some(i => i.severity === severity)
  );

  Handlebars.registerHelper('countBySeverity', (issues, severity) =>
    issues.filter(i => i.severity === severity).length
  );
}
```

---

## 🔍 Troubleshooting

### Issue: Links not clickable in PDF

**Solution:** Ensure Puppeteer has `printBackground: true` and links have proper `href` attributes.

### Issue: Images not showing

**Solution:** Use data URLs or ensure external images are accessible. Check CORS headers.

### Issue: Page breaks in wrong places

**Solution:** Add `class="avoid-break"` to elements that should stay together.

### Issue: Colors look different in PDF

**Solution:** Use `print-color-adjust: exact` in CSS and `printBackground: true` in Puppeteer.

### Issue: Template variables not replaced

**Solution:** Ensure Handlebars helpers are registered before compiling template. Check variable names match exactly.

---

## 📝 Changelog

### v1.0.0 (2025-10-30)
- Initial whitelabel template release
- Executive summary with KPIs and top recommendations
- Severity-grouped issue sections
- Print-optimized CSS
- TypeScript data interface with validation
- Complete documentation

---

## 📞 Support

For issues or questions:
1. Check this documentation first
2. Review `report-template.interface.ts` for data structure
3. Inspect `report-template.html` for placeholder usage
4. Test with `exampleReportData` to verify template rendering

---

## 📄 License

Internal VexNexa template - Proprietary
Not for redistribution outside organization
