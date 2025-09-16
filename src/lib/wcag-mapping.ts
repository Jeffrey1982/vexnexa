/**
 * WCAG 2.1 Success Criteria and axe-core rules mapping
 * This provides comprehensive mapping between axe-core rules and WCAG success criteria
 */

export interface WCAGSuccessCriterion {
  id: string;
  level: "A" | "AA" | "AAA";
  title: string;
  description: string;
  principle: "Perceivable" | "Operable" | "Understandable" | "Robust";
  guideline: string;
  techniques: string[];
}

export interface AxeRuleWCAGMapping {
  ruleId: string;
  ruleName: string;
  wcagCriteria: string[]; // Array of WCAG criterion IDs (e.g., ["1.1.1", "4.1.2"])
  impact: "minor" | "moderate" | "serious" | "critical";
}

// WCAG 2.1 Success Criteria definitions
export const WCAG_SUCCESS_CRITERIA: Record<string, WCAGSuccessCriterion> = {
  "1.1.1": {
    id: "1.1.1",
    level: "A",
    title: "Non-text Content",
    description: "All non-text content that is presented to the user has a text alternative that serves the equivalent purpose.",
    principle: "Perceivable",
    guideline: "1.1 Text Alternatives",
    techniques: ["H37", "H53", "H86", "G94", "G95"]
  },
  "1.2.1": {
    id: "1.2.1",
    level: "A",
    title: "Audio-only and Video-only (Prerecorded)",
    description: "For prerecorded audio-only and prerecorded video-only media, alternative content is provided.",
    principle: "Perceivable",
    guideline: "1.2 Time-based Media",
    techniques: ["G158", "G159", "G166"]
  },
  "1.2.2": {
    id: "1.2.2",
    level: "A",
    title: "Captions (Prerecorded)",
    description: "Captions are provided for all prerecorded audio content in synchronized media.",
    principle: "Perceivable",
    guideline: "1.2 Time-based Media",
    techniques: ["G93", "G87", "H95"]
  },
  "1.3.1": {
    id: "1.3.1",
    level: "A",
    title: "Info and Relationships",
    description: "Information, structure, and relationships conveyed through presentation can be programmatically determined.",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    techniques: ["H42", "H43", "H44", "H51", "H63", "H65"]
  },
  "1.3.2": {
    id: "1.3.2",
    level: "A",
    title: "Meaningful Sequence",
    description: "When the sequence in which content is presented affects its meaning, a correct reading sequence can be programmatically determined.",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    techniques: ["G57", "H34", "H56"]
  },
  "1.3.3": {
    id: "1.3.3",
    level: "A",
    title: "Sensory Characteristics",
    description: "Instructions provided for understanding and operating content do not rely solely on sensory characteristics.",
    principle: "Perceivable",
    guideline: "1.3 Adaptable",
    techniques: ["G96"]
  },
  "1.4.1": {
    id: "1.4.1",
    level: "A",
    title: "Use of Color",
    description: "Color is not used as the only visual means of conveying information, indicating an action, prompting a response, or distinguishing a visual element.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G14", "G111", "G182"]
  },
  "1.4.2": {
    id: "1.4.2",
    level: "A",
    title: "Audio Control",
    description: "If any audio on a Web page plays automatically for more than 3 seconds, either a mechanism is available to pause or stop the audio.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G60", "G170"]
  },
  "1.4.3": {
    id: "1.4.3",
    level: "AA",
    title: "Contrast (Minimum)",
    description: "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G18", "G145", "G174"]
  },
  "1.4.4": {
    id: "1.4.4",
    level: "AA",
    title: "Resize text",
    description: "Except for captions and images of text, text can be resized without assistive technology up to 200 percent without loss of content or functionality.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G142", "G146"]
  },
  "1.4.5": {
    id: "1.4.5",
    level: "AA",
    title: "Images of Text",
    description: "If the technologies being used can achieve the visual presentation, text is used to convey information rather than images of text.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G140"]
  },
  "1.4.6": {
    id: "1.4.6",
    level: "AAA",
    title: "Contrast (Enhanced)",
    description: "The visual presentation of text and images of text has a contrast ratio of at least 7:1.",
    principle: "Perceivable",
    guideline: "1.4 Distinguishable",
    techniques: ["G17", "G18"]
  },
  "2.1.1": {
    id: "2.1.1",
    level: "A",
    title: "Keyboard",
    description: "All functionality of the content is operable through a keyboard interface without requiring specific timings for individual keystrokes.",
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    techniques: ["G202", "H91"]
  },
  "2.1.2": {
    id: "2.1.2",
    level: "A",
    title: "No Keyboard Trap",
    description: "If keyboard focus can be moved to a component of the page using a keyboard interface, then focus can be moved away from that component using only a keyboard interface.",
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    techniques: ["G21"]
  },
  "2.1.4": {
    id: "2.1.4",
    level: "A",
    title: "Character Key Shortcuts",
    description: "If a keyboard shortcut is implemented in content using only letter, punctuation, number, or symbol characters, then at least one of the following is true.",
    principle: "Operable",
    guideline: "2.1 Keyboard Accessible",
    techniques: ["G217"]
  },
  "2.2.1": {
    id: "2.2.1",
    level: "A",
    title: "Timing Adjustable",
    description: "For each time limit that is set by the content, at least one of the following is true.",
    principle: "Operable",
    guideline: "2.2 Enough Time",
    techniques: ["G133", "G180"]
  },
  "2.2.2": {
    id: "2.2.2",
    level: "A",
    title: "Pause, Stop, Hide",
    description: "For moving, blinking, scrolling, or auto-updating information, all of the following are true.",
    principle: "Operable",
    guideline: "2.2 Enough Time",
    techniques: ["G4", "G11", "G187"]
  },
  "2.4.1": {
    id: "2.4.1",
    level: "A",
    title: "Bypass Blocks",
    description: "A mechanism is available to bypass blocks of content that are repeated on multiple Web pages.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G1", "G123", "G124"]
  },
  "2.4.2": {
    id: "2.4.2",
    level: "A",
    title: "Page Titled",
    description: "Web pages have titles that describe topic or purpose.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G88", "H25"]
  },
  "2.4.3": {
    id: "2.4.3",
    level: "A",
    title: "Focus Order",
    description: "If a Web page can be navigated sequentially and the navigation sequences affect meaning or operation, focusable components receive focus in an order that preserves meaning and operability.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G59", "H4", "C27"]
  },
  "2.4.4": {
    id: "2.4.4",
    level: "A",
    title: "Link Purpose (In Context)",
    description: "The purpose of each link can be determined from the link text alone or from the link text together with its programmatically determined link context.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G91", "H30", "H24"]
  },
  "2.4.6": {
    id: "2.4.6",
    level: "AA",
    title: "Headings and Labels",
    description: "Headings and labels describe topic or purpose.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G130", "G131"]
  },
  "2.4.7": {
    id: "2.4.7",
    level: "AA",
    title: "Focus Visible",
    description: "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible.",
    principle: "Operable",
    guideline: "2.4 Navigable",
    techniques: ["G149", "C15", "G165"]
  },
  "3.1.1": {
    id: "3.1.1",
    level: "A",
    title: "Language of Page",
    description: "The default human language of each Web page can be programmatically determined.",
    principle: "Understandable",
    guideline: "3.1 Readable",
    techniques: ["H57"]
  },
  "3.2.1": {
    id: "3.2.1",
    level: "A",
    title: "On Focus",
    description: "When any user interface component receives focus, it does not initiate a change of context.",
    principle: "Understandable",
    guideline: "3.2 Predictable",
    techniques: ["G107"]
  },
  "3.2.2": {
    id: "3.2.2",
    level: "A",
    title: "On Input",
    description: "Changing the setting of any user interface component does not automatically cause a change of context unless the user has been advised of the behavior.",
    principle: "Understandable",
    guideline: "3.2 Predictable",
    techniques: ["G80"]
  },
  "3.3.1": {
    id: "3.3.1",
    level: "A",
    title: "Error Identification",
    description: "If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text.",
    principle: "Understandable",
    guideline: "3.3 Input Assistance",
    techniques: ["G83", "G85"]
  },
  "3.3.2": {
    id: "3.3.2",
    level: "A",
    title: "Labels or Instructions",
    description: "Labels or instructions are provided when content requires user input.",
    principle: "Understandable",
    guideline: "3.3 Input Assistance",
    techniques: ["G131", "H44", "H71"]
  },
  "4.1.1": {
    id: "4.1.1",
    level: "A",
    title: "Parsing",
    description: "In content implemented using markup languages, elements have complete start and end tags, elements are nested according to their specifications.",
    principle: "Robust",
    guideline: "4.1 Compatible",
    techniques: ["G134", "G192", "H74", "H93"]
  },
  "4.1.2": {
    id: "4.1.2",
    level: "A",
    title: "Name, Role, Value",
    description: "For all user interface components, the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set.",
    principle: "Robust",
    guideline: "4.1 Compatible",
    techniques: ["G10", "H44", "H65", "H88"]
  },
  "4.1.3": {
    id: "4.1.3",
    level: "AA",
    title: "Status Messages",
    description: "In content implemented using markup languages, status messages can be programmatically determined through role or properties.",
    principle: "Robust",
    guideline: "4.1 Compatible",
    techniques: ["G193", "ARIA22", "ARIA23"]
  }
};

