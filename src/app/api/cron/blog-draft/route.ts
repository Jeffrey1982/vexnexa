import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withCronAuth } from "@/lib/cron-auth";
import { sendBlogDraftNotification } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Weekly blog cadence — one topic per run, drafted in EN + NL.
 *
 * Picks the first unused topic from the curated list below, has Gemini
 * write both language versions as `draft` BlogPosts, and emails the
 * founder a review link. Nothing is ever auto-published: the founder
 * edits and publishes from /admin/blog. Without GOOGLE_GEMINI_API_KEY
 * the cron degrades to a topic-of-the-week writing prompt by email.
 *
 * Topics are slug-stable so the "already used" check is deterministic.
 */
const TOPICS: Array<{
  slug: string;
  en: string;
  nl: string;
  angle: string;
}> = [
  {
    slug: "eaa-enforcement-2026-what-regulators-fine",
    en: "EAA enforcement in 2026: what EU regulators actually act on",
    nl: "EAA-handhaving in 2026: waar toezichthouders echt op handhaven",
    angle:
      "Practical overview of how EAA enforcement is playing out per EU country, what triggers complaints, realistic risk for SMEs and agency clients. No fear-mongering; cite that enforcement differs per member state and advise verifying with local counsel.",
  },
  {
    slug: "reselling-accessibility-monitoring-agency-guide",
    en: "How agencies resell accessibility monitoring as a recurring service",
    nl: "Zo verkoop je toegankelijkheidsmonitoring door als terugkerende dienst",
    angle:
      "Playbook for digital agencies: packaging white-label WCAG monitoring into a monthly retainer, pricing models, positioning to existing clients, delivering branded reports.",
  },
  {
    slug: "wcag-2-2-new-criteria-quick-wins",
    en: "The nine new WCAG 2.2 criteria and their quickest wins",
    nl: "De negen nieuwe WCAG 2.2-criteria en hun snelste quick wins",
    angle:
      "Walk through the success criteria added in WCAG 2.2, what each means in practice, and the lowest-effort fix per criterion.",
  },
  {
    slug: "accessibility-regressions-after-deploys",
    en: "Why accessibility regresses after every deploy — and the checklist that stops it",
    nl: "Waarom toegankelijkheid stukgaat bij elke deploy — en de checklist die dat stopt",
    angle:
      "CMS updates, new components, and content edits silently reintroduce WCAG issues. Concrete regression checklist plus the case for scheduled scans.",
  },
  {
    slug: "accessibility-overlays-vs-monitoring-eaa",
    en: "Accessibility overlays vs real monitoring: what the EAA actually requires",
    nl: "Toegankelijkheidsoverlays vs echte monitoring: wat de EAA werkelijk vereist",
    angle:
      "Honest comparison: what overlay widgets do and do not fix, why the accessibility community is critical of them, and what source-level fixing plus monitoring looks like.",
  },
  {
    slug: "pitching-accessibility-to-clients",
    en: "How to pitch accessibility monitoring to your clients (with pricing models)",
    nl: "Zo pitch je toegankelijkheidsmonitoring aan je klanten (met prijsmodellen)",
    angle:
      "Scripts and framing for agencies: the EAA hook, the regression argument, three retainer models, handling 'our site is fine' objections.",
  },
  {
    slug: "toegankelijkheidsverklaring-verplichtingen",
    en: "The accessibility statement: what businesses must publish under the EAA",
    nl: "De toegankelijkheidsverklaring: wat bedrijven onder de EAA moeten publiceren",
    angle:
      "What an accessibility statement is, who needs one, what it must contain, and how to keep it honest when the site is not fully conformant yet.",
  },
  {
    slug: "webshop-checkout-accessibility-issues",
    en: "Seven checkout accessibility issues that cost webshops revenue",
    nl: "Zeven toegankelijkheidsproblemen in de checkout die webshops omzet kosten",
    angle:
      "Concrete checkout failures (labels, error handling, timeouts, contrast, keyboard traps) with the revenue angle: these block real customers, not just audits.",
  },
  {
    slug: "automated-scans-vs-manual-audits-honest",
    en: "What automated accessibility scans catch — and what they honestly can't",
    nl: "Wat geautomatiseerde toegankelijkheidsscans vinden — en wat echt niet",
    angle:
      "Transparent piece: automated coverage of WCAG criteria, where manual review is irreplaceable, and how to combine both. Builds trust by being honest about limits.",
  },
  {
    slug: "accessibility-kpis-monthly-client-reports",
    en: "Accessibility KPIs agencies should report to clients every month",
    nl: "Toegankelijkheids-KPI's die bureaus maandelijks aan klanten zouden moeten rapporteren",
    angle:
      "Which numbers matter (score trend, criticals, regressions caught, time-to-fix), which vanity metrics to skip, and how a monthly report keeps the retainer alive.",
  },
  {
    slug: "eaa-micro-enterprise-exemption-explained",
    en: "Is your client exempt from the EAA? The micro-enterprise rules explained",
    nl: "Valt je klant buiten de EAA? De micro-onderneming-regels uitgelegd",
    angle:
      "The under-10-staff / under-2M-turnover service exemption, what it does not cover (products), and why exempt businesses still benefit from accessibility.",
  },
  {
    slug: "alt-text-that-actually-works",
    en: "Alt text that actually works: rules, examples, and edge cases",
    nl: "Alt-teksten die echt werken: regels, voorbeelden en randgevallen",
    angle:
      "Practical alt-text guide: decorative vs informative images, icons and buttons, charts, product photos in webshops. Before/after examples.",
  },
];

