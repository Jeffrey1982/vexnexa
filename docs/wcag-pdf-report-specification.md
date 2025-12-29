# WCAG Compliance Report – Enterprise PDF Layout Specification

## 1. Visual Layout Architecture

### Page Format
- **Size**: A4 (210mm × 297mm) / US Letter compatible
- **Orientation**: Portrait
- **Margins**: 20mm top/bottom, 15mm left/right
- **Safe zone**: 10mm additional internal padding
- **Printable area**: 180mm × 257mm

---

## 2. Typography Scale

```typescript
const Typography = {
  // Headers
  H1: {
    size: '32pt',
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.5pt',
    usage: 'Cover page title only'
  },

  H2: {
    size: '24pt',
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.3pt',
    usage: 'Section titles (Executive Summary, Compliance Summary)'
  },

  H3: {
    size: '18pt',
    weight: 600,
    lineHeight: 1.4,
    usage: 'Subsection headers (Priority Issues, KPI cards)'
  },

  H4: {
    size: '14pt',
    weight: 600,
    lineHeight: 1.5,
    usage: 'Issue titles, card headers'
  },

  Body: {
    size: '11pt',
    weight: 400,
    lineHeight: 1.6,
    usage: 'Main content, explanations'
  },

  BodySmall: {
    size: '10pt',
    weight: 400,
    lineHeight: 1.5,
    usage: 'Code snippets, selectors, metadata'
  },

  Caption: {
    size: '9pt',
    weight: 400,
    lineHeight: 1.4,
    color: 'gray-600',
    usage: 'Footer, timestamps, disclaimers'
  },

  Label: {
    size: '9pt',
    weight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5pt',
    usage: 'Badges, severity labels, WCAG tags'
  }
};

// Font Stack (PDF-safe)
fontFamily: {
  primary: config.fontFamily || 'Inter, -apple-system, system-ui, sans-serif',
  mono: 'Consolas, Monaco, "Courier New", monospace'
}
```

---

## 3. Color System & Grayscale Compliance

```typescript
interface BrandConfig {
  logo?: string;
  brandName?: string;
  primaryColor: string;      // Default: #2563EB (blue)
  secondaryColor: string;    // Default: #475569 (slate)
  accentColor: string;       // Default: #10B981 (green)
  headerGradient?: string;   // Optional gradient
  fontFamily?: string;
  footerText?: string;
  showVendorAttribution: boolean;
}

// Semantic Color Mapping
const Colors = {
  // Severity (MUST include pattern/icon differentiation)
  critical: {
    color: '#DC2626',       // Red
    bgColor: '#FEE2E2',
    icon: '⬤',              // Filled circle
    pattern: 'solid-fill'   // For grayscale
  },
  serious: {
    color: '#EA580C',       // Orange
    bgColor: '#FFEDD5',
    icon: '▲',              // Triangle
    pattern: 'diagonal-lines'
  },
  moderate: {
    color: '#F59E0B',       // Amber
    bgColor: '#FEF3C7',
    icon: '■',              // Square
    pattern: 'dots'
  },
  minor: {
    color: '#3B82F6',       // Blue
    bgColor: '#DBEAFE',
    icon: '◆',              // Diamond
    pattern: 'light-dots'
  },

  // Compliance Status
  passed: {
    color: '#10B981',       // Green
    bgColor: '#D1FAE5',
    icon: '✓'
  },
  failed: {
    color: '#DC2626',
    bgColor: '#FEE2E2',
    icon: '✗'
  },
  incomplete: {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '⚠'
  },

  // Neutral Scale (safe for all brands)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    600: '#4B5563',
    800: '#1F2937',
    900: '#111827'
  },

  // Score Gauge
  scoreExcellent: '#10B981',  // 90-100
  scoreGood: '#3B82F6',       // 70-89
  scoreNeeds: '#F59E0B',      // 50-69
  scorePoor: '#DC2626'        // 0-49
};

// Grayscale Fallback Rules
grayscalePrint: {
  critical: { fill: '100%', border: '2pt solid' },
  serious: { fill: '75%', border: '1.5pt solid' },
  moderate: { fill: '50%', border: '1pt solid' },
  minor: { fill: '25%', border: '0.5pt dashed' }
}
```

---

