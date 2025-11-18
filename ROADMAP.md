# VexNexa Product Roadmap

## Page Metadata
**URL**: /roadmap
**Title**: VexNexa Product Roadmap | What's Coming Next
**Meta Description**: See what we're building at VexNexa. Upcoming features include API access, scheduled scans, multi-site dashboards, and team integrations.

---

## Hero Section

### Headline
**We're building VexNexa in the open**

### Subheadline
Here's what we're working on, what's coming soon, and what we're considering. Your feedback shapes our priorities.

### CTA
**Primary**: "Request a Feature" → /feedback
**Secondary**: "Join Beta Program" → /beta

---

## 🚀 Available Now

### Instant WCAG Scanning
✅ Automated analysis against WCAG 2.1 and 2.2
✅ Powered by axe-core (industry standard)
✅ Single-page and multi-page scanning
✅ Severity-based issue prioritization

### Developer-Friendly Reports
✅ Clear violation descriptions
✅ Code-level insights with element selectors
✅ Remediation guidance for every issue
✅ WCAG Success Criterion references

### Multilingual Platform
✅ Full interface in English, Dutch, and French
✅ Switch languages anytime
✅ International team support

### Team Features
✅ Multiple users per account
✅ Shared scan history
✅ Basic collaboration

### Export Capabilities
✅ PDF reports (Starter+)
✅ Word documents (Pro+)
✅ Shareable scan URLs

### Transparent Pricing
✅ Self-service signup
✅ Clear plan limits
✅ Overflow pricing for extra usage
✅ Cancel anytime

---

## 🔨 In Development (Q1 2025)

These features are actively being built. Expected release: January-March 2025.

### Multi-Site Dashboard
**Status:** In development
**Target:** Late January 2025

**What it is:**
A single dashboard view showing all your sites, scan history, and accessibility scores at a glance.

**Why it matters:**
Agencies and teams managing multiple projects need to see everything in one place without clicking through individual sites.

**Features:**
- Bird's-eye view of all sites and their current scores
- Sort/filter by score, last scan date, or violations
- Quick access to any site's detailed report
- Aggregate statistics across all projects

**Who requested it:** Digital agencies managing 5+ client sites

---

### PDF & JSON Export Enhancements
**Status:** In development
**Target:** Early February 2025

**What it is:**
Improved export formats with more customization options.

**Features:**
- JSON export for developers (integrate into custom tools)
- Enhanced PDF layouts with graphs and trend data
- Customizable report sections (include/exclude specific violation types)
- Bulk export (download reports for multiple scans at once)

**Who requested it:** SaaS teams and developers needing programmatic access to data

---

### Scheduled Scans & Monitoring
**Status:** In development
**Target:** Mid February 2025

**What it is:**
Automated rescans on a schedule (daily, weekly, monthly).

**Features:**
- Set scan frequency per site
- Email notifications when scans complete
- Alerts if accessibility score drops significantly
- Scheduled reports sent to your inbox

**Why it matters:**
Accessibility isn't a one-time thing. Sites change as content is added or features ship. Automated monitoring catches regressions.

**Who requested it:** Agencies on retainer, SaaS teams shipping frequently

---

### API Access (v1)
**Status:** In development
**Target:** Late February 2025

**What it is:**
RESTful API for triggering scans, retrieving results, and integrating VexNexa into your workflow.

**Planned endpoints:**
```bash
POST /v1/scan          # Trigger a new scan
GET  /v1/scan/:id      # Get scan results
GET  /v1/sites         # List all your sites
GET  /v1/sites/:id     # Get site details
POST /v1/webhooks      # Register webhook URLs
```

**Use cases:**
- CI/CD integration (scan on every deploy)
- Custom dashboards and reporting
- Automated monitoring workflows
- Integration with internal tools

**Who requested it:** SaaS development teams, large agencies

---

## 📅 Planned (Q2 2025)

These features are planned but not yet in active development. Expected release: April-June 2025.

### Authenticated Scanning
**Status:** Planned
**Target:** April 2025

**What it is:**
Scan sites behind login walls or basic authentication.

**How it will work:**
- Provide login credentials securely
- VexNexa logs in and scans authenticated pages
- Credentials encrypted and never stored long-term

