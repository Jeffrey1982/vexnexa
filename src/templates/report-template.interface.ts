/**
 * WhiteLabel Accessibility Report - TypeScript Data Contract
 *
 * This interface defines the complete data structure required for generating
 * a whitelabel accessibility compliance PDF report.
 *
 * @version 1.0.0
 * @author VexNexa Engineering Team
 */

export interface ReportData {
  /**
   * Whitelabel mode flag
   * When true, all product branding, logos, and URLs are suppressed
   * @default true
   */
  is_whitelabel: boolean;

  /**
   * Date the accessibility scan was performed
   * @format ISO 8601 date string (e.g., "2025-10-30")
   */
  scan_date: string;

  /**
   * Time the scan was performed
   * @example "14:05 CET", "09:30 UTC", "15:45 EST"
   */
  scan_time: string;

  /**
   * The URL that was scanned for accessibility issues
   * @example "https://example.com"
   */
  scanned_url: string;

  /**
   * Total number of pages scanned in this report
   * @minimum 1
   */
  total_pages_scanned: number;

  /**
   * Overall compliance percentage score
   * @minimum 0
   * @maximum 100
   */
  overall_compliance_percent: number;

  /**
   * WCAG standard level tested against
   */
  wcag_level: "WCAG 2.1 A" | "WCAG 2.1 AA" | "WCAG 2.1 AAA" | "WCAG 2.2 A" | "WCAG 2.2 AA" | "WCAG 2.2 AAA";

  /**
   * Count of critical severity issues found
   * @minimum 0
   */
  count_critical: number;

  /**
   * Count of serious severity issues found
   * @minimum 0
   */
  count_serious: number;

  /**
   * Count of moderate severity issues found
   * @minimum 0
   */
  count_moderate: number;

  /**
   * Count of minor severity issues found
   * @minimum 0
   */
  count_minor: number;

  /**
   * Optional hero thumbnail image for the executive summary page
   * Should be a data URL or accessible image URL
   * Recommended size: 800x450px
   * @optional
   */
  hero_thumbnail_src?: string;

  /**
   * Top 3 prioritized recommendations for immediate action
   * These appear on the executive summary page
   * @minItems 3
   * @maxItems 3
   */
  top_recommendations: Array<{
    /**
     * Short, action-focused title for the recommendation
     * @example "Improve Color Contrast on Navigation"
     */
    title: string;

    /**
     * Brief explanation of why this recommendation is important
     * @example "Low contrast makes text unreadable for users with vision impairments"
     */
    reason: string;

    /**
     * Clear, actionable next step to implement
     * @example "Update all navigation links to meet 4.5:1 contrast ratio minimum"
     */
    action: string;
  }>;

  /**
   * Detailed list of all accessibility issues found
   * Issues should be ordered by severity: Critical → Serious → Moderate → Minor
   */
  issues: Array<{
    /**
     * Descriptive title of the accessibility issue
     * @example "Images missing alternative text"
     */
    issue_title: string;

    /**
     * Severity level classification
     */
    severity: "Critical" | "Serious" | "Moderate" | "Minor";

    /**
     * WCAG success criterion code
     * @example "1.4.3", "2.1.1", "4.1.2"
     */
    wcag_ref_code: string;

    /**
     * WCAG conformance level for this criterion
     */
    wcag_ref_level: "A" | "AA" | "AAA";

    /**
     * Direct URL to WCAG Understanding documentation
     * @example "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum"
     */
    wcag_ref_url: string;

    /**
     * Number of DOM elements affected by this issue
     * @minimum 1
     */
    affected_nodes_count: number;

    /**
     * Optional CSS selector showing where the issue occurs
     * @example "nav.main-menu > a.nav-link"
     * @optional
     */
    example_selector?: string;

    /**
     * Optional code snippet demonstrating the issue or fix
     * @example '<img src="logo.png">'  (before) → '<img src="logo.png" alt="Company Logo">' (after)
     * @optional
     */
    example_snippet?: string;

    /**
     * Short plain-English explanation of the issue (1-2 sentences)
     * @example "Screen readers cannot describe images without alt text, leaving blind users unable to understand visual content."
     */
    explanation_short: string;

    /**
     * Clear, practical remediation steps
     * @example "Add descriptive alt attributes to all <img> tags. Use empty alt="" for decorative images."
     */
    suggested_fix: string;

    /**
     * Optional thumbnail image showing the specific issue location
     * Should be a data URL or accessible image URL
     * Recommended size: 600x400px max
     * @optional
     */
    issue_thumbnail_src?: string;
  }>;
}

/**
 * Example data payload for testing the template
 */
