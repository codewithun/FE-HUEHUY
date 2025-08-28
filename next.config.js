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
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ];
  },
  reactStrictMode: false,
  images: {
    // Hapus "domains", fokus ke remotePatterns (lebih strict & disarankan)
    remotePatterns: [
      // ====== LOCAL DEV ======
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/promos/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/storage/**' },
      { protocol: 'http', hostname: '127.0.0.1', port: '8000', pathname: '/api/storage/**' },
      { protocol: 'http', hostname: 'localhost',  port: '8000', pathname: '/api/storage/**' },

      // ====== PRODUCTION BACKEND (nip.io) ======
      { protocol: 'https', hostname: 'api-159-223-48-146.nip.io', pathname: '/promos/**' },
      { protocol: 'https', hostname: 'api-159-223-48-146.nip.io', pathname: '/storage/**' },
      { protocol: 'https', hostname: 'api-159-223-48-146.nip.io', pathname: '/api/storage/**' },

      // ====== ANTISIPASI REDIRECT KE IP LANGSUNG ======
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/promos/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/promos/**' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/storage/**' },
      { protocol: 'https', hostname: '159.223.48.146', pathname: '/api/storage/**' },
      { protocol: 'http',  hostname: '159.223.48.146', pathname: '/api/storage/**' },
    ],
    // Kalau mau debugging: uncomment sementara
    // unoptimized: true,
  },
});