type DraftPayload = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  html: string;
};

function buildPrompt(topic: (typeof TOPICS)[number], locale: "en" | "nl"): string {
  const language = locale === "nl" ? "Dutch (informal 'je')" : "English";
  const title = locale === "nl" ? topic.nl : topic.en;
  return `You are the content writer for VexNexa, a WCAG 2.2 accessibility scanner with white-label reports, built in the Netherlands. Primary audience: digital agencies in the EU (especially the Netherlands) that manage multiple client websites.

Write a blog post in ${language} with the working title: "${title}".
Angle: ${topic.angle}

Rules:
- 900–1200 words, practical and concrete, no fluff or hype.
- NEVER claim tools guarantee legal compliance. When relevant, note that automated scans cover part of WCAG and manual review may be needed, and that legal questions belong with a lawyer.
- Structure: short intro (no heading), then 4–6 sections with <h2> headings, use <p>, <ul>/<li>, <strong> only. No <h1>, no inline styles, no images, no scripts.
- Where natural (max twice), link to https://vexnexa.com/free-scan (free scan, no account) or https://vexnexa.com/pilot-partner-program (agency pilot: 3 months of the Agency plan for the Pro price) using normal <a href> tags.
- End with a short practical takeaway section.

Return ONLY a JSON object (no markdown fences) with exactly these keys:
{"title": "...", "metaTitle": "max 60 chars", "metaDescription": "max 155 chars", "excerpt": "1-2 sentence teaser", "html": "<p>...</p><h2>...</h2>..."}`;
}

function parseDraft(raw: string): DraftPayload {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) text = fence[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  const parsed = JSON.parse(text.slice(start, end + 1));
  for (const key of ["title", "metaTitle", "metaDescription", "excerpt", "html"]) {
    if (typeof parsed[key] !== "string" || !parsed[key].trim()) {
      throw new Error(`Model response missing "${key}"`);
    }
  }
  return parsed as DraftPayload;
}

async function generateDraft(
  topic: (typeof TOPICS)[number],
  locale: "en" | "nl"
): Promise<DraftPayload> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(buildPrompt(topic, locale));
  return parseDraft(result.response.text());
}

async function handler(_request: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://vexnexa.com";
  const editUrl = `${appUrl}/admin/blog`;

  // First topic whose slug has no post yet (any locale, drafts included)
  const existing = await prisma.blogPost.findMany({
    where: { slug: { in: TOPICS.map((t) => t.slug) } },
    select: { slug: true },
  });
  const usedSlugs = new Set(existing.map((p) => p.slug));
  const topic = TOPICS.find((t) => !usedSlugs.has(t.slug));

  if (!topic) {
    await sendBlogDraftNotification({
      mode: "exhausted",
      editUrl,
    });
    return NextResponse.json({ ok: true, mode: "exhausted" });
  }

  if (!process.env.GOOGLE_GEMINI_API_KEY) {
    await sendBlogDraftNotification({
      mode: "manual",
      topicEn: topic.en,
      topicNl: topic.nl,
      angle: topic.angle,
      slug: topic.slug,
      editUrl,
    });
    return NextResponse.json({ ok: true, mode: "manual", slug: topic.slug });
  }

  const author = await prisma.user.findFirst({
    where: { isAdmin: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!author) {
    await sendBlogDraftNotification({
      mode: "error",
      slug: topic.slug,
      editUrl,
      error: "No admin user found to own the draft posts.",
    });
    return NextResponse.json({ ok: false, error: "no admin user" }, { status: 500 });
  }

  try {
    const [en, nl] = [await generateDraft(topic, "en"), await generateDraft(topic, "nl")];

    for (const [locale, draft] of [["en", en], ["nl", nl]] as const) {
      await prisma.blogPost.create({
        data: {
          title: draft.title,
          slug: topic.slug,
          locale,
          content: draft.html,
          excerpt: draft.excerpt,
          metaTitle: draft.metaTitle.slice(0, 70),
          metaDescription: draft.metaDescription.slice(0, 170),
          category: "Accessibility",
          tags: ["wcag", "eaa", "agencies"],
          status: "draft",
          authorId: author.id,
          authorName: "VexNexa",
        },
      });
    }

    await sendBlogDraftNotification({
      mode: "drafted",
      topicEn: en.title,
      topicNl: nl.title,
      slug: topic.slug,
      editUrl,
    });

    console.log("[blog-draft] Drafted:", topic.slug);
    return NextResponse.json({ ok: true, mode: "drafted", slug: topic.slug });
  } catch (error: any) {
    console.error("[blog-draft] Failed:", error);
    await sendBlogDraftNotification({
      mode: "error",
      topicEn: topic.en,
      slug: topic.slug,
      editUrl,
      error: error?.message || String(error),
    }).catch(() => undefined);
    return NextResponse.json({ ok: false, error: error?.message }, { status: 500 });
  }
}

export const GET = withCronAuth(handler);
export const POST = withCronAuth(handler);
