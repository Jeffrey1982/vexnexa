/**
 * CMS blog translation workflow.
 *
 * Usage:
 *   OPENAI_API_KEY=... npx tsx scripts/translate-blog-posts.ts
 *
 * Optional:
 *   SOURCE_LOCALE=nl TARGET_LOCALES=en,fr,es,pt npx tsx scripts/translate-blog-posts.ts
 *
 * The script groups published BlogPost records by base slug, picks the
 * original version (Dutch first, otherwise earliest publication), translates
 * title/content/excerpt/meta description/category, and upserts one CMS record
 * per target locale while preserving author, dates, tags, keywords and cover.
 */

import { PrismaClient } from "@prisma/client";
import { config } from "dotenv";

config();

const prisma = new PrismaClient();

const DEFAULT_TARGET_LOCALES = ["nl", "en", "fr", "es", "pt"] as const;
const LOCALE_NAMES: Record<string, string> = {
  nl: "Dutch",
  en: "English",
  fr: "French",
  es: "Spanish",
  pt: "Portuguese",
};

type BlogLocale = (typeof DEFAULT_TARGET_LOCALES)[number];

interface TranslationResult {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
}

function getBaseSlug(slug: string): string {
  return slug.replace(/-(en|nl|fr|es|pt|de)$/i, "");
}

function getStoredSlug(baseSlug: string, locale: string) {
  return `${baseSlug}-${locale}`;
}

function getTargetLocales() {
  const configured = process.env.TARGET_LOCALES?.split(",").map((locale) => locale.trim()).filter(Boolean);
  const locales = configured?.length ? configured : [...DEFAULT_TARGET_LOCALES];
  return locales.filter((locale): locale is BlogLocale => locale in LOCALE_NAMES);
}

function pickOriginalPost(posts: any[]) {
  const sourceLocale = process.env.SOURCE_LOCALE;
  if (sourceLocale) {
    const configured = posts.find((post) => post.locale === sourceLocale);
    if (configured) return configured;
  }

  const dutch = posts.find((post) => post.locale === "nl");
  if (dutch) return dutch;

  return [...posts].sort((a, b) => {
    const aDate = a.publishedAt || a.createdAt || new Date(0);
    const bDate = b.publishedAt || b.createdAt || new Date(0);
    return aDate.getTime() - bDate.getTime();
  })[0];
}

async function translateText(text: string, sourceLocale: string, targetLocale: string, context: string) {
  if (!text || sourceLocale === targetLocale) return text;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to generate missing blog translations.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.BLOG_TRANSLATION_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            "You are a professional SaaS localization editor. Translate only user-visible text. Preserve HTML tags, Markdown syntax, links, code snippets, heading levels, and list structure exactly.",
        },
        {
          role: "user",
          content: [
            `Translate this ${context} from ${LOCALE_NAMES[sourceLocale] || sourceLocale} to ${LOCALE_NAMES[targetLocale] || targetLocale}.`,
            "Return only the translated text, without comments or wrappers.",
            "",
            text,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Translation request failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  const translated = data?.choices?.[0]?.message?.content;
  if (typeof translated !== "string" || !translated.trim()) {
    throw new Error("Translation response did not contain text content.");
  }

  return translated.trim();
}

async function translatePost(post: any, targetLocale: string): Promise<TranslationResult> {
  const sourceLocale = post.locale || "en";

  const [title, content, excerpt, metaTitle, metaDescription, category] = await Promise.all([
    translateText(post.title, sourceLocale, targetLocale, "blog title"),
    translateText(post.content, sourceLocale, targetLocale, "HTML blog article"),
    translateText(post.excerpt || "", sourceLocale, targetLocale, "blog excerpt"),
    translateText(post.metaTitle || post.title, sourceLocale, targetLocale, "SEO title"),
    translateText(post.metaDescription || post.excerpt || "", sourceLocale, targetLocale, "SEO meta description"),
    translateText(post.category, sourceLocale, targetLocale, "blog category"),
  ]);

  return { title, content, excerpt, metaTitle, metaDescription, category };
}

async function main() {
  const targetLocales = getTargetLocales();
  const posts = await prisma.blogPost.findMany({
    where: { status: "published" },
    orderBy: [{ publishedAt: "asc" }, { createdAt: "asc" }],
  });

  const groups = new Map<string, any[]>();
  for (const post of posts) {
    const baseSlug = getBaseSlug(post.slug);
    groups.set(baseSlug, [...(groups.get(baseSlug) || []), post]);
  }

  console.log(`Found ${groups.size} published blog article group(s).`);

  for (const [baseSlug, versions] of groups) {
    const original = pickOriginalPost(versions);
    if (!original) continue;

    console.log(`\nProcessing "${original.title}" (${original.locale}) -> ${baseSlug}`);

    for (const targetLocale of targetLocales) {
      const existing = versions.find((post) => post.locale === targetLocale);
      if (existing) {
        console.log(`  ${targetLocale}: exists, skipping`);
        continue;
      }

      const translated = await translatePost(original, targetLocale);
      const slug = getStoredSlug(baseSlug, targetLocale);

      await prisma.blogPost.create({
        data: {
          title: translated.title,
          slug,
          content: translated.content,
          excerpt: translated.excerpt || null,
          coverImage: original.coverImage,
          locale: targetLocale,
          metaTitle: translated.metaTitle || translated.title,
          metaDescription: translated.metaDescription || translated.excerpt || null,
          metaKeywords: original.metaKeywords,
          category: translated.category,
          tags: original.tags,
          status: original.status,
          publishedAt: original.publishedAt,
          authorId: original.authorId,
          authorName: original.authorName,
          views: 0,
        },
      });

      console.log(`  ${targetLocale}: created ${slug}`);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
