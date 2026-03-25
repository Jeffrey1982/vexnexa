/**
 * Seed script to insert the EAA Guide blog post into the database.
 *
 * Usage:
 *   node scripts/seed-blog-eaa-guide.cjs
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SLUG = 'what-is-the-european-accessibility-act';
const LOCALE = 'en';

const TITLE = 'What Is the European Accessibility Act (EAA)? And Why Your Agency Should Care';

const EXCERPT =
  'If you build websites for clients in the EU, the European Accessibility Act already applies to them — and to you. Here\'s what it means, what\'s at stake, and what to do about it.';

const META_TITLE = 'What Is the European Accessibility Act (EAA)? A Guide for Agencies | VexNexa';
const META_DESCRIPTION =
  'The European Accessibility Act is already in force. If you build websites for EU clients, here\'s what the EAA means for your agency, your clients, and your workflow.';

const META_KEYWORDS = [
  'European Accessibility Act',
  'EAA',
  'WCAG',
  'accessibility agencies',
  'EAA compliance',
  'web accessibility EU',
  'EU accessibility law',
  'digital accessibility',
  'agency compliance',
];

const TAGS = [
  'EAA',
  'European Accessibility Act',
  'WCAG',
  'accessibility',
  'agencies',
  'compliance',
  'Guide',
];

const CATEGORY = 'Guide';

const CONTENT = `
<p>A client calls you. They received a complaint about the accessibility of their webshop. They want to know: are we compliant? You don't actually know. You built their site, you maintain it, but you've never done a structured accessibility check. You're not even sure what the legal requirements are.</p>

<p>This is the reality for most web agencies in Europe right now. And it's about to get uncomfortable.</p>

<h2>What is the European Accessibility Act?</h2>

<p>The European Accessibility Act (EAA) is an EU directive that requires a wide range of digital products and services to be accessible to people with disabilities. It became law across all EU member states on 28 June 2025.</p>

<p>Unlike earlier rules that only applied to government websites, the EAA extends to private companies. If your client runs an e-commerce site, a banking app, a travel booking platform, or any consumer-facing digital service — and they operate in the EU — they fall under this law.</p>

<p>The EAA is based on the EN 301 549 standard, which aligns closely with WCAG 2.1 Level AA. If you're already working with WCAG, you're on the right track. If you're not, you have ground to cover.</p>

<h3>Who does the EAA apply to?</h3>

<p>The scope is broader than most agencies realise:</p>

<ul>
  <li><strong>Any business selling products or services to EU consumers</strong>, regardless of where that business is headquartered. A US or UK company with no physical EU presence still has to comply if they serve EU customers digitally.</li>
  <li><strong>E-commerce websites and mobile apps</strong> — from product pages to checkout flows.</li>
  <li><strong>Banking and financial services</strong> — online banking, payment terminals, ATMs.</li>
  <li><strong>Transport services</strong> — ticketing websites, travel booking platforms.</li>
  <li><strong>Audiovisual media services</strong> — streaming platforms, e-book readers.</li>
  <li><strong>Telecommunications</strong> — messaging apps, call services.</li>
</ul>

<p>There is one exemption: micro-enterprises with fewer than 10 employees and under €2 million annual turnover are not required to comply. But most agency clients are well above that threshold.</p>

<h3>What does "accessible" actually mean under the EAA?</h3>

<p>The EAA requires products and services to be Perceivable, Operable, Understandable, and Robust — the four POUR principles that underpin WCAG. In practice, this means:</p>

<ul>
  <li>Screen readers can navigate the site and convey content meaningfully</li>
  <li>All interactive elements are operable with a keyboard</li>
  <li>Colour contrast meets minimum ratios for readability</li>
  <li>Forms have proper labels, not just placeholders</li>
  <li>Error messages are clear and associated with the correct fields</li>
  <li>Media has captions or transcripts</li>
  <li>The site works with assistive technologies like magnifiers and voice control</li>
</ul>

<p>The EAA does not prescribe a specific WCAG version or conformance level in the directive text itself. Instead, each member state references the harmonised European standard EN 301 549, which currently maps to WCAG 2.1 AA. Some member states may go further.</p>

<h2>Why this matters for agencies specifically</h2>

<p>If you're reading this as an agency owner, project manager, or developer, here's why the EAA is your problem too — not just your client's.</p>

<h3>You're part of the delivery chain</h3>

<p>When a client's website fails an accessibility audit or receives a complaint, the first question they ask is: "Didn't the agency build this?" Even if accessibility wasn't in the original brief, the expectation is shifting. Agencies that build and maintain websites are increasingly seen as responsible for the accessibility of what they deliver.</p>

<p>This doesn't mean you're legally liable in the same way your client is. But it does mean:</p>

<ul>
  <li>Clients will come to you to fix problems — often urgently and without extra budget</li>
  <li>Procurement processes will start requiring accessibility credentials</li>
  <li>Your reputation is tied to the quality of what you ship</li>
</ul>

<h3>Your clients don't know they're in scope</h3>

<p>Most small and medium businesses in the EU have never heard of the EAA. They don't know their website needs to meet accessibility standards. They're going to find out — through a complaint, a competitor who got it right, or an agency (you?) that proactively tells them.</p>

<p>This is an opportunity, not just a risk. The agency that brings the problem *and* the solution wins the trust.</p>

<h3>Accessibility is becoming a recurring service</h3>

<p>One-off audits don't work. Websites change constantly — new content, new features, redesigns, CMS updates. Each change can introduce accessibility regressions. Clients need ongoing monitoring, not a one-time report that goes stale the next week.</p>

<p>For agencies, this means accessibility can be a monthly retainer service: regular scans, branded reports, and periodic remediation. It's a revenue stream that aligns with something you should be doing anyway.</p>

<h2>The four pain points agencies face right now</h2>

<h3>1. "My client asks about accessibility and I have no answer"</h3>

<p>You don't have a repeatable process. Every accessibility question turns into an ad-hoc scramble. You google WCAG, run a free Lighthouse check, and deliver a vague summary. It doesn't inspire confidence — and it certainly doesn't meet the EAA's expectation of structured oversight.</p>

<p><strong>What you need:</strong> A tool that scans any client site against WCAG 2.2, produces a severity-ranked report, and gives you clear remediation guidance. Something you can run in 5 minutes and present to a client within the hour.</p>

<h3>2. "A one-time audit is outdated as soon as we deploy"</h3>

<p>You spent two weeks fixing 30 issues. A month later, a CMS update, a new marketing page, or a redesigned checkout flow reintroduced 12 of them. Without monitoring, nobody notices until the next complaint.</p>

<p><strong>What you need:</strong> Scheduled recurring scans — weekly or monthly — that alert you when scores drop or new critical issues appear. Continuous monitoring turns accessibility from a project into a process.</p>

<h3>3. "I want to offer accessibility as a service but the tools are too expensive or complex"</h3>

<p>Enterprise accessibility platforms cost thousands per month. They're built for internal compliance teams at Fortune 500 companies, not for a 15-person agency managing 20 client sites. And free tools don't give you multi-site management, branded reports, or monitoring.</p>

<p><strong>What you need:</strong> A tool built for agency workflows: <a href="/features">multi-site dashboard</a>, <a href="/white-label-accessibility-reports">white-label reports with your logo</a>, scheduled scans, and <a href="/pricing">pricing that doesn't require enterprise budget</a>. Something you can resell as a service to your clients.</p>

<h3>4. "An overlay widget will fix it, right?"</h3>

<p>No. Accessibility overlay widgets inject JavaScript that modifies the visual presentation of your site — larger text, higher contrast, different fonts. While these features can help some users, they do not fix the underlying code issues. Missing alt text stays missing. Unlabelled forms stay unlabelled. Keyboard traps stay trapped.</p>

<p>Overlays do not meet the EAA's requirements. The law expects the product itself to be accessible, not a bolt-on layer that covers up problems. Multiple lawsuits in the US have explicitly named overlay users as defendants.</p>

<h2>What agencies should do now</h2>

<h3>Step 1: Scan your own website</h3>

<p>Before you advise clients, check your own house. <a href="/auth/register">Run a WCAG scan</a> on your agency's site. It's a sobering exercise — and it gives you first-hand experience with the process you'll recommend to clients.</p>

<h3>Step 2: Scan your top 3 clients</h3>

<p>Pick the three client sites most likely to be in EAA scope — e-commerce, financial services, or any site that serves EU consumers. Run a scan. You'll have a concrete conversation starter: "We found 14 accessibility issues on your site, 3 of them critical. Here's what they mean and how to fix them."</p>

<h3>Step 3: Build a repeatable workflow</h3>

<p>Accessibility isn't a one-time deliverable. Build a workflow you can repeat:</p>

<ol>
  <li><strong>Scan</strong> a client site and generate a severity-ranked report</li>
  <li><strong>Prioritise</strong> — fix critical and serious issues first</li>
  <li><strong>Report</strong> — deliver a branded PDF or DOCX to the client</li>
  <li><strong>Monitor</strong> — schedule recurring scans to catch regressions</li>
  <li><strong>Repeat</strong> — deliver monthly progress reports</li>
</ol>

<p>This is a service. You can charge for it. Your clients need it. And the EAA makes it non-optional.</p>

<h3>Step 4: Educate your clients</h3>

<p>Don't wait for clients to ask. Send them a short email explaining what the EAA means for their website. Attach the scan results. Position yourself as the agency that's ahead of the curve — not the one scrambling to react after a complaint.</p>

<h2>Penalties and enforcement: what happens if you ignore the EAA?</h2>

<p>Each EU member state is responsible for enforcement, and the specifics vary. But the general framework includes:</p>

<ul>
  <li><strong>Market surveillance authorities</strong> that can investigate complaints</li>
  <li><strong>Corrective action orders</strong> requiring non-compliant products and services to be fixed</li>
  <li><strong>Fines</strong> — amounts vary by country, but some member states have set significant penalties</li>
  <li><strong>Restriction of market access</strong> — in severe cases, products or services can be pulled from the market</li>
</ul>

<p>Italy began enforcement early, in November 2023, for large companies already subject to accessibility requirements. Other member states followed with the June 2025 enforcement date.</p>

<p>The practical risk for most businesses isn't a fine — it's a complaint. A single user who can't complete a purchase, read a form, or navigate a website can trigger a formal complaint process. And once that happens, the question isn't "are you aware of the EAA?" but "what have you been doing about it?"</p>

<p>This is where ongoing monitoring matters. An organisation that can show regular scans, documented improvements, and a clear remediation process is in a fundamentally different position than one that has nothing to show.</p>

<h2>The EAA is not going away</h2>

<p>The European Accessibility Act is not a trend. It's not a temporary regulation that might be rolled back. It's a directive that 27 EU member states have transposed into national law, backed by enforcement mechanisms that are being activated right now.</p>

<p>For agencies, this is the moment to decide: are you going to wait for clients to complain, or are you going to lead with a solution?</p>

<p>The agencies that move now will:</p>

<ul>
  <li>Win trust by bringing the problem *and* the answer</li>
  <li>Build a new recurring revenue stream around accessibility monitoring</li>
  <li>Protect their clients from legal exposure</li>
  <li>Differentiate themselves from competitors who are still ignoring accessibility</li>
</ul>

<p>The agencies that wait will be fixing problems under pressure, without budget, and without the client's trust.</p>

<hr />

<h2>Take the Next Step</h2>

<p><em>VexNexa is a white-label WCAG monitoring tool built specifically for agencies and EU-facing teams. Scan any client site, generate branded reports, and set up continuous monitoring — from one dashboard.</em></p>

<ul>
  <li><a href="/auth/register">Start your free scan</a></li>
  <li><a href="/sample-report">View sample report</a></li>
  <li><a href="/pilot-partner-program">Learn about the Pilot Partner Program</a></li>
</ul>
`;

async function main() {
  // Find an admin user to use as author
  const admin = await prisma.user.findFirst({
    where: {
      email: { in: ['jeffrey.aay@gmail.com', 'admin@vexnexa.com'] },
    },
    select: { id: true, email: true },
  });

  if (!admin) {
    console.error('No admin user found. Cannot create blog post without an author.');
    process.exit(1);
  }

  // Check if post already exists
  const existing = await prisma.blogPost.findFirst({
    where: { slug: SLUG, locale: LOCALE },
  });

  if (existing) {
    console.log(`Blog post "${SLUG}" already exists (id: ${existing.id}). Updating...`);
    await prisma.blogPost.update({
      where: { id: existing.id },
      data: {
        title: TITLE,
        content: CONTENT,
        excerpt: EXCERPT,
        metaTitle: META_TITLE,
        metaDescription: META_DESCRIPTION,
        metaKeywords: META_KEYWORDS,
        category: CATEGORY,
        tags: TAGS,
        status: 'published',
        publishedAt: new Date('2026-03-25T10:00:00Z'),
        authorName: 'Jeffrey',
      },
    });
    console.log('Blog post updated successfully.');
  } else {
    const post = await prisma.blogPost.create({
      data: {
        title: TITLE,
        slug: SLUG,
        locale: LOCALE,
        content: CONTENT,
        excerpt: EXCERPT,
        metaTitle: META_TITLE,
        metaDescription: META_DESCRIPTION,
        metaKeywords: META_KEYWORDS,
        category: CATEGORY,
        tags: TAGS,
        status: 'published',
        publishedAt: new Date('2026-03-25T10:00:00Z'),
        authorId: admin.id,
        authorName: 'Jeffrey',
      },
    });
    console.log(`Blog post created successfully (id: ${post.id}).`);
    console.log(`URL: https://www.vexnexa.com/blog/${SLUG}`);
  }
}

main()
  .catch((e) => {
    console.error('Failed to seed blog post:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
