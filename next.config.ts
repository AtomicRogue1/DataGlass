import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      // Proxy Python FastAPI during development to avoid CORS and 404 confusion
      {
        source: "/api/python/:path*",
        destination: process.env.NODE_ENV === 'development' 
          ? "http://localhost:8000/:path*"
          : "https://dataglass-backend.onrender.com/:path*",
      },
    ];
  },
};

export default nextConfig;
