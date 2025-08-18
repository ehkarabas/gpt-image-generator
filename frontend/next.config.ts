import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure we're not using static export
  output: 'standalone', // Not 'export'
  
  // Add headers to allow all HTTP methods
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS,HEAD' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ],
      },
    ];
  },
  
  // Enable experimental features if needed
  experimental: {
    // serverActions might help with dynamic routes
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
};

export default nextConfig;
