import { NextResponse } from 'next/server'
import { MARKETING_LOCALES, isMarketingPath, localizedUrl } from '@/lib/marketing-seo'

const PUBLIC_PAGE_LASTMOD = '2026-05-16'

const PAGE_PATHS = [
  '/',
  '/features',
  '/pricing',
  '/about',
  '/contact',
  '/updates',
  '/methodology',
  '/compliance',
  '/eaa-compliance',
  '/eaa-compliance-monitoring',
  '/for-agencies',
  '/partner-apply',
  '/pilot-partner-program',
  '/blog',
  '/changelog',
  '/wcag-scan',
  '/website-accessibility-checker',
  '/white-label-accessibility-reports',
  '/accessibility-monitoring-agencies',
  '/wcag-compliance-report',
  '/sample-report',
  '/legal/privacy',
  '/legal/security',
  '/legal/sla',
  '/legal/terms',
  '/legal/cookies',
] as const

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

  const entries = PAGE_PATHS.map((path) => {
    if (isMarketingPath(path)) {
      // hreflang alternates shared by every locale variant of this page
      const alternates = [
        ...MARKETING_LOCALES.map(
          (l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escapeXml(localizedUrl(l, path))}"/>`
        ),
        `    <xhtml:link rel="alternate" hreflang="x-default" href="${escapeXml(localizedUrl('en', path))}"/>`,
      ].join('\n')

      return MARKETING_LOCALES.map(
        (l) => `  <url>
    <loc>${escapeXml(localizedUrl(l, path))}</loc>
    <lastmod>${PUBLIC_PAGE_LASTMOD}</lastmod>
${alternates}
  </url>`
      ).join('\n')
    }

    // Non locale-routed page (blog index, changelog, cookies) — single entry.
    return `  <url>
    <loc>${escapeXml(`${baseUrl}${path === '/' ? '' : path}`)}</loc>
    <lastmod>${PUBLIC_PAGE_LASTMOD}</lastmod>
  </url>`
  })

  const urlset = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.join('\n')}
</urlset>`

  return new NextResponse(urlset, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
