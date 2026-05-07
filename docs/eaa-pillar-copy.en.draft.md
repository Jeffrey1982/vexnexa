# EAA Pillar Page — English Copy Draft (v1)

Working draft for `/eaa-compliance`. Review before Dutch translation begins.
Path: `src/app/(marketing)/eaa-compliance/page.tsx`. Namespace: `eaaCompliance` in `messages/en.json`.

> Translator's note (for the NL pass): Dutch is the primary market, so the NL version
> must read natively, not as a translation. Use Dutch business terminology
> (handhaving, boete, niet-naleving, naleving). The headline must stay close to
> "De European Accessibility Act, uitgelegd voor bedrijven." per spec.

---

## Page metadata

- **Title (EN):** European Accessibility Act (EAA) — Compliance Guide for Businesses | VexNexa
- **Meta description (EN, ~150 chars):** EAA enforcement began 28 June 2025. Plain-language guide to who must comply, the WCAG 2.1 AA standard, penalties, and a 5-step roadmap to compliance.
- **OG title:** European Accessibility Act — what it means for your business | VexNexa
- **OG description:** Who must comply, what the standard requires, how penalties work, and a 5-step roadmap to becoming EAA-compliant.
- **Canonical:** https://vexnexa.com/eaa-compliance
- **Hreflang:** en → /eaa-compliance, nl → /nl/eaa-compliance, x-default → /eaa-compliance
- **Breadcrumb:** Home › Compliance › EAA

---

## Section 1 — Hero

- **Trust badge:** EAA enforcement active since 28 June 2025
- **H1:** The European Accessibility Act, explained for businesses.
- **Subhead:** If you sell products or services to consumers in the EU — online stores, banking, ticketing, telecom, e-books, and more — the EAA almost certainly applies to you. Here's what it requires, what it costs to ignore, and how to prove you're compliant.
- **CTA primary:** Scan your site for free → `/auth/register`
- **CTA secondary:** Read the full guide → smooth-scroll to `#what-is`

Eyebrow / kicker (optional, above H1): Compliance guide

---

## Section 2 — What is the EAA?

**H2:** What is the European Accessibility Act?

The European Accessibility Act (EAA) is EU-wide legislation that requires a wide range of digital products and services to be accessible to people with disabilities. It was adopted in 2019 as Directive (EU) 2019/882 and harmonises accessibility rules across all 27 member states, replacing the patchwork of national laws that came before it.

The goal is practical. A person who is blind, has low vision, is deaf, has a motor impairment, or has a cognitive disability should be able to buy, bank, travel, read, and communicate online with the same independence as anyone else. For businesses, that means websites, apps, e-commerce checkouts, e-readers, ATMs, ticketing kiosks, and customer support channels all need to meet a defined accessibility standard.

Member states had until June 2022 to write the directive into national law. Application against businesses began on **28 June 2025**, and every member state has now appointed its own enforcement authority. Audits, complaint procedures, and penalty regimes are all live.

> **Enforcement began 28 June 2025.**
> — Directive (EU) 2019/882, Article 31

*Source: Directive (EU) 2019/882 of the European Parliament and of the Council on the accessibility requirements for products and services.*

---

## Section 3 — Who must comply?

**H2:** Does the EAA apply to your business?

*Intro line (sits above the two columns):* The EAA covers a defined list of products and services aimed at consumers in the EU. The columns below are a quick check — but treat them as guidance, not a legal opinion.

### Yes, you must comply if you offer:

- E-commerce websites and apps that sell to consumers in the EU (regardless of where your business is registered)
- Consumer banking services, including online and mobile banking
- Passenger transport: booking sites, ticketing apps, smart ticketing machines, journey information
- Telecommunications: mobile carriers, VoIP, messaging services for consumers
- Audiovisual media access services (streaming platforms, on-demand TV)
- E-books, e-readers, and the software that distributes them
- Self-service terminals: ATMs, ticket machines, payment terminals, check-in kiosks
- Emergency communications to 112
- Operating systems, computers, and smartphones sold to consumers

### Possibly out of scope or exempt:

- **Microenterprises providing services** — fewer than 10 employees AND annual turnover or balance sheet total of €2 million or less
- Pre-recorded media content published before 28 June 2025
- Office productivity tools and websites used purely for internal business processes
- Maps and mapping services that aren't used for navigation
- Archived content not updated or retransmitted after 28 June 2025
- B2B services where the customer is not a consumer

**Footnote:** The microenterprise exemption applies only to service providers — not to product manufacturers. Even where the exemption applies, regulators encourage voluntary conformance, and many enterprise buyers now require it in procurement.

---

## Section 4 — Penalties

**H2:** Penalties for non-compliance

The EAA does not set a single Europe-wide fine. Each member state writes its own penalty regime into national law, and the rules vary widely. What every member state has in common is the requirement that penalties must be "effective, proportionate, and dissuasive" — high enough that compliance is the cheaper path.