## 4. Page-by-Page Layout Specification

### PAGE 1: COVER PAGE

```
┌─────────────────────────────────────────────┐
│                                             │
│  [Optional Logo - 40mm max width]          │ ← Top 60mm
│  {config.brandName || ""}                  │
│                                             │
│  ─────────────────────────────────────────  │ ← Accent line
│                                             │
│                                             │
│                                             │
│        Accessibility Compliance Report      │ ← H1, centered
│                                             │
│                www.example.com              │ ← H3, gray-700
│                                             │
│                                             │
│                                             │
│  Scan Date: January 15, 2025               │ ← Body, centered
│  Generated: January 15, 2025 14:32 UTC    │
│                                             │
│                                             │
│                                             │
│  ─────────────────────────────────────────  │ ← Bottom accent
│                                             │
│  {config.footerText || "Confidential"}     │ ← Caption
│                                             │
└─────────────────────────────────────────────┘

Spacing:
- Logo: 60mm from top, centered
- Title: 120mm from top
- URL: 135mm from top
- Dates: 160mm from top
- Footer: 20mm from bottom
```

### PAGE 2: EXECUTIVE SUMMARY

```
┌─────────────────────────────────────────────┐
│ Executive Summary                      p. 2 │ ← H2 + page number
│ ───────────────────────────────────────     │
│                                             │
│           ┌─────────────┐                  │
│           │             │                  │
│           │     425     │  ← Score (48pt)  │
│           │   /1000     │                  │
│           │             │                  │
│           │  Needs      │  ← Verdict (14pt)│
│           │ Improvement │                  │
│           └─────────────┘                  │
│                                             │
│  Your website has 23 accessibility issues   │
│  that require attention. Critical issues    │
│  prevent some users from accessing content. │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ WCAG Compliance Status               │  │
│  │                                      │  │
│  │ ✓ Level A:    85% compliant         │  │
│  │ ⚠ Level AA:   62% compliant         │  │
│  │ ✗ Level AAA:  Not tested            │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ Issues by Severity                   │  │
│  │                                      │  │
│  │ ⬤ Critical:     3 issues            │  │
│  │ ▲ Serious:      8 issues            │  │
│  │ ■ Moderate:     9 issues            │  │
│  │ ◆ Minor:        3 issues            │  │
│  └──────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘

Components:
- Score Circle: 120mm diameter, stroke 6pt
- Verdict text: bold, color matches score range
- Info boxes: 10mm padding, gray-100 background, 1pt border
```

### PAGE 3: KPI OVERVIEW GRID

```
┌─────────────────────────────────────────────┐
│ Key Metrics                            p. 3 │
│ ───────────────────────────────────────     │
│                                             │
│  ┌────────────────┐  ┌────────────────┐   │
│  │ Accessibility  │  │ Performance    │   │
│  │                │  │                │   │
│  │      425       │  │      78        │   │
│  │     /1000      │  │     /100       │   │
│  │                │  │                │   │
│  │ Needs Work     │  │ Good           │   │
│  └────────────────┘  └────────────────┘   │
│                                             │
│  ┌────────────────┐  ┌────────────────┐   │
│  │ SEO Score      │  │ Total Issues   │   │
│  │                │  │                │   │
│  │      82        │  │      23        │   │
│  │     /100       │  │                │   │
│  │                │  │                │   │
│  │ Good           │  │ Action Needed  │   │
│  └────────────────┘  └────────────────┘   │
│                                             │
│  ┌────────────────────────────────────────┐│
│  │ Scan Coverage                          ││
│  │                                        ││
│  │ • Pages scanned: 1                    ││
│  │ • Elements analyzed: 1,247            ││
│  │ • Rules evaluated: 98 (WCAG 2.1 AA)   ││
│  │ • Scan duration: 3.2 seconds          ││
│  └────────────────────────────────────────┘│
│                                             │
└─────────────────────────────────────────────┘

Card Specs:
- Grid: 2x2, 8mm gap
- Card size: 85mm × 65mm
- Padding: 6mm
- Border: 1pt solid gray-200
- Score: 32pt bold
- Label: 11pt gray-600
```

### PAGE 4: PRIORITY ISSUES

