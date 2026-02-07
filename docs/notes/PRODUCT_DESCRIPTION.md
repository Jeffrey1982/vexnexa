# VexNexa Product Description Page

## Page Title (H1)
**What is VexNexa?**

## Introduction
VexNexa is a developer-friendly accessibility scanner that analyzes your website against WCAG 2.1 and 2.2 standards. We give you instant, accurate reports about accessibility violations—without injecting overlay widgets, without requiring sales calls, and without making promises we can't keep.

---

## What VexNexa Does

### Automated WCAG Scanning
We crawl your website and test every element against WCAG Success Criteria using axe-core, the industry-standard accessibility testing engine used by Google, Microsoft, and the W3C.

**What you get:**
- Complete analysis of HTML structure, ARIA usage, color contrast, keyboard navigation, and more
- Issues categorized by WCAG level (A, AA, AAA)
- Severity ranking (Critical, Serious, Moderate, Minor)
- Specific element selectors so you know exactly where the problem is

### Developer-Friendly Reports
Every violation includes:

1. **What's wrong** - Clear description of the accessibility issue
2. **Why it matters** - Impact on users with disabilities
3. **How to fix it** - Code-level guidance and examples
4. **WCAG reference** - Which Success Criterion it violates (e.g., 1.4.3, 2.1.1)

No vague scores. No marketing fluff. Just technical data you can act on.

### Multilingual Platform
The entire VexNexa interface is available in:
- 🇬🇧 English
- 🇳🇱 Dutch (Nederlands)
- 🇫🇷 French (Français)

Switch languages anytime from your dashboard. Perfect for international teams and agencies working across markets.

---

## How VexNexa Works (Technical Overview)

### 1. URL Submission
You provide the URL you want to scan. No installation required, no scripts to add to your site.

### 2. Automated Crawling
Our scanner:
- Loads your page in a headless browser
- Renders JavaScript (we test what users actually see)
- Discovers links for multi-page analysis (on paid plans)
- Maps your site structure

### 3. Accessibility Analysis
We run the axe-core testing engine, which checks for:
- **Semantic HTML** - Proper heading structure, landmarks, lists
- **ARIA usage** - Correct roles, states, and properties
- **Color contrast** - Text readability against backgrounds
- **Keyboard navigation** - Focus management, tab order, skip links
- **Form accessibility** - Labels, error messages, input types
- **Images & media** - Alt text, captions, transcripts
- **Interactive elements** - Buttons, links, modals, tooltips
- **Document structure** - Page titles, language attributes, landmarks

### 4. Report Generation
You receive:
- Overall accessibility score (0-100)
- Total issue count by severity
- Detailed violation list with:
  - Element selectors (CSS/XPath)
  - Code snippets showing the problem
  - Remediation guidance
  - WCAG Success Criterion reference

### 5. Ongoing Monitoring (Paid Plans)
- Re-scan on demand to track fixes
- Scheduled scans (coming soon) for continuous monitoring
- Historical data to see improvement trends

---

## What VexNexa Is NOT

### We Are Not an Overlay Widget
**What overlays do:**
Overlays inject JavaScript into your site that attempts to "fix" accessibility on the fly by manipulating the DOM, adding ARIA attributes, or changing visual styling.

**Why that's controversial:**
The accessibility community widely criticizes overlays because:
- They can't fix fundamental code structure issues
- They often create new accessibility barriers
- They don't address the root cause
- They can interfere with assistive technology

**What VexNexa does instead:**
We analyze your actual code structure and give you specific violations to fix at the source. No scripts injected, no DOM manipulation, no shortcuts.

### We Do Not Guarantee Legal Compliance
**We will never claim:**
- "100% WCAG compliance guaranteed"
- "Lawsuit protection"
- "Safe from ADA lawsuits"
- "Certified accessible"

**The truth:**
No automated tool can guarantee accessibility or legal compliance. Manual testing by users with disabilities is essential. We provide accurate technical data to help you identify and fix issues, but compliance is your responsibility.

### We Are Not an Automated Fixer
**We don't:**
- Auto-inject ARIA attributes
- Automatically adjust color contrast
- Modify your HTML/CSS without your knowledge
- Claim to fix issues with "AI"

**What we do:**
Show you exactly what's wrong and how to fix it properly. Real accessibility requires thoughtful code changes by developers who understand the context.

### We Are Not an Enterprise Compliance Platform
**We're not:**
- Siteimprove (enterprise monitoring suite with account managers)
- Level Access (consulting-heavy compliance service)
- Monsido (content governance platform)

**We are:**
A fast, self-service scanner for developers and agencies who want instant results without the enterprise complexity.

---

## Who Should Use VexNexa?

### ✅ Perfect For

**Web Developers**
- Building accessible sites from scratch
- Need quick feedback during development
- Want technical, code-level insights
- Prefer tools that respect developers' intelligence

**Digital Agencies**
- Managing multiple client sites
- Need professional reports for client deliverables
- Want white-label options (Business plan)
- Require multilingual support for international clients

**SaaS Product Teams**
- Shipping features rapidly
- Maintaining WCAG compliance across releases
- Planning to integrate scanning into CI/CD (API coming soon)
- Need team collaboration features

**Freelance Developers**
- Conducting accessibility audits for clients
- Creating professional proposals
- Working on tight budgets
- Managing solo projects

**Startups & Small Teams**
- Building inclusive products from day one
- Need affordable, transparent tools
- Want self-service without sales pressure
- Value speed and simplicity

### ❌ Probably Not For

