import Anthropic from "@anthropic-ai/sdk";
import { BlogPost } from "@prisma/client";
import crypto from "crypto";

const SUPPORTED_LOCALES = ["en", "nl", "de", "fr", "es", "pt"] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];

const CANONICAL_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.vexnexa.com";

interface LocaleContent {
  title: string;
  content_md: string; // Actually HTML but Claude will preserve it
}

interface FormatTranslateResponse {
  post_id: string;
  slug: string;
  alternates: Record<Locale, string>;
  locales: Record<Locale, LocaleContent>;
  warnings: string[];
}

interface FormattedBlogResult {
  alternates: Record<Locale, string>;
  locales: Record<
    Locale,
    {
      title: string;
      content: string; // HTML
      excerpt: string;
      metaTitle: string;
      metaDescription: string;
    }
  >;
  contentHash: string;
}

const SYSTEM_PROMPT = `You are a deterministic formatter and translator for VexNexa blog posts.

ABSOLUTE OUTPUT RULE
- You must ALWAYS return the final STRICT JSON result in your next message.
- Do NOT respond with "Ready", "Awaiting input", "status", "capabilities", or any handshake.
- Do NOT produce any intermediate status output.
- If input fields are missing, output best-effort JSON and add warnings in "warnings".

TASK (ONLY THESE)
1) Reformat the provided blog content for premium editorial readability (newspaper/magazine feel).
2) Translate into ALL supported_locales.
3) Localize INTERNAL VexNexa blog links per locale using Option A paths.
4) Produce locale alternates URLs for hreflang and internal backlinking.

HARD CONSTRAINTS
- Do NOT add new facts, claims, or sections.
- Do NOT remove meaning.
- Allowed micro-edits only: split long paragraphs, normalize punctuation, fix obvious typos, enforce heading hierarchy.
- Keep code blocks exactly as-is (do not translate inside code fences).
- Keep brand/product names unchanged: VexNexa, WCAG, axe-core, Vercel, etc.
- Keep images in place; translate only alt text.
- Output HTML for content (preserve all HTML tags).

EDITORIAL FORMATTING
- Exactly one H1 title at top (use existing_title if present).
- Use H2 for main sections and H3 for subsections; never skip levels.
- Break up walls of text into readable paragraphs.
- Lists only when helpful. Horizontal rules only for natural pauses.

URL STRATEGY (OPTION A)
- canonical_base_url: provided in input
- localized_path_pattern: /{locale}/blog/{slug}

INTERNAL LINK LOCALIZATION
- Internal link if it begins with canonical_base_url OR is relative starting with "/".
- Only localize blog links of form:
  /blog/<any-slug> OR {canonical_base_url}/blog/<any-slug>
  => /{locale}/blog/<any-slug> OR {canonical_base_url}/{locale}/blog/<any-slug>
- Preserve external links unchanged.
- Do NOT invent new links.

ALTERNATES
For each locale in supported_locales:
alternates[locale] = canonical_base_url + "/{locale}/blog/" + slug

OUTPUT (STRICT JSON ONLY)
Return ONLY one valid JSON object:
{
  "post_id": "...",
  "slug": "...",
  "alternates": { "<locale>": "<absolute-url>", ... },
  "locales": {
    "<locale>": { "title": "...", "content_md": "..." }
  },
  "warnings": []
}

VALIDATION
Before responding, validate:
- Response is a single JSON object
- Top-level keys: post_id, slug, alternates, locales, warnings
- locales includes exactly the supported_locales keys
If validation fails, fix it and output JSON only.`;

/**
 * Calculate SHA-256 hash of content for change detection
 */
export function calculateContentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf8").digest("hex");
}

/**
 * Format and translate a blog post using Claude AI
 */
export async function formatTranslateBlogPost(
  post: BlogPost
): Promise<FormattedBlogResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const anthropic = new Anthropic({ apiKey });

  // Prepare input payload for Claude
  const inputPayload = {
    post_id: post.id,
    slug: post.slug,
    canonical_base_url: CANONICAL_BASE_URL,
    canonical_path: `/blog/${post.slug}`,
    localized_path_pattern: "/{locale}/blog/{slug}",
    supported_locales: SUPPORTED_LOCALES,
    source_locale: "en", // Assume English is source
    existing_title: post.title,
    raw_content: post.content,
  };

  const userMessage = `INPUT PAYLOAD (PROVIDED BY SYSTEM)
${JSON.stringify(inputPayload, null, 2)}`;

  console.log("[AI Translation] Starting translation for post:", post.slug);

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      temperature: 0,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    // Extract text from response
    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    if (!responseText) {
      throw new Error("Empty response from Claude API");
    }

    // Strip any leading/trailing non-JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[AI Translation] Invalid response:", responseText);
      throw new Error("No valid JSON found in Claude response");
    }

    const cleanedJson = jsonMatch[0];
    const parsed: FormatTranslateResponse = JSON.parse(cleanedJson);

    // Validate response structure
    if (!parsed.post_id || !parsed.slug || !parsed.alternates || !parsed.locales) {
      throw new Error("Invalid response structure from Claude API");
    }

    // Validate all locales are present
    for (const locale of SUPPORTED_LOCALES) {
      if (!parsed.locales[locale]) {
        throw new Error(`Missing locale ${locale} in Claude response`);
      }
    }

    // Log warnings if any
    if (parsed.warnings && parsed.warnings.length > 0) {
      console.warn("[AI Translation] Warnings:", parsed.warnings);
    }

    // Transform to final result format
    const result: FormattedBlogResult = {
      alternates: parsed.alternates,
      locales: {} as any,
      contentHash: calculateContentHash(post.content),
    };

    // Process each locale
    for (const locale of SUPPORTED_LOCALES) {
      const localeData = parsed.locales[locale];

      // content_md is actually HTML (Claude preserves it)
      const htmlContent = localeData.content_md;

      // Extract excerpt from first paragraph (max 200 chars)
      const tempDiv = htmlContent.replace(/<[^>]*>/g, " ");
      const excerpt = tempDiv.substring(0, 200).trim() + "...";

      result.locales[locale] = {
        title: localeData.title,
        content: htmlContent,
        excerpt: excerpt,
        metaTitle: localeData.title,
        metaDescription: excerpt,
      };
    }

    console.log("[AI Translation] Successfully translated post:", post.slug);
    return result;
  } catch (error) {
    console.error("[AI Translation] Error:", error);
    throw new Error(
      `Failed to format/translate blog post: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
