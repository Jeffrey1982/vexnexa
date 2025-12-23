import { NextResponse } from 'next/server'

// Build-time constant to avoid changing lastmod on each request
const LAST_MODIFIED = new Date().toISOString()

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vexnexa.com'

  const pages = [
    { url: baseUrl, priority: 1.0, changefreq: 'weekly' },
    { url: `${baseUrl}/features`, priority: 0.9, changefreq: 'weekly' },
    { url: `${baseUrl}/pricing`, priority: 0.9, changefreq: 'weekly' },
    { url: `${baseUrl}/about`, priority: 0.7, changefreq: 'monthly' },
    { url: `${baseUrl}/contact`, priority: 0.7, changefreq: 'monthly' },
    { url: `${baseUrl}/blog`, priority: 0.8, changefreq: 'weekly' },
    { url: `${baseUrl}/changelog`, priority: 0.6, changefreq: 'weekly' },
    { url: `${baseUrl}/legal/privacy`, priority: 0.3, changefreq: 'monthly' },
    { url: `${baseUrl}/legal/terms`, priority: 0.3, changefreq: 'monthly' },
  ]

  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(page => `  <url>
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
