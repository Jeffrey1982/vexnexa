import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/blog/[slug] - Get a single blog post
export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const { searchParams } = new URL(req.url);
    const isAdmin = searchParams.get("admin") === "true";

    let where: any = { slug: slug };

    if (!isAdmin) {
      where.status = "published";
    }

    const post = await prisma.blogPost.findFirst({
      where,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { ok: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // Increment view count (only for published posts viewed publicly)
    if (!isAdmin && post.status === "published") {
      await prisma.blogPost.update({
        where: { id: post.id },
        data: { views: { increment: 1 } }
      });
    }

    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    console.error("Failed to fetch blog post:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to fetch blog post" },
      { status: 500 }
    );
  }
}

// PATCH /api/blog/[slug] - Update a blog post (admin only)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const user = await requireAuth();

    // Check if user is admin by email
    const adminEmails = [
      'jeffrey.aay@gmail.com',
      'admin@vexnexa.com'
    ];

    if (!adminEmails.includes(user.email)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const {
      title,
      slug: newSlug,
      content,
      excerpt,
      coverImage,
      metaTitle,
      metaDescription,
      metaKeywords,
      category,
      tags,
      status,
      authorName
    } = body;

    const existing = await prisma.blogPost.findUnique({
      where: { slug: slug }
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    // If slug is changing, check new slug doesn't exist
    if (newSlug && newSlug !== slug) {
      const slugExists = await prisma.blogPost.findUnique({
        where: { slug: newSlug }
      });
      if (slugExists) {
        return NextResponse.json(
          { ok: false, error: "A post with this slug already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (newSlug) updateData.slug = newSlug;
    if (content) updateData.content = content;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (metaTitle !== undefined) updateData.metaTitle = metaTitle;
    if (metaDescription !== undefined) updateData.metaDescription = metaDescription;
    if (metaKeywords !== undefined) updateData.metaKeywords = metaKeywords;
    if (category) updateData.category = category;
    if (tags !== undefined) updateData.tags = tags;
    if (authorName !== undefined) updateData.authorName = authorName || null;
    if (status) {
      updateData.status = status;
      // Auto-set publishedAt when publishing
      if (status === "published" && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const post = await prisma.blogPost.update({
      where: { slug: slug },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return NextResponse.json({ ok: true, post });
  } catch (e: any) {
    console.error("Failed to update blog post:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to update blog post" },
      { status: 500 }
    );
  }
}

// DELETE /api/blog/[slug] - Delete a blog post (admin only)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params

  try {
    const user = await requireAuth();

    // Check if user is admin by email
    const adminEmails = [
      'jeffrey.aay@gmail.com',
      'admin@vexnexa.com'
    ];

    if (!adminEmails.includes(user.email)) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized - Admin access required" },
        { status: 403 }
      );
    }

    const existing = await prisma.blogPost.findUnique({
      where: { slug: slug }
    });

    if (!existing) {
      return NextResponse.json(
        { ok: false, error: "Blog post not found" },
        { status: 404 }
      );
    }

    await prisma.blogPost.delete({
      where: { slug: slug }
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Failed to delete blog post:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
