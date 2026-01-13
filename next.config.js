/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for easy deployment
  output: 'standalone',
  
  // Disable x-powered-by header
  poweredByHeader: false,
  
  // Image optimization
  images: {
    domains: ['media.api-sports.io'], // API-Football image domain
  },
  
  // Headers for PWA
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
};

module.exports = nextConfig;