export const exampleReportData: ReportData = {
  is_whitelabel: true,
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
      reason: "27 images lack alt text, preventing screen readers from describing visual content to blind users.",
      action: "Add descriptive alt attributes to all informational images. Use empty alt=\"\" for decorative images."
    },
    {
      title: "Fix Low Contrast Text",
      reason: "Navigation and footer text fails WCAG contrast requirements, making content difficult to read.",
      action: "Increase text color contrast to meet minimum 4.5:1 ratio. Test with a contrast checker tool."
    },
    {
      title: "Ensure Keyboard Navigation",
      reason: "Interactive elements in the main menu are not reachable via keyboard, excluding non-mouse users.",
      action: "Add proper focus management and ensure all buttons/links are keyboard accessible with visible focus indicators."
    }
  ],

  issues: [
    // Critical issues
    {
      issue_title: "Images missing alternative text",
      severity: "Critical",
      wcag_ref_code: "1.1.1",
      wcag_ref_level: "A",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content",
      affected_nodes_count: 27,
      example_selector: "img.product-thumbnail, img.hero-banner",
      example_snippet: '<img src="product.jpg" alt="Product: Blue Cotton T-Shirt Size M">',
      explanation_short: "Screen readers cannot describe images without alt text, preventing blind users from understanding visual content.",
      suggested_fix: "Add descriptive alt attributes to all <img> elements. Describe the image's purpose, not just its appearance. Use empty alt=\"\" only for purely decorative images.",
      issue_thumbnail_src: undefined
    },
    {
      issue_title: "Form inputs missing labels",
      severity: "Critical",
      wcag_ref_code: "4.1.2",
      wcag_ref_level: "A",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value",
      affected_nodes_count: 12,
      example_selector: "form#checkout input[type='text']",
      example_snippet: '<label for="email">Email Address</label>\n<input type="email" id="email" name="email" required>',
      explanation_short: "Unlabeled form fields prevent screen reader users from understanding what information to enter.",
      suggested_fix: "Associate every form input with a <label> element using matching id attributes. Ensure labels are visible and descriptive.",
      issue_thumbnail_src: undefined
    },
    {
      issue_title: "Insufficient color contrast",
      severity: "Critical",
      wcag_ref_code: "1.4.3",
      wcag_ref_level: "AA",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum",
      affected_nodes_count: 43,
      example_selector: "nav.primary a.nav-link, footer p",
      explanation_short: "Low contrast text (2.8:1 ratio) makes content difficult or impossible to read for users with vision impairments.",
      suggested_fix: "Increase text color contrast to meet minimum 4.5:1 ratio for normal text and 3:1 for large text (18pt+). Use online contrast checker tools to verify.",
      issue_thumbnail_src: undefined
    },

    // Serious issues
    {
      issue_title: "Keyboard focus indicators not visible",
      severity: "Serious",
      wcag_ref_code: "2.4.7",
      wcag_ref_level: "AA",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible",
      affected_nodes_count: 18,
      example_selector: "button, a.button, input",
      example_snippet: 'button:focus {\n  outline: 2px solid #0066cc;\n  outline-offset: 2px;\n}',
      explanation_short: "Users navigating by keyboard cannot see which element is currently focused, making navigation confusing.",
      suggested_fix: "Ensure all interactive elements show a clear, visible focus indicator. Never use outline: none without providing an alternative. Minimum 3:1 contrast ratio for focus indicators.",
      issue_thumbnail_src: undefined
    },
    {
      issue_title: "Missing skip navigation link",
      severity: "Serious",
      wcag_ref_code: "2.4.1",
      wcag_ref_level: "A",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks",
      affected_nodes_count: 1,
      example_snippet: '<a href="#main-content" class="skip-link">Skip to main content</a>',
      explanation_short: "Keyboard users must tab through the entire navigation on every page, wasting time and effort.",
      suggested_fix: "Add a 'Skip to main content' link as the first focusable element on the page. Style it to be visible on keyboard focus.",
      issue_thumbnail_src: undefined
    },

    // Moderate issues
    {
      issue_title: "Heading hierarchy skips levels",
      severity: "Moderate",
      wcag_ref_code: "1.3.1",
      wcag_ref_level: "A",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships",
      affected_nodes_count: 8,
      example_selector: "section.features h4",
      explanation_short: "Document structure jumps from <h2> to <h4>, skipping <h3>, which confuses screen reader navigation.",
      suggested_fix: "Use heading tags in sequential order (h1 → h2 → h3) without skipping levels. Each page should have exactly one <h1>.",
      issue_thumbnail_src: undefined
    },

    // Minor issues
    {
      issue_title: "Language attribute missing from page elements",
      severity: "Minor",
      wcag_ref_code: "3.1.2",
      wcag_ref_level: "AA",
      wcag_ref_url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts",
      affected_nodes_count: 3,
      example_snippet: '<blockquote lang="es">Hola, bienvenido</blockquote>',
      explanation_short: "Embedded content in different languages lacks lang attribute, causing screen readers to pronounce words incorrectly.",
      suggested_fix: "Add lang attribute to any element containing content in a language different from the page's primary language.",
      issue_thumbnail_src: undefined
    }
  ]
};

/**
 * Helper type for template rendering engines
 */
export type ReportTemplateContext = ReportData;

/**
 * Validation helper: checks if ReportData is valid
 */
export function validateReportData(data: Partial<ReportData>): data is ReportData {
  return !!(
    typeof data.is_whitelabel === 'boolean' &&
    typeof data.scan_date === 'string' &&
    typeof data.scan_time === 'string' &&
    typeof data.scanned_url === 'string' &&
    typeof data.total_pages_scanned === 'number' &&
    typeof data.overall_compliance_percent === 'number' &&
    data.overall_compliance_percent >= 0 &&
    data.overall_compliance_percent <= 100 &&
    typeof data.wcag_level === 'string' &&
    typeof data.count_critical === 'number' &&
    typeof data.count_serious === 'number' &&
    typeof data.count_moderate === 'number' &&
    typeof data.count_minor === 'number' &&
    Array.isArray(data.top_recommendations) &&
    data.top_recommendations.length === 3 &&
    Array.isArray(data.issues) &&
    data.issues.length > 0
  );
}

/**
 * Helper: Sort issues by severity
 */
export function sortIssuesBySeverity(issues: ReportData['issues']): ReportData['issues'] {
  const severityOrder = { Critical: 0, Serious: 1, Moderate: 2, Minor: 3 };
  return [...issues].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
}

/**
 * Helper: Group issues by severity
 */
export function groupIssuesBySeverity(issues: ReportData['issues']) {
  return {
    critical: issues.filter(i => i.severity === 'Critical'),
    serious: issues.filter(i => i.severity === 'Serious'),
    moderate: issues.filter(i => i.severity === 'Moderate'),
    minor: issues.filter(i => i.severity === 'Minor'),
  };
}
