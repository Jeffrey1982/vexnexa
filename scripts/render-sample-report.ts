/**
 * Render a realistic sample accessibility report to HTML for visual review.
 *
 * Usage:
 *   npx tsx scripts/render-sample-report.ts [out.html]
 */
import { writeFileSync } from "fs";
import { transformScanToReport } from "../src/lib/report/transform";
import { renderReportHTML } from "../src/lib/report/render-html";

const violations = [
  {
    id: "color-contrast",
    impact: "serious",
    help: "Elements must have sufficient color contrast",
    description: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds.",
    tags: ["wcag143", "wcag2aa"],
    nodes: [
      { target: ["#hero > p.subtitle"], html: "<p class='subtitle' style='color:#9ca3af'>Welkom op onze website</p>", failureSummary: "Element has insufficient color contrast of 2.85 (foreground color: #9ca3af, background color: #ffffff, font size: 16px)" },
      { target: ["nav .menu-item:nth-child(3)"], html: "<a class='menu-item' href='/diensten'>Diensten</a>", failureSummary: "Element has insufficient color contrast of 3.91" },
      { target: [".footer__legal a"], html: "<a href='/privacy'>Privacybeleid</a>", failureSummary: "Element has insufficient color contrast of 2.51" },
      { target: [".card--pricing .price-note"], html: "<span class='price-note'>incl. btw</span>", failureSummary: "Element has insufficient color contrast of 3.12" },
    ],
  },
  {
    id: "image-alt",
    impact: "critical",
    help: "Images must have alternate text",
    description: "Ensures <img> elements have alternate text or a role of none or presentation.",
    tags: ["wcag111", "wcag2a"],
    nodes: [
      { target: ["img.hero-banner"], html: "<img src='/img/banner-2024.jpg' class='hero-banner'>", failureSummary: "Element does not have an alt attribute" },
      { target: [".team-grid img:nth-child(2)"], html: "<img src='/img/medewerker-jan.jpg'>", failureSummary: "Element does not have an alt attribute" },
      { target: ["footer img.partner-logo"], html: "<img src='/img/partner-keurmerk.png' class='partner-logo'>", failureSummary: "Element does not have an alt attribute" },
    ],
  },
  {
    id: "button-name",
    impact: "critical",
    help: "Buttons must have discernible text",
    description: "Ensures buttons have discernible text.",
    tags: ["wcag412", "wcag2a"],
    nodes: [
      { target: ["button.search-toggle"], html: "<button class='search-toggle'><svg viewBox='0 0 24 24'>…</svg></button>", failureSummary: "Element does not have inner text that is visible to screen readers" },
      { target: [".carousel button.next"], html: "<button class='next'><i class='chevron'></i></button>", failureSummary: "Element has no accessible name" },
    ],
  },
  {
    id: "label",
    impact: "moderate",
    help: "Form elements must have labels",
    description: "Ensures every form element has a label.",
    tags: ["wcag332", "wcag131", "wcag2a"],
    nodes: [
      { target: ["form.newsletter input[type=email]"], html: "<input type='email' placeholder='Uw e-mailadres'>", failureSummary: "Form element does not have an implicit (wrapped) label" },
    ],
  },
  {
    id: "link-name",
    impact: "serious",
    help: "Links must have discernible text",
    description: "Ensures links have discernible text.",
    tags: ["wcag244", "wcag412", "wcag2a"],
    nodes: [
      { target: [".social-links a:nth-child(1)"], html: "<a href='https://linkedin.com/company/x'><svg>…</svg></a>", failureSummary: "Element has no accessible name" },
      { target: [".social-links a:nth-child(2)"], html: "<a href='https://x.com/x'><svg>…</svg></a>", failureSummary: "Element has no accessible name" },
    ],
  },
  {
    id: "heading-order",
    impact: "moderate",
    help: "Heading levels should only increase by one",
    description: "Ensures the order of headings is semantically correct.",
    tags: ["wcag131", "best-practice"],
    nodes: [
      { target: [".section--diensten h4"], html: "<h4>Onze aanpak</h4>", failureSummary: "Heading order invalid (h2 → h4)" },
    ],
  },
  {
    id: "region",
    impact: "minor",
    help: "All page content should be contained by landmarks",
    description: "Ensures all page content is contained by landmarks.",
    tags: ["best-practice"],
    nodes: [
      { target: [".cookie-banner"], html: "<div class='cookie-banner'>Wij gebruiken cookies…</div>", failureSummary: "Element is not contained by a landmark region" },
    ],
  },
];

const raw = {
  violations,
  vni: {
    score: 2140,
    tier: "Elite",
    pillars: {
      accessibility: 72,
      performance: 81,
      seo: 88,
      bestPractices: 76,
    },
  },
  deepScan: {
    scannedPages: 12,
    worstPage: { url: "https://demo-klant.nl/contact", score: 54, vniScore: 1620 },
    pages: [
      { url: "https://demo-klant.nl/", score: 71, issues: 14, vniScore: 2140 },
      { url: "https://demo-klant.nl/diensten", score: 78, issues: 9, vniScore: 2210 },
      { url: "https://demo-klant.nl/over-ons", score: 82, issues: 6, vniScore: 2280 },
      { url: "https://demo-klant.nl/contact", score: 54, issues: 22, vniScore: 1620 },
      { url: "https://demo-klant.nl/blog", score: 75, issues: 11, vniScore: 2090 },
    ],
  },
  totalPageWeightBytes: 3_240_000,
  largestContentfulPaintMs: 2890,
  domNodeCount: 1840,
  aiContentChecks: [
    {
      imageUrl: "https://demo-klant.nl/img/team-overleg.jpg",
      altText: "foto",
      aiDescription: "Vier collega's in overleg aan een vergadertafel met laptops en een whiteboard op de achtergrond.",
      matchesAltText: false,
      confidence: 0.93,
      recommendation: "Vervang 'foto' door een beschrijvende alt-tekst, bijvoorbeeld: 'Team in overleg aan vergadertafel'.",
    },
    {
      imageUrl: "https://demo-klant.nl/img/kantoorpand.jpg",
      altText: "Ons kantoorpand aan de Stationsweg in Utrecht",
      aiDescription: "Modern kantoorgebouw met glazen gevel, gefotografeerd vanaf straatniveau.",
      matchesAltText: true,
      confidence: 0.97,
    },
  ],
};

const reportData = transformScanToReport(
  {
    id: "scan-sample-2026",
    score: 67,
    issues: 14,
    impactCritical: 5,
    impactSerious: 6,
    impactModerate: 2,
    impactMinor: 1,
    wcagAACompliance: 71,
    wcagAAACompliance: 48,
    createdAt: new Date().toISOString(),
    raw,
    site: { url: "https://demo-klant.nl" },
    page: { url: "https://demo-klant.nl/", title: "Demo Klant — Home" },
  },
  undefined,
  undefined,
  undefined,
  "premium"
);

const html = renderReportHTML(reportData);
const out = process.argv[2] || "tmp-sample-report.html";
writeFileSync(out, html, "utf8");
console.log(`Wrote ${out} (${(html.length / 1024).toFixed(0)} KB)`);
