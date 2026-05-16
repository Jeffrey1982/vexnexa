import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 600

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const locale = searchParams.get('locale') || 'en'
  const limit = Number(searchParams.get('limit') || 3)

  try {
    let posts = await prisma.blogPost.findMany({
      where: {
        status: 'published',
        locale,
      },
      orderBy: { publishedAt: 'desc' },
      take: limit,
      select: {
        slug: true,
        locale: true,
        title: true,
        excerpt: true,
        publishedAt: true,
        category: true,
        coverImage: true,
        authorName: true,
      },
    })

    if (posts.length === 0) {
      posts = await prisma.blogPost.findMany({
        where: { status: 'published' },
        orderBy: { publishedAt: 'desc' },
        take: limit,
        select: {
          slug: true,
          locale: true,
          title: true,
          excerpt: true,
          publishedAt: true,
          category: true,
          coverImage: true,
          authorName: true,
        },
      })
    }

    return NextResponse.json({ posts }, {
      headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=3600' },
    })
  } catch (error) {
    console.error('[api/blog/latest] error', error)
    return NextResponse.json({ posts: [] }, { status: 200 })
  }
}
