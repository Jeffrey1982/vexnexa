import { NextResponse } from 'next/server'

// Configuration
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'
const LOCALES = ['en', 'nl', 'de', 'fr', 'es'] as const
const LAST_MODIFIED = '2026-05-16'

// Explicit list of content slugs (SEO/content pages intended to rank)
// Keep this empty until the route exists; the sitemap index only references live sitemaps.
const CONTENT_SLUGS: string[] = []

interface SitemapUrl {
  url: string
}

export async function GET() {
  // Expand each slug across all locales
  const contentPages: SitemapUrl[] = []

  for (const slug of CONTENT_SLUGS) {
    for (const locale of LOCALES) {
      contentPages.push({
        url: `${BASE_URL}/${locale}/${slug}`,
      })
    }
  }

  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${contentPages.map(page => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${LAST_MODIFIED}</lastmod>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(urlset, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