```
┌─────────────────────────────────────────────┐
│ Priority Issues                        p. 4 │
│ ───────────────────────────────────────     │
│                                             │
│ These issues require immediate attention:   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ ⬤ CRITICAL                           │   │
│ │ Missing form labels                  │   │
│ │                                      │   │
│ │ WCAG 2.1: 3.3.2 Labels or Instructions│  │
│ │ Affects: 8 form elements             │   │
│ │                                      │   │
│ │ Why this matters:                    │   │
│ │ Screen reader users cannot identify  │   │
│ │ what information is required in forms.│  │
│ │                                      │   │
│ │ How to fix:                          │   │
│ │ Add <label> elements or aria-label   │   │
│ │ attributes to all form inputs.       │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ ⬤ CRITICAL                           │   │
│ │ Insufficient color contrast          │   │
│ │ [Similar structure...]               │   │
│ └──────────────────────────────────────┘   │
│                                             │
│ ┌──────────────────────────────────────┐   │
│ │ ▲ SERIOUS                            │   │
│ │ Images missing alt text              │   │
│ │ [Similar structure...]               │   │
│ └──────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘

Issue Card Specs:
- Width: 100% (170mm)
- Padding: 6mm
- Margin bottom: 5mm
- Border-left: 4pt solid {severity.color}
- Background: severity.bgColor
- Page break: avoid inside card
```

### PAGE 5+: DETAILED FINDINGS (REPEATABLE)

```
┌─────────────────────────────────────────────┐
│ Detailed Findings                   p. 5-N │
│ ───────────────────────────────────────     │
│                                             │
│ ⬤ CRITICAL  WCAG 2.1: 1.3.1               │ ← Badge + Tag
│ Missing form labels                         │ ← H4
│ ─────────────────────────────────────       │
│                                             │
│ Affected Elements: 8                        │
│                                             │
│ input[type="email"]                         │ ← Mono font
│   Line 142, Column 8                        │
│   <input type="email" name="email">        │
│                                             │
│ input[type="password"]                      │
│   Line 156, Column 8                        │
│   <input type="password" name="pwd">       │
│                                             │
│ [+ 6 more]                                  │
│                                             │
│ Impact on Users:                            │
│ Screen reader users cannot determine what   │
│ information is required. Keyboard users may │
│ struggle to navigate forms efficiently.     │
│                                             │
│ Recommended Fix:                            │
│ Associate each input with a <label> element:│
│                                             │
│   <label for="email">Email Address</label> │
│   <input type="email" id="email">          │
│                                             │
│ Or use aria-label for icon-only inputs:    │
│                                             │
│   <input aria-label="Search" type="search">│
│                                             │
│ ─────────────────────────────────────       │
│                                             │
│ [Next issue...]                             │
│                                             │
└─────────────────────────────────────────────┘

Spacing:
- Section margin-top: 8mm
- Element list: 4mm padding, gray-50 bg
- Code blocks: 4mm padding, gray-100 bg, mono font
- Between sections: 6mm
```

---

## 5. White-Label Branding Requirements

### Strict Requirements

The layout MUST support full white-labeling via a config object:

```typescript
interface BrandConfig {
  logo?: string;              // Optional logo URL
  brandName?: string;         // Company name (or empty)
  primaryColor: string;       // Main brand color
  secondaryColor: string;     // Secondary accent
  accentColor: string;        // Highlight color
  headerGradient?: string;    // Optional gradient
  fontFamily?: string;        // Custom font (with fallback)
  footerText?: string;        // Custom footer text
  showVendorAttribution: boolean; // Show/hide "Powered by"
}
```

### Anti-Patterns (DO NOT DO)

❌ No hardcoded brand names anywhere
❌ No marketing language
❌ No flashy UI elements
❌ No reliance on color alone for meaning
❌ No dashboard-style clutter

### Requirements

✅ Report must look complete even with empty branding config
✅ All colors must be configurable
✅ Logo is always optional
✅ Must remain professional and trustworthy

---

## 6. Data Mapping (axe-core to PDF)

