import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/blog - List blog posts (public or admin)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const category = searchParams.get("category");
    const limit = parseInt(searchParams.get("limit") || "50");
    const isAdmin = searchParams.get("admin") === "true";

    let where: any = {};

    if (isAdmin) {
      // Admin view - require auth and admin role
      const user = await requireAuth();

      // Check if user is admin by email
      const adminEmails = [
        'jeffrey.aay@gmail.com',
        'admin@tutusporta.com'
      ];

      if (!adminEmails.includes(user.email)) {
        return NextResponse.json(
          { ok: false, error: "Unauthorized - Admin access required" },
          { status: 403 }
        );
      }
      // Admin can see all statuses
      if (status) where.status = status;
    } else {
      // Public view - only published posts
      where.status = "published";
    }

    if (category) where.category = category;

    const posts = await prisma.blogPost.findMany({
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
      },
      orderBy: { publishedAt: "desc" },
      take: limit
    });

    return NextResponse.json({ ok: true, posts });
  } catch (e: any) {
    console.error("Failed to fetch blog posts:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to fetch blog posts" },
      { status: 500 }
    );
  }
}

// POST /api/blog - Create a new blog post (admin only)
export async function POST(req: Request) {
  try {
    const user = await requireAuth();

    // Check if user is admin by email
    const adminEmails = [
      'jeffrey.aay@gmail.com',
      'admin@tutusporta.com'
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
      slug,
      content,
      excerpt,
      coverImage,
      metaTitle,
      metaDescription,
      metaKeywords,
      category,
      tags,
      status,
      publishedAt
    } = body;

    if (!title || !slug || !content || !category) {
      return NextResponse.json(
        { ok: false, error: "Title, slug, content, and category are required" },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const existing = await prisma.blogPost.findUnique({
      where: { slug }
    });

    if (existing) {
      return NextResponse.json(
        { ok: false, error: "A post with this slug already exists" },
        { status: 400 }
      );
    }

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug,
        content,
        excerpt,
        coverImage,
        metaTitle,
        metaDescription,
        metaKeywords: metaKeywords || [],
        category,
        tags: tags || [],
        status: status || "draft",
        publishedAt: publishedAt ? new Date(publishedAt) : status === "published" ? new Date() : null,
        authorId: user.id
      },
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
    console.error("Failed to create blog post:", e);
    return NextResponse.json(
      { ok: false, error: e.message || "Failed to create blog post" },
      { status: 500 }
    );
  }
}
