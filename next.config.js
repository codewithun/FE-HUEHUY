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
    const API_BASE = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000').replace(/\/$/, '');
    const FILE_BASE = API_BASE.replace(/\/api$/i, '');

    return [
      // Untuk file statis Laravel (storage) tetap ke FILE_BASE
      { source: '/storage/:path*',      destination: `${FILE_BASE}/storage/:path*` },
      { source: '/api/storage/:path*',  destination: `${FILE_BASE}/storage/:path*` },

      // map DB path 'ads/...'(public) ke 'storage/ads/...'
      { source: '/ads/:path*',          destination: `${FILE_BASE}/storage/ads/:path*` },

      // Untuk endpoint promos/public gunakan API_BASE (termasuk /api jika ada)
      { source: '/promos/:path*',       destination: `${FILE_BASE}/promos/:path*` },
      { source: '/images/:path*',       destination: `${FILE_BASE}/images/:path*` },

      // opsional: supaya fallback lama tidak 400
      { source: '/api/placeholder/:w/:h', destination: '/default-avatar.png' },
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
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/storage/**' },
      // izinkan jika backend kadang melayani /ads/** langsung
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/ads/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/ads/**' },

      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/ads/**' },

      { protocol: 'https', hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/ads/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/ads/**' },
    ],
    // unoptimized: true,
  },
});