// Mapping of axe-core rules to WCAG success criteria
export const AXE_RULE_WCAG_MAPPING: AxeRuleWCAGMapping[] = [
  {
    ruleId: "accesskeys",
    ruleName: "Ensures every accesskey attribute value is unique",
    wcagCriteria: ["4.1.1"],
    impact: "serious"
  },
  {
    ruleId: "area-alt",
    ruleName: "Ensures <area> elements of image maps have alternate text",
    wcagCriteria: ["1.1.1", "2.4.4", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-allowed-attr",
    ruleName: "Ensures ARIA attributes are allowed for an element's role",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-command-name",
    ruleName: "Ensures every ARIA command has an accessible name",
    wcagCriteria: ["4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-hidden-body",
    ruleName: "Ensures aria-hidden='true' is not present on the document body",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-hidden-focus",
    ruleName: "Ensures aria-hidden elements do not contain focusable elements",
    wcagCriteria: ["1.3.1", "4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-input-field-name",
    ruleName: "Ensures every ARIA input field has an accessible name",
    wcagCriteria: ["4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-label",
    ruleName: "Ensures aria-label attributes have valid values",
    wcagCriteria: ["4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-labelledby",
    ruleName: "Ensures aria-labelledby attributes have valid values",
    wcagCriteria: ["1.3.1", "4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-required-attr",
    ruleName: "Ensures elements with ARIA roles have required ARIA attributes",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-required-children",
    ruleName: "Ensures elements with an ARIA role that require child roles contain them",
    wcagCriteria: ["1.3.1", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-required-parent",
    ruleName: "Ensures elements with an ARIA role that require parent roles are contained by them",
    wcagCriteria: ["1.3.1", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-roles",
    ruleName: "Ensures all elements with a role attribute use a valid value",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-toggle-field-name",
    ruleName: "Ensures every ARIA toggle field has an accessible name",
    wcagCriteria: ["4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "aria-valid-attr",
    ruleName: "Ensures attributes that begin with aria- are valid ARIA attributes",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "aria-valid-attr-value",
    ruleName: "Ensures all ARIA attributes have valid values",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "audio-caption",
    ruleName: "Ensures <audio> elements have captions",
    wcagCriteria: ["1.2.1"],
    impact: "critical"
  },
  {
    ruleId: "autocomplete-valid",
    ruleName: "Ensure the autocomplete attribute is correct and suitable for the form field",
    wcagCriteria: ["1.3.5"],
    impact: "serious"
  },
  {
    ruleId: "avoid-inline-spacing",
    ruleName: "Ensure that text spacing set through style attributes can be adjusted with custom stylesheets",
    wcagCriteria: ["1.4.12"],
    impact: "serious"
  },
  {
    ruleId: "blink",
    ruleName: "Ensures <blink> elements are not used",
    wcagCriteria: ["2.2.2"],
    impact: "serious"
  },
  {
    ruleId: "button-name",
    ruleName: "Ensures buttons have discernible text",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "bypass",
    ruleName: "Ensures each page has at least one mechanism for a user to bypass navigation and jump straight to the content",
    wcagCriteria: ["2.4.1"],
    impact: "serious"
  },
  {
    ruleId: "color-contrast",
    ruleName: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds",
    wcagCriteria: ["1.4.3"],
    impact: "serious"
  },
  {
    ruleId: "color-contrast-enhanced",
    ruleName: "Ensures the contrast between foreground and background colors meets WCAG 2 AAA contrast ratio thresholds",
    wcagCriteria: ["1.4.6"],
    impact: "serious"
  },
  {
    ruleId: "definition-list",
    ruleName: "Ensures <dl> elements are structured correctly",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "dlitem",
    ruleName: "Ensures <dt> and <dd> elements are contained by a <dl>",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "document-title",
    ruleName: "Ensures each HTML document contains a non-empty <title> element",
    wcagCriteria: ["2.4.2"],
    impact: "serious"
  },
  {
    ruleId: "duplicate-id",
    ruleName: "Ensures every id attribute value is unique",
    wcagCriteria: ["4.1.1"],
    impact: "minor"
  },
  {
    ruleId: "duplicate-id-active",
    ruleName: "Ensures every id attribute value used in ARIA and in labels is unique",
    wcagCriteria: ["4.1.1"],
    impact: "serious"
  },
  {
    ruleId: "duplicate-id-aria",
    ruleName: "Ensures every id attribute value used in ARIA and in labels is unique",
    wcagCriteria: ["4.1.1"],
    impact: "critical"
  },
  {
    ruleId: "empty-heading",
    ruleName: "Ensures headings have discernible text",
    wcagCriteria: ["1.3.1", "2.4.6"],
    impact: "minor"
  },
  {
    ruleId: "focus-order-semantics",
    ruleName: "Ensures elements in the focus order have an appropriate role",
    wcagCriteria: ["2.4.3"],
    impact: "minor"
  },
  {
    ruleId: "form-field-multiple-labels",
    ruleName: "Ensures form field does not have multiple label elements",
    wcagCriteria: ["3.3.2"],
    impact: "moderate"
  },
  {
    ruleId: "frame-title",
    ruleName: "Ensures <iframe> and <frame> elements contain a non-empty title attribute",
    wcagCriteria: ["2.4.1", "4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "heading-order",
    ruleName: "Ensures the order of headings is semantically correct",
    wcagCriteria: ["1.3.1", "2.4.6"],
    impact: "moderate"
  },
  {
    ruleId: "html-has-lang",
    ruleName: "Ensures every HTML document has a lang attribute",
    wcagCriteria: ["3.1.1"],
    impact: "serious"
  },
  {
    ruleId: "html-lang-valid",
    ruleName: "Ensures the lang attribute of the <html> element has a valid value",
    wcagCriteria: ["3.1.1"],
    impact: "serious"
  },
  {
    ruleId: "html-xml-lang-mismatch",
    ruleName: "Ensure that HTML elements with both valid lang and xml:lang attributes agree on the base language of the page",
    wcagCriteria: ["3.1.1"],
    impact: "moderate"
  },
  {
    ruleId: "image-alt",
    ruleName: "Ensures <img> elements have alternate text or a role of none or presentation",
    wcagCriteria: ["1.1.1"],
    impact: "critical"
  },
  {
    ruleId: "image-redundant-alt",
    ruleName: "Ensure image alternative is not repeated as text",
    wcagCriteria: ["1.1.1"],
    impact: "minor"
  },
  {
    ruleId: "input-button-name",
    ruleName: "Ensures input buttons have discernible text",
    wcagCriteria: ["4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "input-image-alt",
    ruleName: "Ensures <input type=\"image\"> elements have alternate text",
    wcagCriteria: ["1.1.1", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "keyboard",
    ruleName: "Ensures every focusable element can be accessed by keyboard",
    wcagCriteria: ["2.1.1"],
    impact: "critical"
  },
  {
    ruleId: "label",
    ruleName: "Ensures every form element has a label",
    wcagCriteria: ["1.3.1", "3.3.2", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "label-content-name-mismatch",
    ruleName: "Ensures that elements labelled through their content must have their visible text as part of their accessible name",
    wcagCriteria: ["2.5.3"],
    impact: "serious"
  },
  {
    ruleId: "label-title-only",
    ruleName: "Ensures that every form element is not solely labeled using the title or aria-describedby attributes",
    wcagCriteria: ["3.3.2"],
    impact: "serious"
  },
  {
    ruleId: "landmark-banner-is-top-level",
    ruleName: "Ensures the banner landmark is at top level",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-complementary-is-top-level",
    ruleName: "Ensures the complementary landmark or aside is at top level",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-contentinfo-is-top-level",
    ruleName: "Ensures the contentinfo landmark is at top level",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-main-is-top-level",
    ruleName: "Ensures the main landmark is at top level",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-no-duplicate-banner",
    ruleName: "Ensures the document has no more than one banner landmark",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-no-duplicate-contentinfo",
    ruleName: "Ensures the document has no more than one contentinfo landmark",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-no-duplicate-main",
    ruleName: "Ensures the document has no more than one main landmark",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-one-main",
    ruleName: "Ensures the document has a main landmark",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "landmark-unique",
    ruleName: "Landmarks should have a unique role or role/label/title (i.e. accessible name) combination",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "link-in-text-block",
    ruleName: "Ensures links are distinguished from surrounding text in a way that does not rely on color",
    wcagCriteria: ["1.4.1"],
    impact: "serious"
  },
  {
    ruleId: "link-name",
    ruleName: "Ensures links have discernible text",
    wcagCriteria: ["2.4.4", "4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "list",
    ruleName: "Ensures that lists are structured correctly",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "listitem",
    ruleName: "Ensures <li> elements are used semantically",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "marquee",
    ruleName: "Ensures <marquee> elements are not used",
    wcagCriteria: ["2.2.2"],
    impact: "serious"
  },
  {
    ruleId: "meta-refresh",
    ruleName: "Ensures <meta http-equiv=\"refresh\"> is not used",
    wcagCriteria: ["2.2.1", "2.2.4", "3.2.5"],
    impact: "critical"
  },
  {
    ruleId: "meta-viewport",
    ruleName: "Ensures <meta name=\"viewport\"> does not disable text scaling and zooming",
    wcagCriteria: ["1.4.4"],
    impact: "critical"
  },
  {
    ruleId: "nested-interactive",
    ruleName: "Ensures interactive controls are not nested as they are not always announced by screen readers or can cause focus problems for assistive technologies",
    wcagCriteria: ["4.1.2"],
    impact: "serious"
  },
  {
    ruleId: "no-autoplay-audio",
    ruleName: "Ensures <video> or <audio> elements do not autoplay audio for more than 3 seconds without a control mechanism to stop or mute the audio",
    wcagCriteria: ["1.4.2"],
    impact: "moderate"
  },
  {
    ruleId: "object-alt",
    ruleName: "Ensures <object> elements have alternate text",
    wcagCriteria: ["1.1.1"],
    impact: "serious"
  },
  {
    ruleId: "page-has-heading-one",
    ruleName: "Ensure that the page, or at least one of its frames contains a level-one heading",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "presentation-role-conflict",
    ruleName: "Ensures elements with a role of presentation or none do not have any interactive descendants",
    wcagCriteria: ["4.1.2"],
    impact: "minor"
  },
  {
    ruleId: "region",
    ruleName: "Ensures all page content is contained by landmarks",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "role-img-alt",
    ruleName: "Ensures [role='img'] elements have alternate text",
    wcagCriteria: ["1.1.1"],
    impact: "serious"
  },
  {
    ruleId: "scope-attr-valid",
    ruleName: "Ensures the scope attribute is used correctly on tables",
    wcagCriteria: ["1.3.1"],
    impact: "moderate"
  },
  {
    ruleId: "scrollable-region-focusable",
    ruleName: "Elements that have scrollable content should be accessible by keyboard",
    wcagCriteria: ["2.1.1"],
    impact: "serious"
  },
  {
    ruleId: "select-name",
    ruleName: "Ensures select element has an accessible name",
    wcagCriteria: ["1.3.1", "4.1.2"],
    impact: "critical"
  },
  {
    ruleId: "server-side-image-map",
    ruleName: "Ensures that server-side image maps are not used",
    wcagCriteria: ["2.1.1"],
    impact: "minor"
  },
  {
    ruleId: "skip-link",
    ruleName: "Ensures all skip links have a focusable target",
    wcagCriteria: ["2.4.1"],
    impact: "moderate"
  },
  {
    ruleId: "tabindex",
    ruleName: "Ensures tabindex attribute values are not greater than 0",
    wcagCriteria: ["2.4.3"],
    impact: "serious"
  },
  {
    ruleId: "table-duplicate-name",
    ruleName: "Ensure that tables do not have the same summary and caption",
    wcagCriteria: ["1.3.1"],
    impact: "minor"
  },
  {
    ruleId: "table-fake-caption",
    ruleName: "Ensure that tables with a caption use the <caption> element.",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "td-has-header",
    ruleName: "Ensure that each non-empty data cell in a large table has one or more table headers",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "td-headers-attr",
    ruleName: "Ensure that each cell in a table using the headers refers to another cell in that table",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "th-has-data-cells",
    ruleName: "Ensure that each table header in a data table refers to data cells",
    wcagCriteria: ["1.3.1"],
    impact: "serious"
  },
  {
    ruleId: "valid-lang",
    ruleName: "Ensures lang attributes have valid values",
    wcagCriteria: ["3.1.2"],
    impact: "serious"
  },
  {
    ruleId: "video-caption",
    ruleName: "Ensures <video> elements have captions",
    wcagCriteria: ["1.2.2"],
    impact: "critical"
  },
  {
    ruleId: "video-description",
    ruleName: "Ensures <video> elements have audio descriptions",
    wcagCriteria: ["1.2.3", "1.2.5"],
    impact: "serious"
  }
];

/**
 * Get WCAG success criteria that are violated by a specific axe rule
 */
export function getWCAGCriteriaForRule(ruleId: string): WCAGSuccessCriterion[] {
  const mapping = AXE_RULE_WCAG_MAPPING.find(m => m.ruleId === ruleId);
  if (!mapping) return [];

  return mapping.wcagCriteria
    .map(criterionId => WCAG_SUCCESS_CRITERIA[criterionId])
    .filter(Boolean);
}

/**
 * Calculate WCAG compliance percentage for a specific level
 */
export function calculateWCAGComplianceDetailed(
  violations: any[],
  level: "A" | "AA" | "AAA" = "AA"
): {
  percentage: number;
  passedCriteria: number;
  totalCriteria: number;
  violatedCriteria: WCAGSuccessCriterion[];
  passedCriteria_list: WCAGSuccessCriterion[];
} {
  // Get all criteria for the specified level and below
  const allCriteria = Object.values(WCAG_SUCCESS_CRITERIA).filter(criterion => {
    if (level === "A") return criterion.level === "A";
    if (level === "AA") return criterion.level === "A" || criterion.level === "AA";
    return true; // AAA includes all levels
  });

  // Find which criteria are violated
  const violatedCriteriaSet = new Set<string>();

  violations.forEach(violation => {
    const mapping = AXE_RULE_WCAG_MAPPING.find(m => m.ruleId === violation.id);
    if (mapping) {
      mapping.wcagCriteria.forEach(criterionId => {
        const criterion = WCAG_SUCCESS_CRITERIA[criterionId];
        if (criterion && (
          (level === "A" && criterion.level === "A") ||
          (level === "AA" && (criterion.level === "A" || criterion.level === "AA")) ||
          (level === "AAA")
        )) {
          violatedCriteriaSet.add(criterionId);
        }
      });
    }
  });

  const violatedCriteria = Array.from(violatedCriteriaSet)
    .map(id => WCAG_SUCCESS_CRITERIA[id])
    .filter(Boolean);

  const passedCriteria_list = allCriteria.filter(
    criterion => !violatedCriteriaSet.has(criterion.id)
  );

  const passedCriteria = allCriteria.length - violatedCriteria.length;
  const percentage = Math.round((passedCriteria / allCriteria.length) * 100);

  return {
    percentage,
    passedCriteria,
    totalCriteria: allCriteria.length,
    violatedCriteria,
    passedCriteria_list
  };
}

/**
 * Get a comprehensive WCAG compliance report
 */
export function generateWCAGComplianceReport(violations: any[]) {
  const aCompliance = calculateWCAGComplianceDetailed(violations, "A");
  const aaCompliance = calculateWCAGComplianceDetailed(violations, "AA");
  const aaaCompliance = calculateWCAGComplianceDetailed(violations, "AAA");

  return {
    levelA: aCompliance,
    levelAA: aaCompliance,
    levelAAA: aaaCompliance,
    summary: {
      overallCompliance: aaCompliance.percentage, // AA is the standard
      criticalViolations: violations.filter(v =>
        AXE_RULE_WCAG_MAPPING.find(m => m.ruleId === v.id)?.impact === "critical"
      ).length,
      totalViolations: violations.length,
      principleBreakdown: getPrincipleBreakdown(violations)
    }
  };
}

function getPrincipleBreakdown(violations: any[]) {
  const breakdown = {
    Perceivable: 0,
    Operable: 0,
    Understandable: 0,
    Robust: 0
  };

  violations.forEach(violation => {
    const criteria = getWCAGCriteriaForRule(violation.id);
    criteria.forEach(criterion => {
      breakdown[criterion.principle]++;
    });
  });

  return breakdown;
}