# Why VexNexa Doesn't Use Overlay Widgets

## Page Metadata
**URL**: /why-no-overlays
**Title**: Why VexNexa Doesn't Use Accessibility Overlays
**Meta Description**: VexNexa scans your code structure instead of injecting overlay widgets. Learn why the accessibility community warns against overlays and how real scanning works.

---

## Hero Section

### Headline (H1)
**We don't use overlays. Here's why.**

### Subheadline
Accessibility overlays promise quick fixes, but the disability community and accessibility professionals widely criticize them. VexNexa takes a different approach.

---

## What Is an Accessibility Overlay?

An accessibility overlay is a JavaScript widget that you add to your website (usually via a single line of code). Once installed, it:

- Injects a toolbar or icon on your site
- Attempts to modify your site's appearance and behavior in real-time
- Claims to make your site "accessible" or "WCAG compliant"
- Often markets itself as an instant, automated solution

**Common overlay providers include:**
- accessiBe
- UserWay
- AudioEye (in widget mode)
- EqualWeb
- Several others

---

## Why Overlays Are Controversial

### The Accessibility Community Has Concerns

The National Federation of the Blind, WebAIM, accessibility consultants, and disability advocates have published criticisms of overlay widgets:

#### 1. They Can't Fix Structural Issues
Overlays work by manipulating the DOM (Document Object Model) after your page loads. They cannot fix:
- Illogical heading hierarchy
- Missing semantic HTML structure
- Poor form design
- Broken keyboard navigation flow
- Inaccessible interactive widgets
- Content that doesn't make sense

**Example:**
If your heading structure jumps from H1 to H4, an overlay can't retroactively restructure your content to make logical sense.

#### 2. They Can Introduce New Barriers
By injecting ARIA attributes and modifying the page structure, overlays can:
- Confuse screen readers with conflicting information
- Break existing keyboard navigation
- Create focus traps
- Interfere with user preferences and assistive technology settings
- Cause unexpected behavior for power users of assistive tech

**Example:**
A blind user who has configured their screen reader a specific way may find the overlay's automatic changes disruptive rather than helpful.

#### 3. They Don't Address Root Causes
Accessibility is about building sites properly from the start. Overlays are a band-aid that:
- Mask symptoms instead of fixing problems
- Leave inaccessible code in your codebase
- Create dependency on a third-party script
- Don't improve your development practices

**Example:**
If you remove the overlay, all the "accessibility fixes" disappear—because your underlying code is still inaccessible.

#### 4. One-Size-Fits-All Doesn't Work
People with disabilities have diverse needs. An overlay that tries to serve everyone often:
- Makes assumptions about what users need
- Overrides user preferences
- Provides features that only help some users while harming others

**Example:**
A dyslexic user may have already installed their preferred font and spacing tools. The overlay forcing different settings can interfere.

#### 5. Legal & Compliance Risks
Despite marketing claims:
- Overlays don't guarantee WCAG compliance
- Courts have ruled against sites using overlays in ADA lawsuits
- No overlay can replace proper accessible design and development

---

## What VexNexa Does Instead

### We Scan Your Actual Code

VexNexa analyzes your HTML, CSS, and ARIA structure directly. We:

