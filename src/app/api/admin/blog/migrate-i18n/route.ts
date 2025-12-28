import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatTranslateBlogPost, calculateContentHash } from "@/lib/ai/formatTranslateBlogPost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for batch processing

/**
 * POST /api/admin/blog/migrate-i18n
 * Batch migrate all published blog posts to localized versions
 * Requires ADMIN_TOKEN header
 */
export async function POST(req: Request) {
  try {
    // Verify admin token
    const adminToken = req.headers.get("x-admin-token");
    const expectedToken = process.env.ADMIN_TOKEN;

    if (!expectedToken || adminToken !== expectedToken) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized - Invalid admin token" },
        { status: 403 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { ok: false, error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    console.log("[i18n Migration] Starting batch migration...");

    // Fetch all published posts
    const posts = await prisma.blogPost.findMany({
      where: { status: "published" },
      orderBy: { publishedAt: "desc" },
    });

    console.log(`[i18n Migration] Found ${posts.length} published posts`);

    const results = {
      total: posts.length,
      processed: 0,
      skipped: 0,
      failed: 0,
      failedIds: [] as string[],
    };

    for (const post of posts) {
      try {
        // Check if localization is needed
        const currentHash = calculateContentHash(post.content);
        const existingLocales = await prisma.blogPostLocale.count({
          where: { postId: post.id },
        });

        // Skip if already localized with matching hash
        if (existingLocales >= 6 && post.contentHash === currentHash) {
          console.log(`[i18n Migration] Skipping ${post.slug} - already localized`);
          results.skipped++;
          continue;
        }

        console.log(`[i18n Migration] Processing ${post.slug}...`);

        // Format and translate
        const formattedResult = await formatTranslateBlogPost(post);

        // Upsert localized content for all locales
        const upsertPromises = Object.entries(formattedResult.locales).map(
          ([locale, localeData]) =>
            prisma.blogPostLocale.upsert({
              where: {
                postId_locale: {
                  postId: post.id,
                  locale: locale,
                },
              },
              create: {
                postId: post.id,
                locale: locale,
                title: localeData.title,
                content: localeData.content,
                excerpt: localeData.excerpt,
                metaTitle: localeData.metaTitle,
                metaDescription: localeData.metaDescription,
              },
              update: {
                title: localeData.title,
                content: localeData.content,
                excerpt: localeData.excerpt,
                metaTitle: localeData.metaTitle,
                metaDescription: localeData.metaDescription,
              },
            })
        );

        await Promise.all(upsertPromises);

        // Update post with hash and timestamp
        await prisma.blogPost.update({
          where: { id: post.id },
          data: {
            contentHash: formattedResult.contentHash,
            localizedAt: new Date(),
          },
        });

        results.processed++;
        console.log(`[i18n Migration] Completed ${post.slug}`);

        // Add small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`[i18n Migration] Failed to process ${post.slug}:`, error);
        results.failed++;
        results.failedIds.push(post.id);
      }
    }

    console.log("[i18n Migration] Migration complete:", results);

    return NextResponse.json({
      ok: true,
      results,
    });
  } catch (e: any) {
    console.error("[i18n Migration] Migration failed:", e);
    return NextResponse.json(
      {
        ok: false,
        error: e.message || "Migration failed",
      },
      { status: 500 }
    );
  }
}
