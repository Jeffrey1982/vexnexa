import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Comprehensive WCAG 2.1 AA Manual Audit Template
 * Covers manual testing criteria that automated tools cannot detect
 */
export async function seedWCAGAuditTemplates() {
  console.log("Seeding WCAG 2.1 audit templates...");

  // Create WCAG 2.1 Level AA Template
  const wcagAATemplate = await prisma.auditTemplate.upsert({
    where: { id: "wcag-2-1-aa-manual" },
    update: {},
    create: {
      id: "wcag-2-1-aa-manual",
      name: "WCAG 2.1 Level AA - Manual Audit",
      description: "Comprehensive manual accessibility audit checklist for WCAG 2.1 Level AA compliance. Covers criteria that cannot be tested automatically.",
      category: "wcag",
      wcagLevel: "AA",
      isPublic: true,
      isDefault: true,
    }
  });

  // Manual audit criteria for WCAG 2.1 AA
  const criteria = [
    // ========== 1. Perceivable ==========
    {
      category: "keyboard",
      subcategory: "navigation",
      title: "Keyboard Navigation - All functionality available via keyboard",
      description: "All page functionality can be operated through keyboard interface without requiring specific timings",
      howToTest: "1. Disconnect mouse\n2. Navigate entire page using Tab, Shift+Tab, Arrow keys, Enter, Space\n3. Verify all interactive elements are reachable and operable\n4. Check dropdowns, modals, carousels work with keyboard only",
      wcagCriterion: "2.1.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/keyboard",
      priority: "critical",
      required: true,
      order: 1
    },
    {
      category: "keyboard",
      subcategory: "focus",
      title: "Visible Focus Indicator",
      description: "Keyboard focus indicator is clearly visible for all interactive elements",
      howToTest: "1. Tab through all interactive elements\n2. Verify visible focus indicator (outline, border, highlight)\n3. Ensure focus indicator has sufficient contrast (3:1 minimum)\n4. Check focus doesn't get trapped or lost",
      wcagCriterion: "2.4.7",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible",
      priority: "high",
      required: true,
      order: 2
    },
    {
      category: "keyboard",
      subcategory: "focus",
      title: "No Keyboard Trap",
      description: "Keyboard focus can be moved away from any component using only keyboard",
      howToTest: "1. Tab into modals, carousels, embedded content\n2. Verify you can escape using Tab, Esc, or standard navigation\n3. Check no components trap focus permanently",
      wcagCriterion: "2.1.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap",
      priority: "critical",
      required: true,
      order: 3
    },
    {
      category: "screen_reader",
      subcategory: "compatibility",
      title: "Screen Reader - Alt Text Quality",
      description: "Images have meaningful alternative text that conveys purpose and context",
      howToTest: "1. Enable screen reader (NVDA, JAWS, VoiceOver)\n2. Navigate through all images\n3. Verify alt text is descriptive and meaningful\n4. Check decorative images use empty alt or role='presentation'",
      wcagCriterion: "1.1.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-content",
      priority: "critical",
      required: true,
      order: 4
    },
    {
      category: "screen_reader",
      subcategory: "landmarks",
      title: "Screen Reader - Semantic HTML Structure",
      description: "Proper use of headings, landmarks, lists for screen reader navigation",
      howToTest: "1. Use screen reader landmarks navigation\n2. Verify proper heading hierarchy (H1, H2, H3)\n3. Check semantic elements (nav, main, aside, footer)\n4. Ensure lists use proper ul/ol/li tags",
      wcagCriterion: "1.3.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships",
      priority: "high",
      required: true,
      order: 5
    },
    {
      category: "screen_reader",
      subcategory: "links",
      title: "Screen Reader - Link Purpose Clear from Context",
      description: "Purpose of each link can be determined from link text alone or together with context",
      howToTest: "1. Use screen reader links list\n2. Verify links make sense out of context\n3. Avoid generic text like 'click here', 'read more'\n4. Check aria-label or aria-labelledby where needed",
      wcagCriterion: "2.4.4",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context",
      priority: "high",
      required: true,
      order: 6
    },
    {
      category: "screen_reader",
      subcategory: "forms",
      title: "Screen Reader - Form Labels and Instructions",
      description: "Form inputs have proper labels, instructions, and error messages",
      howToTest: "1. Navigate forms with screen reader\n2. Verify each input has associated label\n3. Check required fields indicated\n4. Test error message accessibility and clarity\n5. Verify instructions are programmatically associated",
      wcagCriterion: "3.3.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions",
      priority: "critical",
      required: true,
      order: 7
    },
    {
      category: "screen_reader",
      subcategory: "dynamic_content",
      title: "Screen Reader - Live Regions and Dynamic Updates",
      description: "Dynamic content changes are announced to screen readers appropriately",
      howToTest: "1. Trigger dynamic content updates (notifications, live regions)\n2. Verify screen reader announces changes\n3. Check aria-live, aria-atomic usage\n4. Test loading states and spinners are announced",
      wcagCriterion: "4.1.3",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/status-messages",
      priority: "high",
      required: true,
      order: 8
    },
    {
      category: "color",
      subcategory: "contrast",
      title: "Color Contrast - Text Readability",
      description: "Text has sufficient contrast ratio against background (4.5:1 normal, 3:1 large)",
      howToTest: "1. Use color contrast analyzer tool\n2. Test body text (minimum 4.5:1)\n3. Test large text (minimum 3:1)\n4. Check UI components and graphical objects\n5. Test in different color modes (light/dark)",
      wcagCriterion: "1.4.3",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum",
      priority: "high",
      required: true,
      order: 9
    },
    {
      category: "color",
      subcategory: "information",
      title: "Color Not Sole Indicator",
      description: "Color is not used as the only visual means of conveying information",
      howToTest: "1. Check links distinguished by more than color alone\n2. Verify form validation uses icons/text not just color\n3. Test charts use patterns or labels in addition to color\n4. Check required fields marked with * not just color",
      wcagCriterion: "1.4.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color",
      priority: "high",
      required: true,
      order: 10
    },
    {
      category: "color",
      subcategory: "ui_components",
      title: "Non-text Contrast - UI Components",
      description: "UI components and graphical objects have 3:1 contrast ratio",
      howToTest: "1. Test button borders and states\n2. Check form input outlines\n3. Verify icon contrast against background\n4. Test focus indicators\n5. Check interactive charts and graphs",
      wcagCriterion: "1.4.11",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast",
      priority: "high",
      required: true,
      order: 11
    },
    {
      category: "forms",
      subcategory: "input_purpose",
      title: "Forms - Input Purpose Identification",
      description: "Purpose of input fields can be programmatically determined",
      howToTest: "1. Check autocomplete attributes on personal info fields\n2. Verify name, email, address fields have proper autocomplete\n3. Test browser autofill works correctly\n4. Check input types (email, tel, url) are appropriate",
      wcagCriterion: "1.3.5",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose",
      priority: "medium",
      required: true,
      order: 12
    },
    {
      category: "forms",
      subcategory: "error_prevention",
      title: "Forms - Error Prevention and Recovery",
      description: "Forms provide error prevention, suggestions, and recovery mechanisms",
      howToTest: "1. Submit forms with errors\n2. Verify clear error messages\n3. Check error messages associated with fields\n4. Test confirmation for important submissions\n5. Verify ability to review and correct before submission",
      wcagCriterion: "3.3.3",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/error-suggestion",
      priority: "high",
      required: true,
      order: 13
    },
    {
      category: "timing",
      subcategory: "adjustable",
      title: "Timing Adjustable",
      description: "Users can turn off, adjust, or extend time limits",
      howToTest: "1. Identify any time limits (session timeouts, timed content)\n2. Verify users can extend, adjust, or disable\n3. Check warning before timeout\n4. Test ability to extend with simple action\n5. Ensure at least 20 seconds warning",
      wcagCriterion: "2.2.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable",
      priority: "high",
      required: true,
      order: 14
    },
    {
      category: "motion",
      subcategory: "animation",
      title: "Animation and Motion - Pause, Stop, Hide",
      description: "Moving, blinking, scrolling content can be paused, stopped, or hidden",
      howToTest: "1. Identify auto-playing animations, carousels\n2. Verify pause/stop controls available\n3. Check animations respect prefers-reduced-motion\n4. Test parallax and scroll effects can be disabled",
      wcagCriterion: "2.2.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide",
      priority: "high",
      required: true,
      order: 15
    },
    {
      category: "motion",
      subcategory: "seizures",
      title: "Motion - No Content Flashes More Than 3 Times Per Second",
      description: "Content does not flash more than three times in any one second period",
      howToTest: "1. Review all animations and transitions\n2. Check flashing frequency\n3. Verify no strobing effects\n4. Test video content for flashing",
      wcagCriterion: "2.3.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/three-flashes-or-below-threshold",
      priority: "critical",
      required: true,
      order: 16
    },
    {
      category: "navigation",
      subcategory: "skip_links",
      title: "Navigation - Skip Links and Bypass Blocks",
      description: "Mechanism available to skip repeated blocks of content",
      howToTest: "1. Tab to first element on page\n2. Verify 'Skip to main content' link appears\n3. Test skip link navigates to main content\n4. Check skip link works on all pages\n5. Verify heading structure allows navigation",
      wcagCriterion: "2.4.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks",
      priority: "high",
      required: true,
      order: 17
    },
    {
      category: "navigation",
      subcategory: "page_titles",
      title: "Navigation - Descriptive Page Titles",
      description: "Web pages have titles that describe topic or purpose",
      howToTest: "1. Review page title in browser tab\n2. Verify title is descriptive and unique\n3. Check title reflects current page content\n4. Test dynamic page title updates (SPAs)",
      wcagCriterion: "2.4.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/page-titled",
      priority: "medium",
      required: true,
      order: 18
    },
    {
      category: "navigation",
      subcategory: "focus_order",
      title: "Navigation - Logical Focus Order",
      description: "Focus order preserves meaning and operability",
      howToTest: "1. Tab through entire page\n2. Verify focus order matches visual layout\n3. Check focus doesn't jump unexpectedly\n4. Test reading order makes sense\n5. Verify tabindex doesn't create confusing order",
      wcagCriterion: "2.4.3",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order",
      priority: "high",
      required: true,
      order: 19
    },
    {
      category: "navigation",
      subcategory: "multiple_ways",
      title: "Navigation - Multiple Ways to Find Pages",
      description: "More than one way available to locate pages (menu, search, sitemap)",
      howToTest: "1. Check site has navigation menu\n2. Verify search functionality available\n3. Look for sitemap or table of contents\n4. Test multiple navigation paths to same content",
      wcagCriterion: "2.4.5",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/multiple-ways",
      priority: "medium",
      required: true,
      order: 20
    },
    {
      category: "navigation",
      subcategory: "headings",
      title: "Navigation - Descriptive Headings and Labels",
      description: "Headings and labels describe topic or purpose",
      howToTest: "1. Review all headings (H1-H6)\n2. Verify headings describe section content\n3. Check form labels are descriptive\n4. Test button text is meaningful\n5. Verify heading hierarchy is logical",
      wcagCriterion: "2.4.6",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels",
      priority: "high",
      required: true,
      order: 21
    },
    {
      category: "content",
      subcategory: "reading_order",
      title: "Content - Meaningful Sequence",
      description: "Reading order is logical and meaningful",
      howToTest: "1. Read page top to bottom\n2. Verify content order makes sense\n3. Check CSS doesn't create confusing order\n4. Test with screen reader reading order\n5. Verify flexbox/grid don't reorder confusingly",
      wcagCriterion: "1.3.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/meaningful-sequence",
      priority: "high",
      required: true,
      order: 22
    },
    {
      category: "content",
      subcategory: "orientation",
      title: "Content - Orientation Lock Not Required",
      description: "Content doesn't restrict to single display orientation (portrait/landscape)",
      howToTest: "1. Rotate device/browser\n2. Verify content adapts to orientation\n3. Check no orientation lock messages\n4. Test both portrait and landscape work",
      wcagCriterion: "1.3.4",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/orientation",
      priority: "medium",
      required: true,
      order: 23
    },
    {
      category: "content",
      subcategory: "reflow",
      title: "Content - Reflow at 320px Width",
      description: "Content reflows without horizontal scrolling at 320px width",
      howToTest: "1. Set viewport to 320px wide\n2. Zoom to 400%\n3. Verify no horizontal scrolling needed\n4. Check all content remains accessible\n5. Test responsive design works properly",
      wcagCriterion: "1.4.10",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/reflow",
      priority: "high",
      required: true,
      order: 24
    },
    {
      category: "content",
      subcategory: "text_spacing",
      title: "Content - Text Spacing Adjustable",
      description: "Content doesn't break when text spacing is increased",
      howToTest: "1. Apply increased text spacing (line-height 1.5, paragraph spacing 2x font size)\n2. Verify no content is cut off\n3. Check no text overlaps\n4. Test with browser text spacing extensions",
      wcagCriterion: "1.4.12",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/text-spacing",
      priority: "medium",
      required: true,
      order: 25
    },
    {
      category: "content",
      subcategory: "images_of_text",
      title: "Content - No Images of Text (unless necessary)",
      description: "Text is used instead of images of text",
      howToTest: "1. Identify any images containing text\n2. Verify text images are necessary (logos, branding)\n3. Check no decorative text images\n4. Test if real text could be used instead",
      wcagCriterion: "1.4.5",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/images-of-text",
      priority: "medium",
      required: false,
      order: 26
    },
    {
      category: "interactive",
      subcategory: "target_size",
      title: "Interactive - Target Size (44×44 pixels minimum)",
      description: "Interactive targets are at least 44×44 pixels",
      howToTest: "1. Measure all clickable elements\n2. Verify buttons, links are 44×44px minimum\n3. Check touch targets on mobile\n4. Test tap targets don't overlap\n5. Verify adequate spacing between targets",
      wcagCriterion: "2.5.5",
      wcagLevel: "AAA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/target-size",
      priority: "medium",
      required: false,
      order: 27
    },
    {
      category: "interactive",
      subcategory: "pointer_gestures",
      title: "Interactive - Pointer Gestures Have Alternatives",
      description: "Functionality using multipoint or path-based gestures has single-pointer alternative",
      howToTest: "1. Identify swipe, pinch, multi-finger gestures\n2. Verify single-pointer alternatives exist\n3. Check zoom has +/- buttons\n4. Test carousels have arrow buttons\n5. Verify drag-drop has keyboard alternative",
      wcagCriterion: "2.5.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/pointer-gestures",
      priority: "high",
      required: true,
      order: 28
    },
    {
      category: "interactive",
      subcategory: "pointer_cancellation",
      title: "Interactive - Pointer Cancellation",
      description: "Single pointer actions can be cancelled",
      howToTest: "1. Test clicking and dragging away cancels action\n2. Verify important actions require up-event\n3. Check accidental taps can be cancelled\n4. Test undo mechanism available for critical actions",
      wcagCriterion: "2.5.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/pointer-cancellation",
      priority: "medium",
      required: true,
      order: 29
    },
    {
      category: "language",
      subcategory: "page_language",
      title: "Language - Default Language Identified",
      description: "Default human language of page can be programmatically determined",
      howToTest: "1. Check HTML lang attribute\n2. Verify lang='en', lang='nl', etc. is set\n3. Test screen reader uses correct language\n4. Check lang matches actual content language",
      wcagCriterion: "3.1.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page",
      priority: "high",
      required: true,
      order: 30
    },
    {
      category: "language",
      subcategory: "parts_language",
      title: "Language - Language of Parts Identified",
      description: "Language of passages or phrases is programmatically determined",
      howToTest: "1. Identify foreign language content\n2. Verify lang attribute on elements\n3. Check quotes in other languages tagged\n4. Test mixed-language content properly marked",
      wcagCriterion: "3.1.2",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-parts",
      priority: "medium",
      required: true,
      order: 31
    },
    {
      category: "predictable",
      subcategory: "on_focus",
      title: "Predictable - No Context Change on Focus",
      description: "Receiving focus does not initiate change of context",
      howToTest: "1. Tab through all elements\n2. Verify focus doesn't trigger navigation\n3. Check focus doesn't open modals automatically\n4. Test focus doesn't submit forms\n5. Verify no unexpected behavior on focus",
      wcagCriterion: "3.2.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/on-focus",
      priority: "high",
      required: true,
      order: 32
    },
    {
      category: "predictable",
      subcategory: "on_input",
      title: "Predictable - No Context Change on Input",
      description: "Changing setting does not automatically cause change of context",
      howToTest: "1. Change form inputs (select, radio, checkbox)\n2. Verify no automatic submission\n3. Check no automatic navigation\n4. Test changes require explicit submit action\n5. Verify users warned of automatic changes",
      wcagCriterion: "3.2.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/on-input",
      priority: "high",
      required: true,
      order: 33
    },
    {
      category: "predictable",
      subcategory: "consistent",
      title: "Predictable - Consistent Navigation",
      description: "Navigation mechanisms repeated on multiple pages occur in same relative order",
      howToTest: "1. Navigate multiple pages\n2. Verify menu/navigation consistent\n3. Check order of nav items consistent\n4. Test header/footer layout consistent\n5. Verify repeated components in same location",
      wcagCriterion: "3.2.3",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation",
      priority: "medium",
      required: true,
      order: 34
    },
    {
      category: "predictable",
      subcategory: "identification",
      title: "Predictable - Consistent Identification",
      description: "Components with same functionality are identified consistently",
      howToTest: "1. Find repeated elements (search, buttons)\n2. Verify same labels used consistently\n3. Check icons represent same functions\n4. Test similar components work similarly\n5. Verify consistent terminology throughout",
      wcagCriterion: "3.2.4",
      wcagLevel: "AA",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/consistent-identification",
      priority: "medium",
      required: true,
      order: 35
    },
    {
      category: "compatible",
      subcategory: "parsing",
      title: "Compatible - Valid HTML Markup",
      description: "HTML markup is valid and properly structured",
      howToTest: "1. Validate HTML with W3C validator\n2. Check no duplicate IDs\n3. Verify proper nesting of elements\n4. Test elements have complete start/end tags\n5. Check attributes properly quoted",
      wcagCriterion: "4.1.1",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/parsing",
      priority: "medium",
      required: true,
      order: 36
    },
    {
      category: "compatible",
      subcategory: "name_role_value",
      title: "Compatible - Name, Role, Value Available",
      description: "For all UI components, name and role can be programmatically determined",
      howToTest: "1. Test custom components with screen reader\n2. Verify ARIA roles properly applied\n3. Check aria-label/aria-labelledby present\n4. Test states communicated (expanded, selected)\n5. Verify component type clear to assistive tech",
      wcagCriterion: "4.1.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/name-role-value",
      priority: "critical",
      required: true,
      order: 37
    },
    {
      category: "media",
      subcategory: "captions",
      title: "Media - Captions for Prerecorded Audio/Video",
      description: "Captions provided for all prerecorded audio/video content",
      howToTest: "1. Play all videos\n2. Verify captions available\n3. Check captions synchronized\n4. Test caption quality and accuracy\n5. Verify caption controls accessible",
      wcagCriterion: "1.2.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/captions-prerecorded",
      priority: "high",
      required: true,
      order: 38
    },
    {
      category: "media",
      subcategory: "audio_description",
      title: "Media - Audio Description or Media Alternative",
      description: "Audio description or full text alternative provided for prerecorded video",
      howToTest: "1. Watch videos with visual information\n2. Check audio description track available\n3. Verify visual info described in audio\n4. Test full transcript available as alternative\n5. Check important visual info conveyed",
      wcagCriterion: "1.2.3",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/audio-description-or-media-alternative-prerecorded",
      priority: "high",
      required: true,
      order: 39
    },
    {
      category: "media",
      subcategory: "controls",
      title: "Media - Audio Control Available",
      description: "Mechanism available to pause or stop audio that plays automatically",
      howToTest: "1. Load pages with auto-playing audio\n2. Verify pause/stop control visible\n3. Check control accessible via keyboard\n4. Test audio stops when using control\n5. Verify volume control available",
      wcagCriterion: "1.4.2",
      wcagLevel: "A",
      wcagUrl: "https://www.w3.org/WAI/WCAG21/Understanding/audio-control",
      priority: "high",
      required: true,
      order: 40
    }
  ];

  // Insert all criteria
  for (const criterion of criteria) {
    await prisma.auditCriterion.create({
      data: {
        templateId: wcagAATemplate.id,
        ...criterion
      }
    });
  }

  console.log(`✓ Created WCAG 2.1 AA template with ${criteria.length} criteria`);

  // Create WCAG 2.1 Level AAA Template (subset - most critical AAA criteria)
  const wcagAAATemplate = await prisma.auditTemplate.upsert({
    where: { id: "wcag-2-1-aaa-manual" },
    update: {},
    create: {
      id: "wcag-2-1-aaa-manual",
      name: "WCAG 2.1 Level AAA - Manual Audit",
      description: "Extended manual accessibility audit for WCAG 2.1 Level AAA compliance (highest standard)",
      category: "wcag",
      wcagLevel: "AAA",
      isPublic: true,
      isDefault: false,
    }
  });

  console.log("✓ WCAG 2.1 audit templates seeded successfully");
}

// Run seeder if executed directly
if (require.main === module) {
  seedWCAGAuditTemplates()
    .then(() => {
      console.log("Seeding completed");
      process.exit(0);
    })
    .catch((e) => {
      console.error("Seeding failed:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
