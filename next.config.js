const withNextIntl = require('next-intl/plugin')('./src/i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://vexnexa.com',
  },
  outputFileTracingIncludes: {
    '/*': ['node_modules/@sparticuz/chromium/**'],
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
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.vexnexa.com' }],
        destination: 'https://vexnexa.com/:path*',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize playwright-core for server builds
      config.externals = config.externals || [];
      config.externals.push({
        'playwright-core': 'commonjs playwright-core',
      });
    }
    return config;
  },
  // CSP headers are set in middleware.ts to avoid duplicate/conflicting policies
};

module.exports = withNextIntl(nextConfig);