**France** was the first member state to publicly announce enforcement actions, with its accessibility authority opening proceedings within days of the 28 June 2025 deadline. Other member states have followed with audit programs and formal complaint procedures. In most countries, enforcement starts with a formal notice and a chance to remediate; uncorrected violations escalate to administrative fines, public disclosure of the offending business, or temporary withdrawal of the service from the market.

### How enforcement looks per country (illustrative — confirm with local counsel)

- **Netherlands.** The Implementatiewet toegankelijkheidsvoorschriften producten en diensten authorises designated supervisory bodies — including the Autoriteit Consument & Markt (ACM) — to issue formal warnings, binding instructions, and administrative fines.
- **Germany.** Under the Barrierefreiheitsstärkungsgesetz (BFSG), market surveillance authorities can issue fines per infringement and order non-compliant products to be withdrawn from the market.
- **France.** Enforcement runs through specialised authorities (notably the DGCCRF and ARCOM), which can issue formal notices, daily penalties for continued non-compliance, and sanctions that are publicly disclosed.

**Disclaimer:** Specific fine ceilings vary by country, sector, and the severity of the breach. This page is a plain-language summary, not legal advice. For an authoritative answer for your business, consult counsel in the jurisdiction(s) where you operate.

---

## Section 5 — WCAG 2.1 AA: the technical baseline

**H2:** The technical standard: WCAG 2.1 Level AA

The EAA itself doesn't tell you exactly which lines of code to write. It points instead to a harmonised European standard called **EN 301 549**, which spells out the technical accessibility requirements for digital products and services. EN 301 549 builds directly on the **Web Content Accessibility Guidelines (WCAG) 2.1 at conformance level AA**.

In practice: if your website, app, or document conforms to WCAG 2.1 AA, you are meeting the core technical requirements of the EAA. The newer **WCAG 2.2** (published October 2023) adds nine additional success criteria on top of 2.1 — meeting WCAG 2.2 AA gives you everything in 2.1 AA plus a buffer, so it remains a safe forward-compatible target.

### Common WCAG failures the EAA expects you to fix

- Insufficient colour contrast between text and background
- Images and icons missing meaningful alternative text
- Forms without programmatic labels or with unclear error messages
- Content that cannot be navigated or operated with a keyboard alone
- Pages where focus disappears or jumps unpredictably
- Headings and landmarks used for visual styling instead of structure
- Videos without captions or audio description
- PDFs and documents not tagged for screen readers
- Click targets that are too small or too close together (new in WCAG 2.2)

*Each item above will eventually link to a deeper how-to on the blog.*

---

## Section 6 — Compliance roadmap (5 steps)

**H2:** How to become EAA-compliant in 5 steps

Use a semantic `<ol>`. Numbers below are the rendered list numbers.

1. **Audit your current site against WCAG 2.1 AA.** Start with a baseline assessment of every public-facing page, flow, and document. An automated scanner like VexNexa catches the high-volume issues — contrast, alt text, labels, ARIA misuse — and a manual review with assistive technology covers what automation can't, such as cognitive load and keyboard logic on complex components.

2. **Prioritise critical and serious issues first.** Not every issue blocks a real user equally. Group your findings by severity and by user impact. A missing label on a checkout button blocks purchases for screen-reader users today, while a minor heading-order issue on a deep blog page can wait. Fix the blockers in the top user journeys first.

3. **Remediate in code, not with overlays.** Accessibility overlays — the floating widgets that promise instant compliance — do not bring a site into EAA conformance, and several have been the subject of public lawsuits. The only durable fix is to correct the underlying HTML, ARIA, and design. Build accessibility reviews into pull requests so regressions are caught before they ship.

4. **Set up continuous monitoring.** A site is never "done" with accessibility. Every release can introduce regressions, and content teams add new pages every week. Continuous monitoring runs scans on a schedule, alerts you when scores drop, and gives you a live picture of where things stand instead of a six-month-old PDF.

5. **Document compliance with timestamped reports.** Under the EAA you may be asked to demonstrate conformance — by an enforcement authority, by an enterprise customer in procurement, or by a public-sector tender. Keep dated audit reports, remediation logs, and a public accessibility statement. When the question comes, the answer should already be on file.

### CTA card at end of section

- **Title:** VexNexa automates steps 1, 4, and 5.
- **Body:** Run a scan today, schedule continuous monitoring, and export audit-ready reports — without writing a single internal tool.
- **CTA:** Start your free scan → `/auth/register`

---

## Section 7 — VexNexa as the solution

**H2:** How VexNexa supports EAA compliance

Three blocks, one sentence each.

