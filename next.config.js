const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for easy deployment
  output: process.env.BUILD_TARGET === 'ios' ? 'export' : 'standalone',

  // Disable x-powered-by header
  poweredByHeader: false,

  // Transpile Mili source from sibling directory
  transpilePackages: ['@ball-knowledge/mili'],

  // Image optimization
  images: {
    domains: ['media.api-sports.io'], // API-Football image domain
  },

  // Resolve @mili imports to sibling directory
  webpack(config) {
    config.resolve.alias['@mili'] = path.resolve(__dirname, '../mili/src');
    return config;
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
