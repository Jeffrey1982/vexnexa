const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zoljdbuiphzlsqzxdxyy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvbGpkYnVpcGh6bHNxenhkeHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyNjI2OTAsImV4cCI6MjA3MjgzODY5MH0.K2cLamkHo4KH0POi8XOgUBRSiYlpRXmhBambxyeCI8s',
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com',
  },
  outputFileTracingIncludes: {
    'app/api/scan/route.js': ['node_modules/@sparticuz/chromium/**'],
    'app/api/scan-enhanced/route.js': ['node_modules/@sparticuz/chromium/**'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
        port: '',
        pathname: '/s2/favicons/**',
      },
      {
        protocol: 'https',
        hostname: '*.gstatic.com',
        port: '',
        pathname: '/faviconV2/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize playwright-core and @sparticuz/chromium for server builds
      config.externals = config.externals || [];
      config.externals.push({
        'playwright-core': 'commonjs playwright-core',
        '@sparticuz/chromium': 'commonjs @sparticuz/chromium',
      });
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://va.vercel-scripts.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.supabase.co https://va.vercel-scripts.com wss://*.supabase.co https://www.google.com https://*.gstatic.com https://*.google-analytics.com",
              "img-src 'self' data: blob: https://www.google.com https://*.supabase.co https://*.gstatic.com https://www.googletagmanager.com https://*.google-analytics.com",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);