1. **Load your page** in a headless browser (like a real user's browser)
2. **Run axe-core** (the industry-standard accessibility engine)
3. **Report WCAG violations** with specific element selectors
4. **Provide remediation guidance** so you can fix things properly

**We never:**
- Inject scripts into your site
- Modify your DOM
- Add widgets or toolbars
- Make automated "fixes"

### Why This Approach Works

#### 1. You Fix the Root Cause
When you fix the underlying HTML, CSS, and JavaScript:
- The improvements are permanent
- You learn better development practices
- Your codebase becomes more maintainable
- You don't depend on third-party scripts

#### 2. No Interference with Assistive Technology
Your site works naturally with:
- Screen readers (JAWS, NVDA, VoiceOver, TalkBack)
- Keyboard-only navigation
- Voice control software
- Refreshable braille displays
- Custom user stylesheets

#### 3. Developer-Focused Learning
Our reports teach you:
- Which WCAG Success Criteria you're violating
- Why the issue matters for users
- How to fix it in your code
- Best practices for the future

#### 4. True Compliance
When you fix accessibility at the code level:
- You're building proper semantic HTML
- You're following WCAG guidelines correctly
- You're creating a genuinely better user experience
- You're reducing legal risk more effectively

---

## Common Overlay Marketing Claims (Debunked)

### Claim 1: "Get WCAG Compliant in 48 Hours"
**Reality:** Real accessibility takes time. Automated tools (overlays OR scanners) can only catch 30-40% of issues. Manual testing and thoughtful design are essential.

### Claim 2: "Protect Yourself from ADA Lawsuits"
**Reality:** Courts have ruled against websites using overlays. No tool can guarantee legal protection. The best protection is building accessible sites properly.

### Claim 3: "AI-Powered Automatic Fixes"
**Reality:** Accessibility requires human judgment. AI can't determine if alt text is meaningful, if content flow makes sense, or if interactions are truly usable.

### Claim 4: "One Line of Code"
**Reality:** If it sounds too good to be true, it usually is. Accessibility is not a one-line-of-code problem. It's a design and development practice.

---

## When Overlays Might Make Sense

We want to be fair. There are *very limited* scenarios where overlays can provide value:

### Assistive Features for All Users
Some overlay features are genuinely useful when implemented thoughtfully:
- Font size adjustment (if not forcing it on users)
- High-contrast mode (as an option, not default)
- Content highlighting for dyslexia
- Animation/motion controls

**Key difference:** These should be *optional enhancements* for users who want them, not automatic "fixes" to mask inaccessible code.

### Legacy Systems with Limited Control
If you're managing a legacy CMS where you cannot change the underlying code, an overlay *might* provide temporary relief while you plan a proper rebuild.

**But:** This should be a short-term bridge, not a permanent solution.

---

## The VexNexa Philosophy

We believe in:

### ✅ Honest Solutions Over Quick Fixes
Accessibility takes work. We provide the data you need to do it right.

### ✅ Respecting the Disability Community
We listen to blind users, deaf users, users with motor disabilities, and accessibility advocates who have criticized overlays.

### ✅ Teaching, Not Masking
Our reports help you learn proper accessibility practices, not hide problems.

### ✅ Transparency
We're honest about what automated tools can and cannot do. We never promise 100% compliance.

### ✅ Sustainable Accessibility
Fix things once, properly, in your codebase. Don't depend on third-party scripts that might break, get acquired, or change their terms.

---

## What Accessibility Experts Say About Overlays

### Organizations Warning Against Overlays

**National Federation of the Blind (NFB)**
Issued a statement condemning overlay widgets and calling for their discontinuation.

**WebAIM**
Published research and articles explaining why overlays often fail to deliver on promises.

**Web Accessibility Initiative (W3C)**
Emphasizes proper WCAG implementation in source code, not client-side patches.

**Overlay Fact Sheet**
A coalition of accessibility professionals maintains [overlayfactsheet.com](https://overlayfactsheet.com) documenting concerns. (Reference: we acknowledge this exists without endorsing every statement.)

### What Developers Say

Developers in accessibility communities (a11y Slack, Twitter, Stack Overflow) frequently express frustration with:
- Overlays breaking their carefully crafted accessible code
- Clients choosing overlays over proper fixes due to marketing
- Debugging issues caused by overlay script conflicts

---

## How VexNexa Is Different from Overlays

| Aspect | Accessibility Overlays | VexNexa |
|--------|----------------------|---------|
| **Installation** | Inject script into your site | No installation needed |
| **Approach** | Modify DOM in browser | Scan code structure |
| **Impact on site** | Adds widget, changes behavior | No changes to your site |
| **Fixes** | Automated, superficial | You fix properly in code |
| **User experience** | Can interfere with assistive tech | No interference |
| **Learning** | Doesn't teach you anything | Detailed explanations |
| **Dependency** | Ongoing subscription required | Use our scanner as needed |
| **WCAG compliance** | Claimed, rarely achieved | Honest reporting of violations |
| **Legal protection** | Often falsely promised | We make no legal claims |

---

## Our Recommendation

### If You're Considering an Overlay

Ask yourself:

1. **Can I fix the issues in my code instead?**
   - If yes → Use VexNexa to identify problems, then fix them properly
   - If no → Why not? (Budget? Time? Knowledge?)

2. **Am I using this as a permanent solution or temporary bridge?**
   - Permanent → Reconsider. Overlays are not sustainable
   - Temporary → Better than nothing, but plan to fix properly soon

3. **Have I consulted with users with disabilities?**
   - User testing reveals what automated tools miss
   - Ask disabled users if the overlay helps or hinders

4. **What does my legal counsel say?**
   - Don't rely on overlay marketing for legal advice
   - Consult actual accessibility lawyers

### Our Advice

**Best path forward:**
1. Use VexNexa to scan your site
2. Prioritize violations by severity
3. Fix the most critical issues first
4. Re-scan to verify fixes
5. Conduct manual testing with real users
6. Iterate and improve continuously

This is harder than installing an overlay, but it's the right way.

---

## FAQ About Overlays vs. Scanners

**Q: Isn't VexNexa also automated, like overlays?**
Yes, we're automated *scanning*, but we don't make automated *fixes*. We show you what's wrong; you fix it properly.

**Q: Are ALL overlays bad?**
"Bad" is strong. They're controversial and often oversold. Some features can be useful, but they shouldn't replace proper accessibility practices.

**Q: Can I use an overlay AND VexNexa?**
You can, but we recommend fixing issues in your code instead of relying on the overlay.

**Q: What if my boss insists on an overlay?**
Share this page and resources like the Overlay Fact Sheet. If you're overruled, at least run VexNexa scans to know what issues remain unfixed.

**Q: Do you have an agenda against overlay companies?**
No. We want accessible web for everyone. We're sharing documented concerns from the disability community and our own technical analysis.

---

## Further Reading

### Resources to Learn More

**Overlay Fact Sheet**
overlayfactsheet.com - Written by accessibility professionals

**WebAIM Articles**
webaim.org - Research and guidance on accessibility

**W3C WCAG Guidelines**
w3.org/WAI/WCAG21/quickref/ - Official WCAG reference

**A11y Slack Community**
web-a11y.slack.com - Discuss with accessibility practitioners

**ARIA Authoring Practices**
w3.org/WAI/ARIA/apg/ - Learn proper ARIA implementation

---

## Take the Right Path

Accessibility isn't a widget you install.
It's a practice you build into your development workflow.

**VexNexa helps you:**
- Identify real WCAG violations
- Understand why they matter
- Fix them properly in your code
- Build better products for everyone

**Start scanning today →** [vexnexa.com/scan](/scan)

---

**Last Updated**: 2025-01-18
**Document Type**: Educational / Position Page
**Tone**: Professional, evidence-based, non-aggressive
**Audience**: Developers, product teams, decision-makers
