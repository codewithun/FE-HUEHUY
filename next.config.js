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
  // ✅ Tambahan: proxy agar hindari CORS untuk file statis Laravel
  async rewrites() {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const FILE_BASE = API_BASE.replace(/\/api\/?$/, '');

    return [
      { source: '/storage/:path*',      destination: `${FILE_BASE}/storage/:path*` },
      { source: '/promos/:path*',       destination: `${FILE_BASE}/promos/:path*` },
      { source: '/api/storage/:path*',  destination: `${FILE_BASE}/storage/:path*` },
      { source: '/images/:path*',       destination: `${FILE_BASE}/images/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
  reactStrictMode: false,
  images: {
    // (tetap persis seperti punyamu)
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/storage/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/api/storage/**' },

      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/promos/**' },
      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/api/storage/**' },

      { protocol: 'https', hostname: '159.223.48.146', pathname: '/promos/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/promos/**' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/api/storage/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/api/storage/**' },
    ],
    // unoptimized: true,
  },
});
