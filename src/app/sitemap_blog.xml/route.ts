import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BLOG_SEO_LOCALES, getBlogBaseSlug, getBlogPublicUrl, isBlogSeoLocale } from '@/lib/blog-seo'
import { DIGITAL_ACCESSIBILITY_PIVOT_SLUG } from '@/lib/static-blog-posts'

// Configuration
const BASE_URL: string = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET(): Promise<NextResponse> {
  try {
    // Fetch all published blog posts
    const posts = await prisma.blogPost.findMany({
      where: { status: 'published' },
      select: {
        slug: true,
        locale: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    })

    const cmsUrlNodes = posts
      .filter((post) => isBlogSeoLocale(post.locale))
      .map((post) => {
        const loc: string = escapeXml(
          getBlogPublicUrl(post.locale, getBlogBaseSlug(post.slug)).replace('https://vexnexa.com', BASE_URL)
        )
        const lastmod: string = (post.updatedAt || post.publishedAt || new Date())
          .toISOString()
          .split('T')[0]
        return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>`
      })

    const staticUrlNodes = BLOG_SEO_LOCALES.map((locale) => {
      const loc = escapeXml(
        getBlogPublicUrl(locale, DIGITAL_ACCESSIBILITY_PIVOT_SLUG).replace('https://vexnexa.com', BASE_URL)
      )

      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`
    })

    const urlNodes = [...staticUrlNodes, ...cmsUrlNodes].join('\n')

    // When urlNodes is empty the sitemap is still valid (empty <urlset/>)
    const xml: string = urlNodes.length > 0
      ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlNodes}\n</urlset>`
      : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('Error generating blog sitemap:', error)

    // Return empty but valid self-closing sitemap on error
    const emptyXml: string = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`

    return new NextResponse(emptyXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=60',
      },
    })
  }
}
