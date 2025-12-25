import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://vexnexa.com'

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
