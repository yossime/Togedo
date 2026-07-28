const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google OAuth profile pictures
      },
    ],
  },
  async rewrites() {
    return [
      // Do not rewrite NextAuth API routes
      {
        source: '/api/auth/:path*',
        destination: '/api/auth/:path*',
      },
      // Proxy all other API routes to the backend
      {
        source: '/api/:path*',
        destination: `${API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