**Enterprise Organizations Requiring:**
- Dedicated account managers
- Custom SLAs and legal indemnification
- On-premise deployment
- Integration with legacy compliance workflows

*For enterprise needs, consider Siteimprove or Level Access*

**Teams Looking For:**
- Automated code fixes (we don't do that)
- Legal compliance guarantees (no one can promise that)
- Overlay widget solutions (we actively avoid those)
- Free unlimited scanning (we have a generous free tier, but limits exist)

---

## Technology Stack

VexNexa is built with modern, reliable technologies:

- **Scanner Engine**: axe-core by Deque Systems (industry standard)
- **Browser Automation**: Playwright (Chromium-based rendering)
- **Platform**: Next.js 14 (React framework)
- **Database**: PostgreSQL via Supabase
- **Hosting**: Vercel (edge network for global speed)
- **Internationalization**: next-intl (true multilingual support)

**What this means for you:**
- Fast, reliable scanning
- Accurate results that match manual testing
- Modern, accessible interface
- Global CDN for quick access worldwide

---

## Accuracy & Limitations

### What Automated Tools Can Catch
Automated scanners like VexNexa can reliably detect:
- Missing alt text on images
- Insufficient color contrast
- Missing form labels
- Invalid ARIA usage
- Broken heading hierarchy
- Keyboard trap issues
- Many WCAG Level A and AA violations

**Estimated coverage:** 30-40% of accessibility issues can be found automatically.

### What Requires Manual Testing
No automated tool can verify:
- Whether alt text is meaningful (we can detect it exists, not if it's good)
- Logical tab order (we check structure, not user flow logic)
- Content readability and plain language
- Context-dependent ARIA usage
- Usability for specific disability types
- Real-world assistive technology compatibility

**Reality:** Manual testing by users with disabilities is essential for true accessibility.

### Our Commitment
We will always be honest about what automated tools can and cannot do. VexNexa is a powerful first step, but not a replacement for human judgment and testing.

---

## Pricing Philosophy

### Transparent & Self-Service
- See all prices upfront on /pricing
- No "contact sales" requirements
- No hidden fees or surprise invoices
- Cancel anytime from your dashboard

### Fair Usage Limits
- Clear page/site/user limits per plan
- Transparent overflow pricing when you exceed limits
- No sudden account locks—just clear communication

### No Lock-In
- No annual contracts required
- Monthly or annual billing (save with annual)
- Export your data anytime
- Cancel with one click

---

## Privacy & Security

### We Don't Store Your Site Content
When we scan your site:
- We analyze the HTML/CSS/JS structure
- We store WCAG violation data and metadata
- We do NOT store full page content or user data
- We do NOT track your site visitors

### GDPR Compliant
- EU-based infrastructure options
- Clear data processing agreements
- User data rights honored (access, deletion, portability)
- No third-party tracking scripts

### Security
- HTTPS everywhere
- Secure authentication via Supabase
- Regular security audits
- Transparent incident disclosure policy

---

## Support & Documentation

### Self-Service Resources
- Comprehensive documentation at /docs
- WCAG Success Criteria guide
- Developer tutorials
- Video walkthroughs

### Email Support
- Starter plan: Standard email support (24-48h response)
- Pro/Business plans: Priority support (12-24h response)
- Technical questions answered by developers, not scripts

### No Phone Support
We're a small, focused team. Email lets us provide thoughtful, detailed answers. We don't outsource to call centers.

---

## Coming Soon

We're actively building:

### Q1 2025
- **Multi-site dashboard** - Manage all your projects in one view
- **PDF/JSON exports** - Professional reports for clients
- **Scheduled rescans** - Automated monitoring on a schedule
- **API access** - Integrate VexNexa into CI/CD pipelines

### Under Consideration
- Slack & Jira integrations for team workflows
- Custom WCAG rulesets for specific industries
- Historical trend tracking & comparison
- Advanced team role permissions
- Webhook notifications

Want early access? [Join our beta program →](/beta)

---

## Getting Started

### Step 1: Try It Free
Visit [vexnexa.com/scan](/scan) and paste any URL. Get instant results, no signup required.

### Step 2: Review Your Report
See your accessibility score, browse violations by severity, read technical explanations.

### Step 3: Sign Up (Optional)
Create a free account to:
- Save your scans
- Track progress over time
- Access detailed reports
- Manage team members (on paid plans)

### Step 4: Upgrade When Ready
Choose a plan that fits your needs. Upgrade instantly with a credit card. No sales calls.

---

## FAQ

**Q: Is VexNexa open source?**
The scanner uses open-source axe-core, but the VexNexa platform is proprietary. We contribute back to accessibility tooling where we can.

**Q: Can I white-label VexNexa?**
Yes, on the Business plan. Custom branding for reports and dashboards.

**Q: Do you offer refunds?**
Yes. If you're unsatisfied within 14 days of a paid subscription, we'll refund you in full.

**Q: Can I scan sites behind authentication?**
Not yet, but it's on our roadmap for Q2 2025.

**Q: What about single-page apps (SPAs)?**
We render JavaScript, so we can scan React, Vue, Angular, Svelte, etc. Apps must be publicly accessible.

**Q: Can I use VexNexa for client work?**
Yes! Pro and Business plans allow commercial use and client reporting.

---

## Ready to Start?

[Scan Your First Site Free →](/scan)

No credit card. No demos. No widgets.
Just instant accessibility insights.

---

**Last Updated**: 2025-01-18
**Document Type**: Product Description Page
**Audience**: Developers, agencies, product teams