**Use cases:**
- SaaS dashboards requiring login
- Membership sites
- Staging environments with basic auth
- Admin panels

**Security considerations:**
- We're designing this carefully to ensure credential safety
- May support OAuth, test accounts, or temporary tokens

---

### Team Integrations
**Status:** Planned
**Target:** May 2025

**What it is:**
Connect VexNexa to the tools your team already uses.

**Planned integrations:**
- **Slack** - Scan results posted to channels, alerts for regressions
- **Jira** - Auto-create tickets from violations, sync fix status
- **Microsoft Teams** - Similar to Slack integration
- **GitHub** - PR comments with accessibility scan results
- **GitLab** - Similar to GitHub integration

**Who requested it:** Development teams using these tools daily

---

### Historical Trend Tracking
**Status:** Planned
**Target:** May 2025

**What it is:**
Visualize how your accessibility score changes over time.

**Features:**
- Line graphs showing score trends
- Compare any two scans side-by-side
- See when violations were introduced or fixed
- Correlate with release dates or content changes

**Why it matters:**
Prove improvement to stakeholders. Identify when regressions happened. Celebrate progress.

---

### Custom WCAG Rulesets
**Status:** Planned
**Target:** June 2025

**What it is:**
Customize which WCAG Success Criteria you scan for.

**Use cases:**
- Focus only on WCAG 2.1 Level AA (ignore AAA)
- Scan for specific industry requirements
- Disable rules that don't apply to your use case

**Example:**
If you're building a text-only dashboard, you might skip multimedia-related rules.

**Who requested it:** Teams with specific compliance requirements

---

## 🤔 Under Consideration

These features are being discussed but not yet committed to the roadmap. Your feedback helps us prioritize.

### Advanced Team Permissions
**What it is:**
Role-based access control (viewer, editor, admin roles per team member).

**Why we're considering it:**
Agencies want to give clients read-only access. Large teams need permission hierarchy.

**Challenges:**
Adds complexity. Need to balance feature richness with simplicity.

**Status:** Collecting feedback

---

### White-Label Platform (Full)
**What it is:**
Beyond white-label reports—a fully branded VexNexa experience agencies can resell.

**Example:**
YourAgency.com/accessibility-scanner powered by VexNexa, but looks like your product.

**Why we're considering it:**
Agencies want to offer accessibility scanning as their own service.

**Challenges:**
Significant engineering effort. Need to validate demand first.

**Status:** Gauging interest

---

### Mobile App Scanning
**What it is:**
Accessibility scanning for iOS and Android apps, not just websites.

**Why we're considering it:**
Mobile accessibility is increasingly important.

**Challenges:**
Completely different technology stack (accessibility APIs vs. web HTML). May be a separate product.

**Status:** Early research phase

---

### Localhost / Private Network Scanning
**What it is:**
Scan sites running on localhost or private networks (behind firewalls).

**How it might work:**
- VexNexa CLI tool running on your machine
- Scans local dev servers and sends results to dashboard
- No cloud access needed

**Why we're considering it:**
Developers want to scan before deploying to staging.

**Challenges:**
Security, platform compatibility (Windows, macOS, Linux), support burden.

**Status:** Exploring options

---

### Accessibility Heatmaps
**What it is:**
Visual overlay on your site showing where violations are located.

**Example:**
Hover over elements with low contrast, missing alt text, etc., directly on your rendered page.

**Why we're considering it:**
Makes it easier to locate issues visually instead of reading selectors.

