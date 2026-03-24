import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com'

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
          // Legacy Shopify URLs
          '/products/',
          '/collections/',
          '/cart',
          '/checkout',
          '/blogs/',
          '/account',
        ],
        allow: [
          '/',
          '/features',
          '/pricing',
          '/about',
          '/contact',
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
          '/eaa-compliance-monitoring',
          '/sample-report',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: '/',
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
