// next.config.js
// Base runtime caching from next-pwa and a custom rule for API requests
const baseRuntimeCaching = require('next-pwa/cache');
const runtimeCaching = [
  // Ensure API calls are always NetworkFirst (avoid stale cache for auth/data)
  {
    urlPattern: /^https:\/\/api\.huehuy\.com\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    },
  },
  // Dev/local API
  {
    urlPattern: /^http:\/\/localhost:8000\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    },
  },
  // Same-origin API calls when using Next.js rewrites (relative path)
  {
    urlPattern: /^\/api\//,
    handler: 'NetworkFirst',
    options: {
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
    },
  },
  ...baseRuntimeCaching,
];
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

      // Generic API proxy to avoid CORS entirely; keep specific rules above
      { source: '/api/:path*', destination: `${API_BASE}/:path*` },
    ];
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          // Allow OAuth popups (e.g., Google) to close themselves without COOP blocking warnings
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
          // Note: Avoid setting COEP in development to prevent noisy warnings
        ],
      },
    ];
  },
  reactStrictMode: false,
  images: {
    // (tetap persis seperti punyamu)
    remotePatterns: [
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/storage/' },
      // izinkan jika backend kadang melayani /ads/** langsung
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/ads/' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/ads/' },

      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/storage/' },
      { protocol: 'https', hostname: 'api.huehuy.com', pathname: '/ads/' },

      { protocol: 'https', hostname: '159.223.48.146', pathname: '/storage/' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/storage/' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/ads/' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/ads/' },

      // Allow Google profile images
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/' },
      { protocol: 'https', hostname: 'lh4.googleusercontent.com', pathname: '/' },
      { protocol: 'https', hostname: 'lh5.googleusercontent.com', pathname: '/' },
      { protocol: 'https', hostname: 'lh6.googleusercontent.com', pathname: '/' },
    ],
    // unoptimized: true,
  },
});