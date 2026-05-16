import { NextResponse } from 'next/server'
import { getIndexablePublicDomains } from '@/lib/public-reports'

export const dynamic = 'force-dynamic'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'

  let domains: { normalized_domain: string; updated_at: string }[] = []

  try {
    domains = await getIndexablePublicDomains()
  } catch (error) {
    console.error('[Sitemap Reports] Error fetching domains:', error)
  }

  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${domains.map(d => `  <url>
    <loc>${escapeXml(`${baseUrl}/report/${encodeURIComponent(d.normalized_domain)}`)}</loc>
    <lastmod>${new Date(d.updated_at).toISOString()}</lastmod>
  </url>`).join('\n')}
</urlset>`

  return new NextResponse(urlset, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
