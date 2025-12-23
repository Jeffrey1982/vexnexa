import { NextResponse } from 'next/server'

// Build-time constant to avoid changing lastmod on each request
const LAST_MODIFIED = new Date().toISOString()

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com'

  // SEO/content pages intended to rank
  // Add blog posts, guides, case studies, and educational content here
  const contentPages: Array<{ url: string; priority: number; changefreq: string }> = [
    // TODO: When blog posts exist, add them dynamically:
    // const posts = await getBlogPosts()
    // posts.map(post => ({ url: `${baseUrl}/blog/${post.slug}`, priority: 0.8, changefreq: 'monthly' }))

    // Placeholder - add actual content pages when available
  ]

  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${contentPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${LAST_MODIFIED}</lastmod>
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
}
