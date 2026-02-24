/** @type {import('next').NextConfig} */

const isIosBuild = process.env.BUILD_TARGET === 'ios';

const nextConfig = {
  // 'standalone' for Vercel, 'export' for Capacitor iOS builds
  output: isIosBuild ? 'export' : 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  // Image optimization — static export requires unoptimized
  images: isIosBuild
    ? { unoptimized: true }
    : { domains: ['media.api-sports.io'] },

  // Headers for PWA (server-only, ignored in static export)
  ...(!isIosBuild && {
    async headers() {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
          ],
        },
      ];
    },
  }),
};

module.exports = nextConfig;