**Challenges:**
Requires browser extension or bookmarklet. May blur line with overlays (we don't want that perception).

**Status:** Researching user interest

---

## 🚫 What We Won't Build

To maintain focus, here are things we've intentionally decided NOT to build:

### ❌ Accessibility Overlay Widget
**Why not:** We don't believe in overlays. Our position is clear: scan and fix at the source, don't inject widgets.

### ❌ Automated Code Fixes
**Why not:** Real accessibility requires human judgment. We'll never promise "AI fixes" that auto-generate code changes.

### ❌ Legal Compliance Guarantees
**Why not:** No tool can guarantee you won't be sued or that you're 100% compliant. We provide data, not legal protection.

### ❌ Enterprise-Only Features Behind "Contact Sales"
**Why not:** We're committed to transparent, self-service pricing. If a feature exists, it has a clear price.

### ❌ Content Management System (CMS)
**Why not:** We're a scanner, not a CMS. We integrate with your existing tools, not replace them.

---

## 📣 How to Influence the Roadmap

We prioritize features based on:

1. **User demand** - How many people request it?
2. **Impact** - How much value does it add?
3. **Complexity** - Can we build it without sacrificing quality?
4. **Strategic fit** - Does it align with our vision?

### Ways to Share Feedback

**1. Request a Feature**
Submit ideas at [vexnexa.com/feedback](/feedback)

**2. Vote on Existing Requests**
See what others have requested and upvote your favorites

**3. Join Beta Programs**
Get early access to new features and provide feedback

**4. Contact Us Directly**
Email [product@vexnexa.com](mailto:product@vexnexa.com) with detailed use cases

---

## 🎯 Our Product Philosophy

### Principles That Guide Our Roadmap

**1. Developer-First**
We build for people who write code and ship products. Features should be technical, accurate, and useful—not marketing fluff.

**2. Self-Service Always**
No feature will require "contact sales." If we build it, you can access it transparently.

**3. Honest About Limitations**
We won't promise automated fixes, legal guarantees, or 100% compliance. We'll provide accurate data and let you make decisions.

**4. Simplicity Over Bloat**
We'd rather do fewer things exceptionally well than many things poorly. Enterprise feature bloat won't happen here.

**5. Fast & Reliable**
New features can't slow down the core experience. Scanning should always be instant.

---

## 📊 Roadmap Timeline (Visual)

### 2025 Q1 (Jan-Mar)
- ✅ Multi-site dashboard
- ✅ Enhanced PDF/JSON exports
- ✅ Scheduled scans
- ✅ API v1 launch

### 2025 Q2 (Apr-Jun)
- 🔨 Authenticated scanning
- 🔨 Team integrations (Slack, Jira, GitHub)
- 🔨 Historical trend tracking
- 🔨 Custom WCAG rulesets

### 2025 Q3 (Jul-Sep)
- 🤔 TBD based on Q1/Q2 feedback

### 2025 Q4 (Oct-Dec)
- 🤔 TBD based on user demand

---

## 💬 Join the Beta Program

Get early access to new features before they launch.

**Beta benefits:**
- Try features first
- Provide feedback that shapes final design
- Influence prioritization
- Feel like part of the VexNexa team

**Beta expectations:**
- Features may be buggy
- UX may change based on feedback
- You'll be asked for input regularly

[Sign Up for Beta →](/beta)

---

## 🔔 Stay Updated

### Ways to Track Roadmap Changes

**1. Follow Our Blog**
[vexnexa.com/blog](/blog) - Product updates and feature announcements

**2. Subscribe to Email Updates**
Get monthly roadmap digests in your inbox

**3. Follow on Social Media**
Twitter/X: [@vexnexa](https://twitter.com/vexnexa) (if applicable)

**4. Check This Page**
We update this roadmap monthly with progress reports

---

## ❓ Roadmap FAQ

**Q: Are these dates guaranteed?**
No. Software development is unpredictable. These are our best estimates, but delays happen.

**Q: Can I pay to prioritize a feature?**
Not currently. We prioritize based on broad user value, not individual payments. (Enterprise custom development might be considered in the future.)

**Q: What if a feature I need isn't on the roadmap?**
[Request it →](/feedback). If enough people want it, we'll add it.

**Q: Can I contribute code?**
VexNexa isn't open-source, but we appreciate the thought. Share ideas via feedback instead.

**Q: How often is this roadmap updated?**
Monthly. Check back for progress updates.

---

## 🚀 Start Using VexNexa Today

Don't wait for future features. VexNexa is powerful right now.

**Available today:**
✅ Instant WCAG scanning
✅ Developer-friendly reports
✅ Multilingual platform
✅ Transparent pricing

[Start Free Scan →](/scan)

---

**Last Updated**: 2025-01-18
**Next Update**: February 2025
**Status**: Active Roadmap
**Feedback**: product@vexnexa.com
