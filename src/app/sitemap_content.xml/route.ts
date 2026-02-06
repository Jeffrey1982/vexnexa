import { NextResponse } from 'next/server'

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'
const LOCALES = ['en', 'nl', 'de', 'fr', 'es'] as const
const LAST_MODIFIED = '2025-12-23' // Stable constant to avoid changing on each request

// Explicit list of content slugs (SEO/content pages intended to rank)
// Add more slugs here as content is created
const CONTENT_SLUGS = [
  'how-to-test-website-accessibility',
  // TODO: Add more content page slugs here as they are created:
  // 'wcag-compliance-guide',
  // 'accessibility-best-practices',
  // etc.
]

interface SitemapUrl {
  url: string
  priority: number
  changefreq: string
}

export async function GET() {
  // Expand each slug across all locales
  const contentPages: SitemapUrl[] = []

  for (const slug of CONTENT_SLUGS) {
    for (const locale of LOCALES) {
      contentPages.push({
        url: `${BASE_URL}/${locale}/${slug}`,
        priority: 0.8,
        changefreq: 'weekly',
      })
    }
  }

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
