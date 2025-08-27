// next.config.js
const runtimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
});

/** @type {import('next').NextConfig} */
module.exports = withPWA({
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
  reactStrictMode: false,
  images: {
    domains: [
      'localhost',
      '127.0.0.1',
      'api-unparone.unpar.ac.id',
      'assets.huehuy.com',
      'api-159-223-48-146.nip.io',
    ],
    remotePatterns: [
      // local dev
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/storage/**' },
      { protocol: 'http', hostname: 'localhost', port: '8000', pathname: '/api/storage/**' },

      // production backend
      { protocol: 'https', hostname: 'api-159-223-48-146.nip.io', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api-159-223-48-146.nip.io', pathname: '/api/storage/**' },
    ],
    // Untuk debugging, bisa uncomment ini sementara
    // unoptimized: true,
  },
});
