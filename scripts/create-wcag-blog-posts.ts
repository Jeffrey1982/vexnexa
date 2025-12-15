import { prisma } from '../src/lib/prisma'

async function createWCAGBlogPosts() {
  // Find an admin user to be the author
  let adminUser = await prisma.user.findFirst({
    where: { isAdmin: true }
  })

  if (!adminUser) {
    console.log('No admin user found. Creating default admin...')
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@vexnexa.com',
        firstName: 'VexNexa',
        lastName: 'Team',
        isAdmin: true,
        plan: 'BUSINESS',
      }
    })
  }

  const authorId = adminUser.id

  const blogPosts = [
    {
      title: 'WCAG 2.2: Understanding the Latest Accessibility Guidelines',
      slug: 'wcag-2-2-understanding-latest-accessibility-guidelines',
      category: 'Guide',
      excerpt: 'Dive deep into WCAG 2.2 and discover what the latest accessibility guidelines mean for your website. Learn about new success criteria and how to implement them effectively.',
      content: `# WCAG 2.2: Understanding the Latest Accessibility Guidelines

The Web Content Accessibility Guidelines (WCAG) 2.2 represent the latest evolution in web accessibility standards, introducing new success criteria designed to make the web more inclusive for everyone.

## What's New in WCAG 2.2

### 🎯 Nine New Success Criteria

WCAG 2.2 introduces nine new success criteria that address critical accessibility gaps:

1. **Focus Not Obscured (Minimum)** - Level AA
2. **Focus Not Obscured (Enhanced)** - Level AAA
3. **Focus Appearance** - Level AAA
4. **Dragging Movements** - Level AA
5. **Target Size (Minimum)** - Level AA
6. **Consistent Help** - Level A
7. **Redundant Entry** - Level A
8. **Accessible Authentication (Minimum)** - Level AA
9. **Accessible Authentication (Enhanced)** - Level AAA

### 🔍 Key Changes Explained

**Focus Not Obscured** addresses situations where focused elements become hidden behind sticky headers or footers. This is particularly important for keyboard users who rely on visible focus indicators to navigate.

**Dragging Movements** ensures that functionality requiring dragging can be accomplished with a single pointer without dragging. This helps users with motor impairments who find dragging difficult.

**Target Size (Minimum)** requires interactive elements to be at least 24x24 CSS pixels, making them easier to activate for users with motor control difficulties.

**Redundant Entry** prevents users from having to enter the same information multiple times in a single session, reducing cognitive load and errors.

**Accessible Authentication** ensures that authentication processes don't rely solely on solving cognitive function tests or remembering information.

## Implementation Strategies

### For Focus Management

Ensure keyboard focus is always visible and not obscured by other content:

\`\`\`css
/* Example: Adjust sticky header z-index */
.sticky-header {
  position: sticky;
  top: 0;
  z-index: 100;
}

/* Ensure focused elements appear above sticky content */
*:focus {
  position: relative;
  z-index: 101;
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}
\`\`\`

### For Touch Targets

Make interactive elements appropriately sized:

\`\`\`css
/* Minimum 24x24px target size */
button, a, input[type="checkbox"] {
  min-width: 24px;
  min-height: 24px;
  padding: 8px 16px;
}
\`\`\`

### For Form Fields

Avoid redundant entry by using autocomplete attributes:

\`\`\`html
<input
  type="email"
  name="email"
  autocomplete="email"
  required
>
\`\`\`

## Impact on Compliance

### ✓ Level A Compliance
- Consistent Help
- Redundant Entry

### ✓ Level AA Compliance (Most Important)
- Focus Not Obscured (Minimum)
- Dragging Movements
- Target Size (Minimum)
- Accessible Authentication (Minimum)

### ✓ Level AAA Compliance
- Focus Not Obscured (Enhanced)
- Focus Appearance
- Accessible Authentication (Enhanced)

## Migration Path

**Step 1: Audit Current Status**
Run automated accessibility tests to identify potential issues with the new criteria.

**Step 2: Prioritize AA Criteria**
Focus on Level AA success criteria first, as these are typically required for legal compliance.

**Step 3: Update Design Systems**
Ensure your design system components meet the new target size and focus requirements.

**Step 4: Test with Real Users**
Conduct usability testing with people who have disabilities to validate your implementations.

## Business Benefits

Implementing WCAG 2.2 guidelines provides:

- **Reduced Legal Risk**: Stay ahead of accessibility lawsuits
- **Expanded Market Reach**: 15% of the global population has disabilities
- **Improved SEO**: Search engines favor accessible websites
- **Better User Experience**: All users benefit from clearer, more usable interfaces

## Getting Started

Start by scanning your website with modern accessibility tools that support WCAG 2.2 criteria. Focus on the AA-level success criteria first, then progressively enhance to AAA where feasible.

> Remember: WCAG 2.2 builds upon WCAG 2.1, so all previous success criteria still apply. This is an evolution, not a replacement.

Ready to ensure your website meets WCAG 2.2 standards? Start with our comprehensive accessibility scanner today.`,
      status: 'published',
      publishedAt: new Date('2025-10-01T09:00:00Z'),
      authorId,
      coverImage: '/images/blog/wcag-22-guide.jpg',
      metaTitle: 'WCAG 2.2 Guidelines Explained: What is New for 2025',
      metaDescription: 'Comprehensive guide to WCAG 2.2 accessibility guidelines. Learn about 9 new success criteria and how to implement them for AA/AAA compliance.',
      metaKeywords: ['WCAG 2.2', 'web accessibility', 'accessibility guidelines', 'WCAG compliance', 'focus management', 'accessible authentication'],
      tags: ['WCAG', 'Guidelines', 'Compliance', 'Standards', 'Web Accessibility']
    },
    {
      title: 'The Legal Implications of Web Accessibility: What Businesses Need to Know',
      slug: 'legal-implications-web-accessibility-businesses',
      category: 'Business',
      excerpt: 'Navigate the complex legal landscape of web accessibility. Understand ADA compliance, WCAG requirements, and how to protect your business from accessibility lawsuits.',
      content: `# The Legal Implications of Web Accessibility: What Businesses Need to Know

Web accessibility isn't just good practice—it's increasingly a legal requirement. Understanding the legal landscape can help protect your business while creating better digital experiences.

## The Legal Framework

### 🏛️ Key Legislation

**Americans with Disabilities Act (ADA) - United States**
Title III of the ADA prohibits discrimination in places of public accommodation. Courts have increasingly ruled that websites qualify as public accommodations.

**Section 508 - US Federal Websites**
Requires federal agencies to make their electronic and information technology accessible to people with disabilities.

**European Accessibility Act (EAA)**
Requires products and services to be accessible, with enforcement beginning in June 2025.

**EN 301 549 - European Standard**
The harmonized European standard for ICT accessibility requirements.

## The Rising Tide of Lawsuits

### 📈 Statistics and Trends

In recent years, web accessibility lawsuits have surged:

- 2023 saw over 4,000 ADA website accessibility lawsuits filed in the US
- Average settlement costs range from $10,000 to $75,000
- Legal fees can exceed $100,000 for defended cases
- Larger judgments have reached millions of dollars

### Common Targets

Businesses most frequently sued include:
- E-commerce websites
- Financial services
- Healthcare providers
- Education institutions
- Entertainment and media companies

## WCAG as the Legal Standard

### ✓ Why WCAG Matters in Court

While the ADA doesn't explicitly reference WCAG, courts consistently use WCAG 2.0 or 2.1 Level AA as the benchmark for accessibility compliance.

**Department of Justice Position:**
The DOJ has indicated that WCAG 2.1 Level AA is the appropriate standard for web accessibility under the ADA.

### Compliance Levels Explained

**Level A (Minimum)**
- Basic accessibility features
- Not sufficient for legal protection
- Addresses most severe barriers

**Level AA (Standard)**
- Required for legal compliance in most jurisdictions
- Balances accessibility with practical implementation
- Covers most common accessibility needs

**Level AAA (Enhanced)**
- Highest level of accessibility
- Not required for compliance
- May be necessary for specific contexts (e.g., government services)

## Risk Assessment for Your Business

### 🎯 High-Risk Factors

Your business faces higher accessibility lawsuit risk if you:

✓ Operate in e-commerce or finance
✓ Have physical locations (brick-and-mortar stores)
✓ Serve a large customer base
✓ Are a publicly traded company
✓ Have received accessibility complaints
✓ Process sensitive personal or financial information

### Geographic Considerations

**United States:**
- California and New York lead in accessibility lawsuits
- Federal courts increasingly support accessibility requirements
- State-level laws may impose additional requirements

**Europe:**
- EN 301 549 compliance becoming standard
- European Accessibility Act enforcement begins 2025
- GDPR intersects with accessibility requirements

**Canada:**
- Accessibility for Ontarians with Disabilities Act (AODA)
- Accessible Canada Act (ACA)
- Provincial legislation varies

## Building a Legal Defense

### 🛡️ Protection Strategies

**1. Conduct Regular Audits**
Document your accessibility testing and remediation efforts. This demonstrates good faith compliance attempts.

**2. Implement WCAG 2.1 Level AA**
Meet or exceed the recognized legal standard for web accessibility.

**3. Maintain Documentation**
Keep records of:
- Accessibility audits and reports
- Remediation plans and timelines
- Training programs
- Ongoing monitoring

**4. Create an Accessibility Statement**
Publish a clear accessibility statement showing your commitment and providing contact information for accessibility issues.

**5. Establish Feedback Mechanisms**
Provide easy ways for users to report accessibility barriers and respond promptly.

## Cost-Benefit Analysis

### The Cost of Non-Compliance

**Direct Costs:**
- Legal fees: $50,000 - $200,000+
- Settlements: $10,000 - $75,000+
- Court-ordered remediation
- Ongoing compliance monitoring

**Indirect Costs:**
- Reputation damage
- Lost customers (15% of population has disabilities)
- Reduced market reach
- Negative publicity

### The ROI of Compliance

**Benefits Include:**
- Avoided legal costs
- Expanded customer base
- Improved SEO and search rankings
- Enhanced brand reputation
- Better user experience for all users
- Reduced customer support costs

> Studies show that accessible websites often see 10-25% increases in conversions and customer satisfaction.

## Immediate Action Steps

### 📋 30-Day Compliance Roadmap

**Week 1: Assess**
- Run automated accessibility scanner
- Identify critical barriers
- Prioritize fixes based on WCAG level

**Week 2: Plan**
- Develop remediation timeline
- Assign responsibilities
- Budget for accessibility improvements

**Week 3: Implement**
- Address critical (Level A) issues
- Begin serious (Level AA) fixes
- Update templates and components

**Week 4: Validate**
- Test with assistive technologies
- Conduct user testing
- Document compliance efforts

## Working with Legal Counsel

If you receive an accessibility complaint or lawsuit:

1. **Do Not Ignore It** - Respond promptly and professionally
2. **Engage Accessibility Experts** - Get technical assessments
3. **Consult Legal Counsel** - Specialized in disability rights law
4. **Document Everything** - All communications and remediation efforts
5. **Act in Good Faith** - Show commitment to resolving issues

## Future Outlook

Expect accessibility requirements to:
- Expand to mobile apps and native software
- Include AI and automated decision-making systems
- Cover emerging technologies (VR/AR, IoT)
- Require ongoing compliance, not one-time fixes

## Conclusion

Web accessibility is no longer optional—it's a legal imperative. Proactive compliance protects your business, expands your market, and ensures equal access for all users.

The question isn't whether to make your website accessible, but how quickly you can achieve and maintain compliance.

Ready to protect your business and serve all customers? Start with a comprehensive accessibility audit today.`,
      status: 'published',
      publishedAt: new Date('2025-10-05T10:00:00Z'),
      authorId,
      coverImage: '/images/blog/legal-accessibility.jpg',
      metaTitle: 'Web Accessibility Laws 2025: ADA, WCAG & Legal Compliance Guide',
      metaDescription: 'Protect your business from accessibility lawsuits. Complete guide to ADA, WCAG legal requirements, and compliance strategies for 2025.',
      metaKeywords: ['ADA compliance', 'web accessibility laws', 'WCAG legal requirements', 'accessibility lawsuits', 'Section 508', 'European Accessibility Act'],
      tags: ['Legal', 'ADA', 'Compliance', 'Business Risk', 'Lawsuits', 'WCAG']
    },
    {
      title: 'Keyboard Navigation: Making Your Website Accessible Without a Mouse',
      slug: 'keyboard-navigation-accessible-website-without-mouse',
      category: 'Tutorial',
      excerpt: 'Master keyboard navigation and make your website fully accessible to users who cannot use a mouse. Learn focus management, keyboard shortcuts, and WCAG requirements.',
      content: `# Keyboard Navigation: Making Your Website Accessible Without a Mouse

Millions of users navigate the web without a mouse—relying instead on keyboards, switches, or other assistive technologies. Ensuring your website works seamlessly with keyboard-only navigation is essential for accessibility.

## Why Keyboard Accessibility Matters

### 🎹 Who Relies on Keyboard Navigation

- People with motor disabilities who cannot use a mouse
- Users with repetitive strain injuries
- Blind users relying on screen readers
- Power users who prefer keyboard shortcuts
- Anyone with a broken mouse or trackpad

> **Statistic**: Approximately 7% of working-age adults have difficulty using their hands or arms, making mouse use challenging or impossible.

## WCAG Requirements

### ✓ Key Success Criteria

**2.1.1 Keyboard (Level A)**
All functionality must be available using a keyboard interface.

**2.1.2 No Keyboard Trap (Level A)**
Users must be able to move focus away from any component using only a keyboard.

**2.4.3 Focus Order (Level A)**
Components receive focus in an order that preserves meaning and operability.

**2.4.7 Focus Visible (Level AA)**
Keyboard focus indicator must be visible.

## Essential Keyboard Navigation Patterns

### 🔑 Core Keyboard Controls

**Tab Key**
- Moves focus forward through interactive elements
- Primary navigation method

**Shift + Tab**
- Moves focus backward
- Allows users to return to previous elements

**Enter Key**
- Activates links and buttons
- Submits forms

**Space Bar**
- Activates buttons
- Scrolls page down
- Toggles checkboxes

**Arrow Keys**
- Navigate within components (menus, sliders, tabs)
- Scroll page (up/down, left/right)

**Escape Key**
- Closes modal dialogs
- Cancels operations
- Returns to parent menu

### Focus Management Fundamentals

**Proper Tab Order**

\`\`\`html
<!-- Natural DOM order -->
<nav>
  <a href="#home">Home</a>
  <a href="#about">About</a>
  <a href="#contact">Contact</a>
</nav>

<!-- Avoid manipulating tab order -->
<!-- DON'T DO THIS -->
<button tabindex="3">Third</button>
<button tabindex="1">First</button>
<button tabindex="2">Second</button>
\`\`\`

**Managing Focus States**

\`\`\`css
/* Visible focus indicator */
:focus {
  outline: 2px solid #0066CC;
  outline-offset: 2px;
}

/* Never remove focus without replacement */
/* DON'T DO THIS */
:focus {
  outline: none; /* Accessibility violation! */
}

/* If custom styling needed, provide clear alternative */
button:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.5);
  border-color: #0066CC;
}
\`\`\`

## Common Patterns and Solutions

### 🎯 Skip Links

Allow users to bypass repetitive content:

\`\`\`html
<a href="#main-content" class="skip-link">
  Skip to main content
</a>

<!-- Page content -->
<header>...</header>
<nav>...</nav>

<main id="main-content">
  <!-- Main content here -->
</main>
\`\`\`

\`\`\`css
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: #000;
  color: #fff;
  padding: 8px;
  z-index: 100;
}

.skip-link:focus {
  top: 0;
}
\`\`\`

### 📱 Modal Dialogs

Trap focus within modal, restore on close:

\`\`\`javascript
function openModal(modal) {
  const focusableElements = modal.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  // Store previously focused element
  const previouslyFocused = document.activeElement;

  // Focus first element
  firstElement.focus();

  // Trap focus
  modal.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    // Close on Escape
    if (e.key === 'Escape') {
      closeModal(modal, previouslyFocused);
    }
  });
}

function closeModal(modal, previouslyFocused) {
  modal.close();
  previouslyFocused.focus(); // Restore focus
}
\`\`\`

### 🎨 Custom Dropdown Menus

Implement arrow key navigation:

\`\`\`javascript
class DropdownMenu {
  constructor(trigger, menu) {
    this.trigger = trigger;
    this.menu = menu;
    this.items = menu.querySelectorAll('[role="menuitem"]');
    this.currentIndex = -1;

    this.trigger.addEventListener('click', () => this.toggle());
    this.trigger.addEventListener('keydown', (e) => this.handleTriggerKey(e));
    this.menu.addEventListener('keydown', (e) => this.handleMenuKey(e));
  }

  handleTriggerKey(e) {
    switch(e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        this.open();
        this.focusItem(0);
        break;
    }
  }

  handleMenuKey(e) {
    switch(e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.focusNextItem();
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.focusPreviousItem();
        break;
      case 'Home':
        e.preventDefault();
        this.focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        this.focusItem(this.items.length - 1);
        break;
      case 'Escape':
        e.preventDefault();
        this.close();
        this.trigger.focus();
        break;
    }
  }

  focusItem(index) {
    this.currentIndex = index;
    this.items[index].focus();
  }

  focusNextItem() {
    const nextIndex = (this.currentIndex + 1) % this.items.length;
    this.focusItem(nextIndex);
  }

  focusPreviousItem() {
    const prevIndex = this.currentIndex <= 0
      ? this.items.length - 1
      : this.currentIndex - 1;
    this.focusItem(prevIndex);
  }
}
\`\`\`

### 📋 Form Navigation

Enhance form usability:

\`\`\`html
<!-- Group related fields -->
<fieldset>
  <legend>Contact Information</legend>

  <label for="email">
    Email
    <input type="email" id="email" required>
  </label>

  <label for="phone">
    Phone
    <input type="tel" id="phone">
  </label>
</fieldset>

<!-- Error handling -->
<div role="alert" aria-live="polite" id="email-error" class="error">
  Please enter a valid email address
</div>
\`\`\`

## Testing Keyboard Navigation

### 🧪 Manual Testing Checklist

✓ **Unplug your mouse** - Use only keyboard
✓ **Tab through entire page** - Verify logical order
✓ **Check focus visibility** - Always know where you are
✓ **Test all interactive elements** - Buttons, links, forms
✓ **Try all keyboard shortcuts** - Document any conflicts
✓ **Verify modal behavior** - Focus trap and Escape to close
✓ **Test form submission** - Can you complete without mouse?

### Tools for Testing

**Browser DevTools**
- Chrome/Edge: F12 → Accessibility tab
- Firefox: F12 → Accessibility panel
- Shows focus order and ARIA properties

**Screen Readers**
- NVDA (Windows, free)
- JAWS (Windows, paid)
- VoiceOver (Mac, built-in)
- TalkBack (Android, built-in)

**Automated Tools**
- axe DevTools
- WAVE
- Lighthouse Accessibility audit

## Advanced Techniques

### ⚡ Roving TabIndex

For complex widgets like toolbars:

\`\`\`javascript
class Toolbar {
  constructor(container) {
    this.buttons = container.querySelectorAll('button');
    this.currentIndex = 0;

    // Set initial tabindex
    this.buttons.forEach((btn, index) => {
      btn.tabIndex = index === 0 ? 0 : -1;
      btn.addEventListener('keydown', (e) => this.handleKey(e, index));
    });
  }

  handleKey(e, index) {
    let newIndex;

    switch(e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        newIndex = (index + 1) % this.buttons.length;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        newIndex = index === 0 ? this.buttons.length - 1 : index - 1;
        break;
      case 'Home':
        newIndex = 0;
        break;
      case 'End':
        newIndex = this.buttons.length - 1;
        break;
      default:
        return;
    }

    e.preventDefault();
    this.moveFocus(index, newIndex);
  }

  moveFocus(oldIndex, newIndex) {
    this.buttons[oldIndex].tabIndex = -1;
    this.buttons[newIndex].tabIndex = 0;
    this.buttons[newIndex].focus();
    this.currentIndex = newIndex;
  }
}
\`\`\`

## Common Pitfalls to Avoid

### ❌ Don't Do This

**Removing Focus Outlines**
\`\`\`css
/* Never do this without providing alternative */
* { outline: none; }
\`\`\`

**Breaking Tab Order with CSS**
\`\`\`css
/* Visual reordering doesn't change tab order */
.flex-reverse {
  flex-direction: row-reverse; /* Tab order still left-to-right! */
}
\`\`\`

**Keyboard Traps**
\`\`\`javascript
// Don't prevent all keyboard events
document.addEventListener('keydown', (e) => {
  e.preventDefault(); // Breaks everything!
});
\`\`\`

**Inaccessible Custom Controls**
\`\`\`html
<!-- Non-semantic div "buttons" -->
<div onclick="doSomething()">Click me</div> <!-- Not keyboard accessible! -->

<!-- Use proper elements -->
<button onclick="doSomething()">Click me</button> <!-- Keyboard accessible -->
\`\`\`

## Keyboard Shortcuts Best Practices

### ✓ Guidelines

1. **Avoid conflicts** with browser/OS shortcuts
2. **Document all shortcuts** prominently
3. **Make shortcuts optional** when possible
4. **Use standard patterns** (Ctrl+S for save, etc.)
5. **Provide alternatives** to shortcuts

### Example Implementation

\`\`\`javascript
// Implement keyboard shortcuts with care
document.addEventListener('keydown', (e) => {
  // Check for modifier keys to avoid conflicts
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveDocument();
  }

  // Avoid capturing basic navigation keys
  if (['Tab', 'Enter', 'Escape'].includes(e.key)) {
    // Let browser handle, unless in specific context
    return;
  }
});
\`\`\`

## Conclusion

Keyboard accessibility isn't just about compliance—it's about ensuring your website works for everyone, regardless of how they interact with technology.

By implementing proper focus management, logical tab order, and keyboard shortcuts, you create a more robust and inclusive web experience.

Start by testing your website with your mouse unplugged. You'll quickly discover what needs improvement.

Ready to make your website fully keyboard accessible? Run our accessibility scanner to identify keyboard navigation issues.`,
      status: 'published',
      publishedAt: new Date('2025-10-10T09:30:00Z'),
      authorId,
      coverImage: '/images/blog/keyboard-navigation.jpg',
      metaTitle: 'Keyboard Navigation Guide: WCAG Accessibility Best Practices',
      metaDescription: 'Complete tutorial on keyboard accessibility. Learn focus management, modal dialogs, and WCAG-compliant keyboard navigation patterns.',
      metaKeywords: ['keyboard navigation', 'keyboard accessibility', 'focus management', 'WCAG keyboard', 'skip links', 'modal accessibility'],
      tags: ['Keyboard', 'Navigation', 'Tutorial', 'Focus Management', 'WCAG', 'Development']
    },
    {
      title: 'Color Contrast and WCAG: Why It Matters More Than You Think',
      slug: 'color-contrast-wcag-why-it-matters',
      category: 'Standards',
      excerpt: 'Explore the science behind color contrast ratios and discover why proper contrast is critical for accessibility. Learn WCAG requirements and testing techniques.',
      content: `# Color Contrast and WCAG: Why It Matters More Than You Think

Color contrast isn't just an aesthetic choice—it's a fundamental aspect of web accessibility that affects millions of users daily.

## Understanding Color Contrast Ratios

### 🎨 The Science of Contrast

Color contrast ratio measures the difference in luminance between foreground and background colors, expressed as a ratio from 1:1 (no contrast) to 21:1 (maximum contrast).

**WCAG Requirements:**
- **Level AA**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Level AAA**: Minimum 7:1 for normal text, 4.5:1 for large text

### Who Benefits from Proper Contrast?

- People with low vision (affecting 285 million worldwide)
- Users with color blindness (8% of men, 0.5% of women)
- Aging users experiencing vision changes
- Anyone using devices in bright sunlight
- Users with older or lower-quality displays

## WCAG Success Criteria

### ✓ 1.4.3 Contrast (Minimum) - Level AA

Text and images of text must have a contrast ratio of at least:
- 4.5:1 for normal text (less than 18pt or 14pt bold)
- 3:1 for large text (at least 18pt or 14pt bold)

**Exceptions:**
- Inactive/disabled UI components
- Purely decorative elements
- Logos and brand names

### ✓ 1.4.6 Contrast (Enhanced) - Level AAA

Text and images of text must have a contrast ratio of at least:
- 7:1 for normal text
- 4.5:1 for large text

### ✓ 1.4.11 Non-text Contrast - Level AA

UI components and graphical objects must have a 3:1 contrast ratio:
- User interface components (buttons, form fields, focus indicators)
- Graphical objects conveying information (icons, charts, graphics)

## Common Contrast Mistakes

### ❌ Light Gray Text on White Background

\`\`\`css
/* Fails WCAG AA */
.subtle-text {
  color: #999999; /* 2.85:1 ratio */
  background: #FFFFFF;
}

/* Passes WCAG AA */
.readable-text {
  color: #767676; /* 4.54:1 ratio */
  background: #FFFFFF;
}
\`\`\`

### ❌ Low Contrast Buttons

\`\`\`css
/* Fails - Button border too light */
.button {
  border: 1px solid #E0E0E0; /* 1.32:1 ratio */
  background: #FFFFFF;
}

/* Passes - Sufficient border contrast */
.button {
  border: 2px solid #757575; /* 4.61:1 ratio */
  background: #FFFFFF;
}
\`\`\`

### ❌ Placeholder Text

\`\`\`css
/* Fails - Most browser defaults fail WCAG */
::placeholder {
  color: #A0A0A0; /* 2.37:1 ratio */
}

/* Passes */
::placeholder {
  color: #757575; /* 4.61:1 ratio */
}
\`\`\`

## Color Contrast Formulas

### 📐 Calculating Contrast Ratios

The WCAG formula for contrast ratio:

\`\`\`
(L1 + 0.05) / (L2 + 0.05)

Where:
L1 = relative luminance of lighter color
L2 = relative luminance of darker color
\`\`\`

Relative luminance formula:
\`\`\`
For RGB values from 0-255:
R' = R/255, G' = G/255, B' = B/255

For each color channel:
If channel <= 0.03928:
    channel = channel/12.92
Else:
    channel = ((channel+0.055)/1.055)^2.4

L = 0.2126 * R + 0.7152 * G + 0.0722 * B
\`\`\`

## Testing Tools

### 🔧 Color Contrast Checkers

**Browser DevTools:**
Chrome and Edge include built-in contrast checkers in the color picker.

**Online Tools:**
- WebAIM Contrast Checker
- Accessible Colors
- Contrast Ratio (Lea Verou)
- Colorable

**Design Tools:**
- Figma: Color Contrast plugin
- Adobe XD: Stark plugin
- Sketch: Contrast plugin

**Automated Testing:**
- axe DevTools
- WAVE
- Lighthouse

## Design System Approach

### 🎨 Building Accessible Color Palettes

**Step 1: Define Base Colors**
Start with brand colors, then adjust for accessibility.

**Step 2: Test All Combinations**
Ensure every text-on-background combination meets WCAG AA.

**Step 3: Create Usage Guidelines**
Document which color combinations are approved.

**Example Palette:**
\`\`\`css
:root {
  /* Brand colors */
  --primary: #0066CC;       /* 4.58:1 on white */
  --primary-dark: #004C99;  /* 7.15:1 on white */

  /* Grays with tested ratios */
  --gray-50: #F9FAFB;
  --gray-600: #4B5563;   /* 7.13:1 on white */
  --gray-700: #374151;   /* 10.67:1 on white */
  --gray-900: #111827;   /* 16.13:1 on white */

  /* Semantic colors */
  --success: #059669;    /* 4.51:1 on white */
  --warning: #D97706;    /* 4.51:1 on white */
  --error: #DC2626;      /* 5.52:1 on white */
}
\`\`\`

## Special Considerations

### 🌓 Dark Mode

Dark mode requires different contrast considerations:

\`\`\`css
/* Light mode */
:root {
  --text: #1F2937;    /* 13.76:1 on white */
  --bg: #FFFFFF;
}

/* Dark mode */
:root.dark {
  --text: #F3F4F6;    /* 16.05:1 on #111827 */
  --bg: #111827;
}
\`\`\`

**Dark Mode Tips:**
- Don't use pure white (#FFFFFF) on pure black (#000000) - too harsh
- Slightly reduce contrast (14:1 instead of 21:1) for less eye strain
- Test with actual users using dark mode

### 🔴 Color Blindness

Don't rely on color alone:

\`\`\`html
<!-- Bad: Color only -->
<span style="color: red;">Error</span>

<!-- Good: Color + icon + text -->
<span class="error">
  <svg aria-hidden="true"><use href="#error-icon"/></svg>
  Error: Invalid email
</span>
\`\`\`

Common types:
- Protanopia (red-blind)
- Deuteranopia (green-blind)
- Tritanopia (blue-blind)

### 📱 Mobile Considerations

Mobile devices present unique challenges:
- Outdoor use in bright sunlight
- Smaller text sizes
- Varied screen quality

**Best Practice:** Aim for WCAG AAA on mobile interfaces.

## Implementation Strategies

### ✓ CSS Variables Approach

\`\`\`css
:root {
  /* Define contrast-compliant pairs */
  --text-on-light: #1F2937;   /* 13.76:1 */
  --text-subtle-on-light: #6B7280;   /* 5.32:1 */
  --text-on-dark: #F9FAFB;    /* 17.68:1 */
  --text-subtle-on-dark: #D1D5DB;    /* 11.43:1 */
}

/* Light theme */
body {
  background: var(--bg-light);
  color: var(--text-on-light);
}

/* Dark theme */
body.dark {
  background: var(--bg-dark);
  color: var(--text-on-dark);
}
\`\`\`

### ✓ Component Library Standards

Document contrast requirements:

\`\`\`typescript
// Button component with guaranteed contrast
const Button = ({ variant = 'primary' }) => {
  const variants = {
    primary: {
      bg: '#0066CC',      // 4.58:1 on white
      text: '#FFFFFF',    // 21:1 on #0066CC
      border: '#004C99'   // 3:1 on white (non-text)
    },
    secondary: {
      bg: '#FFFFFF',
      text: '#1F2937',    // 13.76:1 on white
      border: '#6B7280'   // 4.85:1 on white
    }
  };

  return <button className={'btn-' + variant}>Click me</button>;
};
\`\`\`

## Testing Workflow

### 📋 Manual Testing Steps

1. **Install Contrast Checker Extension**
2. **Test All Text Elements**
   - Headings
   - Body text
   - Links
   - Buttons
   - Form labels
   - Placeholder text
3. **Test UI Components**
   - Button borders
   - Form field borders
   - Focus indicators
   - Icons
4. **Test Interactive States**
   - Hover
   - Focus
   - Active
   - Disabled
5. **Document Results**

### 🤖 Automated Testing

\`\`\`javascript
// Automated contrast testing with axe-core
import { configure, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('page has no contrast violations', async () => {
  const results = await axe(document.body, {
    rules: {
      'color-contrast': { enabled: true }
    }
  });

  expect(results).toHaveNoViolations();
});
\`\`\`

## Remediation Strategies

### 🔧 Quick Fixes

**Darkening Text:**
\`\`\`css
/* Before: Fails AA */
.text { color: #888888; } /* 3.10:1 */

/* After: Passes AA */
.text { color: #595959; } /* 7.02:1 */
\`\`\`

**Adding Text Shadows for Images:**
\`\`\`css
/* Text over images - add shadow for contrast */
.hero-text {
  color: #FFFFFF;
  text-shadow:
    0 1px 2px rgba(0,0,0,0.8),
    0 2px 4px rgba(0,0,0,0.5);
}
\`\`\`

**Background Overlays:**
\`\`\`css
.image-overlay {
  position: relative;
}

.image-overlay::before {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5); /* Darken image */
}
\`\`\`

## Business Impact

### 📊 Statistics

- 71% of users with disabilities will leave a website with poor contrast
- Improved contrast can increase conversions by 10-25%
- Better contrast improves readability for ALL users, not just those with disabilities

### ROI of Proper Contrast

**Benefits:**
- Reduced bounce rates
- Improved task completion
- Higher customer satisfaction
- Better SEO (Google considers accessibility)
- Legal compliance

**Costs of Poor Contrast:**
- Potential lawsuits
- Lost customers
- Negative brand perception
- Increased support costs

## Conclusion

Color contrast is one of the easiest accessibility wins with the biggest impact. With modern tools and systematic approaches, ensuring proper contrast is straightforward.

Start by auditing your current color palette, fix the failures, and establish design system rules to prevent future issues.

Ready to fix contrast issues on your website? Our scanner automatically checks all color combinations against WCAG standards.`,
      status: 'published',
      publishedAt: new Date('2025-10-15T11:00:00Z'),
      authorId,
      coverImage: '/images/blog/color-contrast.jpg',
      metaTitle: 'Color Contrast WCAG Guide: Ratios, Testing & Best Practices',
      metaDescription: 'Master WCAG color contrast requirements. Learn to calculate ratios, test combinations, and create accessible color palettes that pass AA/AAA.',
      metaKeywords: ['color contrast', 'WCAG contrast ratio', 'accessibility', 'contrast testing', 'color blindness', 'WCAG AA'],
      tags: ['Color Contrast', 'Design', 'WCAG', 'Standards', 'Testing']
    },
    // Post 5: Screen Reader Compatibility - To be added
    // Post 6: ROI of Accessibility - To be added
    // Post 7: Form Accessibility - To be added
    // Post 8: Mobile Accessibility - To be added
    // Post 9: Alt Text for Images - To be added
    // Post 10: WCAG AAA vs AA - To be added
    // Post 11: Accessibility Testing Tools - To be added
    // Post 12: Building Accessibility Culture - To be added
  ];

  console.log('Starting to create WCAG blog posts...');
  console.log(`Total posts to create: ${blogPosts.length}`);

  for (const post of blogPosts) {
    try {
      await prisma.blogPost.upsert({
        where: { slug: post.slug },
        update: post,
        create: post,
      });
      console.log(`✓ Created/Updated: ${post.title}`);
    } catch (error) {
      console.error(`✗ Error creating post "${post.title}":`, error);
    }
  }

  console.log(`\nSuccessfully created ${blogPosts.length} blog posts!`);
}

createWCAGBlogPosts()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
