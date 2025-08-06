const runtimeCaching = require('next-pwa/cache');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  runtimeCaching,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  async headers() {
    return [
      {
        source: '/(.*)?', // Matches all pages
        headers: [
          {
            key: 'X-Frame-Options',
            value: '*',
          },
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
    ],
  },
});
