/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google OAuth profile pictures
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
  experimental: {
    serverActions: true,
  },
  // Allow development origins to avoid cross-origin warning
  allowedDevOrigins: [
    '192.168.1.151'
  ],
  async rewrites() {
    return [
      // Do not rewrite Next Auth API routes
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Rewrite all other API routes to the backend
      {
        source: '/api/:path*',
        destination: 'http://localhost:4000/api/:path*',
      },
    ];
  },
};

module.exports = nextConfig; 