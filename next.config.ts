import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy Python FastAPI during development to avoid CORS and 404 confusion
      {
        source: "/api/python/:path*",
        destination: "https://dataglass-backend.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
