import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'

export async function GET() {
  try {
    // Fetch all published blog posts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: {
        slug: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    })

    // Generate blog post URLs
    const blogUrls = posts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      // Use updatedAt if available, otherwise publishedAt, fallback to current date
      lastmod: (post.updatedAt || post.publishedAt || new Date()).toISOString().split('T')[0],
      changefreq: 'monthly',
      priority: 0.7,
    }))

    const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${blogUrls.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`

    return new NextResponse(urlset, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating blog sitemap:', error)

    // Return empty but valid sitemap on error
    const emptyUrlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`

    return new NextResponse(emptyUrlset, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=60',
      },
    })
  } finally {
    await prisma.$disconnect()
  }
}
