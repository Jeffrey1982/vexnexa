import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'

  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/dashboard',
          '/dashboard/*',
          '/scans',
          '/scans/*',
          '/api/',
          '/admin/',
          '/admin/*',
          '/settings',
          '/settings/*',
          '/auth/*',
          '/onboarding',
          '/sites',
          '/sites/*',
          '/teams',
          '/analytics',
          '/advanced-analytics',
          '/checkout',
          '/checkout/*',
          '/newsletter/*',
          '/get-started',
          '/reset-password',
          '/unauthorized',
        ],
        allow: [
          '/',
          '/features',
          '/pricing',
          '/audits',
          '/about',
          '/contact',
          '/updates',
          '/methodology',
          '/compliance',
          '/eaa-compliance',
          '/bfsg-compliance',
          '/accessibe-alternative',
          '/siteimprove-alternative',
          '/blog',
          '/blog/*',
          '/changelog',
          '/legal/*',
          '/wcag-scan',
          '/website-accessibility-checker',
          '/white-label-accessibility-reports',
          '/accessibility-monitoring-agencies',
          '/wcag-compliance-report',
          '/for-agencies',
          '/government-accessibility',
          '/eaa-compliance-monitoring',
          '/partner-apply',
          '/founding-agencies',
          '/sample-report',
          '/legal/cookies',
          '/report/*',
        ],
      },
      // AI crawlers are allowed on public marketing/blog content so VexNexa
      // can be discovered and cited in AI search answers (ChatGPT, Perplexity).
      // App/dashboard routes stay covered by the wildcard disallow rules above.
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
