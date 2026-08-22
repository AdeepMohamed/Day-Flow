import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Production Deployment Optimization
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    unoptimized: true,
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },
};

export default nextConfig;
