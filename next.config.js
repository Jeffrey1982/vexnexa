/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  // Plain-text Resend delivery does not need its optional React-email renderer.
  serverExternalPackages: ['resend'],
  images: { formats: ['image/avif', 'image/webp'] },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    ] }];
  },
};
module.exports = nextConfig;