```typescript
interface AxeResult {
  violations: AxeViolation[];
  passes: AxePass[];
  incomplete: AxeIncomplete[];
  url: string;
  timestamp: string;
}

interface AxeViolation {
  id: string;                    // Rule ID
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  tags: string[];                // ['wcag2a', 'wcag131']
  description: string;           // Human-readable title
  help: string;                  // Short explanation
  helpUrl: string;               // Link to docs
  nodes: {
    html: string;                // Element HTML
    target: string[];            // CSS selector
    failureSummary: string;      // What failed
  }[];
}

// Mapping Logic
function mapAxeDataToPDF(axeResult: AxeResult) {
  return {
    coverPage: {
      title: "Accessibility Compliance Report",
      url: axeResult.url,
      scanDate: axeResult.timestamp,
      generatedDate: new Date().toISOString()
    },

    executiveSummary: {
      score: calculateScore(axeResult),
      verdict: getVerdict(score),
      totalIssues: axeResult.violations.length,
      severityBreakdown: {
        critical: filterBySeverity('critical').length,
        serious: filterBySeverity('serious').length,
        moderate: filterBySeverity('moderate').length,
        minor: filterBySeverity('minor').length
      }
    },

    priorityIssues: axeResult.violations
      .filter(v => ['critical', 'serious'].includes(v.impact))
      .sort((a, b) => severityWeight(a.impact) - severityWeight(b.impact))
      .slice(0, 5)
      .map(violation => ({
        severity: violation.impact,
        title: violation.description,
        wcagCriterion: extractWCAGTag(violation.tags),
        affectedCount: violation.nodes.length,
        impact: violation.help,
        fix: generateFixGuidance(violation)
      })),

    detailedFindings: axeResult.violations.map(violation => ({
      severity: violation.impact,
      title: violation.description,
      wcagCriterion: extractWCAGTag(violation.tags),
      affectedElements: violation.nodes.map(node => ({
        selector: node.target.join(' > '),
        html: node.html,
        failureSummary: node.failureSummary
      })),
      impact: violation.help,
      fix: generateFixGuidance(violation)
    }))
  };
}

// Helper Functions
function calculateScore(axe: AxeResult): number {
  const weights = { critical: 100, serious: 50, moderate: 20, minor: 5 };
  const totalPenalty = axe.violations.reduce(
    (sum, v) => sum + (weights[v.impact] * v.nodes.length), 0
  );
  return Math.max(0, 1000 - totalPenalty);
}

function extractWCAGTag(tags: string[]): string {
  const wcagTag = tags.find(t => t.match(/wcag\d+/));
  if (!wcagTag) return 'N/A';

  // Convert 'wcag131' to '1.3.1'
  const match = wcagTag.match(/wcag(\d)(\d)(\d)/);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : wcagTag;
}

function getVerdict(score: number): string {
  if (score >= 900) return 'Excellent';
  if (score >= 700) return 'Good';
  if (score >= 500) return 'Needs Improvement';
  return 'Poor';
}
```

---

## 7. PDF Generation Implementation

```typescript
import puppeteer from 'puppeteer';

async function generateAccessibilityPDF(
  axeResult: AxeResult,
  config: BrandConfig
): Promise<Buffer> {

  // 1. Process data
  const reportData = mapAxeDataToPDF(axeResult);

  // 2. Merge with brand config
  const fullConfig = { ...defaultConfig, ...config };

  // 3. Render HTML
  const html = renderTemplate(reportData, fullConfig);

  // 4. Generate PDF
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      bottom: '20mm',
      left: '15mm',
      right: '15mm'
    },
    displayHeaderFooter: true,
    preferCSSPageSize: true
  });

  await browser.close();

  return pdf;
}
```

---

## 8. Quality Assurance Checklist

### Visual Quality
- [ ] Professional appearance when printed
- [ ] No clipped text or overflow
- [ ] Consistent spacing throughout
- [ ] Readable in grayscale
- [ ] Proper page breaks (no orphaned headers)

### Content Accuracy
- [ ] All axe-core violations mapped correctly
- [ ] WCAG references accurate
- [ ] Severity levels correct
- [ ] No missing data errors

### White-Label Compliance
- [ ] No hardcoded brand names visible
- [ ] Works with empty config (minimal branding)
- [ ] Custom colors apply correctly
- [ ] Logo displays without distortion

### Accessibility (Meta)
- [ ] PDF itself is tagged for screen readers
- [ ] Proper heading hierarchy (H1 → H2 → H3)
- [ ] Alt text on images/charts
- [ ] Sufficient color contrast
- [ ] Logical reading order

