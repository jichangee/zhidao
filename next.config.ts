import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma', 'pg'],
  },
  allowedDevOrigins: ['10.0.0.19'],
};

export default nextConfig;
