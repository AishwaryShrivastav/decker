import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Allow Chrome extension origins to call our API
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization, X-Api-Key",
          },
        ],
      },
    ];
  },
  // Increase body size limit for audio uploads (default is 1MB)
  experimental: {
    serverActions: {
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