1. **Continuous WCAG 2.2 monitoring** — Schedule scans daily, weekly, or after every deploy, and get email alerts the moment a regression appears. Link: "See how monitoring works" → `/eaa-compliance-monitoring`
2. **Audit-ready PDF and DOCX reports** — Export executive summaries, full technical reports, and remediation plans in branded formats your auditors and clients can sign off on. Link: "View a sample report" → `/sample-report`
3. **White-label for agencies** — Resell accessibility audits and ongoing monitoring under your own brand, with your logo, colours, and domain. Link: "Explore white-label" → `/white-label-accessibility-reports`

---

## Section 8 — FAQ

**H2:** Frequently asked questions about the EAA

10 Q&A pairs, Radix Accordion. The shape below is the source for the FAQPage JSON-LD.

**Q1. Does the EAA apply to me if my business isn't in the EU?**
Yes, if you offer products or services to consumers in the EU. The EAA applies based on where the customer is, not where you are headquartered. A US, UK, or Asian business selling to French or Dutch consumers is in scope.

**Q2. What's the difference between WCAG 2.1 and WCAG 2.2?**
WCAG 2.2 is the most recent version (published October 2023) and adds nine success criteria on top of 2.1. The EAA's harmonised standard, EN 301 549, currently references WCAG 2.1 AA as the technical baseline. Conforming to WCAG 2.2 AA satisfies WCAG 2.1 AA, so 2.2 is a safer forward-compatible target.

**Q3. Are PDFs and other documents covered?**
Yes. Documents distributed as part of a covered service — invoices, statements, terms, e-books, ticket confirmations — must meet the accessibility requirements. They need to be tagged for screen readers, have a logical reading order, and include meaningful alt text on images.

**Q4. What if I'm a microenterprise?**
Microenterprises providing services (fewer than 10 employees and an annual turnover or balance sheet total of €2 million or less) are exempt from the service obligations. The exemption does not apply to product manufacturers. Many exempt businesses still aim to conform, because their enterprise customers require it in procurement.

**Q5. Can a tool guarantee 100% compliance?**
No, and any vendor that promises this should be treated with caution. Automated scanning catches roughly 30–50% of WCAG issues — the deterministic ones like contrast, missing labels, and structural errors. The rest require manual review, real assistive-technology testing, and human judgement on context.

**Q6. How is the EAA different from the US ADA?**
The Americans with Disabilities Act is older, broader in some ways, and largely shaped by court rulings. The EAA is a single piece of EU legislation with a defined technical standard (EN 301 549, based on WCAG 2.1 AA) and named enforcement authorities in every member state. If you serve customers on both sides of the Atlantic, conforming to WCAG 2.2 AA covers most of both.

**Q7. What's the deadline for services that already exist?**
For self-service terminals already in use (such as ATMs and ticket machines), there is a transition period that runs until 28 June 2030. Service contracts agreed before 28 June 2025 may also continue under their existing terms until they end, but no later than 28 June 2030. After that date, everything in scope must be accessible.

**Q8. Where can I read the official directive?**
The full text is published on EUR-Lex as Directive (EU) 2019/882. Each member state also publishes its own national transposition law — for the Netherlands, the Implementatiewet toegankelijkheidsvoorschriften producten en diensten; for Germany, the Barrierefreiheitsstärkungsgesetz (BFSG); for France, the relevant articles in the Code de la consommation.

**Q9. Are mobile apps covered?**
Yes. Native iOS and Android apps for covered services — banking, e-commerce, ticketing, telecom — fall under the same requirements as websites. EN 301 549 has dedicated sections for non-web software and mobile.

**Q10. Do I need a public accessibility statement?**
A clear, public accessibility statement is strongly recommended and is required in some member states for certain service categories. It should describe the standard you target (WCAG 2.1 or 2.2 AA), known gaps, the date of the last assessment, and how users can report issues or request accessible alternatives.

---

## Section 9 — Final CTA block

Dark proof block — `var(--color-ink-900)` background, white text.

- **H2:** Audit your site against the EAA today.
- **Subhead:** Free scan, no credit card. Results in under 60 seconds.
- **CTA:** Start your free scan → `/auth/register`

---

## Open items I'm holding for you (no work happening on these yet)

1. **Branch.** The brief says branch from `feature/rebrand-2026`, but the only rebrand branch in the repo is `codex/rebrand-2026`, and Codex's hero work is **uncommitted** in the working tree (Hero.tsx, tokens.css, en.json, nl.json, badge/button variants, page.tsx). Three options: (a) wait for Codex to commit and rename, (b) branch from `codex/rebrand-2026` HEAD now (won't have Codex's uncommitted hero), (c) ask Codex to commit first, then I branch. I'll wait for your call before any `git checkout`.
2. **Navbar.** No "EAA" link exists today. Brief lists navbar as out of scope — leaving alone unless you say otherwise.
3. **JSON-LD.** No shared utility — existing pages inline the script. I'll do the same.
4. **`next-sitemap`.** Not configured. Nothing to update there.
