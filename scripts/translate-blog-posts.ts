/**
 * Blog Post Translation Script
 *
 * This script helps translate existing blog posts into all supported languages.
 * It uses the Anthropic Claude API to translate content while preserving formatting.
 *
 * Usage:
 *   1. Make sure you have ANTHROPIC_API_KEY in your .env file
 *   2. Run: npx tsx scripts/translate-blog-posts.ts
 *
 * The script will:
 *   - Fetch all published blog posts in English
 *   - Translate them to nl, fr, es, pt
 *   - Create new blog post entries with language-specific slugs
 *   - Preserve all formatting, metadata, and structure
 */

import { PrismaClient } from '@prisma/client';
import Anthropic from '@anthropic-ai/sdk';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SUPPORTED_LOCALES = ['nl', 'fr', 'es', 'pt'] as const;

const LOCALE_NAMES: Record<string, string> = {
  nl: 'Dutch',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
};

interface TranslationResult {
  title: string;
  content: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
}

async function translateContent(
  text: string,
  targetLanguage: string,
  context: string
): Promise<string> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Translate the following ${context} from English to ${LOCALE_NAMES[targetLanguage]}.

Preserve all HTML tags, markdown formatting, and structure exactly as they appear. Only translate the actual text content, not HTML/markdown syntax.

Text to translate:
${text}

Provide ONLY the translated text without any additional comments or explanations.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === 'text') {
    return content.text.trim();
  }
  throw new Error('Unexpected response format from Claude');
}

async function translateBlogPost(
  post: any,
  targetLocale: string
): Promise<TranslationResult> {
  console.log(`  Translating to ${LOCALE_NAMES[targetLocale]}...`);

  const [title, content, excerpt, metaTitle, metaDescription, category] =
    await Promise.all([
      translateContent(post.title, targetLocale, 'blog post title'),
      translateContent(post.content, targetLocale, 'blog post content'),
      post.excerpt
        ? translateContent(post.excerpt, targetLocale, 'blog post excerpt')
        : '',
      post.metaTitle
        ? translateContent(post.metaTitle, targetLocale, 'meta title')
        : '',
      post.metaDescription
        ? translateContent(
            post.metaDescription,
            targetLocale,
            'meta description'
          )
        : '',
      translateContent(post.category, targetLocale, 'category name'),
    ]);

  return {
    title,
    content,
    excerpt,
    metaTitle,
    metaDescription,
    category,
  };
}

async function main() {
  console.log('Starting blog post translation...\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY not found in environment variables');
    console.error('Please add it to your .env file');
    process.exit(1);
  }

  // Fetch all English blog posts
  const englishPosts = await prisma.blogPost.findMany({
    where: {
      locale: 'en',
      status: 'published',
    },
    include: {
      author: true,
    },
  });

  console.log(`Found ${englishPosts.length} English blog posts to translate\n`);

  for (const post of englishPosts) {
    console.log(`Processing: "${post.title}"`);

    // Extract base slug (remove -en suffix if present)
    let baseSlug = post.slug;
    if (baseSlug.endsWith('-en')) {
      baseSlug = baseSlug.slice(0, -3);
    }

    for (const targetLocale of SUPPORTED_LOCALES) {
      try {
        // Check if translation already exists
        const existingTranslation = await prisma.blogPost.findUnique({
          where: {
            slug_locale: {
              slug: `${baseSlug}-${targetLocale}`,
              locale: targetLocale,
            },
          },
        });

        if (existingTranslation) {
          console.log(
            `  ${LOCALE_NAMES[targetLocale]} translation already exists, skipping...`
          );
          continue;
        }

        // Translate the content
        const translated = await translateBlogPost(post, targetLocale);

        // Create new blog post entry
        await prisma.blogPost.create({
          data: {
            title: translated.title,
            slug: `${baseSlug}-${targetLocale}`,
            content: translated.content,
            excerpt: translated.excerpt || null,
            coverImage: post.coverImage,
            locale: targetLocale,
            metaTitle: translated.metaTitle || null,
            metaDescription: translated.metaDescription || null,
            metaKeywords: post.metaKeywords,
            category: translated.category,
            tags: post.tags,
            status: post.status,
            publishedAt: post.publishedAt,
            authorId: post.authorId,
            authorName: post.authorName,
            views: 0,
          },
        });

        console.log(
          `  ✓ Successfully created ${LOCALE_NAMES[targetLocale]} translation`
        );

        // Add a small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(
          `  ✗ Error translating to ${LOCALE_NAMES[targetLocale]}:`,
          error
        );
      }
    }

    console.log('');
  }

  console.log('Translation complete!');
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Fatal error:', error);
  prisma.$disconnect();
  process.exit(1);
});