### PDF Technical
- [ ] File size < 5MB for typical report
- [ ] Fonts embedded correctly
- [ ] Links are clickable
- [ ] Metadata populated
- [ ] Opens in all major PDF readers

---

## 9. Implementation Priority

### Phase 1: Core Structure (Week 1)
1. Set up PDF generation pipeline (Puppeteer/Playwright)
2. Implement white-label config system
3. Create basic page templates
4. Build typography and color system

### Phase 2: Data Processing (Week 2)
1. Parse axe-core JSON
2. Calculate accessibility score
3. Map violations to WCAG criteria
4. Generate fix recommendations

### Phase 3: Components (Week 3)
1. Score gauge (circular/linear)
2. Severity badges
3. KPI cards
4. Issue cards
5. Compliance checklist

### Phase 4: Testing & Polish (Week 4)
1. Test with various data scenarios
2. Verify print quality (color & grayscale)
3. Test white-label variants
4. Optimize PDF file size
5. Add PDF metadata and tags

---

## 10. Technology Stack Recommendations

### PDF Generation Libraries

**Option 1: Puppeteer (Recommended)**
- ✅ Best for dynamic data
- ✅ Full CSS support
- ✅ Easy to maintain
- ✅ Free and open-source
- ❌ Larger bundle size

**Option 2: Playwright**
- ✅ Modern, fast
- ✅ Excellent cross-browser support
- ✅ Better API than Puppeteer
- ❌ Newer, smaller ecosystem

**Option 3: Prince XML**
- ✅ Best PDF quality
- ✅ Superior print output
- ✅ Advanced layout features
- ❌ Commercial license required
- ❌ Expensive

**Option 4: wkhtmltopdf**
- ✅ Fast and lightweight
- ✅ Free and open-source
- ❌ Limited CSS support
- ❌ No longer actively maintained

### Recommended: Puppeteer + React/Next.js
```bash
npm install puppeteer react-pdf-html
```

---

## 11. File Structure

```
src/
├── lib/
│   ├── pdf/
│   │   ├── generator.ts           # Main PDF generation
│   │   ├── templates/
│   │   │   ├── cover.tsx
│   │   │   ├── executive-summary.tsx
│   │   │   ├── kpi-grid.tsx
│   │   │   ├── priority-issues.tsx
│   │   │   ├── detailed-findings.tsx
│   │   │   ├── compliance-summary.tsx
│   │   │   └── legal.tsx
│   │   ├── components/
│   │   │   ├── score-gauge.tsx
│   │   │   ├── severity-badge.tsx
│   │   │   ├── kpi-card.tsx
│   │   │   ├── issue-card.tsx
│   │   │   └── compliance-row.tsx
│   │   ├── styles/
│   │   │   ├── pdf.css            # Print-optimized CSS
│   │   │   └── theme.ts           # Color system
│   │   └── utils/
│   │       ├── axe-mapper.ts      # axe-core data mapping
│   │       ├── score-calculator.ts
│   │       └── wcag-extractor.ts
│   └── accessibility/
│       └── scanner.ts              # axe-core integration
└── app/
    └── api/
        └── reports/
            └── accessibility/
                └── route.ts        # API endpoint
```

---

## 12. API Endpoint Design

```typescript
// POST /api/reports/accessibility
export async function POST(request: Request) {
  const { url, brandConfig } = await request.json();

  // 1. Run axe-core scan
  const axeResult = await runAccessibilityScan(url);

  // 2. Generate PDF
  const pdf = await generateAccessibilityPDF(axeResult, brandConfig);

  // 3. Return PDF
  return new Response(pdf, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="accessibility-report-${Date.now()}.pdf"`
    }
  });
}
```

---

## Contact & Support

This specification is designed for enterprise-grade accessibility compliance reporting. For implementation questions or clarifications, refer to:

- **WCAG 2.1 Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **axe-core Documentation**: https://github.com/dequelabs/axe-core
- **Puppeteer PDF Options**: https://pptr.dev/api/puppeteer.pdfoptions

---

**Last Updated**: January 15, 2025
**Version**: 1.0.0
**Status**: Production-Ready Specification
